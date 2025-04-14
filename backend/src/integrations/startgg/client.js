// src/integrations/startgg/client.js
const { GraphQLClient } = require('graphql-request');
require('dotenv').config();

// Import the queries
const {
  GET_FEATURED_TOURNAMENTS_QUERY,
  GET_ALL_TOURNAMENTS_QUERY,
  GET_TOURNAMENT_QUERY,
  GET_SETS_BY_PHASE_QUERY,
  GET_SET_BY_ID_QUERY,
  GET_SETS_BY_PHASE_REDUCED_QUERY
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
        error.response?.status === 503 ||
        (error.message && error.message.includes("complexity is too high"))
      ) {
        console.error(`Rate limit or complexity error. Retry ${i + 1}/${retries} after ${delay}ms`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Rethrow if not a rate limit or service unavailable error
      }
    }
  }
  throw new Error('Failed to fetch data after retries');
};

// Get featured tournaments
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
  // Remove tournament/ prefix if present
  if (slug.startsWith('tournament/')) {
    slug = slug.replace('tournament/', '');
  }
  
  try {
    const data = await fetchWithRetry(GET_TOURNAMENT_QUERY, { slug });
    return data.tournament;
  } catch (error) {
    console.error(`Error fetching tournament details for ${slug}:`, error);
    return null;
  }
};

// Get sets by phase
const getSetsByPhase = async (phaseId, page = 1, perPage = 25) => {
  try {
    const data = await fetchWithRetry(GET_SETS_BY_PHASE_QUERY, {
      phaseId,
      page,
      perPage,
    });
    return data.phase.sets.nodes;
  } catch (error) {
    console.error(`Error fetching sets for phase ${phaseId}:`, error);
    throw error;
  }
};

// Get sets by phase with reduced complexity query
const getSetsByPhaseWithReduced = async (phaseId, page = 1, perPage = 20) => {
  try {
    console.log(`Fetching sets with reduced query for phase ${phaseId} (page ${page}, perPage ${perPage})`);
    const data = await fetchWithRetry(GET_SETS_BY_PHASE_REDUCED_QUERY, {
      phaseId,
      page,
      perPage,
    });
    
    if (!data.phase || !data.phase.sets || !data.phase.sets.nodes) {
      console.log(`No sets data found for phase ${phaseId}`);
      return [];
    }
    
    return data.phase.sets.nodes;
  } catch (error) {
    console.error(`Error fetching sets with reduced query for phase ${phaseId}:`, error);
    throw error;
  }
};

// Get set by ID
const getSetById = async (setId) => {
  // Handle preview IDs
  if (setId.startsWith('preview_')) {
    console.log(`Cannot directly fetch preview set ID: ${setId}`);
    return null;
  }
  
  try {
    const data = await fetchWithRetry(GET_SET_BY_ID_QUERY, { setId });
    return data.set;
  } catch (error) {
    console.error(`Error fetching set ${setId}:`, error);
    return null;
  }
};

// Add this to src/integrations/startgg/client.js

/**
 * This function is designed to find a specific match in a completed tournament
 * by using the tournament ID, phase ID, and contestant names which we know from the bet
 */
// Corrected findSetInCompletedTournament function for src/integrations/startgg/client.js

/**
 * This function is designed to find a specific match in a completed tournament
 * by using the tournament slug, phase ID, and contestant names which we know from the bet
 */
const findSetInCompletedTournament = async (tournamentId, phaseId, contestant1Name, contestant2Name, tournamentSlug) => {
  // Important: Use the slug rather than ID for tournament lookup
  console.log(`Performing direct lookup for match ${contestant1Name} vs ${contestant2Name} in tournament slug: ${tournamentSlug}, phase ${phaseId}`);
  
  try {
    // Step 1: Verify the tournament exists using its slug
    const tournamentDetail = await getTournamentDetails(tournamentSlug);
    
    if (!tournamentDetail) {
      console.log(`Tournament with slug ${tournamentSlug} not found`);
      return null;
    }
    
    console.log(`Found tournament: ${tournamentDetail.name}`);
    
    // Step 2: For completed tournaments, use a simpler, less complex query that just gets sets with minimal data
    const simplifiedSetsQuery = `
      query PhaseSimpleSets($phaseId: ID!, $page: Int, $perPage: Int) {
        phase(id: $phaseId) {
          id
          name
          sets(page: $page, perPage: $perPage) {
            nodes {
              id
              state
              winnerId
              displayScore
              slots {
                entrant {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;
    
    // Try to find the match in multiple pages of results
    for (let page = 1; page <= 10; page++) {
      try {
        console.log(`Checking page ${page} for sets in phase ${phaseId}`);
        
        const setsData = await fetchWithRetry(simplifiedSetsQuery, { 
          phaseId, 
          page, 
          perPage: 25  // Smaller to keep query complexity down
        });
        
        if (!setsData.phase || !setsData.phase.sets || !setsData.phase.sets.nodes) {
          console.log(`No sets data found on page ${page}`);
          if (page === 1) {
            // If first page is empty, phase probably doesn't exist
            return null;
          }
          break; // End of sets
        }
        
        const sets = setsData.phase.sets.nodes;
        console.log(`Found ${sets.length} sets on page ${page}`);
        
        // Look for the specific match by participant names
        for (const set of sets) {
          if (set.slots && set.slots.length === 2) {
            const entrant1Name = set.slots[0]?.entrant?.name;
            const entrant2Name = set.slots[1]?.entrant?.name;
            
            // Check normal order
            const normalMatch = 
              entrant1Name === contestant1Name && 
              entrant2Name === contestant2Name;
            
            // Check reverse order 
            const reverseMatch = 
              entrant1Name === contestant2Name && 
              entrant2Name === contestant1Name;
            
            // Also try more flexible name matching (case insensitive, contained substring)
            const flexNormalMatch = 
              entrant1Name && contestant1Name && 
              entrant2Name && contestant2Name &&
              entrant1Name.toLowerCase().includes(contestant1Name.toLowerCase()) && 
              entrant2Name.toLowerCase().includes(contestant2Name.toLowerCase());
              
            const flexReverseMatch = 
              entrant1Name && contestant1Name && 
              entrant2Name && contestant2Name &&
              entrant1Name.toLowerCase().includes(contestant2Name.toLowerCase()) && 
              entrant2Name.toLowerCase().includes(contestant1Name.toLowerCase());
            
            if (normalMatch || reverseMatch || flexNormalMatch || flexReverseMatch) {
              console.log(`Found matching set: ${entrant1Name} vs ${entrant2Name}`);
              return set;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching sets on page ${page}: ${error.message}`);
        // If we hit complexity errors, try a different approach
        if (error.message && error.message.includes("complexity is too high")) {
          break;
        }
      }
    }
    
    console.log(`No matching set found after extensive search`);
    return null;
  } catch (error) {
    console.error(`Error in findSetInCompletedTournament: ${error.message}`);
    return null;
  }
};

// Add this to the exported API object
const startGGApi = {
  // Include existing methods
  getFeaturedTournaments,
  getTournaments,
  getTournamentDetails,
  getSetsByPhase,
  getSetsByPhaseWithReduced,
  getSetById,
  // Add the new method
  findSetInCompletedTournament
};

module.exports = {
  client,
  startGGApi
};