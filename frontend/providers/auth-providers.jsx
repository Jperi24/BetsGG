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

  function pauseForEnter(message = 'Press Enter to continue...') {
    return new Promise(resolve => {
      window.prompt(message, '');
      resolve();
    });
  }

// In login function, make sure cookies are set properly
const login = async (email, password) => {
  setIsLoading(true);
  try {
    console.log("Attempting login...");
    const response = await apiLogin({ email, password });
    console.log("Login response received:", { 
      hasToken: !!response.token, 
      requires2FA: !!response.requires2FA,
      hasTempToken: !!response.tempToken
    });

    console.log("Raw response",response)

    
    
    // Check if 2FA is required
    if (response.requires2FA && response.token) {
      console.log("2FA required, storing temporary token");
      // Store 2FA state in sessionStorage to persist across redirects
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tempToken', response.tempToken);
        sessionStorage.setItem('requires2FA', 'true');
        sessionStorage.setItem('pendingAuthEmail', email);
      }
      
      // Update state to show 2FA verification screen
      setTempToken(response.tempToken);
      setRequires2FA(true);
      setIsLoading(false);
      return response;
    }
    
    // For normal login (no 2FA)
    console.log("Normal login flow (no 2FA required)");
    handleAuthResponse(response);
    return response;
  } catch (error) {
    console.error('Auth provider login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Improve the handleAuthResponse function
const handleAuthResponse = (response) => {
  if (!response || !response.token || !response.data || !response.data.user) {
    throw new Error('Invalid authentication response');
  }
  
  const { token, data } = response;

  console.log("response = ",response)
  
  // Set state first
  setToken(token);
  setUser(data.user);
  
  // Then store in localStorage and cookies
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    
    // Set cookie with proper attributes
    // Set longer expiry and ensure proper path
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
};// In auth-providers.jsx - fixed initialization useEffect
useEffect(() => {
  const initializeAuth = async () => {
    console.log('Initializing auth state...');
    setIsLoading(true);
    
    try {
      // Check for token in localStorage and cookies (client-side only)
      if (typeof window !== 'undefined') {
        // First check for pending 2FA verification - this should take priority
        const storedTempToken = sessionStorage.getItem('tempToken');
        const storedRequires2FA = sessionStorage.getItem('requires2FA');
        
        console.log('Session storage check:', {
          hasTempToken: !!storedTempToken,
          requires2FA: storedRequires2FA === 'true',
          email: sessionStorage.getItem('pendingAuthEmail')
        });
        
        if (storedTempToken && storedRequires2FA === 'true') {
          console.log('Pending 2FA verification detected - awaiting code input');
          setTempToken(storedTempToken);
          setRequires2FA(true);
          
          // Important: Don't proceed with normal token check when 2FA is pending
          // because 2FA needs to be completed first
          setIsLoading(false);
          setAuthInitialized(true);
          return; // Exit early to avoid normal token logic
        }
        
        // Try to get token from localStorage if no pending 2FA
        const storedToken = localStorage.getItem('token');
        console.log('Stored token found:', !!storedToken);
        
        if (storedToken) {
          // Validate token format before setting it
          if (storedToken.length > 20) { // Simple validation for JWT token
            setToken(storedToken);
            
            // Make sure the cookie is also set
            const cookieExists = document.cookie.split(';').some(c => 
              c.trim().startsWith('token='));
              
            if (!cookieExists) {
              // Re-set the cookie if it's missing
              document.cookie = `token=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
            }
            
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
          // Try to get token from cookies as a backup
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
            
          if (cookieToken && cookieToken.length > 20) {
            // If found in cookie but not localStorage, restore it
            localStorage.setItem('token', cookieToken);
            setToken(cookieToken);
            
            try {
              // Verify cookie token
              const response = await getCurrentUser();
              setUser(response.data.user);
            } catch (error) {
              // Invalid cookie token
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
              setToken(null);
            }
          } else {
            console.log('No token found, user is not authenticated');
            console.log("Session storage", sessionStorage);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
      setAuthInitialized(true);
      console.log('Auth initialization completed', {
        isAuthenticated: !!user,
        requires2FA,
        hasTempToken: !!tempToken
      });
    }
  };

  initializeAuth();
}, []);


const verify2FA = async (code, isRecoveryCode = false) => {
  // Get the temporary token
  const tokenToUse = tempToken || sessionStorage.getItem('tempToken');
  if (!tokenToUse) {
    console.error('No temporary token available for 2FA verification');
    throw new Error('No temporary token available');
  }
  
  setIsLoading(true);
  try {
    console.log(`Verifying 2FA code with token: ${tokenToUse.substring(0, 10)}...`);
    const response = await verify2FALogin(tokenToUse, code, isRecoveryCode);
    console.log('2FA verification successful, response received:', {
      hasToken: !!response.token,
      hasUser: !!response.data?.user
    });
    
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