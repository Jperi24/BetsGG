// src/models/Transaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet', 'win', 'refund'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['ETH', 'BASE', 'SOL', 'USDC'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  txHash: {
    type: String,
    sparse: true, // Allow null/undefined values
    index: true
  },
  walletAddress: {
    type: String,
    required: function() {
      return this.type === 'deposit' || this.type === 'withdrawal';
    }
  },
  betId: {
    type: Schema.Types.ObjectId,
    ref: 'Bet',
    required: function() {
      return this.type === 'bet' || this.type === 'win' || this.type === 'refund';
    },
    index: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  network: {
    type: String,
    enum: ['ethereum', 'base', 'solana'],
    required: function() {
      return this.type === 'deposit' || this.type === 'withdrawal';
    }
  },
  fee: {
    type: Number,
    default: 0
  }
});

// Automatically update the updatedAt field
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;