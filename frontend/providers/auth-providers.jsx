'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, verify2FALogin, logout as apiLogout } from '@/lib/api/auth';

// Create Auth Context with proper function signatures
const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  requires2FA: false,
  authInitialized: false,
  login: async (email, password) => null,
  verify2FA: async (code, isRecoveryCode) => null,
  register: async (username, email, password) => null,
  logout: () => {},
  updateUserData: (userData) => {},
  cancelLogin: () => {}
});

// Secure error handling that prevents information leakage
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
  const [requires2FA, setRequires2FA] = useState(false);
  const [authState, setAuthState] = useState({ needs2FA: false });
  const [authInitialized, setAuthInitialized] = useState(false);
  const [sessionRefreshInterval, setSessionRefreshInterval] = useState(null);

  // Enhanced Login function with improved security
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Only log non-sensitive information
      if (process.env.NODE_ENV === 'development') {
        console.log("Initiating login process");
      }
      
      const response = await apiLogin({ email, password });
      
      // Check if 2FA is required
      if (response.requires2FA) {
        if (process.env.NODE_ENV === 'development') {
          console.log("2FA verification required");
        }
        
        // Store 2FA state in memory only, not in session storage
        setRequires2FA(true);
        setAuthState({
          needs2FA: true,
          email // Store only what's needed for UI
        });
        
        setIsLoading(false);
        return response;
      }
      
      // Normal login flow (no 2FA)
      if (process.env.NODE_ENV === 'development') {
        console.log("Standard login completed");
      }
      
      // Process auth response without storing tokens in JS-accessible storage
      handleAuthSuccess(response);
      
      return response;
    } catch (error) {
      const safeError = getSafeErrorMessage(error);
      throw { message: safeError }; // Return safe error
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on mount with secure session management
  useEffect(() => {
    const initializeAuth = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Initializing auth state');
      }
      setIsLoading(true);
      
      try {
        // Check for pending 2FA verification from state
        if (authState.needs2FA) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Resuming 2FA verification flow');
          }
          setRequires2FA(true);
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        // If no pending 2FA, try to get current user from session cookie
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('Checking for existing session');
          }
          const response = await getCurrentUser();
          if (process.env.NODE_ENV === 'development') {
            console.log('User session found');
          }
          setUser(response.data.user);
          
          // Set up session refresh
          setupSessionRefresh();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log('No active session found');
          }
          // This is normal - user may just not be logged in
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error during auth initialization:', getSafeErrorMessage(error));
        }
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth initialization completed');
        }
      }
    };

    initializeAuth();
    
    // Clean up session refresh on unmount
    return () => {
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
      }
    };
  }, [authState.needs2FA]);
  
  // Setup periodic session refresh to keep the session alive and handle expiration
  const setupSessionRefresh = () => {
    // Clear any existing interval
    if (sessionRefreshInterval) {
      clearInterval(sessionRefreshInterval);
    }
    
    // Set up a new interval - refresh session every 15 minutes
    const interval = setInterval(async () => {
      try {
        // Send a request to refresh the session
        const response = await getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        // Session likely expired, clear user state
        setUser(null);
        clearInterval(interval);
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    setSessionRefreshInterval(interval);
  };

  // 2FA verification with improved security
  const verify2FA = async (code, isRecoveryCode = false) => {
    if (!authState.needs2FA) {
      throw new Error('Authentication error: 2FA verification not initiated');
    }
    
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Processing 2FA verification');
      }
      
      const response = await verify2FALogin(authState.email, code, isRecoveryCode);
      
      // Handle successful authentication
      handleAuthSuccess(response);
      
      // Clear 2FA state
      setRequires2FA(false);
      setAuthState({ needs2FA: false });
      
      return response;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('2FA verification failed');
      }
      throw { message: getSafeErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  // Secure processing of authentication response
  const handleAuthSuccess = (response) => {
    if (!response || !response.data || !response.data.user) {
      throw new Error('Invalid authentication response');
    }
    
    // Store user data in state only
    // Rely on HTTP-only cookies set by the server for auth token
    setUser(response.data.user);
    
    // Set up session refresh for the new session
    setupSessionRefresh();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Authentication successful');
    }
  };

  // Cancel login/2FA process
  const cancelLogin = () => {
    setRequires2FA(false);
    setAuthState({ needs2FA: false });
  };
  
  // Enhanced registration with improved validation for password requirements
  const register = async (username, email, password) => {
    // Validate password requirements on the client side
    if (password.length < 12) {
      throw { message: 'Password must be at least 12 characters long' };
    }
    
    if (!/[0-9]/.test(password)) {
      throw { message: 'Password must contain at least one number' };
    }
    
    if (!/[a-z]/.test(password)) {
      throw { message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[A-Z]/.test(password)) {
      throw { message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      throw { message: 'Password must contain at least one special character' };
    }
    
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Initiating registration process');
      }
      const response = await apiRegister({ username, email, password });
      handleAuthSuccess(response);
      return response;
    } catch (error) {
      throw { message: getSafeErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Secure logout - calls server to invalidate session
  const logout = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Initiating logout process');
      }
      
      // First, update local state to prevent UI flashing
      setUser(null);
      setRequires2FA(false);
      setAuthState({ needs2FA: false });
      
      // Clear session refresh interval
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
        setSessionRefreshInterval(null);
      }
      
      // Then call server endpoint to invalidate the session cookie
      await apiLogout();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Logout completed successfully');
      }
      
      // Reload the page to ensure all state is cleared
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }
      
      // Even if the server call fails, ensure local state is cleared
      setUser(null);
      
      // Force reload to clear everything
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