import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode
 */
export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('al-theme');
    if (saved) {
      return saved === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('al-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return [isDark, toggleDarkMode];
}

/**
 * Hook for getting current theme
 */
export function useTheme(): 'dark' | 'light' | 'system' {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    const saved = localStorage.getItem('al-theme-preference');
    return saved as 'dark' | 'light' | 'system' || 'system';
  });

  useEffect(() => {
    const saved = localStorage.getItem('al-theme-preference');
    if (saved) {
      setTheme(saved as 'dark' | 'light' | 'system');
    }
  }, []);

  return theme;
}

/**
 * Hook for setting theme
 */
export function useSetTheme(): (theme: 'dark' | 'light' | 'system') => void {
  const setTheme = (theme: 'dark' | 'light' | 'system') => {
    localStorage.setItem('al-theme-preference', theme);
    
    // Apply theme immediately
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System - check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  return setTheme;
}
