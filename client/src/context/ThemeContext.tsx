import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Load initial preference from cache or default to dark theme for developers
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('codesync_theme') as Theme;
    return savedTheme || 'dark';
  });

  // 2. 🚀 Core System Design Injection: Manipulate the real DOM element root directly
  useEffect(() => {
    const rootElement = window.document.documentElement;
    
    if (theme === 'dark') {
      rootElement.classList.add('dark');
      rootElement.style.colorScheme = 'dark';
    } else {
      rootElement.classList.remove('dark');
      rootElement.style.colorScheme = 'light';
    }
    
    localStorage.setItem('codesync_theme', theme); // Persist setting
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be executed cleanly inside a ThemeProvider boundary block');
  }
  return context;
};