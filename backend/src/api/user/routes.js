// src/api/user/routes.js
const express = require('express');
const router = express.Router();
const userController = require('./controller');
const { protect } = require('../../middleware/auth');
const { body } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// All user routes require authentication
router.use(protect);

// Update profile
router.patch(
  '/profile',
  [
    body('username')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('currentPassword')
      .isString()
      .notEmpty()
      .withMessage('Current password is required'),
    validateRequest
  ],
  userController.updateProfile
);

// Export user data
router.get('/export-data', userController.exportUserData);

// Delete account
router.delete(
  '/account',
  [
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required to delete your account'),
    validateRequest
  ],
  userController.deleteAccount
);

module.exports = router;