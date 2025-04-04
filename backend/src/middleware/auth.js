// src/middleware/auth.js - Updated for cookie-based auth
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./error');
const sessionService = require('../services/auth/session');
const notificationService = require('../services/notification');

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token from HTTP-only cookie and adds user to request
 */
// In backend/src/middleware/auth.js
exports.protect = async (req, res, next) => {
  console.log('=== AUTH DEBUG ===');
  console.log('Request path:', req.originalUrl);
  console.log('Auth cookies:', {
    authToken: req.cookies.auth_token ? 'Present' : 'Missing',
    sessionId: req.cookies.session_id ? 'Present' : 'Missing'
  });
  
  try {
    // 1) Get token from cookies
    const token = req.cookies.auth_token;

    if (!token) {
      console.log('No auth token found in cookies');
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 2) Verify token
    console.log('Verifying JWT token...');
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { 
      userId: decoded.id,
      tokenVersion: decoded.tokenVersion,
      pending2FA: decoded.pending2FA || false
    });

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      console.log('User not found in database');
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if token version matches current user's version
    if (decoded.tokenVersion !== currentUser.tokenVersion) {
      console.log('Token version mismatch', { 
        tokenVersion: decoded.tokenVersion, 
        userTokenVersion: currentUser.tokenVersion 
      });
      return res.status(401).json({
        status: 'fail',
        message: 'Token is no longer valid. Please log in again.'
      });
    }

    // Log user details
    console.log('User authenticated:', {
      userId: currentUser.id,
      role: currentUser.role
    });

    // 4) Check if this is a temporary token waiting for 2FA
    if (decoded.pending2FA) {
      console.log('Token has pending2FA flag');
      // Only allow access to the 2FA verification route
      if (req.originalUrl !== '/api/auth/verify-2fa') {
        return res.status(401).json({
          status: 'fail',
          message: 'Two-factor authentication required. Please verify your identity.'
        });
      }
    }

    // 5) Check if session is valid
    const sessionId = req.cookies.session_id;
    if (sessionId) {
      console.log('Checking session validity...');
      const session = await sessionService.getSession(sessionId);
      console.log('Session found:', !!session);
      
      if (!session || session.userId !== currentUser.id.toString()) {
        console.log('Invalid session');
        // Invalid session, clear cookies
        res.clearCookie('auth_token');
        res.clearCookie('session_id');
        res.clearCookie('csrf_token');
        
        return res.status(401).json({
          status: 'fail',
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      // Attach session to request
      req.session = session;
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    console.log('Auth middleware passed successfully');
    console.log('=== END AUTH DEBUG ===');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
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
    // First check if user exists and is authenticated
    if (!req.user) {
      console.error('restrictTo middleware: req.user is undefined');
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please log in.'
      });
    }

    // Debug log to see what's happening
    console.log(`Authorization check - User role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
    
    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed - User role ${req.user.role} not in allowed roles: ${roles.join(', ')}`);
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }

    // Authorization passed
    console.log('Authorization successful');
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
    
    // Get token from cookie
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if it's a temporary token
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