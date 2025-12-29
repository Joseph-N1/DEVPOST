/**
 * Authentication Context
 * Manages auth state and provides auth methods
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  theme?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGitHub: () => void;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'leggooo_tokens';
const USER_STORAGE_KEY = 'leggooo_user';

function getStoredTokens(): AuthTokens | null {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  
  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.accessToken || null;
  }, []);
  
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      
      if (!response.ok) {
        clearTokens();
        setUser(null);
        return false;
      }
      
      const newTokens = await response.json();
      storeTokens(newTokens);
      return true;
    } catch {
      return false;
    }
  }, []);
  
  const fetchUser = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.status === 401) {
        // Try refreshing token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = getAccessToken();
          if (newToken) {
            return fetchUser(newToken);
          }
        }
        return null;
      }
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.display_name,
        avatarUrl: data.user.avatar_url,
        theme: data.user.theme,
      };
    } catch {
      return null;
    }
  }, [refreshAccessToken, getAccessToken]);
  
  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      const tokens = getStoredTokens();
      
      if (tokens?.accessToken) {
        const userData = await fetchUser(tokens.accessToken);
        if (userData) {
          setUser(userData);
          storeUser(userData);
        } else {
          clearTokens();
        }
      }
      
      setIsLoading(false);
    }
    
    initAuth();
  }, [fetchUser]);
  
  // Handle OAuth callback from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const expiresIn = params.get('expiresIn');
    
    if (accessToken && refreshToken && expiresIn) {
      // Store tokens
      storeTokens({
        accessToken,
        refreshToken,
        expiresIn: parseInt(expiresIn, 10),
      });
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      // Fetch user data
      fetchUser(accessToken).then((userData) => {
        if (userData) {
          setUser(userData);
          storeUser(userData);
        }
        setIsLoading(false);
      });
    }
  }, [fetchUser]);
  
  const signInWithGitHub = useCallback(() => {
    window.location.href = `${API_URL}/auth/github`;
  }, []);
  
  const signOut = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore logout errors
      }
    }
    
    clearTokens();
    setUser(null);
  }, [getAccessToken]);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGitHub,
        signOut,
        refreshAccessToken,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
