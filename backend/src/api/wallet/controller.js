// src/api/wallet/controller.js
const walletService = require('../../services/wallet');

/**
 * Get user's balance
 */
exports.getBalance = async (req, res, next) => {
  try {
    const balance = await walletService.getUserBalance(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        balance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's transaction history
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const { type } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    
    const { transactions, total } = await walletService.getUserTransactions(
      req.user.id,
      type,
      limit,
      skip
    );
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      total,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a deposit transaction
 */
exports.createDeposit = async (req, res, next) => {
  try {
    const { amount, currency, walletAddress, network } = req.body;
    
    const transaction = await walletService.createDepositTransaction(
      req.user.id,
      amount,
      currency,
      walletAddress,
      network
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a withdrawal transaction
 */
exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, currency, walletAddress, network } = req.body;
    
    const { transaction, newBalance } = await walletService.createWithdrawalTransaction(
      req.user.id,
      amount,
      currency,
      walletAddress,
      network
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        transaction,
        newBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a deposit (webhook handler)
 */
exports.processDeposit = async (req, res, next) => {
  try {
    const { transactionId, txHash } = req.body;
    
    const result = await walletService.processDeposit(transactionId, txHash);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a withdrawal (admin only)
 */
exports.processWithdrawal = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await walletService.processWithdrawal(transactionId);
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending withdrawals (admin only)
 */
exports.getPendingWithdrawals = async (req, res, next) => {
  try {
    const Transaction = require('../../models/Transaction');
    
    const transactions = await Transaction.find({
      type: 'withdrawal',
      status: 'pending'
    }).populate('user', 'username email');
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};


const settingsController = require('./settings-controller');

// Add these to the exports:
// Wallet settings
exports.getWalletSettings = settingsController.getWalletSettings;
exports.addWalletAddress = settingsController.addWalletAddress;
exports.removeWalletAddress = settingsController.removeWalletAddress;
exports.updateTransactionPreferences = settingsController.updateTransactionPreferences;
