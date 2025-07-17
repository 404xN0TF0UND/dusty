import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('dusty-theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'dark'; // Default to dark theme for Dusty's aesthetic
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('dusty-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--color-background', '#1a1a1a');
      root.style.setProperty('--color-surface', '#2d2d2d');
      root.style.setProperty('--color-surface-secondary', '#3a3a3a');
      root.style.setProperty('--color-text', '#ffffff');
      root.style.setProperty('--color-text-secondary', '#cccccc');
      root.style.setProperty('--color-text-muted', '#999999');
      root.style.setProperty('--color-border', '#404040');
      root.style.setProperty('--color-primary', '#8b5cf6');
      root.style.setProperty('--color-primary-hover', '#7c3aed');
      root.style.setProperty('--color-secondary', '#6b7280');
      root.style.setProperty('--color-success', '#22c55e');
      root.style.setProperty('--color-warning', '#f59e0b');
      root.style.setProperty('--color-danger', '#ef4444');
      root.style.setProperty('--color-info', '#3b82f6');
    } else {
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-surface', '#f8f9fa');
      root.style.setProperty('--color-surface-secondary', '#e9ecef');
      root.style.setProperty('--color-text', '#212529');
      root.style.setProperty('--color-text-secondary', '#6c757d');
      root.style.setProperty('--color-text-muted', '#adb5bd');
      root.style.setProperty('--color-border', '#dee2e6');
      root.style.setProperty('--color-primary', '#8b5cf6');
      root.style.setProperty('--color-primary-hover', '#7c3aed');
      root.style.setProperty('--color-secondary', '#6b7280');
      root.style.setProperty('--color-success', '#22c55e');
      root.style.setProperty('--color-warning', '#f59e0b');
      root.style.setProperty('--color-danger', '#ef4444');
      root.style.setProperty('--color-info', '#3b82f6');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 