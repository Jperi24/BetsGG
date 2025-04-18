// src/services/betting/custom-odds.js
const mongoose = require('mongoose');
const Bet = require('../../models/Bet');
const User = require('../../models/User');
const Transaction = require('../../models/Transactions');
const { AppError } = require('../../middleware/error');
const notificationService = require('../notification');

/**
 * Create a new bet offer
 * @param {string} betId - ID of the bet
 * @param {string} userId - ID of the user creating the offer
 * @param {number} prediction - 1 for contestant1, 2 for contestant2
 * @param {number} amount - Amount to bet
 * @param {Object} odds - Odds object with numerator and denominator
 * @returns {Object} - Updated bet
 */
const createBetOffer = async (betId, userId, prediction, amount, odds) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Verify bet is still open
    if (bet.status !== 'open') {
      throw new AppError('This bet is no longer accepting offers', 400);
    }

    // Validate prediction
    if (prediction !== 1 && prediction !== 2) {
      throw new AppError('Prediction must be 1 (contestant 1) or 2 (contestant 2)', 400);
    }

    // Check user balance
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.balance < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Validate odds
    if (!odds.numerator || !odds.denominator || odds.numerator <= 0 || odds.denominator <= 0) {
      throw new AppError('Invalid odds format. Must provide positive numerator and denominator values.', 400);
    }

    // Deduct amount from user balance
    user.balance -= amount;
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'bet',
      amount: amount,
      currency: 'ETH',
      status: 'completed',
      betId: bet._id,
      description: `Bet offer on ${prediction === 1 ? bet.contestant1.name : bet.contestant2.name} with odds ${odds.numerator}:${odds.denominator}`
    });

    await transaction.save({ session });

    // Add bet offer
    bet.betOffers.push({
      user: userId,
      prediction: prediction,
      amount: amount,
      odds: {
        numerator: odds.numerator,
        denominator: odds.denominator
      },
      remainingAmount: amount,
      matches: []
    });

    // Add to the display pools (for UI purposes only)
    bet.totalPool += amount;
    if (prediction === 1) {
      bet.contestant1Pool += amount;
    } else {
      bet.contestant2Pool += amount;
    }

    await bet.save({ session });

    // Add bet to user's participated bets array (for backward compatibility)
    await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          participatedBets: bet._id,
          deployedBets: bet._id  // Also add to deployed bets if it's their own offer
        } 
      },
      { session }
    );

    // Send notification
    await notificationService.notifyBetCreated(userId, bet);

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
 * Accept an existing bet offer
 * @param {string} betId - ID of the bet
 * @param {string} offerId - ID of the offer to accept
 * @param {string} userId - ID of the user accepting the offer
 * @param {number} acceptAmount - Amount to accept from the offer
 * @returns {Object} - Updated bet
 */
const acceptBetOffer = async (betId, offerId, userId, acceptAmount) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Verify bet is still open
    if (bet.status !== 'open') {
      throw new AppError('This bet is no longer accepting offers', 400);
    }

    // Find the offer
    const offerIndex = bet.betOffers.findIndex(o => o._id.toString() === offerId);
    if (offerIndex === -1) {
      throw new AppError('Bet offer not found', 404);
    }

    const offer = bet.betOffers[offerIndex];

    // Check if offer has enough remaining
    if (offer.remainingAmount < acceptAmount) {
      throw new AppError(`Only ${offer.remainingAmount} ETH available from this offer`, 400);
    }

    // Calculate the counter amount based on odds
    const counterAmount = (acceptAmount * offer.odds.denominator) / offer.odds.numerator;

    // Check user balance
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.balance < counterAmount) {
      throw new AppError('Insufficient balance', 400);
    }

    // Cannot accept your own offer
    if (offer.user.toString() === userId.toString()) {
      throw new AppError('Cannot accept your own bet offer', 400);
    }

    // Determine which side the user is betting on (opposite of the offer)
    const acceptPrediction = offer.prediction === 1 ? 2 : 1;

    // Deduct amount from user balance
    user.balance -= counterAmount;
    await user.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'bet',
      amount: counterAmount,
      currency: 'ETH',
      status: 'completed',
      betId: bet._id,
      description: `Accepted bet on ${acceptPrediction === 1 ? bet.contestant1.name : bet.contestant2.name} against offer with odds ${offer.odds.numerator}:${offer.odds.denominator}`
    });

    await transaction.save({ session });

    // Update the offer
    offer.remainingAmount -= acceptAmount;
    offer.matches.push({
      user: userId,
      amount: acceptAmount,
      counterAmount: counterAmount,
      timestamp: new Date()
    });

    // Update the main bet pools (for UI display)
    bet.totalPool += counterAmount;
    if (acceptPrediction === 1) {
      bet.contestant1Pool += counterAmount;
    } else {
      bet.contestant2Pool += counterAmount;
    }

    // Also add to participants array (for backward compatibility)
    bet.participants.push({
      user: userId,
      prediction: acceptPrediction,
      amount: counterAmount,
      timestamp: new Date()
    });

    await bet.save({ session });

    // Add bet to user's participated bets
    await User.findByIdAndUpdate(
      userId,
      { $push: { participatedBets: bet._id } },
      { session }
    );

    // Send notifications
    await notificationService.notifyBetAccepted(userId, bet, counterAmount, acceptPrediction);
    
    // Also notify the creator of the bet if it's not the current user
    if (bet.creator && !bet.creator.equals(userId)) {
      await notificationService.notifyCreatorOfAcceptance(bet.creator, bet, counterAmount, {
        username: user.username
      });
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

/**
 * Claim winnings for a user on a completed bet
 * @param {string} betId - ID of the bet
 * @param {string} userId - ID of the user claiming winnings
 * @returns {Object} - Result of claiming winnings
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

    // Find the user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has already claimed all their winnings
    const userBets = bet.getUserBets(userId);
    
    if (userBets.length === 0) {
      throw new AppError('You did not participate in this bet', 400);
    }
    
    const allClaimed = userBets.every(userBet => userBet.claimed);
    
    if (allClaimed) {
      throw new AppError('You have already claimed all your winnings for this bet', 400);
    }

    // Calculate winnings
    let totalWinnings = 0;
    let modifiedOffers = false;
    
    // Process offers created by user
    for (let i = 0; i < bet.betOffers.length; i++) {
      const offer = bet.betOffers[i];
      
      if (offer.user.toString() === userId.toString() && !offer.claimed) {
        // Return unmatched amount regardless of outcome
        totalWinnings += offer.remainingAmount;
        
        // If user's prediction matches winner
        if (offer.prediction === bet.winner) {
          // Calculate winnings from each match
          offer.matches.forEach(match => {
            totalWinnings += match.amount + match.counterAmount;
          });
        }
        
        // Mark offer as claimed
        bet.betOffers[i].claimed = true;
        modifiedOffers = true;
      }
    }
    
    // Process offers accepted by user
    for (let i = 0; i < bet.betOffers.length; i++) {
      const offer = bet.betOffers[i];
      
      for (let j = 0; j < offer.matches.length; j++) {
        const match = offer.matches[j];
        
        if (match.user.toString() === userId.toString() && !match.claimed) {
          // User accepted this offer (bet on the opposite side)
          const userPrediction = offer.prediction === 1 ? 2 : 1;
          
          if (userPrediction === bet.winner) {
            totalWinnings += match.amount + match.counterAmount;
          }
          
          // Mark match as claimed
          bet.betOffers[i].matches[j].claimed = true;
          modifiedOffers = true;
        }
      }
    }
    
    if (totalWinnings === 0) {
      throw new AppError('You have no winnings to claim for this bet', 400);
    }
    
    // Apply platform commission (1%)
    const commission = totalWinnings * 0.01;
    const netWinnings = totalWinnings - commission;
    
    // Add winnings to user balance
    user.balance += netWinnings;
    await user.save({ session });
    
    // Save bet if modified
    if (modifiedOffers) {
      await bet.save({ session });
    }
    
    // Create transaction record for the winnings
    const winTransaction = new Transaction({
      user: userId,
      type: 'win',
      amount: netWinnings,
      currency: 'ETH',
      status: 'completed',
      betId: bet._id,
      description: `Winnings from bet on ${bet.winner === 1 ? bet.contestant1.name : bet.contestant2.name} in ${bet.tournamentName}: ${bet.matchName}`
    });
    
    await winTransaction.save({ session });
    
    // Create transaction record for the commission
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
    
    // Also update participants array for backward compatibility
    if (bet.participants && bet.participants.length > 0) {
      for (let i = 0; i < bet.participants.length; i++) {
        if (bet.participants[i].user.toString() === userId.toString()) {
          bet.participants[i].claimed = true;
        }
      }
      await bet.save({ session });
    }
    
    await session.commitTransaction();
    
    // Send notification
    await notificationService.notifyBetWin(userId, bet, totalWinnings, netWinnings);
    
    return {
      success: true,
      grossWinnings: totalWinnings,
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
 * Cancel an unmatched bet offer
 * @param {string} betId - ID of the bet
 * @param {string} offerId - ID of the offer
 * @param {string} userId - ID of the user cancelling the offer
 * @returns {Object} - Updated bet
 */
const cancelBetOffer = async (betId, offerId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the bet
    const bet = await Bet.findById(betId).session(session);
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }

    // Verify bet is still open
    if (bet.status !== 'open') {
      throw new AppError('This bet is no longer open for modifications', 400);
    }

    // Find the offer
    const offerIndex = bet.betOffers.findIndex(o => o._id.toString() === offerId);
    if (offerIndex === -1) {
      throw new AppError('Bet offer not found', 404);
    }

    const offer = bet.betOffers[offerIndex];

    // Check if user owns the offer
    if (offer.user.toString() !== userId.toString()) {
      throw new AppError('You can only cancel your own bet offers', 403);
    }

    // Check if there's any remaining amount to cancel
    if (offer.remainingAmount <= 0) {
      throw new AppError('This offer is fully matched and cannot be cancelled', 400);
    }

    // Find user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Return the remaining funds to user
    const refundAmount = offer.remainingAmount;
    user.balance += refundAmount;
    await user.save({ session });

    // Create refund transaction
    const transaction = new Transaction({
      user: userId,
      type: 'refund',
      amount: refundAmount,
      currency: 'ETH',
      status: 'completed',
      betId: bet._id,
      description: `Refund from cancelled bet offer on ${bet.matchName}`
    });

    await transaction.save({ session });

    // Update bet display pools
    bet.totalPool -= refundAmount;
    if (offer.prediction === 1) {
      bet.contestant1Pool -= refundAmount;
    } else {
      bet.contestant2Pool -= refundAmount;
    }

    // Zero out the remaining amount on the offer (keep it for record)
    bet.betOffers[offerIndex].remainingAmount = 0;

    await bet.save({ session });

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
 * Get all active bet offers for a specific bet
 * @param {string} betId - ID of the bet
 * @returns {Array} - List of active offers
 */
const getActiveBetOffers = async (betId) => {
  try {
    const bet = await Bet.findById(betId)
      .populate('betOffers.user', 'username')
      .exec();
    
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }
    
    const activeOffers = [];
    
    bet.betOffers.forEach(offer => {
      if (offer.remainingAmount > 0) {
        activeOffers.push({
          id: offer._id,
          user: {
            id: offer.user._id,
            username: offer.user.username
          },
          prediction: offer.prediction,
          contestant: offer.prediction === 1 ? bet.contestant1.name : bet.contestant2.name,
          amount: offer.remainingAmount,
          odds: {
            numerator: offer.odds.numerator,
            denominator: offer.odds.denominator,
            display: `${offer.odds.numerator}:${offer.odds.denominator}`
          },
          timestamp: offer.timestamp
        });
      }
    });
    
    return activeOffers;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all of a user's bets (both offers and acceptances) for a specific bet
 * @param {string} betId - ID of the bet
 * @param {string} userId - ID of the user
 * @returns {Array} - List of user's bets
 */
const getUserBetsOnMatch = async (betId, userId) => {
  try {
    const bet = await Bet.findById(betId);
    
    if (!bet) {
      throw new AppError('Bet not found', 404);
    }
    
    return bet.getUserBets(userId);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBetOffer,
  acceptBetOffer,
  claimWinnings,
  cancelBetOffer,
  getActiveBetOffers,
  getUserBetsOnMatch}