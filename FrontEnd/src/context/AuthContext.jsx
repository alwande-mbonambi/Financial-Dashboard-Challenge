import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/auth.js';
import { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('authToken'));

  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    sessionStorage.setItem('authToken', data.token);
    setToken(data.token);
    setAuthToken(data.token);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setAuthToken(null);
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}