// lib/api/tournaments.ts
import apiClient, { handleApiResponse } from './index';

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  startAt: number;
  endAt: number;
  numAttendees: number;
  countryCode?: string;
  addrState?: string;
  city?: string;
  venueAddress?: string;
  images: Array<{ url: string }>;
  events: Array<TournamentEvent>;
}

export interface TournamentEvent {
  id: string;
  name: string;
  numEntrants?: number;
  videogame?: {
    id: string;
    name: string;
    displayName?: string;
  };
  phases: Array<{
    id: string;
    name: string;
    numSeeds?: number;
    bracketType?: string;
  }>;
}

export interface Set {
  id: string;
  fullRoundText: string;
  state: number;
  winnerId?: string;
  slots: Array<{
    id: string;
    standing?: {
      placement: number;
      stats?: {
        score?: {
          value: number;
        };
      };
    };
    entrant?: {
      id: string;
      name: string;
      participants?: Array<{
        id: string;
        gamerTag: string;
      }>;
    };
  }>;
}

// Get featured tournaments
export const getFeaturedTournaments = async (limit = 20): Promise<{ data: { tournaments: Tournament[] } }> => {
  const response = await apiClient.get(`/tournaments/featured?limit=${limit}`);
  return handleApiResponse(response);
};

// Get upcoming tournaments
export const getUpcomingTournaments = async (limit = 20): Promise<{ data: { tournaments: Tournament[] } }> => {
  const response = await apiClient.get(`/tournaments/upcoming?limit=${limit}`);
  return handleApiResponse(response);
};

// Get ongoing tournaments
export const getOngoingTournaments = async (limit = 20): Promise<{ data: { tournaments: Tournament[] } }> => {
  const response = await apiClient.get(`/tournaments/ongoing?limit=${limit}`);
  return handleApiResponse(response);
};

// Get tournament by slug
export const getTournamentBySlug = async (slug: string): Promise<{ data: { tournament: Tournament } }> => {
  const response = await apiClient.get(`/tournaments/${slug}`);
  return handleApiResponse(response);
};

// Get sets by phase ID
export const getSetsByPhaseId = async (phaseId: string): Promise<{ data: { sets: Set[] } }> => {
  const response = await apiClient.get(`/tournaments/phase/${phaseId}/sets`);
  return handleApiResponse(response);
};

// Search tournaments
export const searchTournaments = async (query: string): Promise<{ data: { tournaments: Tournament[] } }> => {
  const response = await apiClient.get(`/tournaments/search?query=${encodeURIComponent(query)}`);
  return handleApiResponse(response);
};