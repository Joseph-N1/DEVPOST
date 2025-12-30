import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide default theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.theme).toBeDefined();
    expect(['light', 'dark', 'system']).toContain(result.current.theme);
  });

  it('should toggle between light and dark themes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    const initialResolved = result.current.resolvedTheme;
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.resolvedTheme).not.toBe(initialResolved);
  });

  it('should set specific theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme('light');
    });
    
    expect(localStorage.setItem).toHaveBeenCalledWith('leggooo-theme', 'light');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });
});
