import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext(null);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check if user has a preference saved
    const saved = localStorage.getItem('theme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved;
    }
    // Default to system
    return 'system';
  });

  // Calculate isDark based on theme
  const getIsDark = (currentTheme) => {
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return currentTheme === 'dark';
  };

  const [isDark, setIsDark] = useState(() => getIsDark(theme));

  // Update dark mode class and state when theme changes
  useEffect(() => {
    const shouldBeDark = getIsDark(theme);
    setIsDark(shouldBeDark);

    // Update class on html element immediately
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes (only if theme is 'system')
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const shouldBeDark = e.matches;
      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Check initial value
    handleChange({ matches: mediaQuery.matches });

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      setTheme(mode);
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDark, theme, setThemeMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

