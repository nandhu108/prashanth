import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | signed-in | signed-out

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus('signed-out');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  useEffect(() => {
    if (!getToken()) {
      setStatus('signed-out');
      return;
    }
    api
      .me()
      .then((res) => {
        setUser(res.data.user);
        setStatus('signed-in');
      })
      .catch(() => {
        setToken(null);
        setStatus('signed-out');
      });
  }, []);

  const signIn = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.data.token);
    setUser(res.data.user);
    setStatus('signed-in');
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, isReady: status !== 'loading' }),
    [user, status, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
