import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onRun?: () => void;
  onToggleFileExplorer?: () => void;
  onToggleTerminal?: () => void;
  onToggleChat?: () => void;
  onOpenCommandPalette?: () => void;
  onCommentToggle?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Ctrl+S or Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      }

      // Ctrl+Enter or Cmd+Enter: Run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlers.onRun?.();
      }

      // Ctrl+B or Cmd+B: Toggle File Explorer
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handlers.onToggleFileExplorer?.();
      }

      // Ctrl+J or Cmd+J: Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        handlers.onToggleTerminal?.();
      }

      // Ctrl+Shift+P or Cmd+Shift+P: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handlers.onOpenCommandPalette?.();
      }

      // Ctrl+Shift+C or Cmd+Shift+C: Toggle Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handlers.onToggleChat?.();
      }

      // Ctrl+/ or Cmd+/: Toggle Comment (in Monaco editor)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        // Let Monaco handle this, but we could add custom logic
        // e.preventDefault();
        // handlers.onCommentToggle?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);

  // Display shortcut information
  const shortcuts = [
    { keys: 'Ctrl+S', action: 'Save' },
    { keys: 'Ctrl+Enter', action: 'Run Code' },
    { keys: 'Ctrl+B', action: 'Toggle File Explorer' },
    { keys: 'Ctrl+J', action: 'Toggle Terminal' },
    { keys: 'Ctrl+Shift+P', action: 'Command Palette' },
    { keys: 'Ctrl+Shift+C', action: 'Toggle Chat' },
    { keys: 'Ctrl+/', action: 'Comment Toggle' },
  ];

  return { shortcuts };
};

export default useKeyboardShortcuts;
