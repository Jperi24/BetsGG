// src/middleware/auth.js (Updated)
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./error');

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token and adds user to request
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
   
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if token version matches current user's version
    if (decoded.tokenVersion !== currentUser.tokenVersion) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token is no longer valid. Please log in again.'
      });
    }

    // 4) Check if this is a temporary token waiting for 2FA
    if (decoded.pending2FA) {
      // Only allow access to the 2FA verification route
      if (req.originalUrl !== '/api/auth/verify-2fa') {
        return res.status(401).json({
          status: 'fail',
          message: 'Two-factor authentication required. Please verify your identity.'
        });
      }
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired. Please log in again.'
      });
    }
    
    next(error);
  }
};

/**
 * Restrict routes to specific user roles
 * @param {Array} roles - Array of allowed roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Require 2FA to be verified
 * Used for sensitive operations
 */
exports.require2FAVerified = async (req, res, next) => {
  try {
    // Get the user
    const user = await User.findById(req.user.id);
    
    // If 2FA is not enabled, proceed
    if (!user.twoFactorEnabled) {
      return next();
    }
    
    // If 2FA is enabled, check if the token is a full token (not a temporary one)
    const token = req.headers.authorization.split(' ')[1];
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    if (decoded.pending2FA) {
      return res.status(401).json({
        status: 'fail',
        message: 'Two-factor authentication required for this action'
      });
    }
    
    // Proceed if 2FA is verified
    next();
  } catch (error) {
    next(error);
  }
};