import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quiz.user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);

  function saveSession(token, userData) {
    localStorage.setItem('quiz.token', token);
    localStorage.setItem('quiz.user', JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    saveSession(data.token, data.user);
  }

  async function register(name, email, password) {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    saveSession(data.token, data.user);
  }

  function logout() {
    localStorage.removeItem('quiz.token');
    localStorage.removeItem('quiz.user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
