import React, { useState } from 'react';
import {
  Folder,
  File,
  FileCode,
  Plus,
  FolderPlus,
  Download,
  Trash2,
  Pencil,
  Upload
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCreateAsset: (type: 'file' | 'folder', name: string) => void;
  onDownloadZip: () => void;
  onUploadFiles: (files: FileList) => void;

  onDeleteFile: (filePath: string) => void;
  onRenameFile: (
  oldPath: string,
  newPath: string
) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateAsset,
  onDownloadZip,
  onUploadFiles,
  onDeleteFile,
  onRenameFile
}) => {
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [assetName, setAssetName] = useState('');

  const handleAssetCreationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    onCreateAsset(isCreating!, assetName.trim());
    setAssetName('');
    setIsCreating(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/80 mt-4">
      {/* Module Navigation Tools Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Files</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsCreating('file')} 
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Create New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setIsCreating('folder')} 
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Create New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={onDownloadZip} 
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-500 transition-colors"
            title="Download Workspace (ZIP)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <label
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-500 transition-colors cursor-pointer"
            title="Upload Files"
          >
            <Upload className="h-3.5 w-3.5" />
            <input
              type="file"
              multiple
              accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md"
              {...({ webkitdirectory: '', directory: '' } as any)}
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  onUploadFiles(event.target.files);
                  event.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Inline Creation Forms Input Box */}
      {isCreating && (
        <form onSubmit={handleAssetCreationSubmit} className="mb-3">
          <input
            type="text"
            autoFocus
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder={isCreating === 'file' ? 'index.js' : 'src'}
            onBlur={() => setIsCreating(null)}
            className="w-full bg-white dark:bg-slate-900 border border-indigo-500 text-slate-900 dark:text-slate-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
          />
        </form>
      )}

      {/* Files List Stream Render Matrix */}
      <div className="space-y-1 overflow-y-auto flex-1 pr-1 font-mono text-xs">
        {files.map((file) => {
          const isSelected = activeFile === file.path;
          return (
            <div
  key={file.path}
  className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
    isSelected
      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10'
      : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
  }`}
>
             <div
  className="flex items-center gap-2 flex-1 cursor-pointer"
  onClick={() =>
    file.type === 'file' &&
    onSelectFile(file.path)
  }
>
  {file.type === 'folder' ? (
    <Folder
      className={`h-3.5 w-3.5 ${
        isSelected
          ? 'text-white'
          : 'text-amber-500'
      }`}
    />
  ) : file.path.endsWith('.js') ||
    file.path.endsWith('.ts') ||
    file.path.endsWith('.tsx') ? (
    <FileCode
      className={`h-3.5 w-3.5 ${
        isSelected
          ? 'text-white'
          : 'text-sky-500'
      }`}
    />
  ) : (
    <File
      className={`h-3.5 w-3.5 ${
        isSelected
          ? 'text-white'
          : 'text-slate-400'
      }`}
    />
  )}

  <span className="truncate" title={file.path}>
    {file.path}
  </span>
</div>
<button
  onClick={(e) => {
    e.stopPropagation();

    const newName =
      prompt(
        'Enter new file name',
        file.name
      );

    if (
      newName &&
      newName !== file.name
    ) {
      onRenameFile(
        file.path,
        newName
      );
    }
  }}
  className="text-yellow-400 hover:text-yellow-600"
>
  <Pencil className="h-3.5 w-3.5" />
</button>
<button
  onClick={(e) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Delete ${file.name}?`
      )
    ) {
      onDeleteFile(file.path);
    }
  }}
  className="text-red-400 hover:text-red-600"
>
  <Trash2 className="h-3.5 w-3.5" />
</button> 
            </div>
          );
        })}
      </div>
    </div>
  );
};
