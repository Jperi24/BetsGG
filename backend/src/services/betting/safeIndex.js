// src/services/betting/index.js
const mongoose = require('mongoose');
const Bet = require('../../models/Bet');
const User = require('../../models/User');
const Transaction = require('../../models/Transactions');
const tournamentService = require('../tournament');
const { AppError } = require('../../middleware/error');

/**
 * Create a new bet
 */
const createBet = async (betData, userId) => {
  

  const session = await mongoose.startSession();
  session.startTransaction();
  

  try {
    // Validate tournament exists
    const tournament = await tournamentService.getTournamentBySlug(betData.tournamentSlug);
    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    // Find the event and phase in the tournament
    const event = tournament.events.find(e => e.id === betData.eventId);
    if (!event) {
      throw new AppError('Event not found in tournament', 404);
    }

    const phase = event.phases.find(p => p.id === betData.phaseId);
    if (!phase) {
      throw new AppError('Phase not found in event', 404);
    }

    
    

    // Get sets for this phase to find the specific match
    const sets = await tournamentService.getSetsByPhaseId(betData.phaseId);
    
    const set = sets.find(s => String(s.id) === String(betData.setId));


    
    
    if (!set) {
      throw new AppError('Match not found in phase', 404);
    }
    if (set.state === 3) { // 3 is the "completed" state in Start.GG API
      throw new AppError('Cannot create a bet for a completed match', 400);
    }

    

    // Validate match has two contestants
    if (!set.slots || set.slots.length !== 2 || !set.slots[0].entrant || !set.slots[1].entrant) {
      throw new AppError('Match must have exactly two contestants', 400);
    }

    // Validate bet amounts
    if (betData.minimumBet < 0.0001) {
      throw new AppError('Minimum bet must be at least 0.0001', 400);
    }

    if (betData.maximumBet < betData.minimumBet) {
      throw new AppError('Maximum bet must be greater than minimum bet', 400);
    }

    const existingBet = await Bet.findOne({
      tournamentId: tournament.id,
      eventId: event.id,
      phaseId: phase.id,
      setId: set.id,
      status: { $in: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'] } // Only check active bets
    });
    
    if (existingBet) {
      throw new AppError('A betting pool already exists for this match', 400);
    }
    
  

    const cleanSlug = tournament.slug.replace(/^tournament\//, ""); 
   
    
    

    // Create new bet
    const newBet = new Bet({
      tournamentId: tournament.id,
      tournamentSlug: cleanSlug,
      tournamentName: tournament.name,
      eventId: event.id,
      eventName: event.name,
      phaseId: phase.id,
      phaseName: phase.name,
      setId: set.id,
      matchName: set.fullRoundText || `${set.slots[0].entrant.name} vs ${set.slots[1].entrant.name}`,
      contestant1: {
        id: set.slots[0].entrant.id,
        name: set.slots[0].entrant.name
      },
      contestant2: {
        id: set.slots[1].entrant.id,
        name: set.slots[1].entrant.name
      },
      creator: userId,
      minimumBet: betData.minimumBet,
      maximumBet: betData.maximumBet,
      startTime: betData.startTime,
    });

    await newBet.save({ session });

    // Add bet to user's created bets
    await User.findByIdAndUpdate(
      userId,
      { $push: { deployedBets: newBet._id } },
      { session }
    );

    await session.commitTransaction();
    return newBet;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Place a bet on an existing bet
 */
// const placeBet = async (betId, prediction, amount, userId) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {

//     const tournament = await tournamentService.getTournamentBySlug(betData.tournamentSlug);
//     if (!tournament) {
//       throw new AppError('Tournament not found', 404);
//     }

//     // Validate tournament hasn't ended
//     const currentTime = Math.floor(Date.now() / 1000);
//     if (tournament.endAt < currentTime) {
//       throw new AppError('Cannot create bets cmpleted tournaments', 400);
//     }

//     // Find the event and phase in the tournament
//     const event = tournament.events.find(e => e.id === betData.eventId);
//     if (!event) {
//       throw new AppError('Event not found in tournament', 404);
//     }

//     const phase = event.phases.find(p => p.id === betData.phaseId);
//     if (!phase) {
//       throw new AppError('Phase not found in event', 404);
//     }

//     // Get sets for this phase to find the specific match
//     const sets = await tournamentService.getSetsByPhaseId(betData.phaseId);
//     const set = sets.find(s => String(s.id) === String(betData.setId));
    
//     if (!set) {
//       throw new AppError('Match not found in phase', 404);
//     }

//     // Check if match is already completed
//     if (set.state === 3) { // 3 is the "completed" state in Start.GG API
//       throw new AppError('Cannot create a bet for a completed match', 400);
//     }

//     // Validate match has two contestants
//     if (!set.slots || set.slots.length !== 2 || !set.slots[0].entrant || !set.slots[1].entrant) {
//       throw new AppError('Match must have exactly two contestants', 400);
//     }

//     // Validate bet amounts
//     if (betData.minimumBet < 0.0001) {
//       throw new AppError('Minimum bet must be at least 0.0001', 400);
//     }

//     if (betData.maximumBet < betData.minimumBet) {
//       throw new AppError('Maximum bet must be greater than minimum bet', 400);
//     }
//     // Find the bet
//     const bet = await Bet.findById(betId).session(session);
//     if (!bet) {
//       throw new AppError('Bet not found', 404);
//     }

//     // Check if bet is open
//     if (bet.status !== 'open') {
//       throw new AppError('This bet is no longer accepting participants', 400);
//     }

//     // Check if user has already participated
//     if (bet.hasUserParticipated(userId)) {
//       throw new AppError('You have already placed a bet on this match', 400);
//     }

//     // Validate prediction
//     if (prediction !== 1 && prediction !== 2) {
//       throw new AppError('Prediction must be 1 (contestant 1) or 2 (contestant 2)', 400);
//     }

//     // Validate amount
//     if (amount < bet.minimumBet || amount > bet.maximumBet) {
//       throw new AppError(`Bet amount must be between ${bet.minimumBet} and ${bet.maximumBet}`, 400);
//     }

//     // Check user balance
//     const user = await User.findById(userId).session(session);
//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     if (user.balance < amount) {
//       throw new AppError('Insufficient balance', 400);
//     }

//     // Deduct amount from user balance
//     user.balance -= amount;
//     await user.save({ session });

//     // Create transaction record
//     const transaction = new Transaction({
//       user: userId,
//       type: 'bet',
//       amount: amount,
//       currency: 'ETH', // Default currency
//       status: 'completed',
//       betId: bet._id,
//       description: `Bet on ${prediction === 1 ? bet.contestant1.name : bet.contestant2.name} in ${bet.tournamentName}: ${bet.matchName}`
//     });

//     await transaction.save({ session });

//     // Add user to bet participants
//     bet.participants.push({
//       user: userId,
//       prediction: prediction,
//       amount: amount,
//       timestamp: new Date()
//     });

//     // Update bet pools
//     bet.totalPool += amount;
//     if (prediction === 1) {
//       bet.contestant1Pool += amount;
//     } else {
//       bet.contestant2Pool += amount;
//     }

//     await bet.save({ session });

//     // Add bet to user's participated bets
//     await User.findByIdAndUpdate(
//       userId,
//       { $push: { participatedBets: bet._id } },
//       { session }
//     );

//     await session.commitTransaction();
//     return bet;
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };
const placeBet = async (betId, prediction, amount, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Check if bet is open
    if (bet.status !== 'open') {
      throw new AppError('This bet is no longer accepting participants', 400);
    }

    // Double-check with the tournament API if the match is still open
    try {
      // Get the latest set info from Start.GG API
      const set = await startGGApi.getSetById(bet.setId);
      
      if (!set) {
        throw new AppError('Match data could not be retrieved', 500);
      }
      
      // Check if match is already completed
      if (set.state === 3) { // 3 is the "completed" state in Start.GG API
        // Automatically update the bet status
        bet.status = 'in_progress';
        
        if (set.winnerId) {
          bet.status = 'completed';
          if (set.winnerId === bet.contestant1.id) {
            bet.winner = 1;
          } else if (set.winnerId === bet.contestant2.id) {
            bet.winner = 2;
          }
          bet.resultDeterminedAt = new Date();
        }
        
        await bet.save({ session });
        throw new AppError('This match has already been completed - betting is closed', 400);
      }
      
      // Check if match is in progress
      if (set.state === 2) { // 2 is the "in progress" state
        bet.status = 'in_progress';
        await bet.save({ session });
        throw new AppError('This match is already in progress - betting is closed', 400);
      }
    } catch (apiError) {
      // If we can't verify with the API, rely on our internal status
      if (apiError.message.includes('betting is closed')) {
        throw apiError; // Re-throw the specific error
      }
      // Log the error but continue with the bet's current status
      console.error(`Failed to validate match status with Start.GG API: ${apiError.message}`);
    }

    // Check if user has already participated
    if (bet.hasUserParticipated(userId)) {
      throw new AppError('You have already placed a bet on this match', 400);
    }

    // Validate prediction
    if (prediction !== 1 && prediction !== 2) {
      throw new AppError('Prediction must be 1 (contestant 1) or 2 (contestant 2)', 400);
    }

    // Validate amount
    if (amount < bet.minimumBet || amount > bet.maximumBet) {
      throw new AppError(`Bet amount must be between ${bet.minimumBet} and ${bet.maximumBet}`, 400);
    }

    // Check user balance
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.balance < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Deduct amount from user balance
    user.balance -= amount;
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'bet',
      amount: amount,
      currency: 'ETH', // Default currency
      status: 'completed',
      betId: bet._id,
      description: `Bet on ${prediction === 1 ? bet.contestant1.name : bet.contestant2.name} in ${bet.tournamentName}: ${bet.matchName}`
    });

    await transaction.save({ session });

    // Add user to bet participants
    bet.participants.push({
      user: userId,
      prediction: prediction,
      amount: amount,
      timestamp: new Date()
    });

    // Update bet pools
    bet.totalPool += amount;
    if (prediction === 1) {
      bet.contestant1Pool += amount;
    } else {
      bet.contestant2Pool += amount;
    }

    await bet.save({ session });

    // Add bet to user's participated bets
    await User.findByIdAndUpdate(
      userId,
      { $push: { participatedBets: bet._id } },
      { session }
    );

    await session.commitTransaction();
    return bet;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
/**
 * Get bet by ID
 */
const getBetById = async (betId) => {
  return await Bet.findById(betId)
    .populate('creator', 'username')
    .populate('participants.user', 'username');
};

/**
 * Get bets by tournament
 */
const getBetsByTournament = async (tournamentSlug, status) => {
  try {
    console.log(`Betting service: Getting bets for tournament slug: ${tournamentSlug}, status: ${status || 'all'}`);
    
    if (!tournamentSlug) {
      throw new AppError('Tournament slug is required', 400);
    }
    
    // Clean up the tournament slug - remove any "tournament/" prefix if present
    console.log("Querying on slug",tournamentSlug)
    
    
    // Construct the query
    const query = { tournamentSlug: tournamentSlug };
    if (status) {
      query.status = status;
    }
    
    // Find bets matching the query
    const bets = await Bet.find(query)
      .populate('creator', 'username')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${bets.length} bets for tournament ${tournamentSlug}`);
    return bets;
  } catch (error) {
    console.error(`Error in getBetsByTournament: ${error.message}`);
    throw error;
  }
};

/**
 * Get user's created bets
 */
const getUserCreatedBets = async (userId) => {
  return await Bet.find({ creator: userId })
    .sort({ createdAt: -1 });
};

/**
 * Get user's participated bets
 */
const getUserParticipatedBets = async (userId) => {
  return await Bet.find({ 'participants.user': userId })
    .sort({ createdAt: -1 });
};

/**
 * Claim winnings from a bet
 */
// backend/src/services/betting/index.js - Update the claimWinnings function

/**
 * Claim winnings from a bet
 */
const claimWinnings = async (betId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Check if bet is completed
    if (bet.status !== 'completed') {
      throw new AppError('Bet is not completed yet', 400);
    }

    // Check if bet has a winner
    if (bet.winner !== 1 && bet.winner !== 2) {
      throw new AppError('This bet has no winner yet', 400);
    }

    // Check if user participated in this bet
    const participant = bet.participants.find(
      p => p.user.toString() === userId.toString()
    );

    if (!participant) {
      throw new AppError('You did not participate in this bet', 400);
    }

    // Check if user bet on the winning contestant
    if (participant.prediction !== bet.winner) {
      throw new AppError('You did not bet on the winning contestant', 400);
    }

    // Check if user already claimed their winnings
    if (participant.claimed) {
      throw new AppError('You have already claimed your winnings', 400);
    }

    // Calculate winnings
    const userBet = participant.amount;
    const winningPool = bet.winner === 1 ? bet.contestant1Pool : bet.contestant2Pool;
    const totalPool = bet.totalPool;
    
    // Formula: (user bet / winning pool) * total pool
    const grossWinnings = (userBet / winningPool) * totalPool;
    
    // Apply 1% house commission
    const commission = grossWinnings * 0.01;
    const netWinnings = grossWinnings - commission;
    
    // Find the user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Add winnings to user balance
    user.balance += netWinnings;
    await user.save({ session });

    // Mark participant as claimed
    await Bet.updateOne(
      { _id: bet._id, 'participants.user': userId },
      { $set: { 'participants.$.claimed': true } },
      { session }
    );

    // Create transaction record for the winnings
    const winTransaction = new Transaction({
      user: userId,
      type: 'win',
      amount: netWinnings,
      currency: 'ETH', // Default currency
      status: 'completed',
      betId: bet._id,
      description: `Winnings from bet on ${bet.winner === 1 ? bet.contestant1.name : bet.contestant2.name} in ${bet.tournamentName}: ${bet.matchName}`
    });

    await winTransaction.save({ session });
    
    // Create transaction record for the commission (optional, for accounting)
    const commissionTransaction = new Transaction({
      user: userId,
      type: 'commission',
      amount: commission,
      currency: 'ETH',
      status: 'completed',
      betId: bet._id,
      description: `Commission fee (1%) on winnings from bet: ${bet.tournamentName}: ${bet.matchName}`
    });
    
    await commissionTransaction.save({ session });

    await session.commitTransaction();
    return {
      success: true,
      grossWinnings,
      commission,
      netWinnings,
      newBalance: user.balance
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
/**
 * Report a dispute for a bet
 */
const reportDispute = async (betId, reason, userId) => {
  // Check if bet exists
  const bet = await Bet.findById(betId);
  if (!bet) {
    throw new AppError('Bet not found', 404);
  }

  // Check if user participated in this bet
  const participated = bet.participants.some(
    p => p.user.toString() === userId.toString()
  );

  if (!participated && bet.creator.toString() !== userId.toString()) {
    throw new AppError('You must be a participant or creator of this bet to report a dispute', 400);
  }

  // Update bet with dispute
  bet.disputed = true;
  bet.disputeReason = reason;
  bet.status = 'disputed';
  
  await bet.save();
  
  return bet;
};

/**
 * Get active bets
 */
const getActiveBets = async (limit = 20, offset = 0) => {
  return await Bet.find({ status: { $in: ['open', 'in_progress'] } })
    .populate('creator', 'username')
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: -1 });
};

/**
 * Cancel a bet (admin only)
 */
// Modify in src/services/betting/index.js

/**
 * Cancel a bet (admin or system)
 */


/**
 * Update bet status
 */
const updateBetStatus = async (betId, status, winner) => {
  // Validate status
  if (!['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Find the bet
  const bet = await Bet.findById(betId);
  if (!bet) {
    throw new AppError('Bet not found', 404);
  }

  // Update status
  bet.status = status;
  
  // If status is 'completed', set winner
  if (status === 'completed') {
    if (winner !== 0 && winner !== 1 && winner !== 2) {
      throw new AppError('Winner must be 0 (draw/cancelled), 1 (contestant 1), or 2 (contestant 2)', 400);
    }
    
    bet.winner = winner;
    bet.resultDeterminedAt = new Date();
  }

  await bet.save();
  return bet;
};

module.exports = {
  createBet,
  placeBet,
  getBetById,
  getBetsByTournament,
  getUserCreatedBets,
  getUserParticipatedBets,
  claimWinnings,
  reportDispute,
  getActiveBets,
  updateBetStatus
};