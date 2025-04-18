// src/models/Bet.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define BetOffer schema for nested use
const betOfferSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prediction: {
    type: Number, // 1 for contestant1, 2 for contestant2
    required: true,
    enum: [1, 2]
  },
  amount: {
    type: Number,
    required: true,
    min: 0.0001
  },
  odds: {
    numerator: {
      type: Number,
      required: true,
      min: 1
    },
    denominator: {
      type: Number,
      required: true,
      min: 1
    }
  },
  remainingAmount: {
    type: Number,
    min: 0
  },
  matches: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number, // Amount from the original offer being matched
    counterAmount: Number, // Amount the matcher is putting up
    timestamp: {
      type: Date,
      default: Date.now
    },
    claimed: {
      type: Boolean,
      default: false
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  claimed: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const betSchema = new Schema({
  tournamentId: {
    type: String,
    required: true,
    index: true
  },
  tournamentSlug: {
    type: String,
    required: true
  },
  tournamentName: {
    type: String,
    required: true
  },
  eventId: {
    type: String,
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  phaseId: {
    type: String,
    required: true
  },
  phaseName: {
    type: String,
    required: true
  },
  setId: {
    type: String,
    required: true
  },
  matchName: {
    type: String,
    required: true
  },
  contestant1: {
    id: String,
    name: {
      type: String,
      required: true
    }
  },
  contestant2: {
    id: String,
    name: {
      type: String,
      required: true
    }
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPool: {
    type: Number,
    default: 0
  },
  contestant1Pool: {
    type: Number,
    default: 0
  },
  contestant2Pool: {
    type: Number,
    default: 0
  },
  minimumBet: {
    type: Number,
    default: 0.001,
    min: 0.0001
  },
  maximumBet: {
    type: Number,
    default: 1,
    min: 0.001
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'open'
  },
  winner: {
    type: Number, // 1 for contestant1, 2 for contestant2, 0 for draw/cancelled
    default: null
  },
  cancelledBy: {
    type: Schema.Types.Mixed, // Can be userId or 'system'
  },
  cancelledAt: {
    type: Date
  },
  // Enhanced with bet offers and matches instead of simple participants
  betOffers: [betOfferSchema],
  
  // Keep old participants array for backward compatibility
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    prediction: {
      type: Number, // 1 for contestant1, 2 for contestant2
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.0001
    },
    claimed: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  resultDeterminedAt: {
    type: Date
  },
  disputed: {
    type: Boolean,
    default: false
  },
  disputeReason: {
    type: String
  }
});

// Indexes for querying
betSchema.index({ status: 1 });
betSchema.index({ creator: 1 });
betSchema.index({ 'betOffers.user': 1 });
betSchema.index({ 'betOffers.matches.user': 1 });
betSchema.index({ tournamentId: 1, status: 1 });

// Virtual for total number of participants
betSchema.virtual('participantCount').get(function() {
  // Count unique users from both bet offers and matches
  const offerUsers = this.betOffers.map(o => o.user.toString());
  
  const matchUsers = [];
  this.betOffers.forEach(offer => {
    offer.matches.forEach(match => {
      matchUsers.push(match.user.toString());
    });
  });
  
  // Combine and remove duplicates
  const allUsers = [...new Set([...offerUsers, ...matchUsers])];
  return allUsers.length;
});

// Virtual for active odds - get all available offers
betSchema.virtual('activeOffers').get(function() {
  return this.betOffers
    .filter(offer => offer.remainingAmount > 0)
    .map(offer => ({
      id: offer._id,
      user: offer.user,
      prediction: offer.prediction,
      contestant: offer.prediction === 1 ? this.contestant1.name : this.contestant2.name,
      amount: offer.remainingAmount,
      odds: `${offer.odds.numerator}:${offer.odds.denominator}`,
      timestamp: offer.timestamp
    }));
});

// Method to check if a user has participated
betSchema.methods.hasUserParticipated = function(userId) {
  // Check if user created any offers
  const createdOffers = this.betOffers.some(offer => 
    offer.user.toString() === userId.toString()
  );
  
  // Check if user accepted any offers
  const acceptedOffers = this.betOffers.some(offer => 
    offer.matches.some(match => match.user.toString() === userId.toString())
  );
  
  return createdOffers || acceptedOffers;
};

// Method to get all of a user's bets (both offers and acceptances)
betSchema.methods.getUserBets = function(userId) {
  const userBets = [];
  
  // Get offers created by the user
  this.betOffers.forEach(offer => {
    if (offer.user.toString() === userId.toString()) {
      userBets.push({
        type: 'offer',
        id: offer._id,
        prediction: offer.prediction,
        amount: offer.amount,
        remainingAmount: offer.remainingAmount,
        odds: offer.odds,
        claimed: offer.claimed,
        timestamp: offer.timestamp
      });
    }
  });
  
  // Get offers accepted by the user
  this.betOffers.forEach(offer => {
    offer.matches.forEach(match => {
      if (match.user.toString() === userId.toString()) {
        userBets.push({
          type: 'match',
          offerId: offer._id,
          matchId: match._id,
          prediction: offer.prediction === 1 ? 2 : 1, // Opposite of the offer prediction
          amount: match.counterAmount,
          odds: {
            numerator: offer.odds.denominator, // Reversed odds
            denominator: offer.odds.numerator
          },
          claimed: match.claimed,
          timestamp: match.timestamp
        });
      }
    });
  });
  
  return userBets;
};

// Method to calculate potential winnings for a user
betSchema.methods.calculatePotentialWinnings = function(userId) {
  let totalPotential = 0;
  
  // Calculate potential winnings for each offer created by the user
  this.betOffers.forEach(offer => {
    if (offer.user.toString() === userId.toString()) {
      // For matched portions
      offer.matches.forEach(match => {
        if (offer.prediction === 1) {
          // If user bet on contestant 1
          const potentialWin = (offer.odds.denominator / offer.odds.numerator) * match.amount;
          totalPotential += match.amount + potentialWin;
        } else {
          // If user bet on contestant 2
          const potentialWin = (offer.odds.denominator / offer.odds.numerator) * match.amount;
          totalPotential += match.amount + potentialWin;
        }
      });
      
      // Add unmatched amount (will be returned regardless of outcome)
      totalPotential += offer.remainingAmount;
    }
  });
  
  // Calculate potential winnings for each offer accepted by the user
  this.betOffers.forEach(offer => {
    offer.matches.forEach(match => {
      if (match.user.toString() === userId.toString()) {
        // User accepted this offer (bet on the opposite side)
        if (offer.prediction === 1) {
          // User bet on contestant 2
          const potentialWin = match.counterAmount + match.amount;
          totalPotential += potentialWin;
        } else {
          // User bet on contestant 1
          const potentialWin = match.counterAmount + match.amount;
          totalPotential += potentialWin;
        }
      }
    });
  });
  
  return totalPotential;
};

// Method to calculate actual winnings for a user
betSchema.methods.calculateActualWinnings = function(userId) {
  if (!this.winner || this.status !== 'completed') {
    return 0;
  }
  
  let totalWinnings = 0;
  
  // Calculate winnings for offers created by the user
  this.betOffers.forEach(offer => {
    if (offer.user.toString() === userId.toString()) {
      // Return unmatched amount regardless of outcome
      totalWinnings += offer.remainingAmount;
      
      // If user's prediction matches winner
      if (offer.prediction === this.winner) {
        // Calculate winnings from each match
        offer.matches.forEach(match => {
          totalWinnings += match.amount + match.counterAmount;
        });
      }
    }
  });
  
  // Calculate winnings for offers accepted by the user
  this.betOffers.forEach(offer => {
    offer.matches.forEach(match => {
      if (match.user.toString() === userId.toString()) {
        // User accepted this offer (bet on the opposite side)
        const userPrediction = offer.prediction === 1 ? 2 : 1;
        
        if (userPrediction === this.winner) {
          totalWinnings += match.amount + match.counterAmount;
        }
      }
    });
  });
  
  // Apply platform commission (1%)
  const commission = totalWinnings * 0.01;
  return totalWinnings - commission;
};

// Method to check if bet is active
betSchema.methods.isActive = function() {
  return ['open', 'in_progress'].includes(this.status);
};

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;