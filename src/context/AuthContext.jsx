import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('log_analysis_user');
    return savedUser ? JSON.parse(savedUser) : {
      username: 'analyst@threatdetect.ai',
      name: 'Alex Vance',
      role: 'Lead Security Analyst',
      badgeId: 'SOC-8842'
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('log_analysis_auth') === 'true' || true;
  });

  const login = (email, _password) => {
    const userData = {
      username: email || 'analyst@threatdetect.ai',
      name: 'Alex Vance',
      role: 'Lead Security Analyst',
      badgeId: 'SOC-8842'
    };
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('log_analysis_user', JSON.stringify(userData));
    localStorage.setItem('log_analysis_auth', 'true');
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('log_analysis_user');
    localStorage.removeItem('log_analysis_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
