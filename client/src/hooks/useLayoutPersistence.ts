import { useEffect, useState } from 'react';

interface PanelSizes {
  fileExplorer: number;
  editor: number;
  aiCopilot: number;
  terminal: number;
}

const STORAGE_KEY = 'codesync_panel_sizes';

export const useLayoutPersistence = () => {
  const [sizes, setSizes] = useState<PanelSizes>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load panel sizes:', error);
    }

    // Default sizes
    return {
      fileExplorer: 20,
      editor: 50,
      aiCopilot: 30,
      terminal: 25,
    };
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateSizes = (newSizes: Partial<PanelSizes>) => {
    const updated = { ...sizes, ...newSizes };
    setSizes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save panel sizes:', error);
    }
  };

  const resetSizes = () => {
    const defaults = {
      fileExplorer: 20,
      editor: 50,
      aiCopilot: 30,
      terminal: 25,
    };
    setSizes(defaults);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch (error) {
      console.error('Failed to reset panel sizes:', error);
    }
  };

  return {
    sizes,
    updateSizes,
    resetSizes,
    isMobile,
  };
};

export default useLayoutPersistence;
