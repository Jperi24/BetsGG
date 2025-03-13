// backend/src/services/betting/update-service.js
const Bet = require('../../models/Bet');
const Transaction = require('../../models/Transactions');
const User = require('../../models/User');
const { startGGApi } = require('../../integrations/startgg/client');
const { AppError } = require('../../middleware/error');
const mongoose = require('mongoose');

/**
 * Service to periodically check bet statuses and update them based on match results
 */

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
 * Update a single bet status based on match results
 */
const updateBetStatus = async (bet) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Fetch the latest set info from Start.GG API
    const set = await startGGApi.getSetById(bet.setId);
    
    // Skip if no set found or set is not complete
    if (!set || set.state !== 3) { // 3 is the "completed" state in Start.GG API
      return;
    }
    
    // Determine the winner based on set data
    let winner = 0; // Default to 0 (draw/cancelled)
    
    if (set.winnerId) {
      // Check which contestant won
      if (set.winnerId === bet.contestant1.id) {
        winner = 1;
      } else if (set.winnerId === bet.contestant2.id) {
        winner = 2;
      }
    }
    
    // Update bet status to completed and set winner
    bet.status = 'completed';
    bet.resultDeterminedAt = new Date();
    bet.winner = winner;
    
    await bet.save({ session });
    
    // Handle payouts if not a draw/cancelled
    if (winner === 0) {
      // Process refunds for a draw/cancelled match
      await processRefunds(bet, session);
    }
    
    await session.commitTransaction();
    console.log(`Updated bet ${bet._id} with winner: ${winner}`);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process refunds for cancelled matches or draws
 */
const processRefunds = async (bet, session) => {
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
        description: `Refund for draw/cancelled match: ${bet.tournamentName} - ${bet.matchName}`
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
};

// Add to src/services/betting/update-service.js

/**
 * Check if a set has been cancelled or no longer exists
 */

const cancelBet = async (betId, reason, userId, isSystem = false) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Check user role if not a system action
    if (!isSystem) {
      const user = await User.findById(userId).session(session);
      if (!user || user.role !== 'admin') {
        throw new AppError('Not authorized to perform this action', 403);
      }
    }

    // Can only cancel open or in_progress bets
    if (!['open', 'in_progress'].includes(bet.status)) {
      throw new AppError(`Cannot cancel a bet with status: ${bet.status}`, 400);
    }

    // Update bet status
    bet.status = 'cancelled';
    bet.disputeReason = reason;
    bet.winner = 0; // No winner
    bet.cancelledBy = isSystem ? 'system' : userId;
    bet.cancelledAt = new Date();
    await bet.save({ session });

    // Refund all participants
    for (const participant of bet.participants) {
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
          description: `Refund for cancelled bet: ${bet.tournamentName} - ${bet.matchName}. Reason: ${reason}`
        });

        await transaction.save({ session });
      }
    }

    await session.commitTransaction();
    return bet;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
const checkForCancelledSets = async () => {
  if (isUpdating) {
    console.log('Bet update is already in progress');
    return;
  }

  isUpdating = true;
  console.log('Starting check for cancelled sets...');
  
  try {
    // Find all open or in_progress bets
    const activeBets = await Bet.find({
      status: { $in: ['open', 'in_progress'] }
    });
    
    console.log(`Found ${activeBets.length} active bets to check for cancellations`);
    
    // Process each bet
    for (const bet of activeBets) {
      try {
        // Fetch the latest set info from Start.GG API
        let set;
        try {
          set = await startGGApi.getSetById(bet.setId);
        } catch (apiError) {
          console.error(`Error fetching set ${bet.setId} from API:`, apiError);
          // Continue to next bet if API call fails
          continue;
        }
        
        // Check if set no longer exists or has been cancelled
        if (!set) {
          console.log(`Set ${bet.setId} no longer exists in tournament ${bet.tournamentSlug}, cancelling bet ${bet._id}`);
          await cancelBet(
            bet._id, 
            'Set no longer exists in tournament structure', 
            null, // Use system admin ID or create a specific mechanism for system actions
            true  // Flag for system-initiated cancellation
          );
          continue;
        }
        
        // Check if any competitors have changed (DQ, replacement, etc.)
        if (set.slots && set.slots.length === 2) {
          const competitor1Changed = set.slots[0].entrant && 
                                    set.slots[0].entrant.id.toString() !== bet.contestant1.id.toString();
          const competitor2Changed = set.slots[1].entrant && 
                                    set.slots[1].entrant.id.toString() !== bet.contestant2.id.toString();
          
          if (competitor1Changed || competitor2Changed) {
            console.log(`Competitors changed for set ${bet.setId}, cancelling bet ${bet._id}`);
            await cancelBet(
              bet._id, 
              'Competitors have changed for this match', 
              null,
              true
            );
            continue;
          }
        }
        
        // Check if set has been explicitly cancelled in the tournament
        if (set.state === 4) { // Assuming state 4 is 'cancelled' in Start.GG API
          console.log(`Set ${bet.setId} has been cancelled, cancelling bet ${bet._id}`);
          await cancelBet(
            bet._id, 
            'Match has been cancelled by tournament organizers', 
            null,
            true
          );
        }
      } catch (error) {
        console.error(`Error checking for cancellation of bet ${bet._id}:`, error);
      }
    }
    
    console.log('Cancelled sets check completed');
  } catch (error) {
    console.error('Error in checkForCancelledSets:', error);
  } finally {
    isUpdating = false;
  }
};

/**
 * Setup scheduled updates
 */
const setupScheduledUpdates = (intervalMinutes = 10) => {
  // Convert minutes to milliseconds
  const interval = intervalMinutes * 60 * 1000;
  
  // Run immediately on startup
  updateAllBets();
  checkForCancelledSets();
  
  // Then schedule regular updates
  setInterval(updateAllBets, interval);
  
  console.log(`Scheduled bet status updates every ${intervalMinutes} minutes`);
};

module.exports = {
  updateAllBets,
  checkForCancelledSets,
  updateBetStatus,
  setupScheduledUpdates
};