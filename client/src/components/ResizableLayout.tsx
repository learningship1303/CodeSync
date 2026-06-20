import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

interface ResizableLayoutProps {
  fileExplorer: React.ReactNode;
  editor: React.ReactNode;
  aiCopilot: React.ReactNode;
  terminal: React.ReactNode;
  isMobile: boolean;
  onResize?: (sizes: { fileExplorer: number; editor: number; aiCopilot: number }) => void;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  fileExplorer,
  editor,
  aiCopilot,
  terminal,
  isMobile,
  onResize,
}) => {
  const handleResize = (sizes: number[]) => {
    if (onResize && sizes.length >= 3) {
      onResize({
        fileExplorer: sizes[0],
        editor: sizes[1],
        aiCopilot: sizes[2],
      });
    }
  };

  if (isMobile) {
    // Stack layout on mobile
    return (
      <div className="flex flex-col h-full gap-4">
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500 mb-2">File Explorer</div>
          {fileExplorer}
        </div>
        <div className="flex-1 min-h-0">
          <div className="text-xs text-slate-500 mb-2">Editor</div>
          {editor}
        </div>
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500 mb-2">AI Copilot</div>
          {aiCopilot}
        </div>
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500 mb-2">Terminal</div>
          {terminal}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Horizontal panels: File Explorer | Editor | AI Copilot */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" onLayout={handleResize}>
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full overflow-hidden">{fileExplorer}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-indigo-500 transition-colors" />

          <Panel defaultSize={50} minSize={30}>
            <div className="h-full overflow-hidden">{editor}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-indigo-500 transition-colors" />

          <Panel defaultSize={30} minSize={20} maxSize={50}>
            <div className="h-full overflow-hidden">{aiCopilot}</div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Vertical divider */}
      <div className="h-px bg-slate-700" />

      {/* Terminal panel */}
      <div className="flex-shrink-0 h-48">{terminal}</div>
    </div>
  );
};

export default ResizableLayout;
