import { useEffect, useRef, useState } from 'react';
import { SOCKET_EVENTS } from '../interfaces/socketEvents';
import { assignCursorColor } from '../services/cursorColorAssignment';

export interface RemoteCursorData {
  socketId: string;
  username: string;
  position: { x: number; y: number; line?: number; column?: number };
  currentFile: string;
  color: string;
}

export const useCursorTracking = (
  roomId: string | undefined,
  activeFile: string,
  socketRef: React.MutableRefObject<any>
) => {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursorData>>(new Map());
 const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Broadcast cursor position
  const broadcastCursor = (x: number, y: number, line?: number, column?: number) => {
    if (!socketRef.current || !roomId) return;

    socketRef.current.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      roomId,
      cursor: { x, y, line, column },
      currentFile: activeFile,
    });
  };

  // Handle Monaco editor cursor change
  const handleEditorCursorChange = (position: any) => {
    if (!position) return;

    // Get approximate pixel position (this is simplified, Monaco API is needed for exact position)
    const x = position.column * 8; // Approximate character width
    const y = position.lineNumber * 20; // Approximate line height

    broadcastCursor(x, y, position.lineNumber, position.column);
  };

  // Listen for remote cursor updates
  useEffect(() => {
    if (!socketRef.current || !roomId) return;

    socketRef.current.on(SOCKET_EVENTS.CURSOR_MOVE, (data: any) => {
      const { socketId, username, cursor, currentFile } = data;

      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.set(socketId, {
          socketId,
          username,
          position: cursor,
          currentFile,
          color: assignCursorColor(socketId),
        });
        return updated;
      });

      // Clear cursor after 5 seconds of inactivity
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        setRemoteCursors((prev) => {
          const updated = new Map(prev);
          updated.delete(socketId);
          return updated;
        });
      }, 5000);
    });

    // Handle cursor leave when user switches files
    socketRef.current.on('cursor-leave', ({ socketId }: { socketId: string }) => {
      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.delete(socketId);
        return updated;
      });
    });

    // Handle disconnection
    socketRef.current.on('user-disconnected', ({ socketId }: { socketId: string }) => {
      setRemoteCursors((prev) => {
        const updated = new Map(prev);
        updated.delete(socketId);
        return updated;
      });
    });

    return () => {
      socketRef.current?.off(SOCKET_EVENTS.CURSOR_MOVE);
      socketRef.current?.off('cursor-leave');
      socketRef.current?.off('user-disconnected');
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [roomId]);

  // Filter cursors to show only for current file
  const visibleCursors = Array.from(remoteCursors.values()).filter(
    (cursor) => cursor.currentFile === activeFile
  );

  return {
    remoteCursors: visibleCursors,
    handleEditorCursorChange,
    broadcastCursor,
  };
};

export default useCursorTracking;
