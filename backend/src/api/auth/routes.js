// src/api/auth/routes.js (Updated)
const express = require('express');
const router = express.Router();
const authController = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRegister, validateLogin, validatePassword, validateWallet } = require('../../middleware/validation');
const { body } = require('express-validator');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/verify-2fa', 
  [
    body('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('token')
      .isString()
      .notEmpty()
      .withMessage('Token is required')
  ],
  authController.verifyTwoFactor
);
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim()
  ],
  authController.forgotPassword
);
router.post('/reset-password/:token', validatePassword, authController.resetPassword);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware require authentication
router.get('/me', authController.getMe);
router.patch('/update-password', validatePassword, authController.updatePassword);
router.post('/link-wallet', validateWallet, authController.linkWallet);

// Two-factor authentication routes
router.post('/2fa/setup', authController.setupTwoFactor);
router.post('/2fa/verify',
  [
    body('token')
      .isString()
      .notEmpty()
      .withMessage('Verification code is required')
  ],
  authController.verifyAndEnableTwoFactor
);
router.post('/2fa/disable',
  [
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Current password is required')
  ],
  authController.disableTwoFactor
);
router.post('/2fa/recovery-codes',
  [
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Current password is required')
  ],
  authController.regenerateRecoveryCodes
);

module.exports = router;