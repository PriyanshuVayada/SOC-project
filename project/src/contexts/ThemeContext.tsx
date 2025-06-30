/**
 * Theme Context for SOC Dashboard
 * 
 * Manages dark/light mode theme state with persistent storage.
 * Provides theme-aware styling and smooth transitions between modes.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to dark mode (typical for SOC dashboards)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('soc-theme-mode');
    return saved ? saved === 'dark' : true; // Default to dark mode
  });

  // Apply theme to document and persist to localStorage
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('soc-theme-mode', theme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}