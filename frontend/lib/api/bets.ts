// lib/api/bets.ts
import apiClient, { handleApiResponse } from './index';
import { User } from './auth';

export type BetStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface BetContestant {
  id?: string;
  name: string;
}

export interface BetParticipant {
  user: string | User;
  prediction: 1 | 2;
  amount: number;
  claimed: boolean;
  timestamp: string;
}

export interface Bet {
  _id: string;
  tournamentId: string;
  tournamentSlug: string;
  tournamentName: string;
  eventId: string;
  eventName: string;
  phaseId: string;
  phaseName: string;
  setId: string;
  matchName: string;
  contestant1: BetContestant;
  contestant2: BetContestant;
  creator: string | User;
  totalPool: number;
  contestant1Pool: number;
  contestant2Pool: number;
  minimumBet: number;
  maximumBet: number;
  status: BetStatus;
  winner: 0 | 1 | 2 | null;
  participants: BetParticipant[];
  createdAt: string;
  startTime?: string;
  endTime?: string;
  resultDeterminedAt?: string;
  disputed: boolean;
  disputeReason?: string;
}

export interface CreateBetData {
  tournamentSlug: string;
  eventId: string;
  eventName: string;
  phaseId: string;
  phaseName: string;
  setId: string;
  minimumBet: number;
  maximumBet: number;
  startTime?: string;
}

export interface PlaceBetData {
  prediction: 1 | 2;
  amount: number;
}

// Get active bets
export const getActiveBets = async (limit = 20, offset = 0): Promise<{ data: { bets: Bet[] } }> => {
  const response = await apiClient.get(`/bets/active?limit=${limit}&offset=${offset}`);
  return handleApiResponse(response);
};

// Get bet by ID
export const getBetById = async (betId: string): Promise<{ 
  data: { 
    bet: Bet,
    userParticipation: null | {
      prediction: 1 | 2;
      amount: number;
      claimed: boolean;
    }
  } 
}> => {
  const response = await apiClient.get(`/bets/${betId}`);
  return handleApiResponse(response);
};

// Get bets by tournament
export const getBetsByTournament = async (
  tournamentSlug: string, 
  status?: BetStatus
): Promise<{ data: { bets: Bet[] } }> => {
  
  const url = status
    ? `/bets/${tournamentSlug}?status=${status}`
    : `/bets/${tournamentSlug}`;
  
  const response = await apiClient.get(url);
  return handleApiResponse(response);
};

// Create a new bet
export const createBet = async (data: CreateBetData): Promise<{ data: { bet: Bet } }> => {
  try {
    console.log("Frontend createBet called with data:", data);
    const response = await apiClient.post('/bets', data);
    console.log("Response received:", response);
    return handleApiResponse(response);
  } catch (error) {
    console.error("Error in createBet:", error);
    throw error;
  }
};

// Place a bet
export const placeBet = async (betId: string, data: PlaceBetData): Promise<{ data: { bet: Bet } }> => {
  const response = await apiClient.post(`/bets/${betId}/place`, data);
  return handleApiResponse(response);
};

// Get user's created bets
export const getUserCreatedBets = async (): Promise<{ data: { bets: Bet[] } }> => {
  const response = await apiClient.get('/bets/user/created');
  return handleApiResponse(response);
};

// Get user's participated bets
export const getUserParticipatedBets = async (): Promise<{ data: { bets: Bet[] } }> => {
  const response = await apiClient.get('/bets/user/participated');
  return handleApiResponse(response);
};

// Claim winnings
export const claimWinnings = async (betId: string): Promise<{ 
  success: boolean;
  winnings: number;
  newBalance: number;
}> => {
  const response = await apiClient.post(`/bets/${betId}/claim`);
  return handleApiResponse(response);
};

// Report a dispute
export const reportDispute = async (betId: string, reason: string): Promise<{ data: { bet: Bet } }> => {
  const response = await apiClient.post(`/bets/${betId}/dispute`, { reason });
  return handleApiResponse(response);
};