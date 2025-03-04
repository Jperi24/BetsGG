'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api/auth';

// Create Auth Context with proper function signatures
const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async (email, password) => null, // Properly define parameters
  register: async (username, email, password) => null, // Properly define parameters
  logout: () => {},
  updateUserData: (userData) => {} // Properly define parameter
});

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });
      handleAuthResponse(response);
      return response;
    } finally {
      setIsLoading(false);
    }
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

  

  // In auth-providers.jsx, add a function to handle auth response:
const handleAuthResponse = (response) => {
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
    login,
    register,
    logout,
    updateUserData
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