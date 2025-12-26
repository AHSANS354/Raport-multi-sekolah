'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { User, LoginCredentials, AuthResponse, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuthData = useCallback((user: User | null, token: string | null) => {
    if (user && token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_USER_KEY);

      if (!token || !userStr) {
        setAuthData(null, null);
        return;
      }

      const user = JSON.parse(userStr) as User;
      
      // Verify token is still valid by fetching user profile
      const response = await apiClient.get<{ data: User }>('/auth/me');
      setAuthData(response.data, token);
    } catch {
      setAuthData(null, null);
    }
  }, [setAuthData]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{ data: AuthResponse; message: string }>('/auth/login', credentials);
    setAuthData(response.data.user, response.data.token);
    router.push('/dashboard');
  }, [setAuthData, router]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      setAuthData(null, null);
      router.push('/login');
    }
  }, [setAuthData, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
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
