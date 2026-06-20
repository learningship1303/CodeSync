import React from 'react';
import { ChevronDown, Trash2, Copy } from 'lucide-react';

export interface TerminalEntry {
  type: 'output' | 'error' | 'success' | 'info' | 'compilation';
  content: string;
  timestamp?: Date;
}

interface TerminalProps {
  entries: TerminalEntry[];
  isRunning: boolean;
  executionTime?: number;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  entries,
  isRunning,
  executionTime,
  onClear,
  isOpen,
  onToggle,
}) => {
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const getEntryColor = (type: TerminalEntry['type']): string => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'compilation':
        return 'text-blue-400';
      case 'info':
        return 'text-slate-300';
      default:
        return 'text-slate-200';
    }
  };

  const getEntryPrefix = (type: TerminalEntry['type']): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'compilation':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      default:
        return '>';
    }
  };

  const copyToClipboard = () => {
    const text = entries.map(e => e.content).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col transition-all duration-300">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Terminal</span>
          {isRunning && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400">Running...</span>
            </div>
          )}
          {executionTime !== undefined && !isRunning && (
            <span className="text-xs text-slate-400">({executionTime}ms)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy output"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle terminal"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      {isOpen && (
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto max-h-48 bg-slate-900">
          {entries.length === 0 ? (
            <div className="text-slate-500">Ready to execute code...</div>
          ) : (
            entries.map((entry, idx) => (
              <div key={idx} className={`mb-1 ${getEntryColor(entry.type)} flex items-start gap-2`}>
                <span className="flex-shrink-0 w-4 text-center">{getEntryPrefix(entry.type)}</span>
                <pre className="flex-1 whitespace-pre-wrap break-words">{entry.content}</pre>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
};

export default Terminal;
