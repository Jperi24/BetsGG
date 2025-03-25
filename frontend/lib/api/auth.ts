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
  const response = await apiClient.post('/auth/register', data);
  return handleApiResponse(response);
};

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  console.log("Response Login:",response)
  return handleApiResponse(response);
};

export const logout = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/logout', credentials);
  console.log("Response Login:",response)
  return handleApiResponse(response);
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
  return handleApiResponse(response);
};

// Update user password
export const updatePassword = async (data: { currentPassword: string; newPassword: string }): Promise<AuthResponse> => {
  const response = await apiClient.patch('/auth/update-password', data);
  return handleApiResponse(response);
};



// Link wallet address to user
export const linkWallet = async (walletAddress: string): Promise<{ data: { user: User } }> => {
  const response = await apiClient.post('/auth/link-wallet', { walletAddress });
  return handleApiResponse(response);
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return handleApiResponse(response);
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<AuthResponse> => {
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
export const verify2FA = async (code: string): Promise<{ data: { recoveryCodes: string[] } }> => {
  const response = await apiClient.post('/auth/2fa/verify', { code });
  return handleApiResponse(response);
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
 * Update user profile information
 */
export const updateProfile = async (data: { 
  username?: string; 
  email?: string; 
  currentPassword: string 
}): Promise<{ data: { user: User } }> => {
  const response = await apiClient.patch('/user/profile', data);
  return handleApiResponse(response);
};

/**
 * Delete the user's account
 */
export const deleteAccount = async (data: { 
  password: string 
}): Promise<{ status: string; message: string }> => {
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