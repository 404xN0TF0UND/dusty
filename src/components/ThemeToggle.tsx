import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="toggle-track">
        <div className={`toggle-thumb ${theme === 'light' ? 'light' : 'dark'}`}>
          {theme === 'dark' ? (
            <span className="toggle-icon">🌙</span>
          ) : (
            <span className="toggle-icon">☀️</span>
          )}
        </div>
      </div>
    </button>
  );
}; 