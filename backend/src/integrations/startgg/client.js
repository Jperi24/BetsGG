// src/integrations/startgg/client.js
const { GraphQLClient } = require('graphql-request');
require('dotenv').config();

// GraphQL queries
const {
  GET_FEATURED_TOURNAMENTS_QUERY,
  GET_ALL_TOURNAMENTS_QUERY,
  GET_TOURNAMENT_QUERY,
  GET_SETS_BY_PHASE_QUERY,
  GET_SET_BY_ID_QUERY // Make sure to add this import
} = require('./queries');

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create GraphQL client
const client = new GraphQLClient("https://api.start.gg/gql/alpha", {
  headers: {
    Authorization: `Bearer ${process.env.START_GG_API_TOKEN}`,
  },
});

// Helper function to handle API call retries
const fetchWithRetry = async (query, variables, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await client.request(query, variables);
      return data;
    } catch (error) {
      if (
        error.response?.status === 429 || 
        error.response?.status === 503
      ) {
        console.error(`Rate limit hit or service unavailable. Retry ${i + 1}/${retries} after ${delay}ms`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Rethrow if not a rate limit or service unavailable error
      }
    }
  }
  throw new Error('Failed to fetch data after retries');
};

// src/integrations/startgg/client.js - Alternative approach

// Updated for a simpler approach without sorting
const getFeaturedTournaments = async (afterDate, page = 1, perPage = 25) => {
  const data = await fetchWithRetry(GET_FEATURED_TOURNAMENTS_QUERY, {
    afterDate,
    page,
    perPage
  });
  
  // Sort them manually by startAt in descending order (newest first)
  const tournaments = data.tournaments.nodes;
  tournaments.sort((a, b) => b.startAt - a.startAt);
  
  return tournaments;
};

// Get all tournaments
const getTournaments = async (afterDate, beforeDate, page = 1, perPage = 25) => {
  const data = await fetchWithRetry(GET_ALL_TOURNAMENTS_QUERY, {
    afterDate,
    beforeDate,
    page,
    perPage
  });
  
  // Sort manually by startAt in descending order
  const tournaments = data.tournaments.nodes;
  tournaments.sort((a, b) => b.startAt - a.startAt);
  
  return {
    tournaments: tournaments,
    pageInfo: data.tournaments.pageInfo
  };
};

// Get tournament details
const getTournamentDetails = async (slug) => {
  const data = await fetchWithRetry(GET_TOURNAMENT_QUERY, { slug });
  return data.tournament;
};

// Get sets by phase
const getSetsByPhase = async (phaseId, page = 1, perPage = 25) => {
  const data = await fetchWithRetry(GET_SETS_BY_PHASE_QUERY, {
    phaseId,
    page,
    perPage,
  });
  return data.phase.sets.nodes;
};

// Get set by ID
const getSetById = async (setId) => {
  if (!setId) {
    throw new Error('Set ID is required');
  }
  
  try {
    const data = await fetchWithRetry(GET_SET_BY_ID_QUERY, { setId });
    return data.set;
  } catch (error) {
    console.error(`Error fetching set ${setId}:`, error);
    return null;
  }
};

// API methods object
const startGGApi = {
  getFeaturedTournaments,
  getTournaments,
  getTournamentDetails,
  getSetsByPhase,
  getSetById // Added the new method
};

module.exports = {
  client,
  startGGApi
};