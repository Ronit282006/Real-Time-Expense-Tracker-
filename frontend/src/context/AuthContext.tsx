import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../types';
import { getMeApi } from '../api/client';

interface AuthCtx {
  token: string | null;
  user: UserProfile | null;
  setToken: (t: string | null) => void;
  setUser: (u: UserProfile | null) => void;
  logout: () => void;
  isAuth: boolean;
}

const AuthContext = createContext<AuthCtx>(null!);

function storeUser(u: UserProfile | null) {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const setToken = (t: string | null) => {
    if (t) localStorage.setItem('token', t);
    else { localStorage.removeItem('token'); storeUser(null); }
    setTokenState(t);
  };

  const setUserAndPersist = (u: UserProfile | null) => { storeUser(u); setUser(u); };

  const logout = () => { setToken(null); setUser(null); storeUser(null); };

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    getMeApi()
      .then(r => setUserAndPersist(r.data))
      .catch(() => { /* interceptor handles 401 -> redirect to login */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, setToken, setUser: setUserAndPersist, logout, isAuth: !!token || !!localStorage.getItem('token') }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
