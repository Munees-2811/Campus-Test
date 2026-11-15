import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = authService.getStoredToken();

      // No token stored → show login page immediately (no network call)
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Token exists → verify it with the backend
      try {
        const res = await authService.getMe();
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('campustest_user', JSON.stringify(res.user));
        }
      } catch (err) {
        // Token invalid / backend down → clear and show login
        console.warn('[AuthContext] Session invalid or backend unreachable:', err.message);
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const registerAdmin = async (adminData) => {
    const data = await authService.initAdmin(adminData);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const changePassword = async (passwords) => {
    return await authService.changePassword(passwords);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    registerAdmin,
    changePassword,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
