import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi, logoutApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('hatsun_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hatsun_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('hatsun_token');
      if (savedToken) {
        try {
          const res = await getMeApi();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('hatsun_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Failed to verify stored session:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (username, email, password) => {
    const res = await loginApi({ username, email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('hatsun_token', res.token);
      localStorage.setItem('hatsun_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    try {
      if (token) logoutApi().catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('hatsun_token');
      localStorage.removeItem('hatsun_user');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isDeliveryStaff = user?.role === 'delivery_staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        isAdmin,
        isDeliveryStaff,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
