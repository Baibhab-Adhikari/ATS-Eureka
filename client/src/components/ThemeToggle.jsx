import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl dark:bg-white/5 bg-gray-100 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 dark:text-white/70 text-gray-700" />
      ) : (
        <Moon className="w-5 h-5 dark:text-white/70 text-gray-700" />
      )}
    </button>
  );
}
