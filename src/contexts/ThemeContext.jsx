import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Theme Context - Manages dark/light theme state
 */
const ThemeContext = createContext(null);

/**
 * Theme Provider - Provides theme context to the application
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ThemeProvider({ children }) {
  // Initialize from localStorage or default to dark theme
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) {
        return stored === 'dark';
      }
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark theme
  });

  // Apply theme class to document body
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    // Persist to localStorage
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem('theme');
      if (!stored) {
        setIsDarkTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkTheme(prev => !prev);
  }, []);

  const value = {
    isDarkTheme,
    toggleTheme,
    theme: isDarkTheme ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @returns {{ isDarkTheme: boolean, toggleTheme: Function, theme: string }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
