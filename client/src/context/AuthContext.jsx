import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken()); // restoring a saved session

  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const finish = (d) => { setToken(d.token); setUser(d.user); };
  const login = useCallback(async (f) => finish(await api.login(f)), []);
  const register = useCallback(async (f) => finish(await api.register(f)), []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
