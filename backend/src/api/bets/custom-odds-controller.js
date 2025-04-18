// src/api/bets/custom-odds-controller.js
const bettingService = require('../../services/betting/custom-odds');
const { AppError } = require('../../middleware/error');

/**
 * Create a new bet offer
 */
exports.createBetOffer = async (req, res, next) => {
  try {
    const { betId, prediction, amount, odds } = req.body;
    
    if (!betId || !prediction || !amount || !odds) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required parameters'
      });
    }
    
    // Validate odds format
    if (!odds.numerator || !odds.denominator) {
      return res.status(400).json({
        status: 'fail',
        message: 'Odds must include numerator and denominator'
      });
    }
    
    const bet = await bettingService.createBetOffer(
      betId, 
      req.user.id, 
      prediction, 
      parseFloat(amount), 
      {
        numerator: parseInt(odds.numerator),
        denominator: parseInt(odds.denominator)
      }
    );
    
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
 * Accept an existing bet offer
 */
exports.acceptBetOffer = async (req, res, next) => {
  try {
    const { betId, offerId, acceptAmount } = req.body;
    
    if (!betId || !offerId || !acceptAmount) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required parameters'
      });
    }
    
    const bet = await bettingService.acceptBetOffer(
      betId,
      offerId,
      req.user.id,
      parseFloat(acceptAmount)
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
 * Claim winnings for a completed bet
 */
exports.claimBetWinnings = async (req, res, next) => {
  try {
    const { betId } = req.params;
    
    if (!betId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bet ID is required'
      });
    }
    
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
 * Cancel an unmatched bet offer
 */
exports.cancelBetOffer = async (req, res, next) => {
  try {
    const { betId, offerId } = req.params;
    
    if (!betId || !offerId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bet ID and Offer ID are required'
      });
    }
    
    const bet = await bettingService.cancelBetOffer(betId, offerId, req.user.id);
    
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
 * Get all active bet offers for a specific bet
 */
exports.getBetOffers = async (req, res, next) => {
  try {
    const { betId } = req.params;
    
    if (!betId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bet ID is required'
      });
    }
    
    const offers = await bettingService.getActiveBetOffers(betId);
    
    res.status(200).json({
      status: 'success',
      results: offers.length,
      data: {
        offers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all of a user's bets for a specific match
 */
exports.getUserBets = async (req, res, next) => {
  try {
    const { betId } = req.params;
    
    if (!betId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bet ID is required'
      });
    }
    
    const userBets = await bettingService.getUserBetsOnMatch(betId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      results: userBets.length,
      data: {
        bets: userBets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific bet with offers and user participation
 */
exports.getBetWithOffers = async (req, res, next) => {
  try {
    const { betId } = req.params;
    
    if (!betId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Bet ID is required'
      });
    }
    
    // Get the bet
    const bet = await Bet.findById(betId)
      .populate('creator', 'username')
      .populate('betOffers.user', 'username')
      .populate('betOffers.matches.user', 'username');
    
    if (!bet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Bet not found'
      });
    }
    
    // Get active offers
    const activeOffers = await bettingService.getActiveBetOffers(betId);
    
    // Get user's participation if authenticated
    let userBets = [];
    let potentialWinnings = 0;
    
    if (req.user) {
      userBets = await bettingService.getUserBetsOnMatch(betId, req.user.id);
      
      // Calculate potential winnings
      potentialWinnings = bet.calculatePotentialWinnings(req.user.id);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        bet,
        activeOffers,
        userParticipation: userBets.length > 0 ? {
          bets: userBets,
          potentialWinnings
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};