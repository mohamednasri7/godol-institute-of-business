import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleSwitch({ className = '', isTransparent = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to full dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to full dark mode'}
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-slate-800 border border-slate-700 shadow-inner'
          : isTransparent
          ? 'bg-white/20 border border-white/30 backdrop-blur-sm'
          : 'bg-slate-200 border border-slate-300'
      } ${className}`}
    >
      {/* Background Icons */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
        <Sun className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'opacity-30 text-amber-200' : 'opacity-100 text-amber-500'}`} />
        <Moon className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'opacity-100 text-blue-300' : 'opacity-30 text-slate-500'}`} />
      </span>

      {/* The Moving Switch Handle / Knob */}
      <span
        className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full shadow-md transform transition-all duration-300 ease-spring ${
          isDark
            ? 'translate-x-7 bg-primary text-white shadow-primary/30'
            : 'translate-x-0 bg-white text-amber-500 shadow-sm'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Sun className="w-3.5 h-3.5 fill-current" />
        )}
      </span>
    </button>
  );
}

