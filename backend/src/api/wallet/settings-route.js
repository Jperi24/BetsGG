// Add these routes to src/api/wallet/routes.js

// Wallet settings routes - all require authentication
router.get('/settings', walletController.getWalletSettings);

router.post(
  '/settings/address',
  [
    body('walletAddress')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required'),
    body('network')
      .optional()
      .isIn(['ethereum', 'base', 'solana'])
      .withMessage('Invalid network'),
    body('label')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Label cannot exceed 50 characters'),
    validateRequest
  ],
  walletController.addWalletAddress
);

router.delete(
  '/settings/address/:walletAddress',
  [
    param('walletAddress')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required'),
    validateRequest
  ],
  walletController.removeWalletAddress
);

router.patch(
  '/settings/preferences',
  [
    body('defaultCurrency')
      .optional()
      .isIn(['ETH', 'BASE', 'SOL', 'USDC'])
      .withMessage('Invalid currency'),
    body('defaultNetwork')
      .optional()
      .isIn(['ethereum', 'base', 'solana'])
      .withMessage('Invalid network'),
    body('autoWithdrawal')
      .optional()
      .isBoolean()
      .withMessage('Auto withdrawal must be a boolean'),
    body('withdrawalThreshold')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Withdrawal threshold must be a positive number'),
    body('gasPreference')
      .optional()
      .isIn(['low', 'standard', 'high'])
      .withMessage('Invalid gas preference'),
    validateRequest
  ],
  walletController.updateTransactionPreferences
);