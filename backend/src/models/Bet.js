// src/models/Bet.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
betSchema.index({ 'participants.user': 1 });
betSchema.index({ tournamentId: 1, status: 1 });

// Virtual for total number of participants
betSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for odds calculation
betSchema.virtual('contestant1Odds').get(function() {
  if (this.contestant1Pool === 0) return 0;
  return parseFloat((this.totalPool / this.contestant1Pool).toFixed(2));
});

betSchema.virtual('contestant2Odds').get(function() {
  if (this.contestant2Pool === 0) return 0;
  return parseFloat((this.totalPool / this.contestant2Pool).toFixed(2));
});

// Method to check if a user has participated
betSchema.methods.hasUserParticipated = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Method to get a user's bet
betSchema.methods.getUserBet = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

// Method to calculate potential winnings
betSchema.methods.calculatePotentialWinnings = function(userId) {
  const userBet = this.getUserBet(userId);
  if (!userBet) return 0;
  
  const pool = userBet.prediction === 1 ? this.contestant1Pool : this.contestant2Pool;
  const totalPool = this.totalPool;
  
  if (pool === 0) return 0;
  
  // Formula: (bet amount / contestant pool) * total pool
  return (userBet.amount / pool) * totalPool;
};

// Method to check if bet is active
betSchema.methods.isActive = function() {
  return ['open', 'in_progress'].includes(this.status);
};

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;