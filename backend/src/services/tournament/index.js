// src/services/tournament/index.js
const NodeCache = require('node-cache');
const { startGGApi } = require('../../integrations/startgg/client');
const Tournament = require('../../models/Tournament');
const { AppError } = require('../../middleware/error');

// Cache setup
const cacheTTL = parseInt(process.env.CACHE_TTL) || 86400; // Default: 24 hours
const dailyCache = new NodeCache({ stdTTL: cacheTTL }); 
const frequentCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes for sets/matches

// Flags to prevent concurrent execution
let isFetchingTournaments = false;
let isUpdatingFrequentCache = false;

// Get timestamp for a date offset from now
const getTimestamp = (days) => {
  return Math.floor(new Date(Date.now() + days * 24 * 3600 * 1000).getTime() / 1000);
};

/**
 * Fetch and cache all tournament data
 */





// Alternative tournament service function
const fetchAllTournaments = async () => {
  if (isFetchingTournaments) {
    console.log('Tournament fetch already in progress');
    return;
  }

  isFetchingTournaments = true;
  try {
    console.log('Starting full tournament refresh...');

    // Calculate date ranges
    const todayDate = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const pastDays5 = getTimestamp(-5); // 5 days ago 
    const pastDays3 = getTimestamp(-3);   // 3 days ago
    const futureDays5 = getTimestamp(5);  // 5 days in the future

    // Step 1: Fetch featured tournaments
    let allTournaments = [];
    let page = 1;
    const perPage = 50;
    let hasMore = true;

    while (hasMore && page <= 3) { // Limit to 3 pages
      try {
        // Sleep to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch featured tournaments - original API call without sort parameters
        const tournaments = await startGGApi.getFeaturedTournaments(
          pastDays5,
          page,
          perPage
        );
        
        // Filter to include only tournaments that haven't ended
        const filteredTournaments = tournaments.filter(
          tournament => tournament.endAt >= todayDate
        );
        
        // Add to our collection
        allTournaments = [...allTournaments, ...filteredTournaments];
        
        // Check if we should fetch more
        hasMore = tournaments.length === perPage;
        page += 1;
      } catch (error) {
        console.error('Error fetching featured tournaments:', error);
        hasMore = false;
      }
    }

    // Sort manually to get newest first
    allTournaments.sort((a, b) => b.startAt - a.startAt);

    console.log(`Fetched ${allTournaments.length} featured tournaments`);

    // Step 2: If we need more tournaments, fetch regular tournaments
    if (allTournaments.length < 75) {
      // Fetch regular tournaments with higher attendance
      page = 1;
      hasMore = true;
      const regularTournaments = [];
      
      while (hasMore && page <= 5) { // Limit to 3 pages
        try {
          // Sleep to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Fetch regular tournaments - original call without sort params
          const result = await startGGApi.getTournaments(
            pastDays3,
            futureDays5,
            page,
            perPage
          );
          
          // Filter tournaments
          const filteredTournaments = result.tournaments.filter(
            tournament => tournament.endAt >= todayDate && tournament.numAttendees > 20
          );
          
          // Add to our regular tournaments collection
          regularTournaments.push(...filteredTournaments);
          
          // Check if we should fetch more
          hasMore = result.tournaments.length === perPage;
          page += 1;
        } catch (error) {
          console.error('Error fetching regular tournaments:', error);
          hasMore = false;
        }
      }

      // Sort regular tournaments manually to get newest first
      regularTournaments.sort((a, b) => b.startAt - a.startAt);
      
      // Add regular tournaments to our collection
      allTournaments = [...allTournaments, ...regularTournaments];
    }

    // Remove duplicates based on tournament ID
    allTournaments = allTournaments.filter((tournament, index, self) =>
      index === self.findIndex((t) => t.id === tournament.id)
    );

    // Limit to top 100 tournaments 
    allTournaments = allTournaments.slice(0, 100);
    console.log(`Total tournaments to process: ${allTournaments.length}`);

    // Rest of the function remains the same...
  } catch (error) {
    console.error('Error in fetchAllTournaments:', error);
  } finally {
    isFetchingTournaments = false;
  }
};

/**
 * Update cache for ongoing tournaments
 */
const updateOngoingTournaments = async () => {
  if (isUpdatingFrequentCache) {
    console.log('Ongoing tournament update already in progress');
    return;
  }

  isUpdatingFrequentCache = true;
  try {
    console.log('Starting ongoing tournament update...');
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Step 1: Get all tournaments from the daily cache
    const keysToCheck = dailyCache.keys();
    let ongoingTournaments = [];
    
    // Step 2: Filter to find ongoing tournaments (with a buffer)
    for (const key of keysToCheck) {
      const tournament = dailyCache.get(key);
      if (tournament) {
        // Add a buffer period of 1 day before and after the tournament
        const startWithBuffer = tournament.startAt - 86400;
        const endWithBuffer = tournament.endAt + 86400;
        
        if (startWithBuffer <= currentTime && endWithBuffer >= currentTime) {
          ongoingTournaments.push(tournament);
        }
      }
    }
    
    console.log(`Found ${ongoingTournaments.length} ongoing tournaments`);
    
    // Step 3: Create a temporary cache
    const temporaryCache = new NodeCache();
    
    // Step 4: Update each ongoing tournament
    for (const tournament of ongoingTournaments) {
      try {
        // Sleep to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch fresh tournament details
        const tournamentDetail = await startGGApi.getTournamentDetails(tournament.slug);
        
        // Store in temporary cache
        temporaryCache.set(tournament.slug.toLowerCase(), tournamentDetail);
        
        // Update in database
        await Tournament.findOneAndUpdate(
          { slug: tournament.slug },
          { 
            ...tournamentDetail,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        
        // Fetch sets for all phases in this tournament
        if (tournamentDetail.events) {
          for (const event of tournamentDetail.events) {
            if (event.phases) {
              for (const phase of event.phases) {
                // Sleep to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
                try {
                  // Fetch sets for this phase
                  const sets = await startGGApi.getSetsByPhase(phase.id, 1, 100);
                  
                  // Store in cache
                  const phaseKey = `phase:${phase.id}`;
                  temporaryCache.set(phaseKey, sets);
                } catch (error) {
                  console.error(`Error fetching sets for phase ${phase.id}:`, error);
                }
              }
            }
          }
        }
        
        console.log(`Updated tournament: ${tournament.slug}`);
      } catch (error) {
        console.error(`Error updating tournament ${tournament.slug}:`, error);
      }
    }
    
    // Step 5: Update the frequent cache
    const keysToUpdate = temporaryCache.keys();
    keysToUpdate.forEach(key => {
      frequentCache.set(key, temporaryCache.get(key));
    });
    
    console.log('Ongoing tournament update completed successfully');
  } catch (error) {
    console.error('Error in updateOngoingTournaments:', error);
  } finally {
    isUpdatingFrequentCache = false;
  }
};

/**
 * Get tournament details from cache or database
 */
const getTournamentBySlug = async (slug) => {

  if (!slug) {
    throw new AppError('Tournament slug is required', 400);
  }
  
  
  const normalizedSlug = 'tournament/' + slug.toLowerCase();
  
  
  // Try to get from cache first
  let tournament = dailyCache.get(normalizedSlug);
  
  // If not in cache, try database
  if (!tournament) {
    tournament = await Tournament.findOne({ slug: normalizedSlug });
    
    // If found in database, add to cache
    if (tournament) {
      
      dailyCache.set(normalizedSlug, tournament.toObject());
      return tournament;
    } else {
      console.log("tournament NOT FOUND")
      // If not in database, fetch from API and cache it
      try {
        const tournamentDetail = await startGGApi.getTournamentDetails(normalizedSlug);
        
        // Save to database
        tournament = await Tournament.findOneAndUpdate(
          { slug: normalizedSlug },
          { 
            ...tournamentDetail,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        
        // Add to cache
        dailyCache.set(normalizedSlug, tournament.toObject());
        return tournament;
      } catch (error) {
        throw new AppError('Tournament not found', 404);
      }
    }
  }
  
  return tournament;
};

/**
 * Get sets by phase ID
 */
const getSetsByPhaseId = async (phaseId) => {
  if (!phaseId) {
    throw new AppError('Phase ID is required', 400);
  }
  
  
  const phaseKey = `phase:${phaseId}`;
  
  // Try to get from cache first
  let sets = frequentCache.get(phaseKey);



  
  // If not in cache, fetch from API
  if (!sets) {
    try {
      sets = await startGGApi.getSetsByPhase(phaseId, 1, 100);
      
      // Cache the result
      frequentCache.set(phaseKey, sets);
    } catch (error) {
      console.error(`Error fetching sets for phase ${phaseId}:`, error);
      throw new AppError('Failed to fetch sets from Start.GG API', 500);
    }
  }
  sets = sets.map(set => {
    return {
      ...set,
      isCompleted: set.state === 3, // 3 indicates completed status
      isInProgress: set.state === 2, // 2 indicates in-progress status
    };
  });  
  return sets;
};

/**
 * Get all featured tournaments
 */


/**
 * Get upcoming tournaments
 */
const getUpcomingTournaments = async (limit = 20) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Get all tournaments from cache
  const tournaments = [];
  const keys = dailyCache.keys();
  
  for (const key of keys) {
    const tournament = dailyCache.get(key);
    if (tournament && tournament.startAt > currentTime) {
      tournaments.push(tournament);
    }
  }
  
  // Sort by start date and limit results
  return tournaments
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, limit);
};

/**
 * Get ongoing tournaments
 */
const getOngoingTournaments = async (limit = 20) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Get all tournaments from cache
  const tournaments = [];
  const keys = dailyCache.keys();
  
  for (const key of keys) {
    const tournament = dailyCache.get(key);
    if (tournament && tournament.startAt <= currentTime && tournament.endAt >= currentTime) {
      tournaments.push(tournament);
    }
  }
  
  // Sort by end date (soonest ending first) and limit results
  return tournaments
    .sort((a, b) => a.endAt - b.endAt)
    .slice(0, limit);
};

/**
 * Initialize the cache on startup
 */
const initializeCache = async () => {
  console.log('Initializing tournament cache...');

  
  
  // Check if we have cached tournaments in the database
  const cachedTournaments = await Tournament.find({});
  
  if (cachedTournaments.length > 0) {
    // Load tournaments into cache
    cachedTournaments.forEach(tournament => {
      dailyCache.set(tournament.slug.toLowerCase(), tournament.toObject());
    });
    
    console.log(`Loaded ${cachedTournaments.length} tournaments from database into cache`);
  } else {
    // If no cached tournaments, fetch them
    await fetchAllTournaments();
  }
};

// Schedule regular updates
const setupScheduledUpdates = () => {
  // Update daily cache every 24 hours
  
  setInterval(fetchAllTournaments, 24 * 60 * 60 * 1000);
  
  // Update ongoing tournaments every 30 minutes
  setInterval(updateOngoingTournaments, 30 * 60 * 1000);
  
  console.log('Scheduled tournament cache updates.');
};

const getFeaturedTournaments = async (limit = 20) => {
  // Get all tournaments from cache
  const tournaments = [];
  const keys = dailyCache.keys();
  
  for (const key of keys) {
    tournaments.push(dailyCache.get(key));
  }
  
  // Sort by start date (newest first) and limit results
  return tournaments
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, limit);
};

module.exports = {
  fetchAllTournaments,
  updateOngoingTournaments,
  getTournamentBySlug,
  getSetsByPhaseId,
  getFeaturedTournaments,
  
  getUpcomingTournaments,
  getOngoingTournaments,
  initializeCache,
  setupScheduledUpdates
};