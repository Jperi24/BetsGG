// src/middleware/validation.js
const { validationResult, body } = require('express-validator');
const Web3 = require('web3');

// Helper for checking if a string is a valid Ethereum address
const isValidEthereumAddress = (address) => {
  const web3 = new Web3();
  return web3.utils.isAddress(address);
};

// Centralized validation error handler
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
exports.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  
  // Use the same enhanced password validation
  body('password')
    .isString()
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('Password must contain at least one special character'),
  
  exports.validateRequest
];

// User login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Please provide a password'),
  
  exports.validateRequest
];

// Password validation
exports.validatePassword = [
  body('password')
    .isString()
    .isLength({ min: 12 }) // Increase minimum length to 12
    .withMessage('Password must be at least 12 characters long')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('Password must contain at least one special character'),
  
  exports.validateRequest
];
// Wallet address validation
exports.validateWallet = [
  body('walletAddress')
    .isString()
    .trim()
    .custom(isValidEthereumAddress)
    .withMessage('Please provide a valid Ethereum wallet address'),
  
  exports.validateRequest
];

// Add this to your validation.js file
exports.validateUpdatePassword = [
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isString()
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('Password must contain at least one special character'),
  
  exports.validateRequest
];