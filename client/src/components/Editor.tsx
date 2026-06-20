import React, { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { SOCKET_EVENTS } from '../interfaces/socketEvents';

interface EditorProps {
  socketRef: React.MutableRefObject<any>;
  roomId: string;
  activeFile: string;
  currentLanguage: string;
  fileContent: string;
  onCodeChange: (code: string) => void;
  onCursorPositionChange?: (position: {
    x: number;
    y: number;
    line: number;
    column: number;
  }) => void;
}

export const Editor: React.FC<EditorProps> = ({
  socketRef,
  roomId,
  activeFile,
  currentLanguage,
  fileContent,
  onCodeChange,
  onCursorPositionChange
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const monacoApiRef = useRef<any>(null);
  const modelsMapRef = useRef<Record<string, any>>({});
  const cursorListenerRef = useRef<any>(null);
  
  // 🚀 Guard flag to prevent infinite loops during remote sync
  const isRemoteChange = useRef(false);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monacoApiRef.current = monaco;

    const initialModel = monacoApiRef.current.editor.createModel(fileContent, currentLanguage);
    modelsMapRef.current[activeFile] = initialModel;
    editor.setModel(initialModel);

    cursorListenerRef.current?.dispose();
    cursorListenerRef.current = editor.onDidChangeCursorPosition((event: any) => {
      const pixelPosition = editor.getScrolledVisiblePosition(event.position);
      if (!pixelPosition) return;

      onCursorPositionChange?.({
        x: pixelPosition.left,
        y: pixelPosition.top,
        line: event.position.lineNumber,
        column: event.position.column,
      });
    });
  };

  // Sync state when activeFile changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    let targetModel = modelsMapRef.current[activeFile];

    if (!targetModel) {
     targetModel =
  monacoRef.current.editor.createModel(
    fileContent,
    currentLanguage
  );
      modelsMapRef.current[activeFile] = targetModel;
    } else {
   monacoRef.current.editor.setModelLanguage(
  targetModel,
  currentLanguage
);   
    }

    if (targetModel.getValue() !== fileContent) {
      isRemoteChange.current = true;
      targetModel.pushEditOperations(
        [],
        [{ range: targetModel.getFullModelRange(), text: fileContent }],
        () => null
      );
      isRemoteChange.current = false;
    }

    editorRef.current.setModel(targetModel);
  }, [activeFile, currentLanguage, fileContent]);

  // Sync incoming code changes from socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on(SOCKET_EVENTS.CODE_CHANGE, ({ filePath, code }: { filePath: string; code: string }) => {
      const targetModel = modelsMapRef.current[filePath];
      if (targetModel && targetModel.getValue() !== code) {
        isRemoteChange.current = true;
        
        // Preserve undo/redo stack using pushEditOperations
        const fullRange = targetModel.getFullModelRange();
        targetModel.pushEditOperations(
          [],
          [{ range: fullRange, text: code }],
          () => null
        );
        
        isRemoteChange.current = false;
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.CODE_CHANGE);
    };
  }, [socketRef.current, activeFile]);

  // Memory management: Cleanup on unmount
  useEffect(() => {
    const models = modelsMapRef.current;
    return () => {
      cursorListenerRef.current?.dispose();
      Object.values(models).forEach(model => model.dispose());
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (isRemoteChange.current) return;

    const cleanValue = value || '';
    onCodeChange(cleanValue);

    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.CODE_CHANGE, {
        roomId,
        filePath: activeFile,
        code: cleanValue
      });
    }
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language={currentLanguage}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'Fira Code, JetBrains Mono, monospace',
          minimap: { enabled: true },
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
