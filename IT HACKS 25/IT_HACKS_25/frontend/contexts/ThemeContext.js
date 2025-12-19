/**
 * Theme Context - Provides theme management with 6 modes
 * Light, Dark, and 4 Seasonal themes (Spring, Summer, Autumn, Winter)
 */

import { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions with colors and emojis
export const THEMES = {
  light: {
    id: 'light',
    name: 'Light',
    emoji: '☀️',
    class: 'light',
    gradient: 'from-emerald-400 to-blue-500',
    primary: '#059669',
    secondary: '#2563eb',
    cardGlow: 'rgba(5, 150, 105, 0.3)',
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    emoji: '🌙',
    class: 'dark',
    gradient: 'from-purple-500 to-indigo-600',
    primary: '#8b5cf6',
    secondary: '#6366f1',
    cardGlow: 'rgba(139, 92, 246, 0.3)',
  },
  spring: {
    id: 'spring',
    name: 'Spring',
    emoji: '🌸',
    class: 'spring',
    gradient: 'from-pink-400 to-green-400',
    primary: '#ec4899',
    secondary: '#22c55e',
    cardGlow: 'rgba(236, 72, 153, 0.3)',
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    emoji: '🌻',
    class: 'summer',
    gradient: 'from-yellow-400 to-orange-500',
    primary: '#f59e0b',
    secondary: '#ef4444',
    cardGlow: 'rgba(245, 158, 11, 0.3)',
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    emoji: '🍂',
    class: 'autumn',
    gradient: 'from-orange-500 to-red-600',
    primary: '#ea580c',
    secondary: '#dc2626',
    cardGlow: 'rgba(234, 88, 12, 0.3)',
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    class: 'winter',
    gradient: 'from-cyan-400 to-blue-600',
    primary: '#06b6d4',
    secondary: '#2563eb',
    cardGlow: 'rgba(6, 182, 212, 0.3)',
  },
};

// Get suggested theme based on current month
const getSuggestedSeasonalTheme = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('eco-farm-theme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      } else {
        // Suggest seasonal theme on first visit
        const suggested = getSuggestedSeasonalTheme();
        setCurrentTheme(suggested);
      }
    } catch (e) {
      // localStorage may not be available
      console.warn('Could not access localStorage for theme');
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Remove all theme classes
    Object.keys(THEMES).forEach((t) => {
      root.classList.remove(t);
    });
    
    // Add current theme class
    root.classList.add(currentTheme);
    
    // Set CSS variables for current theme
    const themeObj = THEMES[currentTheme];
    if (themeObj) {
      root.style.setProperty('--theme-primary', themeObj.primary);
      root.style.setProperty('--theme-secondary', themeObj.secondary);
      root.style.setProperty('--theme-glow', themeObj.cardGlow);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('eco-farm-theme', currentTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage');
    }
  }, [currentTheme, mounted]);

  const changeTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setCurrentTheme(newTheme);
    }
  };

  const currentThemeObj = THEMES[currentTheme];
  const isDark = currentTheme === 'dark';

  // Get suggested theme based on current season
  const getSuggestedTheme = () => getSuggestedSeasonalTheme();

  const value = {
    theme: currentThemeObj,        // Full theme object for compatibility
    currentTheme: currentTheme,    // Theme ID string ('light', 'dark', etc.)
    themes: THEMES,
    setTheme: changeTheme,         // Renamed for consistency with usage
    changeTheme,                   // Keep original name too
    isDark,
    getSuggestedTheme,
    suggestedTheme: getSuggestedSeasonalTheme(),
  };

  // Always render children - don't return null as it breaks SSR
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values instead of throwing to avoid SSR issues
    return {
      theme: THEMES.light,
      currentTheme: 'light',
      themes: THEMES,
      setTheme: () => {},
      changeTheme: () => {},
      isDark: false,
      getSuggestedTheme: () => 'light',
      suggestedTheme: 'light',
    };
  }
  return context;
}

export default ThemeContext;
