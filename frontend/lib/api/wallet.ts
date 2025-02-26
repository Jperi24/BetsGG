// lib/api/wallet.ts
import apiClient, { handleApiResponse } from './index';

export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type Currency = 'ETH' | 'BASE' | 'SOL' | 'USDC';
export type Network = 'ethereum' | 'base' | 'solana';

export interface Transaction {
  _id: string;
  user: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  txHash?: string;
  walletAddress?: string;
  betId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  network?: Network;
  fee?: number;
}

export interface CreateDepositData {
  amount: number;
  currency: Currency;
  walletAddress: string;
  network: Network;
}

export interface CreateWithdrawalData {
  amount: number;
  currency: Currency;
  walletAddress: string;
  network: Network;
}

// Get user's balance
export const getBalance = async (): Promise<{ data: { balance: number } }> => {
  const response = await apiClient.get('/wallet/balance');
  return handleApiResponse(response);
};

// Get user's transactions
export const getTransactions = async (
  type?: TransactionType,
  limit = 20,
  skip = 0
): Promise<{ data: { transactions: Transaction[] }, total: number }> => {
  let url = `/wallet/transactions?limit=${limit}&skip=${skip}`;
  if (type) {
    url += `&type=${type}`;
  }
  
  const response = await apiClient.get(url);
  return handleApiResponse(response);
};

// Create a deposit transaction
export const createDeposit = async (
  data: CreateDepositData
): Promise<{ data: { transaction: Transaction } }> => {
  const response = await apiClient.post('/wallet/deposit', data);
  return handleApiResponse(response);
};

// Create a withdrawal transaction
export const createWithdrawal = async (
  data: CreateWithdrawalData
): Promise<{ data: { transaction: Transaction, newBalance: number } }> => {
  const response = await apiClient.post('/wallet/withdraw', data);
  return handleApiResponse(response);
};