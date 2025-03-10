// src/services/tournament/cleanup.js
const Tournament = require('../../models/Tournament');
const Bet = require('../../models/Bet');
const { AppError } = require('../../middleware/error');

/**
 * Cleanup tournaments that have ended more than X days ago
 * @param {Number} daysThreshold - Number of days after which a tournament is considered for cleanup
 * @returns {Object} - Cleanup statistics
 */
const cleanupExpiredTournaments = async (daysThreshold = 5) => {
  try {
    console.log(`Starting tournament cleanup for tournaments ended more than ${daysThreshold} days ago...`);
    
    // Calculate the timestamp for X days ago
    const thresholdTime = Math.floor(Date.now() / 1000) - (daysThreshold * 24 * 60 * 60);
    
    // Find tournaments that ended before the threshold
    const expiredTournaments = await Tournament.find({
      endAt: { $lt: thresholdTime }
    });
    
    console.log(`Found ${expiredTournaments.length} expired tournaments to clean up`);
    
    let cleanupStats = {
      tournamentsRemoved: 0,
      associatedBetsProcessed: 0,
      errors: []
    };
    
    // Process each expired tournament
    for (const tournament of expiredTournaments) {
      try {
        // Check if there are any unresolved bets for this tournament
        const unresolvedBets = await Bet.countDocuments({
          tournamentId: tournament.id,
          status: { $in: ['open', 'in_progress', 'disputed'] }
        });
        
        // Skip tournaments with unresolved bets to avoid data integrity issues
        if (unresolvedBets > 0) {
          console.log(`Skipping tournament ${tournament.id} (${tournament.name}) - ${unresolvedBets} unresolved bets found`);
          cleanupStats.errors.push({
            tournamentId: tournament.id,
            name: tournament.name,
            reason: `${unresolvedBets} unresolved bets found`
          });
          continue;
        }
        
        // Get associated bets for record-keeping
        const betsCount = await Bet.countDocuments({
          tournamentId: tournament.id
        });
        
        // Delete the tournament
        await Tournament.findByIdAndDelete(tournament._id);
        
        cleanupStats.tournamentsRemoved++;
        cleanupStats.associatedBetsProcessed += betsCount;
        
        console.log(`Removed tournament ${tournament.id} (${tournament.name}) with ${betsCount} associated bets`);
      } catch (error) {
        console.error(`Error processing tournament ${tournament.id}:`, error);
        cleanupStats.errors.push({
          tournamentId: tournament.id,
          name: tournament.name,
          reason: error.message
        });
      }
    }
    
    console.log('Tournament cleanup completed:', cleanupStats);
    return cleanupStats;
  } catch (error) {
    console.error('Error in cleanupExpiredTournaments:', error);
    throw new AppError('Tournament cleanup failed', 500);
  }
};

/**
 * Cleanup tournaments with the option to archive them instead of deleting
 * @param {Number} daysThreshold - Number of days after which a tournament is considered for cleanup
 * @param {Boolean} archive - Whether to archive instead of delete
 * @returns {Object} - Cleanup statistics
 */
const cleanupOrArchiveExpiredTournaments = async (daysThreshold = 5, archive = false) => {
  if (!archive) {
    return await cleanupExpiredTournaments(daysThreshold);
  }
  
  try {
    console.log(`Starting tournament archiving for tournaments ended more than ${daysThreshold} days ago...`);
    
    // Calculate the timestamp for X days ago
    const thresholdTime = Math.floor(Date.now() / 1000) - (daysThreshold * 24 * 60 * 60);
    
    // Find tournaments that ended before the threshold
    const expiredTournaments = await Tournament.find({
      endAt: { $lt: thresholdTime },
      archived: { $ne: true } // Only process non-archived tournaments
    });
    
    console.log(`Found ${expiredTournaments.length} expired tournaments to archive`);
    
    let archiveStats = {
      tournamentsArchived: 0,
      errors: []
    };
    
    // Process each expired tournament
    for (const tournament of expiredTournaments) {
      try {
        // Archive the tournament by setting the archived flag
        await Tournament.findByIdAndUpdate(tournament._id, {
          archived: true,
          archivedAt: new Date()
        });
        
        archiveStats.tournamentsArchived++;
        
        console.log(`Archived tournament ${tournament.id} (${tournament.name})`);
      } catch (error) {
        console.error(`Error archiving tournament ${tournament.id}:`, error);
        archiveStats.errors.push({
          tournamentId: tournament.id,
          name: tournament.name,
          reason: error.message
        });
      }
    }
    
    console.log('Tournament archiving completed:', archiveStats);
    return archiveStats;
  } catch (error) {
    console.error('Error in cleanupOrArchiveExpiredTournaments:', error);
    throw new AppError('Tournament archiving failed', 500);
  }
};

/**
 * Schedule tournament cleanup to run at a specific interval
 * @param {Number} intervalHours - Interval in hours
 * @param {Number} daysThreshold - Number of days after which a tournament is considered for cleanup
 * @param {Boolean} archive - Whether to archive instead of delete
 */
const scheduleCleanup = (intervalHours = 24, daysThreshold = 5, archive = false) => {
  // Convert hours to milliseconds
  const interval = intervalHours * 60 * 60 * 1000;
  
  console.log(`Scheduling tournament cleanup to run every ${intervalHours} hours for tournaments ended more than ${daysThreshold} days ago`);
  
  // Run cleanup immediately on startup
  cleanupOrArchiveExpiredTournaments(daysThreshold, archive);
  
  // Schedule regular cleanup
  setInterval(() => {
    cleanupOrArchiveExpiredTournaments(daysThreshold, archive);
  }, interval);
};

module.exports = {
  cleanupExpiredTournaments,
  cleanupOrArchiveExpiredTournaments,
  scheduleCleanup
};