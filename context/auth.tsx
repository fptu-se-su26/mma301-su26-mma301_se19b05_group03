import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setUnauthorizedHandler } from '@/services/api';
import { registerForPush, unregisterFromPush } from '@/services/push';
import { clearToken, getToken, setToken } from '@/services/storage';

export type AuthUser = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  major?: string;
  skills?: string[];
  interests?: string[];
  description?: string;
  gpa?: number | null;
  avatarUrl?: string;
  studentCode?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    major?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      registerForPush();
    } catch {
      await clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    await setToken(res.data.token);
    setUser(res.data.user);
    registerForPush();
    return res.data.user as AuthUser;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; major?: string }) => {
      const res = await authApi.register(payload);
      await setToken(res.data.token);
      setUser(res.data.user);
      registerForPush();
      return res.data.user as AuthUser;
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    await unregisterFromPush();
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
};
