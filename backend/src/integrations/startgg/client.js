// src/integrations/startgg/client.js
const { GraphQLClient } = require('graphql-request');
require('dotenv').config();

// GraphQL queries
const { 
  GET_FEATURED_TOURNAMENTS_QUERY,
  GET_ALL_TOURNAMENTS_QUERY,
  GET_TOURNAMENT_QUERY,
  GET_SETS_BY_PHASE_QUERY
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

// API methods
const startGGApi = {
  // Get featured tournaments
  getFeaturedTournaments: async (afterDate, page = 1, perPage = 25) => {
    const data = await fetchWithRetry(GET_FEATURED_TOURNAMENTS_QUERY, {
      afterDate,
      page,
      perPage,
    });
    return data.tournaments.nodes;
  },
  
  // Get all tournaments
  getTournaments: async (afterDate, beforeDate, page = 1, perPage = 25) => {
    const data = await fetchWithRetry(GET_ALL_TOURNAMENTS_QUERY, {
      afterDate,
      beforeDate,
      page,
      perPage,
    });
    return {
      tournaments: data.tournaments.nodes,
      pageInfo: data.tournaments.pageInfo
    };
  },
  
  // Get tournament details
  getTournamentDetails: async (slug) => {
    const data = await fetchWithRetry(GET_TOURNAMENT_QUERY, { slug });
    return data.tournament;
  },
  
  // Get sets by phase
  getSetsByPhase: async (phaseId, page = 1, perPage = 25) => {
    const data = await fetchWithRetry(GET_SETS_BY_PHASE_QUERY, {
      phaseId,
      page,
      perPage,
    });
    return data.phase.sets.nodes;
  }
};

module.exports = {
  client,
  startGGApi
};