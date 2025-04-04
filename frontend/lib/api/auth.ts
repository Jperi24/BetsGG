// lib/api/auth.ts
import apiClient, { handleApiResponse } from './index';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  walletAddress?: string;
  balance: number;
  role: 'user' | 'admin';
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  token: string;
  data: {
    user: User;
  };
  requires2FA?: boolean;
  tempToken?: string;
}

// Register a new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return handleApiResponse(response);
  } catch (error: any) { // Type assertion to 'any' here
    // Sanitize error message for frontend display
    if (error.errors && Array.isArray(error.errors)) {
      // Extract validation errors from the response
      const validationErrors = error.errors.map((err: any) => err.msg).join(', ');
      throw new Error(validationErrors || 'Registration failed');
    }
    throw error;
  }
};

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  return handleApiResponse(response);
};

// Improved logout function with CSRF token support
export const logout = async (): Promise<{ status: string; message: string }> => {
  try {
    // Get CSRF token synchronously from cookies
    let csrfToken = '';
    
    if (typeof document !== 'undefined') {
      // Directly check for the cookie without any async operations
      const csrfCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='));
        
      if (csrfCookie) {
        csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
      } else {
        // Check alternative cookie name
        const xsrfCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN='));
          
        if (xsrfCookie) {
          csrfToken = decodeURIComponent(xsrfCookie.split('=')[1]);
        }
      }
    }
    
    // Debug token in development
    if (process.env.NODE_ENV === 'development') {
      console.log('CSRF Token for logout:', csrfToken);
      console.log('Available cookies:', document.cookie);
    }
    
    // Call server logout endpoint with explicit token
    const response = await apiClient.post('/auth/logout', {}, {
      headers: {
        // Use string directly, not a promise
        'X-CSRF-Token': csrfToken || '',
        'X-CSRF-TOKEN': csrfToken || ''
      }
    });
    
    // Clear storage and cookies as before...
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('requires2FA');
      sessionStorage.removeItem('pendingAuthEmail');
      
      // Clear cookies...
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      
      // Clear other cookies...
    }
    
    return handleApiResponse(response);
  } catch (error) {
    console.error('Logout error:', error);
    // Clear storage if request fails...
    throw error;
  }
};

// lib/api/auth.ts
export const getCsrfToken = async (fetchNew = false): Promise<string | null> => {
  // Check if we're in the browser
  if (typeof document === 'undefined') return null;
  
  // Check for token in cookies
  let csrfToken: string | null = null;
  
  // Check for token in cookie with various possible names
  const cookieTokenXSRF = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='));
    
  const cookieTokenCSRF = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='));
    
  if (cookieTokenXSRF) {
    csrfToken = decodeURIComponent(cookieTokenXSRF.split('=')[1]);
  } else if (cookieTokenCSRF) {
    csrfToken = decodeURIComponent(cookieTokenCSRF.split('=')[1]);
  }
  
  // If token exists, return it
  if (csrfToken) {
    console.log('Found CSRF token in cookies');
    return csrfToken;
  }
  
  // If no token and fetchNew is true, fetch a new token
  if (fetchNew) {
    try {
      console.log('Fetching new CSRF token');
      const response = await apiClient.get('/auth/csrf-token');
      
      // Check if the token is in the response headers
      const headerToken = response.headers['x-csrf-token'];
      if (headerToken) {
        console.log('Received new CSRF token from headers');
        return headerToken;
      }
      
      // Check if token is in cookies after the request
      const newCookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN=') || row.startsWith('csrf_token='));
        
      if (newCookieToken) {
        console.log('Received new CSRF token in cookie');
        return decodeURIComponent(newCookieToken.split('=')[1]);
      }
      
      console.warn('No CSRF token found after request');
      return null;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  }
  
  return null;
};



// Verify 2FA during login
export const verify2FALogin = async (
  token: string, 
  code: string,
  isRecoveryCode: boolean = false
): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/verify-2fa', {
    token,
    code,
    isRecoveryCode
  });
  return handleApiResponse(response);
};

// Get current user profile
export const getCurrentUser = async (): Promise<{ data: { user: User } }> => {
  const response = await apiClient.get('/auth/me');
  console.log("CURRENT USER RESPONSE,",response)
  return handleApiResponse(response);
};

// Update user password with strong validation
export const updatePassword = async (data: { 
  currentPassword: string; 
  newPassword: string 
}): Promise<AuthResponse> => {
  // Client-side validation for password strength
  if (data.newPassword.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  if (!/[0-9]/.test(data.newPassword)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[a-z]/.test(data.newPassword)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(data.newPassword)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
    throw new Error('Password must contain at least one special character');
  }

  const response = await apiClient.patch('/auth/update-password', data);
  return handleApiResponse(response);
};

// Link wallet address to user with address validation
export const linkWallet = async (walletAddress: string): Promise<{ data: { user: User } }> => {
  // Basic validation for Ethereum addresses
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('Invalid Ethereum wallet address format');
  }
  
  const response = await apiClient.post('/auth/link-wallet', { walletAddress });
  return handleApiResponse(response);
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<{ status: string; message: string }> => {
  // Basic email validation
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    throw new Error('Please provide a valid email address');
  }
  
  const response = await apiClient.post('/auth/forgot-password', { email });
  return handleApiResponse(response);
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<AuthResponse> => {
  // Client-side validation for password strength
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }
  
  const response = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return handleApiResponse(response);
};

// 2FA functions

// Get 2FA status for current user
export const getUser2FAStatus = async (): Promise<{ data: { enabled: boolean } }> => {
  const response = await apiClient.get('/auth/2fa/status');
  return handleApiResponse(response);
};

// Start 2FA setup process
export const setup2FA = async (): Promise<{ data: { qrCodeUrl: string, secretKey: string } }> => {
  const response = await apiClient.post('/auth/2fa/setup');
  return handleApiResponse(response);
};

// Verify and enable 2FA
// In lib/api/auth.ts
export const verify2FA = async (code: string): Promise<{ data: { recoveryCodes: string[] } }> => {
  // Basic validation for 2FA code
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Please enter a valid 6-digit verification code');
  }
  
  try {
    console.log('Sending 2FA verification code:', code);
    
    // Get CSRF token
    let csrfToken = '';
    if (typeof document !== 'undefined') {
      const csrfCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token=') || row.startsWith('XSRF-TOKEN='));
        
      if (csrfCookie) {
        csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
        console.log('Using CSRF token for verification:', csrfToken);
      } else {
        console.warn('No CSRF token found for verification');
      }
    }
    
    // Include CSRF token in headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    console.log('Verification request headers:', headers);
    
    // Make the verification request
    const response = await apiClient.post('/auth/2fa/verify', { code }, {
      headers,
      withCredentials: true
    });
    
    console.log('Verification response:', response.data);
    
    return handleApiResponse(response);
  } catch (error) {
    console.error('2FA verification error:', error);
    
    if (error) {
      console.error('Response status:', error);
      console.error('Response data:', error);
    }
    
    throw error;
  }
};
// Disable 2FA
export const disable2FA = async (): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post('/auth/2fa/disable');
  return handleApiResponse(response);
};

// Get recovery codes
export const getRecoveryCodes = async (): Promise<{ data: { recoveryCodes: string[] } }> => {
  const response = await apiClient.get('/auth/2fa/recovery-codes');
  return handleApiResponse(response);
};

/**
 * Update user profile information with validation
 */
export const updateProfile = async (data: { 
  username?: string; 
  email?: string; 
  currentPassword: string 
}): Promise<{ data: { user: User } }> => {
  // Validate username if provided
  if (data.username && !/^[a-zA-Z0-9_]{3,30}$/.test(data.username)) {
    throw new Error('Username must be between 3 and 30 characters and can only contain letters, numbers, and underscores');
  }
  
  // Validate email if provided
  if (data.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
    throw new Error('Please provide a valid email address');
  }
  
  const response = await apiClient.patch('/user/profile', data);
  return handleApiResponse(response);
};

/**
 * Delete the user's account with password verification
 */
export const deleteAccount = async (data: { 
  password: string 
}): Promise<{ status: string; message: string }> => {
  if (!data.password) {
    throw new Error('Password is required to delete your account');
  }
  
  const response = await apiClient.delete('/user/account', { data });
  return handleApiResponse(response);
};

/**
 * Export all user data
 */
export const exportUserData = async (): Promise<{ data: any }> => {
  const response = await apiClient.get('/user/export-data');
  return handleApiResponse(response);
};