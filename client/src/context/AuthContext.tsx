import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, attempt to load the current user from the server.
  // If the access token cookie is valid, this succeeds silently.
  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }: LoginInput): Promise<User> => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(
    async ({ email, password, display_name }: RegisterInput): Promise<User> => {
      const res = await authApi.register({ email, password, display_name });
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
