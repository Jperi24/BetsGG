// src/middleware/cookie-auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./error');
const redis = require('../utils/redis');
const crypto = require('crypto');

/**
 * Sets JWT token as HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {Object} options - Cookie options
 */
exports.setTokenCookie = (res, token, options = {}) => {
  // Default cookie options - secure and HTTP-only
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: options.tempToken 
      ? 5 * 60 * 1000  // 5 minutes for temp 2FA tokens
      : 30 * 24 * 60 * 60 * 1000, // 30 days for regular tokens
    ...options
  };

  // Set auth token as HTTP-only cookie
  res.cookie('auth_token', token, cookieOptions);
  
  // Also set the session ID if provided
  if (options.sessionId) {
    res.cookie('session_id', options.sessionId, {
      ...cookieOptions,
      httpOnly: false // Session ID can be accessible to JS for better UX
    });
  }
};

/**
 * Clears auth cookies
 * @param {Object} res - Express response object
 */
exports.clearAuthCookies = (res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  });
  
  res.clearCookie('session_id', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  });
  
  res.clearCookie('csrf_token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  });
};

/**
 * Generates a CSRF token and stores it in Redis
 * @param {string} userId - User ID
 * @returns {string} - CSRF token
 */
exports.generateCsrfToken = async (userId) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  // Store in Redis with 24-hour expiry
  const key = `csrf:${userId}:${csrfToken}`;
  await redis.setAsync(key, '1', 'EX', 86400);
  
  return csrfToken;
};

/**
 * Sets CSRF token cookie
 * @param {Object} res - Express response object
 * @param {string} token - CSRF token
 */
exports.setCsrfCookie = (res, token) => {
  res.cookie('csrf_token', token, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

/**
 * Verify CSRF token
 * @param {string} userId - User ID
 * @param {string} token - CSRF token to verify
 * @returns {boolean} - Whether token is valid
 */
exports.verifyCsrfToken = async (userId, token) => {
  if (!userId || !token) return false;
  
  const key = `csrf:${userId}:${token}`;
  const exists = await redis.getAsync(key);
  
  return exists === '1';
};

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing methods
 */
exports.csrfProtection = async (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get CSRF token from header or request body
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  
  // Already authenticated routes will have user
  if (req.user && csrfToken) {
    const isValid = await exports.verifyCsrfToken(req.user.id, csrfToken);
    
    if (!isValid) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid or expired CSRF token'
      });
    }
    
    return next();
  }
  
  // For login/register routes, CSRF might not be available yet
  // We'll generate a new token after authentication
  next();
};