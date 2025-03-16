// lib/api/wallet-settings.ts
import apiClient, { handleApiResponse } from './index';

export interface WalletAddress {
  address: string;
  network: 'ethereum' | 'base' | 'solana';
  isDefault: boolean;
  label: string;
}

export interface TransactionPreferences {
  defaultCurrency: 'ETH' | 'BASE' | 'SOL' | 'USDC';
  defaultNetwork: 'ethereum' | 'base' | 'solana';
  autoWithdrawal: boolean;
  withdrawalThreshold: number;
  gasPreference: 'low' | 'standard' | 'high';
}

export interface WalletSettings {
  walletAddresses: WalletAddress[];
  transactionPreferences: TransactionPreferences;
}

// Get wallet settings
export const getWalletSettings = async (): Promise<{ data: WalletSettings }> => {
  const response = await apiClient.get('/wallet/settings');
  return handleApiResponse(response);
};

// Add wallet address
export const addWalletAddress = async (data: {
  walletAddress: string;
  network?: 'ethereum' | 'base' | 'solana';
  label?: string;
}): Promise<{ data: { walletAddress: WalletAddress } }> => {
  const response = await apiClient.post('/wallet/settings/address', data);
  return handleApiResponse(response);
};

// Remove wallet address
export const removeWalletAddress = async (walletAddress: string): Promise<{ status: string; message: string }> => {
  const response = await apiClient.delete(`/wallet/settings/address/${walletAddress}`);
  return handleApiResponse(response);
};

// Update transaction preferences
export const updateTransactionPreferences = async (
  preferences: Partial<TransactionPreferences>
): Promise<{ data: { transactionPreferences: TransactionPreferences } }> => {
  const response = await apiClient.patch('/wallet/settings/preferences', preferences);
  return handleApiResponse(response);
};