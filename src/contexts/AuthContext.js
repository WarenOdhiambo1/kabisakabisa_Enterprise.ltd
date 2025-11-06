import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';

// Safe JSON parsing utility
const safeJsonParse = (str) => {
  if (!str || str === 'undefined' || str === 'null') {
    return null;
  }
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

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

  const logout = useCallback(() => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('userData');
    Cookies.remove('csrfToken');
    setUser(null);
    
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  }, [sessionTimeout]);

  // Clean up any invalid cookies on app start
  const cleanupInvalidCookies = useCallback(() => {
    const userData = Cookies.get('userData');
    if (userData === 'undefined' || userData === 'null') {
      logout();
    }
  }, [logout]);

  const setupSessionTimeout = useCallback(() => {
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
  }, [sessionTimeout, logout]);

  useEffect(() => {
    // Clean up any invalid cookies first
    cleanupInvalidCookies();
    
    // Check for existing token on app load
    const token = Cookies.get('accessToken');
    const userData = Cookies.get('userData');
    
    if (token && userData) {
      const parsedUser = safeJsonParse(userData);
      if (parsedUser) {
        setUser(parsedUser);
        setupSessionTimeout();
      } else {
        // Clean up invalid cookies
        logout();
      }
    }
    setLoading(false);
  }, [logout, setupSessionTimeout, cleanupInvalidCookies]);

  const login = async (credentials) => {
    try {
      console.log('Calling login API with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('Login API response:', response);
      
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

      console.log('Setting user in AuthContext:', response.user);
      setUser(response.user);
      setupSessionTimeout();
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  };



  // MFA methods (placeholders for now)
  const setupMFA = async (userId) => {
    // Placeholder - return mock MFA data
    return {
      secret: 'MOCK_SECRET_123456',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };
  };

  const verifyMFA = async (userId, token) => {
    // Placeholder - always succeed
    return { success: true };
  };

  const loginWithMFA = async (credentials) => {
    // Placeholder - same as regular login
    return await login(credentials);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    setupMFA,
    verifyMFA,
    loginWithMFA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};