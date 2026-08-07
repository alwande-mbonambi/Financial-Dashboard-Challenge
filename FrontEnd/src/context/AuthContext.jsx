import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin } from '../api/auth.js';
import { setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read + apply any existing token synchronously during the initial render
  // (not in a useEffect) so it's set on the API client BEFORE any child
  // provider's mount effects (e.g. DataProvider's initial fetches) run.
  const [token, setToken] = useState(() => {
    const storedToken = sessionStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    return storedToken;
  });

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