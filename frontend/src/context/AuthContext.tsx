import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, User } from '../types';
import { authLogin, authRegister } from '../api/services';

interface AuthCtx { user: User | null; token: string | null; loading: boolean; login: (e: string, p: string) => Promise<void>; register: (payload: any) => Promise<void>; logout: () => void; }

const Ctx = createContext<AuthCtx | undefined>(undefined);
const KEY = 'ams_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) { try { const a = JSON.parse(stored) as AuthResponse; setUser(a.user); setToken(a.token); } catch { localStorage.removeItem(KEY); } }
    setLoading(false);
  }, []);

  const save = (auth: AuthResponse) => { localStorage.setItem(KEY, JSON.stringify(auth)); setUser(auth.user); setToken(auth.token); };

  const login = async (email: string, password: string) => { const a = await authLogin({ email, password }); save(a); };
  const register = async (payload: any) => { const a = await authRegister(payload); save(a); };
  const logout = () => { localStorage.removeItem(KEY); setUser(null); setToken(null); };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('useAuth outside provider'); return c; };