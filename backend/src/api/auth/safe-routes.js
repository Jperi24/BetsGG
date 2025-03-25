// src/api/auth/routes.js (Updated)
const express = require('express');
const router = express.Router();
const authController = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRegister, validateLogin, validatePassword, validateWallet, validateRequest,validateUpdatePassword } = require('../../middleware/validation');
const { body } = require('express-validator');

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
      .isBoolean()
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

router.patch('/update-password', protect, validateUpdatePassword, authController.updatePassword);
router.post('/link-wallet', validateWallet, authController.linkWallet);
router.post('/logout', protect, authController.logout);

// 2FA routes
router.get('/2fa/status', authController.getTwoFactorStatus);
router.post('/2fa/setup', authController.setupTwoFactor);
router.post('/2fa/verify', authController.verifyAndEnableTwoFactor);
router.post('/2fa/disable', authController.disableTwoFactor);
router.get('/2fa/recovery-codes', authController.getRecoveryCodes);
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