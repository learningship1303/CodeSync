import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';
import {
  LogOut,
  Copy,
  Terminal as TerminalIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Editor } from '../components/Editor';
import { FileExplorer } from '../components/FileExplorer';
import { AiCopilot } from '../components/AiCopilot';
import RemoteCursor from '../components/RemoteCursor';
import { Terminal, TerminalEntry } from '../components/Terminal';
import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../interfaces/socketEvents';
import { assignCursorColor } from '../services/cursorColorAssignment';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

interface ConnectedDeveloper {
  socketId: string;
  username: string;
}

interface RemoteCursorData {
  socketId: string;
  username: string;
  cursor: {
    x: number;
    y: number;
    line?: number;
    column?: number;
  };
  currentFile: string;
}

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef<any>(null);
  const autoSaveTimer = useRef<any>(null);
  const [files, setFiles] = useState<FileNode[]>([
    { name: 'main.js', path: 'main.js', type: 'file', content: '// Happy Live Collaboration CodeSync Cluster \nconsole.log("Hello Node Server System");\n' }
  ]);
  const [activeFile, setActiveFile] = useState<string>('main.js');
  const [currentLanguage, setCurrentLanguage] = useState<string>('javascript');
  const [clients, setClients] = useState<ConnectedDeveloper[]>([]);
  const [roomAuthorized, setRoomAuthorized] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursorData>>({});

  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    { type: 'info', content: 'CodeSync Runtime initialized successfully.' },
    { type: 'info', content: 'Ready to execute code. Press Run or use Ctrl+Enter.' }
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const ROOM_PASSWORD_LOCAL_KEY_PREFIX = 'codesync_room_password_';
  const location = useLocation();

  const roomPasswordFromNav = (location.state as any)?.roomPassword as string | undefined;

  const getRoomPasswordLocal = (): string | undefined => {
    try {
      const key = `${ROOM_PASSWORD_LOCAL_KEY_PREFIX}${roomId}`;
      const v = localStorage.getItem(key);
      return v || undefined;
    } catch {
      return undefined;
    }
  };

  const roomPassword = roomPasswordFromNav || getRoomPasswordLocal();

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(String(roomId));
    toast.success('Room ID copied!');
  };

  const copyInviteLink = async () => {
    const inviteText =
      `🚀 Join my CodeSync Workspace\n\nRoom ID: ${roomId}\n\nWorkspace Link:\n${window.location.origin}/room/${roomId}\n\n${roomPassword ? `Password: ${roomPassword}\n` : `If it's a Project Workspace, ask me for the password.\n`
      }`;

    await navigator.clipboard.writeText(inviteText);
    toast.success('Invite copied!');
  };

  const copyRoomPassword = async () => {
    if (!roomPassword) {
      toast.error('Room password is not available on this device.');
      return;
    }
    await navigator.clipboard.writeText(roomPassword);
    toast.success('Room password copied!');
  };
  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    toast.success('Left workspace');

    navigate('/dashboard');
  };

  const mapPathToLanguageType = (filePath: string): string => {
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.cpp') || filePath.endsWith('.h')) return 'cpp';
    if (filePath.endsWith('.html')) return 'html';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    return 'javascript';
  };

  const normalizeWorkspacePath = useCallback((value: string): string =>
    value
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      .trim(), []);

  const fileNameFromPath = useCallback((path: string): string => {
    const normalized = normalizeWorkspacePath(path);
    return normalized.split('/').filter(Boolean).pop() || normalized;
  }, [normalizeWorkspacePath]);

  const resolveSiblingPath = useCallback((oldPath: string, nextNameOrPath: string): string => {
    const cleanNext = normalizeWorkspacePath(nextNameOrPath);
    if (cleanNext.includes('/')) return cleanNext;

    const parent = normalizeWorkspacePath(oldPath).split('/').slice(0, -1).join('/');
    return parent ? `${parent}/${cleanNext}` : cleanNext;
  }, [normalizeWorkspacePath]);
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        await API.post('/rooms/verify', {
          roomId
        });
        setRoomAuthorized(true);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Enter the room password from the dashboard first.');
        navigate('/dashboard', { replace: true });
      }
    };

    if (roomId) {
      fetchRoomInfo();
    }
  }, [roomId, navigate]);
  useEffect(() => {
    if (!roomId || !user || !roomAuthorized) return;

    socketRef.current = io(
      process.env.REACT_APP_SOCKET_URL ||
      'http://localhost:5000',
      {
        auth: {
          token: user.token
        }
      }
    );

    const socket = socketRef.current;

    socket.on('connect_error', (error: Error) => {
      toast.error(error.message || 'Live collaboration connection failed');
    });

    socket.on('room-access-denied', ({ message }: { message: string }) => {
      toast.error(message || 'Workspace access denied');
      navigate('/dashboard', { replace: true });
    });

    socket.on('sync-initial-files', (dbFiles: FileNode[]) => {
      if (dbFiles?.length > 0) {
        setFiles(dbFiles);
        setActiveFile(dbFiles[0].path);
        setCurrentLanguage(
          mapPathToLanguageType(dbFiles[0].path)
        );
      }
    });

    socket.on(
      'room-users-update',
      ({ activeUsers }: { activeUsers: ConnectedDeveloper[] }) => {
        setClients(activeUsers);
      }
    );

    socket.on(
      'joined',
      ({ username }: { username: string }) => {
        if (username !== user.name) {
          toast.success(`${username} joined workspace`);
        }
      }
    );

    socket.on(
      'user-disconnected',
      ({ username, socketId }: { username: string; socketId: string }) => {
        toast(`${username} left workspace`);
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }
    );

    socket.on(SOCKET_EVENTS.CURSOR_MOVE, (data: RemoteCursorData) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [data.socketId]: data
      }));
    });

    socket.on(SOCKET_EVENTS.CODE_CHANGE, ({ filePath, code }: { filePath: string; code: string }) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.path === filePath
            ? {
              ...file,
              content: code
            }
            : file
        )
      );
    });

    socket.on('file-node-created', (newFile: FileNode) => {
      setFiles((prev) =>
        prev.some((f) => f.path === newFile.path)
          ? prev
          : [...prev, newFile]
      );
    });
    socket.on(
      'file-node-deleted',
      ({ filePath }: { filePath: string }) => {
        const normalizedPath = normalizeWorkspacePath(filePath);
        setFiles((prev) =>
          prev.filter(
            (file) =>
              file.path !== normalizedPath &&
              !file.path.startsWith(`${normalizedPath}/`)
          )
        );
        setActiveFile((current) =>
          current === normalizedPath || current.startsWith(`${normalizedPath}/`)
            ? 'main.js'
            : current
        );
      }
    );

    socket.on(
      'file-node-renamed',
      ({
        oldPath,
        newPath
      }: {
        oldPath: string;
        newPath: string;
      }) => {
        const normalizedOldPath = normalizeWorkspacePath(oldPath);
        const normalizedNewPath = normalizeWorkspacePath(newPath);
        setFiles((prev) =>
          prev.map((file) =>
            file.path === normalizedOldPath || file.path.startsWith(`${normalizedOldPath}/`)
              ? {
                ...file,
                path: `${normalizedNewPath}${file.path.slice(normalizedOldPath.length)}`,
                name: fileNameFromPath(`${normalizedNewPath}${file.path.slice(normalizedOldPath.length)}`)
              }
              : file
          )
        );
        setActiveFile((current) =>
          current === normalizedOldPath || current.startsWith(`${normalizedOldPath}/`)
            ? `${normalizedNewPath}${current.slice(normalizedOldPath.length)}`
            : current
        );
      }
    );

    socket.on('file-node-upserted', (incomingFile: FileNode) => {
      const normalizedPath = normalizeWorkspacePath(incomingFile.path);
      const fileNode = {
        ...incomingFile,
        path: normalizedPath,
        name: fileNameFromPath(normalizedPath)
      };

      setFiles((prev) => {
        const existing = prev.find((file) => file.path === normalizedPath);
        if (existing) {
          return prev.map((file) => file.path === normalizedPath ? fileNode : file);
        }

        return [...prev, fileNode];
      });
    });

    socket.emit(SOCKET_EVENTS.JOINED, { roomId });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, user, roomAuthorized, fileNameFromPath, normalizeWorkspacePath, navigate]);

  const handleSelectActiveFile = (filePath: string) => {
    setActiveFile(filePath);
    setCurrentLanguage(mapPathToLanguageType(filePath));
  };

  const handleCreateNewAssetNode = (type: 'file' | 'folder', assetName: string) => {
    const normalizedPath = normalizeWorkspacePath(assetName);
    if (!normalizedPath) return toast.error('Enter a file or folder name.');
    if (files.some(f => f.path === normalizedPath)) return toast.error('Asset exists.');

    const content = type === 'file' ? '// New Asset\n' : undefined;
    socketRef.current.emit('create-file-node', {
      roomId,
      path: normalizedPath,
      type,
      content
    });
    setFiles(prev => [...prev, {
      name: fileNameFromPath(normalizedPath),
      path: normalizedPath,
      type,
      content
    }]);
  };
  const handleDeleteFile = async (
    filePath: string
  ) => {
    try {
      await API.delete(`/rooms/${roomId}/files/${encodeURIComponent(filePath)}`);

      const normalizedPath = normalizeWorkspacePath(filePath);

      setFiles((prev) =>
        prev.filter(
          (file) =>
            file.path !== normalizedPath &&
            !file.path.startsWith(`${normalizedPath}/`)
        )
      );

      if (activeFile === normalizedPath || activeFile.startsWith(`${normalizedPath}/`)) {
        const nextFile = files.find(
          (file) =>
            file.type === 'file' &&
            file.path !== normalizedPath &&
            !file.path.startsWith(`${normalizedPath}/`)
        );
        setActiveFile(nextFile?.path || 'main.js');
      }

      toast.success(
        'File deleted'
      );
      socketRef.current.emit(
        'delete-file-node',
        {
          roomId,
          filePath
        }
      );
    } catch (err) {
      toast.error(
        'Delete failed'
      );
    }
  };
  const handleRenameFile = async (
    oldPath: string,
    newNameOrPath: string
  ) => {
    try {
      const normalizedOldPath = normalizeWorkspacePath(oldPath);
      const normalizedNewPath = resolveSiblingPath(oldPath, newNameOrPath);

      await API.put(
        `/rooms/${roomId}/files/rename`,
        {
          oldPath: normalizedOldPath,
          newPath: normalizedNewPath
        }
      );

      setFiles((prev) =>
        prev.map((file) =>
          file.path === normalizedOldPath || file.path.startsWith(`${normalizedOldPath}/`)
            ? {
              ...file,
              path: `${normalizedNewPath}${file.path.slice(normalizedOldPath.length)}`,
              name: fileNameFromPath(`${normalizedNewPath}${file.path.slice(normalizedOldPath.length)}`)
            }
            : file
        )
      );

      if (activeFile === normalizedOldPath || activeFile.startsWith(`${normalizedOldPath}/`)) {
        setActiveFile(`${normalizedNewPath}${activeFile.slice(normalizedOldPath.length)}`);
      }

      toast.success(
        'File renamed'
      );
      socketRef.current.emit(
        'rename-file-node',
        {
          roomId,
          oldPath: normalizedOldPath,
          newPath: normalizedNewPath
        }
      );

    } catch (err) {
      toast.error(
        'Rename failed'
      );
    }
  };
  const downloadWorkspaceZip = async () => {
    try {
      const response = await API.get(`/rooms/${roomId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${roomId}-workspace.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Workspace download failed');
    }
  };
  const uploadWorkspaceFiles = async (uploadedFiles: FileList) => {
    const allowedExtensions = ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'md'];

    for (const uploadedFile of Array.from(uploadedFiles)) {
      const extension = uploadedFile.name.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        toast.error(`${uploadedFile.name} is not a supported source file`);
        continue;
      }

      const content = await uploadedFile.text();
      const fileNode: FileNode = {
        name: uploadedFile.name,
        path: normalizeWorkspacePath(uploadedFile.webkitRelativePath || uploadedFile.name),
        type: 'file',
        content
      };

      await API.post(`/rooms/${roomId}/files/save`, fileNode);
      setFiles((prev) => {
        const existing = prev.find((file) => file.path === fileNode.path);
        if (existing) {
          return prev.map((file) => file.path === fileNode.path ? fileNode : file);
        }

        return [...prev, fileNode];
      });

      socketRef.current?.emit('file-node-upserted', {
        roomId,
        file: fileNode
      });
    }

    toast.success('Upload complete');
  };
  const runCode = async () => {
    try {
      const currentFile = files.find(file => file.path === activeFile);
      if (!currentFile) {
        toast.error('No file selected');
        return;
      }

      setIsCompiling(true);
      setTerminalEntries([
        { type: 'info', content: `Executing ${currentFile.name}...` }
      ]);

      const startTime = Date.now();
      const response = await API.post('/run', {
        language: currentLanguage,
        code: currentFile.content || '',
        fileName: currentFile.name
      });

      const execTime = Date.now() - startTime;
      setExecutionTime(execTime);

      const entries: TerminalEntry[] = [];

      // Show compilation output if present
      if (response.data.compilationOutput) {
        entries.push({
          type: 'compilation',
          content: `Compiling ${currentFile.name}...`
        });
        entries.push({
          type: 'info',
          content: response.data.compilationOutput
        });
      }

      if (response.data.success) {
        if (response.data.compilationOutput) {
          entries.push({
            type: 'success',
            content: 'Compilation Successful'
          });
        }
        entries.push({
          type: 'output',
          content: response.data.output || '(No output)'
        });
        entries.push({
          type: 'success',
          content: `Execution completed in ${execTime}ms`
        });
        toast.success('Code executed successfully');
      } else {
        if (response.data.compilationError) {
          entries.push({
            type: 'error',
            content: `Compilation Error:\n${response.data.compilationError}`
          });
        } else if (response.data.error) {
          entries.push({
            type: 'error',
            content: `Error:\n${response.data.error}`
          });
        }
        toast.error('Execution failed');
      }

      setTerminalEntries(entries);
    } catch (error) {
      console.error(error);
      setTerminalEntries([{
        type: 'error',
        content: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      toast.error('Run failed');
    } finally {
      setIsCompiling(false);
    }
  };
  const saveFileToDatabase = async (
    filePath: string,
    code: string
  ) => {
    try {
      const file = files.find(
        (f) => f.path === filePath
      );

      if (!file) return;

      await API.post(
        `/rooms/${roomId}/files/save`,
        {
          name: file.name,
          path: file.path,
          type: file.type,
          content: code
        }
      );

      console.log(
        `Saved ${filePath}`
      );

    } catch (err) {
      console.error(
        'Auto save failed',
        err
      );
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  const activeFileContent = files.find(f => f.path === activeFile)?.content || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-6 w-6 text-indigo-500" />
              <span className="font-black text-lg">
                CodeSync Space
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={copyRoomId}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Copy Room ID"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                onClick={copyInviteLink}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Copy Invite Link"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                onClick={copyRoomPassword}
                disabled={!roomPassword}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:hover:bg-indigo-600/100"
                title={roomPassword ? 'Copy Password' : 'Room password is not available on this device.'}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mb-4 text-xs text-slate-500 break-all">
            Room ID: {roomId}
          </div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Connected ({clients.length})</h3>
          <div className="space-y-2 mb-6">
            {clients.map((client) => (
              <div
                key={client.socketId}
                className="text-xs flex items-center gap-2 text-emerald-400"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>

                {client.username}

                {client.username === user?.name && (
                  <span className="text-slate-500 ml-1">(You)</span>
                )}
              </div>
            ))}
          </div>

          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelectFile={handleSelectActiveFile}
            onCreateAsset={handleCreateNewAssetNode}
            onDownloadZip={downloadWorkspaceZip}
            onUploadFiles={uploadWorkspaceFiles}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        </div>

        <button onClick={leaveRoom} className="mt-auto flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white">
          <LogOut className="h-4 w-4" /> Exit Room
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex flex-row gap-4 mb-4 h-[70%]">
          <div className="flex-1 h-full flex flex-col">

            <div className="flex justify-end mb-2">
              <button
                onClick={runCode}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                ▶ Run
              </button>
            </div>

            <div className="relative flex-1 min-h-0">
              <Editor socketRef={socketRef} roomId={roomId || ''} activeFile={activeFile} currentLanguage={currentLanguage} fileContent={activeFileContent} onCursorPositionChange={(position) => {
                socketRef.current?.emit(SOCKET_EVENTS.CURSOR_MOVE, {
                  roomId,
                  cursor: position,
                  currentFile: activeFile
                });
              }} onCodeChange={(c) => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.path === activeFile
                      ? {
                        ...f,
                        content: c
                      }
                      : f
                  )
                );

                if (autoSaveTimer.current) {
                  clearTimeout(
                    autoSaveTimer.current
                  );
                }

                autoSaveTimer.current =
                  setTimeout(() => {
                    saveFileToDatabase(
                      activeFile,
                      c
                    );
                  }, 2000);
              }} />
              {Object.values(remoteCursors)
                .filter((remoteCursor) => remoteCursor.currentFile === activeFile)
                .map((remoteCursor) => (
                  <RemoteCursor
                    key={remoteCursor.socketId}
                    username={remoteCursor.username}
                    position={remoteCursor.cursor}
                    color={assignCursorColor(remoteCursor.socketId)}
                    isVisible
                  />
                ))}
            </div>
          </div>
          <AiCopilot currentCode={activeFileContent} contextLanguage={currentLanguage} />
        </div>

        <Terminal
          entries={terminalEntries}
          isRunning={isCompiling}
          executionTime={executionTime}
          onClear={() => {
            setTerminalEntries([]);
            setExecutionTime(undefined);
          }}
          isOpen={isTerminalOpen}
          onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
        />
      </div>
    </div>
  );
};
