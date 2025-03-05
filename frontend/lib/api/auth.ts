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
}

export interface AuthResponse {
  token: string;
  data: {
    user: User;
  };
}

// Register a new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return handleApiResponse(response);
};

// Login user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log("Calling frontend login api")
  const response = await apiClient.post('/auth/login', credentials);
  return handleApiResponse(response);
};

// Get current user profile
export const getCurrentUser = async (): Promise<{ data: { user: User } }> => {
  const response = await apiClient.get('/auth/me');
  console.log("CURRENT USER RESPONSE",response)
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