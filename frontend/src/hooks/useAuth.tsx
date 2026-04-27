import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, AuthResponse, User } from '../services/api';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    
    if (token) {
      // Intentar refrescar datos desde el servidor para tener lo último (puntos, nivel, etc)
      api.get<User>('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Si falla (ej. token expirado), usar lo que hay en localStorage o desloguear
          if (rawUser) setUser(JSON.parse(rawUser));
        })
        .finally(() => setLoading(false));
    } else {
      if (rawUser) setUser(JSON.parse(rawUser));
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: Boolean(user),
    loading,
    async login(email: string, password: string) {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}


