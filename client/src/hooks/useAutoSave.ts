import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

export interface FileNode {
  path: string;
  content?: string;
  type: 'file' | 'folder';
}

export const useAutoSave = (
  roomId: string | undefined,
  activeFile: string,
  fileContent: string
) => {
 const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<{ path: string; content: string } | null>(null);

  // Manual save function
  const saveFile = async (filePath: string, code: string): Promise<boolean> => {
    if (!roomId || !filePath) return false;

    try {
      await API.post(`/rooms/${roomId}/files/save`, {
        path: filePath,
        content: code,
        lastModified: new Date().toISOString(),
      });

      lastSaveRef.current = { path: filePath, content: code };
      toast.success('Saved', { duration: 800 });
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Save failed');
      return false;
    }
  };

  // Trigger auto-save with debouncing
  const triggerAutoSave = (code: string) => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Check if content actually changed
    if (lastSaveRef.current?.path === activeFile && lastSaveRef.current?.content === code) {
      return;
    }

    // Set new timer for 5 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      saveFile(activeFile, code);
    }, 5000);
  };

  // Save on component unmount or route change
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    triggerAutoSave,
    saveFile,
  };
};

export default useAutoSave;
