'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, verify2FALogin, logout as apiLogout } from '@/lib/api/auth';

// Create Auth Context with proper function signatures
const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  tempToken: null,
  requires2FA: false,
  authInitialized: false,
  login: async (email, password) => null,
  verify2FA: async (code, isRecoveryCode) => null,
  register: async (username, email, password) => null,
  logout: () => {},
  updateUserData: (userData) => {},
  cancelLogin: () => {}
});

// Utility for safe error handling
const getSafeErrorMessage = (error) => {
  if (!error) return 'An error occurred';
  
  // Safe errors that can be shown directly
  const safeErrorTypes = [
    'Invalid credentials',
    'Invalid verification code',
    'Email already exists',
    'Username already exists',
    'Password requirements not met',
    'Two-factor authentication failed'
  ];
  
  // Check if error contains a safe message pattern
  if (error.message && safeErrorTypes.some(type => error.message.includes(type))) {
    return error.message;
  }
  
  // Default to generic message
  return 'An error occurred. Please try again.';
};

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempToken, setTempToken] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Login function - improved security
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Reduced logging for security
      console.log("Initiating login process");
      
      const response = await apiLogin({ email, password });
      
      // Check if 2FA is required
      if (response.requires2FA) {
        console.log("2FA verification required");
        
        // Store tempToken securely in memory state
        setTempToken(response.tempToken);
        setRequires2FA(true);
        
        // Only store a flag for UI state management, not the actual token
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('requires2FA', 'true');
        }
        
        setIsLoading(false);
        return response;
      }
      
      // Normal login flow (no 2FA)
      console.log("Standard login completed");
      handleAuthResponse(response);
      return response;
    } catch (error) {
      const safeError = getSafeErrorMessage(error);
      console.error('Login failed:', safeError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth state');
      setIsLoading(true);
      
      try {
        // Check for pending 2FA verification first
        if (typeof window !== 'undefined') {
          const storedRequires2FA = sessionStorage.getItem('requires2FA');
          
          if (storedRequires2FA === 'true') {
            console.log('Resuming 2FA verification flow');
            setRequires2FA(true);
            setIsLoading(false);
            setAuthInitialized(true);
            return;
          }
        }
        
        // If no pending 2FA, try to get current user from session cookie
        try {
          console.log('Checking for existing session');
          const response = await getCurrentUser();
          console.log('User session found');
          setUser(response.data.user);
          
          // Clean up any session storage flags
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('requires2FA');
          }
        } catch (error) {
          console.log('No active session found');
          // This is not an error - user may just not be logged in
        }
      } catch (error) {
        console.error('Error during auth initialization:', getSafeErrorMessage(error));
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
        console.log('Auth initialization completed');
      }
    };

    initializeAuth();
  }, []);

  // 2FA verification with improved security
  const verify2FA = async (code, isRecoveryCode = false) => {
    if (!tempToken) {
      throw new Error('Authentication error: Missing verification token');
    }
    
    setIsLoading(true);
    try {
      console.log('Processing 2FA verification');
      
      const response = await verify2FALogin(tempToken, code, isRecoveryCode);
      
      // Complete the login process
      handleAuthResponse(response);
      
      // Clear 2FA state
      setTempToken(null);
      setRequires2FA(false);
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('requires2FA');
      }
      
      return response;
    } catch (error) {
      console.error('2FA verification failed:', getSafeErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to process auth response securely
  const handleAuthResponse = (response) => {
    if (!response || !response.data || !response.data.user) {
      throw new Error('Invalid authentication response');
    }
    
    // Store user data in state only
    // Rely on HTTP-only cookies set by the server for auth token
    setUser(response.data.user);
    
    console.log('Authentication successful');
  };

  // Cancel login/2FA process
  const cancelLogin = () => {
    setTempToken(null);
    setRequires2FA(false);
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('requires2FA');
    }
  };
  
  // Registration with improved security
  const register = async (username, email, password) => {
    setIsLoading(true);
    try {
      console.log('Initiating registration process');
      const response = await apiRegister({ username, email, password });
      handleAuthResponse(response);
      return response;
    } catch (error) {
      console.error('Registration failed:', getSafeErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Secure logout - calls server to invalidate session
  const logout = async () => {
    try {
      console.log('Initiating logout process');
      
      // Call server endpoint to invalidate the session cookie
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', getSafeErrorMessage(error));
    } finally {
      // Clean up client state regardless of server response
      setUser(null);
      setTempToken(null);
      setRequires2FA(false);
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('requires2FA');
      }
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Update user data helper (for balance changes, etc.)
  const updateUserData = (userData) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };
  
  // Context value
  const value = {
    user,
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