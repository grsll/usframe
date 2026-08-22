import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('us_theme_preference') as Theme;
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          return saved;
        }
      }
    } catch {}
    return 'light';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const root = document.documentElement;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('us_theme_preference', theme);
        }
      } catch {}

      if (theme === 'system') {
        const systemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(!!systemDark);
        if (systemDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      } else if (theme === 'dark') {
        setIsDark(true);
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        setIsDark(false);
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } catch (err) {
      console.warn('Theme switch error:', err);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
