import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  group?: string;
  onExecute: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on search
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      const group = cmd.group || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onExecute();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    inputRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-black/50">
      <div className="w-full max-w-2xl max-h-96 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command name..."
            className="flex-1 bg-transparent text-white outline-none placeholder-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Commands List */}
        <div className="overflow-y-auto flex-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No commands found for "{search}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([group, groupCmds]) => (
              <div key={group}>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-900 sticky top-0">
                  {group}
                </div>
                {groupCmds.map((cmd, idx) => {
                  const isSelected =
                    filteredCommands.indexOf(cmd) === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.onExecute();
                        onClose();
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs opacity-75">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <div className="text-xs opacity-60 font-mono">
                          {cmd.shortcut}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-500">
          Press ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
