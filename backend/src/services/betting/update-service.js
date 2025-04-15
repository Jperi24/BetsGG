// src/services/betting/update-service.js
const Bet = require('../../models/Bet');
const Transaction = require('../../models/Transactions');
const User = require('../../models/User');
const { startGGApi } = require('../../integrations/startgg/client');
const { AppError } = require('../../middleware/error');
const mongoose = require('mongoose');

// Track if update is currently running to prevent parallel execution
let isUpdating = false;

/**
 * Update all open bets with the latest match results
 */
const updateAllBets = async () => {
  if (isUpdating) {
    console.log('Bet update is already in progress');
    return;
  }

  isUpdating = true;
  console.log('Starting bet status update...');
  
  try {
    // Find all open or in_progress bets
    const activeBets = await Bet.find({
      status: { $in: ['open', 'in_progress'] }
    });
    
    console.log(`Found ${activeBets.length} active bets to check`);
    
    // Process each bet
    for (const bet of activeBets) {
      try {
        await updateBetStatus(bet);
      } catch (error) {
        console.error(`Error updating bet ${bet._id}:`, error);
      }
    }
    
    console.log('Bet status update completed');
  } catch (error) {
    console.error('Error in updateAllBets:', error);
  } finally {
    isUpdating = false;
  }
};

/**
 * Parse a preview ID to extract tournament, event, and set information
 */
const parsePreviewId = (previewId) => {
  const matches = previewId.match(/preview_(\d+)_(\d+)_(\d+)/);
  if (matches && matches.length >= 4) {
    return {
      tournamentId: matches[1],
      eventGroupId: matches[2], // Usually corresponds to an event/division
      setIndex: matches[3]      // Index within that event/phase
    };
  }
  return null;
};

/**
 * Update a single bet status based on match results
 */
const updateBetStatus = async (bet) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log(`Updating bet ${bet._id} with setId: ${bet.setId}`);
    
    // First, get tournament information to determine if it's ended
    let tournament = null;
    let tournamentEnded = false;
    
    try {
      tournament = await startGGApi.getTournamentDetails(bet.tournamentSlug);
      
      if (tournament) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (tournament.endAt < currentTime) {
          console.log(`Tournament ${bet.tournamentName} has ended (ended at ${new Date(tournament.endAt * 1000).toISOString()})`);
          tournamentEnded = true;
        }
      } else {
        console.log(`Tournament ${bet.tournamentSlug} not found`);
        tournamentEnded = true;
      }
    } catch (tournamentError) {
      console.error(`Error fetching tournament: ${tournamentError.message}`);
    }
    
    // Check if the set ID is in preview format
    const isPreviewId = bet.setId.startsWith('preview_');
    let set = null;
    
    if (isPreviewId) {
      console.log(`Set ID ${bet.setId} is in preview format, attempting to convert...`);
      
      // Parse the preview ID to get tournament ID
      const parsedId = parsePreviewId(bet.setId);
      
      if (!parsedId) {
        console.log(`Could not parse preview ID: ${bet.setId}`);
        await session.abortTransaction();
        return;
      }
      
      // For completed tournaments, use the direct lookup method which is more effective
      if (tournamentEnded) {
        console.log(`Using direct tournament lookup for completed tournament`);
        
        // Use our new direct tournament lookup method
        set = await startGGApi.findSetInCompletedTournament(
          parsedId.tournamentId,
          bet.phaseId,
          bet.contestant1.name,
          bet.contestant2.name,
          bet.tournamentSlug
        );
        
        // Log whether we found a match
        if (set) {
          console.log(`Direct lookup found matching set for ${bet.contestant1.name} vs ${bet.contestant2.name}`);
        } else {
          console.log(`Direct lookup did not find a match. Trying alternative approaches...`);
          
          // Try our regular approach as fallback
          try {
            console.log(`Falling back to regular approach for tournament ${parsedId.tournamentId}, phase ${bet.phaseId}`);
            
            // Try with reduced query
            const phaseSets = await startGGApi.getSetsByPhaseWithReduced(bet.phaseId, 1, 25);
            
            if (phaseSets && phaseSets.length > 0) {
              console.log(`Found ${phaseSets.length} sets in phase, searching for match...`);
              
              // Try to find by contestant names (more reliable for completed tournaments)
              set = phaseSets.find(s => {
                if (!s.slots || s.slots.length !== 2) return false;
                
                const name1Match = s.slots[0]?.entrant?.name === bet.contestant1.name;
                const name2Match = s.slots[1]?.entrant?.name === bet.contestant2.name;
                
                // Also check the reverse order
                const reverseName1Match = s.slots[1]?.entrant?.name === bet.contestant1.name;
                const reverseName2Match = s.slots[0]?.entrant?.name === bet.contestant2.name;
                
                return (name1Match && name2Match) || (reverseName1Match && reverseName2Match);
              });
              
              if (set) {
                console.log(`Found match in phase sets by contestant name`);
              }
            }
          } catch (fallbackError) {
            console.error(`Fallback approach error: ${fallbackError.message}`);
          }
        }
        
       
   
        // For active tournaments, use the standard approach
        console.log(`Tournament is active, using standard set lookup approach`);
        
        try {
          // Try to get phase sets with reduced complexity
          const phaseSets = await startGGApi.getSetsByPhaseWithReduced(bet.phaseId, 1, 20);
          
          if (phaseSets && phaseSets.length > 0) {
            console.log(`Found ${phaseSets.length} sets, looking for matching contestants`);
            
            // Find the set that matches our contestants
            set = phaseSets.find(s => {
              if (!s.slots || s.slots.length !== 2) return false;
              
              // Try exact contestant ID match first
              const contestant1Match = s.slots[0]?.entrant?.id?.toString() === bet.contestant1.id.toString();
              const contestant2Match = s.slots[1]?.entrant?.id?.toString() === bet.contestant2.id.toString();
              
              // Also try name match
              const nameMatch1 = s.slots[0]?.entrant?.name === bet.contestant1.name;
              const nameMatch2 = s.slots[1]?.entrant?.name === bet.contestant2.name;
              
              // And reverse order
              const reverseName1Match = s.slots[1]?.entrant?.name === bet.contestant1.name;
              const reverseName2Match = s.slots[0]?.entrant?.name === bet.contestant2.name;
              
              return (contestant1Match && contestant2Match) || 
                     (nameMatch1 && nameMatch2) || 
                     (reverseName1Match && reverseName2Match);
            });
            
            if (set) {
              console.log(`Found matching set for ${bet.contestant1.name} vs ${bet.contestant2.name}`);
            } else {
              console.log(`No match found in first page, trying more pages`);
              
              // Try more pages
              for (let page = 2; page <= 500 && !set; page++) {
                try {
                  const moreSets = await startGGApi.getSetsByPhaseWithReduced(bet.phaseId, page, 20);
                  if (moreSets && moreSets.length > 0) {
                    console.log(`Checking page ${page} with ${moreSets.length} sets`);
                    
                    set = moreSets.find(s => {
                      if (!s.slots || s.slots.length !== 2) return false;
                      
                      const name1Match = s.slots[0]?.entrant?.name === bet.contestant1.name;
                      const name2Match = s.slots[1]?.entrant?.name === bet.contestant2.name;
                      
                      const reverseName1Match = s.slots[1]?.entrant?.name === bet.contestant1.name;
                      const reverseName2Match = s.slots[0]?.entrant?.name === bet.contestant2.name;
                      
                      return (name1Match && name2Match) || (reverseName1Match && reverseName2Match);
                    });
                    
                    if (set) {
                      console.log(`Found matching set on page ${page}`);
                      break;
                    }
                  } else {
                    break; // No more sets to check
                  }
                } catch (pageError) {
                  console.error(`Error fetching page ${page}: ${pageError.message}`);
                  break;
                }
              }
            }
          }
        } catch (apiError) {
          console.error(`Error fetching sets: ${apiError.message}`);
        }
      }
    } else {
      // For non-preview IDs, try direct lookup
      try {
        set = await startGGApi.getSetById(bet.setId);
        console.log(`Direct set lookup result: ${set ? 'Found' : 'Not found'}`);
      } catch (setError) {
        console.error(`Error fetching set directly: ${setError.message}`);
      }
    }
    
    // If we couldn't find the set data and the tournament has ended, refund the bet
    if (!set && tournamentEnded) {
      console.log(`Tournament ${bet.tournamentName} has ended and set data unavailable, refunding bet ${bet._id}`);
      
      // Update bet status for refund
      bet.status = 'completed';
      bet.resultDeterminedAt = new Date();
      bet.winner = 0; // 0 means draw/refund
      bet.disputeReason = "Tournament ended, unable to determine match result";
      
      await bet.save({ session });
      await processRefunds(bet, session);
      await session.commitTransaction();
      
      console.log(`Processed refund for bet ${bet._id} from ended tournament`);
      return;
    }
    
    // Skip if no set found
    if (!set) {
      console.log(`No set found for bet ${bet._id}, will try again later`);
      await session.abortTransaction();
      return;
    }
    
 
    
    console.log(`Set found and completed for bet ${bet._id}, processing result`);
    
    // Determine the winner based on set data
    let winner = 0; // Default to 0 (draw/cancelled)
    
    if (set.winnerId) {
      // Check which contestant won
      if (set.winnerId === bet.contestant1.id) {
        winner = 1;
        console.log(`Contestant 1 (${bet.contestant1.name}) won`);
      } else if (set.winnerId === bet.contestant2.id) {
        winner = 2;
        console.log(`Contestant 2 (${bet.contestant2.name}) won`);
      } else {
        // If winner ID doesn't match either contestant, try to determine by other means
        console.log(`Winner ID ${set.winnerId} doesn't match either contestant directly, trying to infer result`);
        
        // Try to match by name if IDs don't match
        if (set.slots && set.slots.length === 2) {
          const slot0Name = set.slots[0]?.entrant?.name;
          const slot1Name = set.slots[1]?.entrant?.name;
          
          // If slot0 has the winner ID and its name matches contestant1
          if (set.slots[0]?.entrant?.id === set.winnerId && 
              slot0Name === bet.contestant1.name) {
            winner = 1;
            console.log(`Determined winner by name match: Contestant 1 (${bet.contestant1.name})`);
          }
          // If slot1 has the winner ID and its name matches contestant1
          else if (set.slots[1]?.entrant?.id === set.winnerId && 
                   slot1Name === bet.contestant1.name) {
            winner = 1;
            console.log(`Determined winner by name match: Contestant 1 (${bet.contestant1.name})`);
          }
          // If slot0 has the winner ID and its name matches contestant2
          else if (set.slots[0]?.entrant?.id === set.winnerId && 
                   slot0Name === bet.contestant2.name) {
            winner = 2;
            console.log(`Determined winner by name match: Contestant 2 (${bet.contestant2.name})`);
          }
          // If slot1 has the winner ID and its name matches contestant2
          else if (set.slots[1]?.entrant?.id === set.winnerId && 
                   slot1Name === bet.contestant2.name) {
            winner = 2;
            console.log(`Determined winner by name match: Contestant 2 (${bet.contestant2.name})`);
          }
          // Try to determine by placement if available
          else if (set.slots[0]?.standing?.placement === 1) {
            if (slot0Name === bet.contestant1.name) {
              winner = 1;
              console.log(`Determined winner by placement: Contestant 1 (${bet.contestant1.name})`);
            } else if (slot0Name === bet.contestant2.name) {
              winner = 2;
              console.log(`Determined winner by placement: Contestant 2 (${bet.contestant2.name})`);
            }
          }
          else if (set.slots[1]?.standing?.placement === 1) {
            if (slot1Name === bet.contestant1.name) {
              winner = 1;
              console.log(`Determined winner by placement: Contestant 1 (${bet.contestant1.name})`);
            } else if (slot1Name === bet.contestant2.name) {
              winner = 2;
              console.log(`Determined winner by placement: Contestant 2 (${bet.contestant2.name})`);
            }
          }
        }
      }
    } 
    
    // Update bet status to completed and set winner
    bet.status = 'completed';
    bet.resultDeterminedAt = new Date();
    bet.winner = winner;
    
    await bet.save({ session });
    
    // Handle payouts if draw/cancelled
    if (winner === 0) {
      // Process refunds for a draw/cancelled match
      await processRefunds(bet, session);
    }
    
    await session.commitTransaction();
    console.log(`Successfully updated bet ${bet._id} with winner: ${winner}`);
  } catch (error) {
    await session.abortTransaction();
    console.error(`Error updating bet ${bet._id}:`, error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process refunds for cancelled matches or draws
 */
const processRefunds = async (bet, session) => {
  console.log(`Processing refunds for bet ${bet._id}`);
  
  // Refund all participants
  for (const participant of bet.participants) {
    // Find user
    const user = await User.findById(participant.user).session(session);
    
    if (user) {
      // Add funds back to user
      user.balance += participant.amount;
      await user.save({ session });
      
      // Create refund transaction
      const transaction = new Transaction({
        user: participant.user,
        type: 'refund',
        amount: participant.amount,
        currency: 'ETH',
        status: 'completed',
        betId: bet._id,
        description: `Refund for bet: ${bet.tournamentName} - ${bet.matchName}`
      });
      
      await transaction.save({ session });
      
      // Mark as claimed to prevent double refunds
      await Bet.updateOne(
        { _id: bet._id, 'participants.user': participant.user },
        { $set: { 'participants.$.claimed': true } },
        { session }
      );
    }
  }
  
  console.log(`Refund processing completed for bet ${bet._id}`);
};

/**
 * Setup scheduled updates
 */
const setupScheduledUpdates = (intervalMinutes = 10) => {
  // Convert minutes to milliseconds
  const interval = intervalMinutes * 60 * 1000;
  
  // Run immediately on startup
  updateAllBets();
  
  // Then schedule regular updates
  setInterval(updateAllBets, interval);
  
  console.log(`Scheduled bet status updates every ${intervalMinutes} minutes`);
};

module.exports = {
  updateAllBets,
  updateBetStatus,
  setupScheduledUpdates
};