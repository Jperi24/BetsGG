// src/api/bets/controller.js
const bettingService = require('../../services/betting');

/**
 * Create a new bet
 */
exports.createBet = async (req, res, next) => {
  try {
    const betData = req.body;
    const bet = await bettingService.createBet(betData, req.user.id);
    
    res.status(201).json({
      status: 'success',
      data: {
        bet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Place a bet
 */
exports.placeBet = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { prediction, amount } = req.body;
    
    const bet = await bettingService.placeBet(
      betId,
      prediction,
      amount,
      req.user.id
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        bet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bet by ID
 */
exports.getBetById = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const bet = await bettingService.getBetById(betId);
    
    if (!bet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Bet not found'
      });
    }
    
      // Check if user has participated in this bet
    let userParticipation = null;
    if (req.user) {
      userParticipation = bet.participants.find(p => {
        // Handle both populated and unpopulated user references
        const participantUserId = p.user._id ? p.user._id.toString() : p.user.toString();
        return participantUserId === req.user.id.toString();
      });
      
      console.log("Found participation:", !!userParticipation);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        bet,
        userParticipation: userParticipation ? {
          prediction: userParticipation.prediction,
          amount: userParticipation.amount,
          claimed: userParticipation.claimed
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bets by tournament
 */
// Update to the getBetsByTournament controller function
exports.getBetsByTournament = async (req, res, next) => {
  try {
    const { tournamentSlug } = req.params;
    const { status } = req.query;
    
    console.log(`Getting bets for tournament: ${tournamentSlug}, status: ${status || 'all'}`);
    
    const bets = await bettingService.getBetsByTournament(tournamentSlug, status);
    
    res.status(200).json({
      status: 'success',
      results: bets.length,
      data: {
        bets
      }
    });
  } catch (error) {
    console.error(`Error in getBetsByTournament: ${error.message}`);
    next(error);
  }
};

/**
 * Get user's created bets
 */
exports.getUserCreatedBets = async (req, res, next) => {
  try {
    const bets = await bettingService.getUserCreatedBets(req.user.id);
    
    res.status(200).json({
      status: 'success',
      results: bets.length,
      data: {
        bets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's participated bets
 */
exports.getUserParticipatedBets = async (req, res, next) => {
  try {
    const bets = await bettingService.getUserParticipatedBets(req.user.id);
    
    res.status(200).json({
      status: 'success',
      results: bets.length,
      data: {
        bets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Claim winnings
 */
exports.claimWinnings = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const result = await bettingService.claimWinnings(betId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Report a dispute
 */
exports.reportDispute = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { reason } = req.body;
    
    const bet = await bettingService.reportDispute(betId, reason, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        bet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active bets
 */
exports.getActiveBets = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const bets = await bettingService.getActiveBets(limit, offset);
    
    res.status(200).json({
      status: 'success',
      results: bets.length,
      data: {
        bets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a bet (admin only)
 */
exports.cancelBet = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { reason } = req.body;
    
    const bet = await bettingService.cancelBet(betId, reason, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        bet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bet status (for automatic updates)
 */
exports.updateBetStatus = async (req, res, next) => {
  try {
    const { betId } = req.params;
    const { status, winner } = req.body;
    
    const bet = await bettingService.updateBetStatus(betId, status, winner);
    
    res.status(200).json({
      status: 'success',
      data: {
        bet
      }
    });
  } catch (error) {
    next(error);
  }
};