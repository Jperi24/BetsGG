// src/api/auth/routes.js - Updated with security endpoints
const express = require('express');
const router = express.Router();
const authController = require('./controller');
const securityController = require('./security-controller');
const sessionController = require('./session-controller');
const { protect, require2FAVerified } = require('../../middleware/auth');
const { validateRegister, validateLogin, validatePassword, validateWallet, validateRequest, validateUpdatePassword } = require('../../middleware/validation');
const { body } = require('express-validator');
const passport = require('passport');

// Google authentication routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google-auth-failed' }),
  authController.googleAuthCallback
);

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/verify-2fa', 
  [
    body('token')
      .isString()
      .notEmpty()
      .withMessage('Token is required'),
    body('code')
      .isString()
      .notEmpty()
      .withMessage('Verification code is required'),
    body('isRecoveryCode')
      .optional()
      .isBoolean(),
    validateRequest
  ],
  authController.verifyTwoFactor
);

router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    validateRequest
  ],
  authController.forgotPassword
);
router.post('/reset-password/:token', validatePassword, authController.resetPassword);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware require authentication

// Auth status and CSRF token endpoints
router.get('/status', securityController.verifyAuthStatus);
router.get('/csrf-token', securityController.refreshCsrfToken);

// User information
router.get('/me', authController.getMe);

// Password management
router.patch('/update-password', validateUpdatePassword, authController.updatePassword);

// Wallet management
router.post('/link-wallet', validateWallet, authController.linkWallet);

// Session management
router.get('/sessions', sessionController.getActiveSessions);
router.delete('/sessions/:sessionId', require2FAVerified, sessionController.terminateSession);
router.delete('/sessions', require2FAVerified, sessionController.terminateAllOtherSessions);

// Logout
router.post('/logout', authController.logout);

// 2FA management
router.get('/2fa/status', authController.getTwoFactorStatus);
router.post('/2fa/setup', authController.setupTwoFactor);
router.post('/2fa/verify', authController.verifyAndEnableTwoFactor);
router.post('/2fa/disable', require2FAVerified, authController.disableTwoFactor);
router.get('/2fa/recovery-codes', require2FAVerified, authController.getRecoveryCodes);
router.post('/2fa/recovery-codes',
  [
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Current password is required'),
    validateRequest
  ],
  require2FAVerified,
  authController.regenerateRecoveryCodes
);

module.exports = router;