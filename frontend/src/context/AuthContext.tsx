import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../api/apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'ams_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const auth = JSON.parse(stored) as AuthResponse;
        setUser(auth.user);
        setToken(auth.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (payload: LoginRequest) => {
    const response = await api.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/login', payload);
    if (response.data.success) {
      const auth = response.data.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      setUser(auth.user);
      setToken(auth.token);
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const register = async (payload: RegisterRequest) => {
    const response = await api.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/register', payload);
    if (response.data.success) {
      const auth = response.data.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      setUser(auth.user);
      setToken(auth.token);
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
