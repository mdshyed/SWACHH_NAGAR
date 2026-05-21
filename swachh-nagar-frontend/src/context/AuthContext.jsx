import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../config/axios';
import { connectSocket, disconnectSocket } from '../config/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((userData, token) => {
    if (userData && token) {
      localStorage.setItem('accessToken', token);
      setUser(userData);
      connectSocket(token);
    } else {
      localStorage.removeItem('accessToken');
      setUser(null);
      disconnectSocket();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    // Use a plain axios call so our interceptor doesn't try to refresh on this specific 401
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    })
      .then((res) => {
        setUser(res.data.data);
        connectSocket(token);
      })
      .catch(() => {
        // Token is stale — clear silently, user will be shown login page
        localStorage.removeItem('accessToken');
      })
      .finally(() => setLoading(false));

    const handleLogout = () => setSession(null, null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [setSession]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user: userData, accessToken } = res.data.data;
    setSession(userData, accessToken);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user: userData, accessToken } = res.data.data;
    setSession(userData, accessToken);
    return userData;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setSession(null, null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
