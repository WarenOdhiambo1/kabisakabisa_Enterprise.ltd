import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  useEffect(() => {
    // Check for existing token on app load
    const token = Cookies.get('accessToken');
    const userData = Cookies.get('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setupSessionTimeout();
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const setupSessionTimeout = () => {
    // Clear existing timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    // Set new timeout for 30 minutes
    const timeout = setTimeout(() => {
      logout();
      alert('Session expired due to inactivity. Please log in again.');
    }, 30 * 60 * 1000); // 30 minutes

    setSessionTimeout(timeout);
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.requiresMfaSetup) {
        return { requiresMfaSetup: true, userId: response.userId };
      }
      
      if (response.requiresMfa) {
        return { requiresMfa: true, userId: response.userId };
      }

      // Store tokens and user data
      Cookies.set('accessToken', response.accessToken, { 
        expires: 1/24, // 1 hour
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      Cookies.set('refreshToken', response.refreshToken, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      Cookies.set('userData', JSON.stringify(response.user), { 
        expires: 1/24,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      setUser(response.user);
      setupSessionTimeout();
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('userData');
    setUser(null);
    
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};