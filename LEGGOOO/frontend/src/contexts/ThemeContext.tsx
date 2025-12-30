import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// Base themes (light/dark mode)
export type BaseTheme = 'light' | 'dark' | 'system';
export type ResolvedBaseTheme = 'light' | 'dark';

// Mood themes (optional overlay)
export type MoodTheme = 'default' | 'anime' | 'neon-city' | 'space-explorer' | 'nature-forest' | 'mechanical' | 'aviation';

// All available themes for direct selection
export type AllTheme = 'light' | 'dark' | 'system' | 'anime' | 'neon-city' | 'space-explorer' | 'nature-forest' | 'mechanical' | 'aviation';

interface ThemeContextValue {
  theme: BaseTheme;
  moodTheme: MoodTheme;
  resolvedTheme: ResolvedBaseTheme;
  activeTheme: string; // The actual theme applied to DOM
  setTheme: (theme: BaseTheme) => void;
  setMoodTheme: (mood: MoodTheme) => void;
  setFullTheme: (theme: AllTheme) => void;
  toggleTheme: () => void;
  availableThemes: readonly { id: AllTheme; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'leggooo-theme';
const MOOD_STORAGE_KEY = 'leggooo-mood';

// Theme metadata for UI
const AVAILABLE_THEMES = [
  { id: 'light' as const, name: 'Light', description: 'Clean light mode' },
  { id: 'dark' as const, name: 'Dark', description: 'Easy on the eyes' },
  { id: 'system' as const, name: 'System', description: 'Follow OS setting' },
  { id: 'anime' as const, name: 'Anime', description: 'Soft pastels, kawaii vibes' },
  { id: 'neon-city' as const, name: 'Neon City', description: 'Cyberpunk glow' },
  { id: 'space-explorer' as const, name: 'Space Explorer', description: 'Deep cosmic blues' },
  { id: 'nature-forest' as const, name: 'Nature Forest', description: 'Earthy greens' },
  { id: 'mechanical' as const, name: 'Mechanical', description: 'Industrial orange' },
  { id: 'aviation' as const, name: 'Aviation', description: 'Cockpit blues' },
] as const;

const MOOD_THEMES: MoodTheme[] = ['anime', 'neon-city', 'space-explorer', 'nature-forest', 'mechanical', 'aviation'];

function getSystemTheme(): ResolvedBaseTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): BaseTheme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getStoredMood(): MoodTheme {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(MOOD_STORAGE_KEY);
  if (stored && MOOD_THEMES.includes(stored as MoodTheme)) {
    return stored as MoodTheme;
  }
  return 'default';
}

function resolveTheme(theme: BaseTheme): ResolvedBaseTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: BaseTheme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<BaseTheme>(() => getStoredTheme() || defaultTheme);
  const [moodTheme, setMoodThemeState] = useState<MoodTheme>(() => getStoredMood());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedBaseTheme>(() => resolveTheme(theme));

  // Compute the actual theme to apply
  const activeTheme = moodTheme !== 'default' ? moodTheme : resolvedTheme;

  // Apply theme to document
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');
    
    // Apply the active theme
    const themeToApply = moodTheme !== 'default' ? moodTheme : resolved;
    root.setAttribute('data-theme', themeToApply);
    
    // Set color-scheme for native elements
    const isDark = ['dark', 'neon-city', 'space-explorer', 'nature-forest', 'mechanical', 'aviation'].includes(themeToApply);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.classList.add(isDark ? 'dark' : 'light');
  }, [theme, moodTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system' || moodTheme !== 'default') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newResolved);
      root.setAttribute('data-theme', newResolved);
      root.style.colorScheme = newResolved;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, moodTheme]);

  const setTheme = useCallback((newTheme: BaseTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    // Reset mood when setting base theme
    setMoodThemeState('default');
    localStorage.setItem(MOOD_STORAGE_KEY, 'default');
  }, []);

  const setMoodTheme = useCallback((mood: MoodTheme) => {
    setMoodThemeState(mood);
    localStorage.setItem(MOOD_STORAGE_KEY, mood);
  }, []);

  // Set any theme directly (for theme picker UI)
  const setFullTheme = useCallback((newTheme: AllTheme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      setTheme(newTheme);
    } else {
      // It's a mood theme
      setMoodThemeState(newTheme as MoodTheme);
      localStorage.setItem(MOOD_STORAGE_KEY, newTheme);
    }
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    if (moodTheme !== 'default') {
      // If using mood theme, switch to opposite base
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  }, [resolvedTheme, moodTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      moodTheme,
      resolvedTheme, 
      activeTheme,
      setTheme, 
      setMoodTheme,
      setFullTheme,
      toggleTheme,
      availableThemes: AVAILABLE_THEMES,
    }}>
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

// Hook for checking if component has mounted (for SSR-safe theme)
export function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
