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

  // In auth-providers.jsx - Update the login function
const login = async (email, password) => {
  setIsLoading(true);
  try {
    const response = await apiLogin({ email, password });
    
    // Check if 2FA is required
    if (response.requires2FA && response.tempToken) {
      // Store 2FA state in sessionStorage to persist across redirects/refreshes
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tempToken', response.tempToken);
        sessionStorage.setItem('requires2FA', 'true');
        sessionStorage.setItem('pendingAuthEmail', email);
      }
      
      setTempToken(response.tempToken);
      setRequires2FA(true);
      setIsLoading(false);
      return response;
    }
    
    handleAuthResponse(response);
    return response;
  } catch (error) {
    console.error('Auth provider login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Add this to the useEffect that initializes auth state
useEffect(() => {
  const initializeAuth = async () => {
    console.log('Initializing auth state...');
    setIsLoading(true);
    
    try {
      // Check for token in localStorage (client-side only)
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        console.log('Stored token found:', !!storedToken);
        
        // Check for pending 2FA verification
        const storedTempToken = sessionStorage.getItem('tempToken');
        const storedRequires2FA = sessionStorage.getItem('requires2FA');
        
        if (storedTempToken && storedRequires2FA === 'true') {
          console.log('Pending 2FA verification detected');
          setTempToken(storedTempToken);
          setRequires2FA(true);
        }
        
        if (storedToken) {
          // Validate token format before setting it
          if (storedToken.length > 20) { // Simple validation for JWT token
            setToken(storedToken);
            try {
              // Verify token by fetching current user
              console.log('Verifying token with API...');
              const response = await getCurrentUser();
              console.log('Token verified, user data received');
              setUser(response.data.user);
              
              // Clear any 2FA session data if we have a valid token
              sessionStorage.removeItem('tempToken');
              sessionStorage.removeItem('requires2FA');
              sessionStorage.removeItem('pendingAuthEmail');
            } catch (error) {
              console.error('Token validation failed:', error);
              // Token is invalid or expired - clear it
              localStorage.removeItem('token');
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
              setToken(null);
            }
          } else {
            console.error('Invalid token format found in localStorage');
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
          }
        } else {
          console.log('No token found, user is not authenticated');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
      setAuthInitialized(true);
      console.log('Auth initialization completed');
    }
  };

  initializeAuth();
}, []);

// Update the verify2FA function to clear session storage
const verify2FA = async (code, isRecoveryCode = false) => {
  if (!tempToken) {
    const storedTempToken = sessionStorage.getItem('tempToken');
    if (!storedTempToken) {
      throw new Error('No temporary token available');
    }
    setTempToken(storedTempToken);
  }
  
  const tokenToUse = tempToken || sessionStorage.getItem('tempToken');
  
  setIsLoading(true);
  try {
    const response = await verify2FALogin(tokenToUse, code, isRecoveryCode);
    
    // Complete the login process
    handleAuthResponse(response);
    
    // Clear 2FA state
    setTempToken(null);
    setRequires2FA(false);
    
    // Clear session storage
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('requires2FA');
    sessionStorage.removeItem('pendingAuthEmail');
    
    return response;
  } catch (error) {
    console.error('2FA verification error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Update cancelLogin to clear session storage
const cancelLogin = () => {
  setTempToken(null);
  setRequires2FA(false);
  
  // Clear session storage
  sessionStorage.removeItem('tempToken');
  sessionStorage.removeItem('requires2FA');
  sessionStorage.removeItem('pendingAuthEmail');
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
  
 // Update the handleAuthResponse function in auth-providers.jsx
// Update the handleAuthResponse function
const handleAuthResponse = (response) => {
  if (!response || !response.token || !response.data || !response.data.user) {
    throw new Error('Invalid authentication response');
  }
  
  const { token, data } = response;
  
  // Store token in localStorage for client-side auth
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    
    // Set cookie with proper attributes for middleware
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Strict`;
  }
  
  // Update state
  setToken(token);
  setUser(data.user);
};

// Also update the logout function to properly clear cookies
const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    
    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    // Clear 2FA session storage
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('requires2FA');
    sessionStorage.removeItem('pendingAuthEmail');
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