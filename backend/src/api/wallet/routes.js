// src/api/wallet/routes.js
const express = require('express');
const router = express.Router();
const walletController = require('./controller');
const { protect, restrictTo } = require('../../middleware/auth');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// All wallet routes require authentication
router.use(protect);

// User routes
router.get('/balance', walletController.getBalance);

router.get(
  '/transactions',
  [
    query('type').optional().isIn(['deposit', 'withdrawal', 'bet', 'win', 'refund']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    validateRequest
  ],
  walletController.getTransactions
);

router.post(
  '/deposit',
  [
    body('amount')
      .isFloat({ min: 0.0001 })
      .withMessage('Amount must be at least 0.0001'),
    body('currency')
      .isIn(['ETH', 'BASE', 'SOL', 'USDC'])
      .withMessage('Invalid currency'),
    body('walletAddress')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required'),
    body('network')
      .isIn(['ethereum', 'base', 'solana'])
      .withMessage('Invalid network'),
    validateRequest
  ],
  walletController.createDeposit
);

router.post(
  '/withdraw',
  [
    body('amount')
      .isFloat({ min: 0.0001 })
      .withMessage('Amount must be at least 0.0001'),
    body('currency')
      .isIn(['ETH', 'BASE', 'SOL', 'USDC'])
      .withMessage('Invalid currency'),
    body('walletAddress')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required'),
    body('network')
      .isIn(['ethereum', 'base', 'solana'])
      .withMessage('Invalid network'),
    validateRequest
  ],
  walletController.createWithdrawal
);

// Webhook route for processing deposits (would be secured differently in production)
// This would typically verify a signature or API key from the blockchain provider
router.post(
  '/webhooks/deposit',
  [
    body('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    body('txHash')
      .isString()
      .trim()
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash'),
    validateRequest
  ],
  walletController.processDeposit
);

// Admin routes
router.use(restrictTo('admin'));

router.get('/admin/withdrawals/pending', walletController.getPendingWithdrawals);

router.post(
  '/admin/withdrawals/:transactionId/process',
  [
    param('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    validateRequest
  ],
  walletController.processWithdrawal
);

module.exports = router;