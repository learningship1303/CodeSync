import React from 'react';
import { Sun, Moon } from 'lucide-react'; // Elegant modern svg icon sets
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-lg border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-500 dark:text-indigo-400 hover:scale-110 active:scale-95 transition-all shadow-md focus:outline-none"
      aria-label="Toggle CodeSync Application Theme Palette"
    >
      {/* 🚀 Dynamic Icon Rendering based on theme condition state without text placeholders */}
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 animate-pulse" /> // Show hot Sun icon in dark mode to switch to light
      ) : (
        <Moon className="h-5 w-5" /> // Show Moon icon in light mode to switch to dark
      )}
    </button>
  );
};