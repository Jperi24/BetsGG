'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, verify2FALogin } from '@/lib/api/auth';

// Create Auth Context with proper function signatures
const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  tempToken: null,
  requires2FA: false,
  login: async (email, password) => null,
  verify2FA: async (code, isRecoveryCode) => null,
  register: async (username, email, password) => null,
  logout: () => {},
  updateUserData: (userData) => {},
  cancelLogin: () => {}
});

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempToken, setTempToken] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Check for token in localStorage (client-side only)
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          setToken(storedToken);
          try {
            // Verify token by fetching current user
            const response = await getCurrentUser();
            setUser(response.data.user);
          } catch (error) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      }
      
      setIsLoading(false);
      setAuthInitialized(true);
    };

    initializeAuth();
  }, []);

  // Login function with 2FA handling
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });
      console.log('Auth provider login response:', response);
      
      // Check if 2FA is required
      if (response.requires2FA && response.token) {
        setTempToken(response.token);
        setRequires2FA(true);
        setIsLoading(false);
        return response;
      }
      
      // Normal login flow (no 2FA)
      handleAuthResponse(response);
      return response;
    } catch (error) {
      console.error('Auth provider login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify 2FA code function
  const verify2FA = async (code, isRecoveryCode = false) => {
    if (!tempToken) {
      throw new Error('No temporary token available');
    }
    
    setIsLoading(true);
    try {
      const response = await verify2FALogin(tempToken, code, isRecoveryCode);
      
      // Complete the login process
      handleAuthResponse(response);
      
      // Clear 2FA state
      setTempToken(null);
      setRequires2FA(false);
      
      return response;
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel login (when user cancels 2FA)
  const cancelLogin = () => {
    setTempToken(null);
    setRequires2FA(false);
  };
  
  // Register function
  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      const response = await apiRegister({ username, email, password });
      handleAuthResponse(response);
      return response;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    setUser(null);
    setToken(null);
    setTempToken(null);
    setRequires2FA(false);
    
    // Redirect to home page (client-side only)
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Update user data (e.g., after balance change)
  const updateUserData = (userData) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const handleAuthResponse = (response) => {
    if (!response || !response.token || !response.data || !response.data.user) {
      throw new Error('Invalid authentication response');
    }
    
    const { token, data } = response;
    
    // Store token in localStorage for client-side auth
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      
      // Also set a cookie for middleware
      document.cookie = `token=${token}; path=/; max-age=${60*60*24*7}`; // 7 days
    }
    
    // Update state
    setToken(token);
    setUser(data.user);
  };

  // Context value
  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    tempToken,
    requires2FA,
    authInitialized,
    login,
    verify2FA,
    register,
    logout,
    updateUserData,
    cancelLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};