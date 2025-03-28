// src/middleware/cookie-auth.js - Improved CSRF Protection
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
      : 7 * 24 * 60 * 60 * 1000, // 7 days for regular tokens (reduced from 30 days)
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
 * Generates a stronger CSRF token with more entropy
 * @param {string} userId - User ID
 * @returns {string} - CSRF token
 */
exports.generateCsrfToken = async (userId) => {
  // Use 64 bytes for stronger token
  const csrfToken = crypto.randomBytes(64).toString('hex');
  
  // Store in Redis with shorter expiry (8 hours instead of 24)
  const key = `csrf:${userId}:${csrfToken}`;
  await redis.setAsync(key, '1', 'EX', 28800); // 8 hours
  
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
    maxAge: 8 * 60 * 60 * 1000 // 8 hours (reduced from 24 hours)
  });
};

/**
 * Enhanced CSRF token verification
 * @param {string} userId - User ID
 * @param {string} token - CSRF token to verify
 * @returns {boolean} - Whether token is valid
 */
exports.verifyCsrfToken = async (userId, token) => {
  if (!userId || !token) return false;
  
  const key = `csrf:${userId}:${token}`;
  const exists = await redis.getAsync(key);
  
  if (exists === '1') {
    // Implement token rotation - after validation, invalidate the token
    // For strict single-use tokens, uncomment the line below
    // await redis.delAsync(key);
    return true;
  }
  
  return false;
};

/**
 * Improved CSRF protection middleware
 * Validates CSRF token for state-changing methods
 */
exports.csrfProtection = async (req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get CSRF token from header (preferred) or request body
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  
  // Authenticated routes will have user
  if (req.user && csrfToken) {
    const isValid = await exports.verifyCsrfToken(req.user.id, csrfToken);
    
    if (!isValid) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid or expired CSRF token'
      });
    }
    
    // Generate a new token for the response
    const newToken = await exports.generateCsrfToken(req.user.id);
    res.setHeader('X-CSRF-Token', newToken);
    exports.setCsrfCookie(res, newToken);
    
    return next();
  }
  
  // For login/register routes without existing auth
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && 
      (req.path === '/api/auth/login' || req.path === '/api/auth/register' || 
       req.path === '/api/auth/forgot-password' || req.path.startsWith('/api/auth/reset-password/'))) {
    // Allow these specific public endpoints
    return next();
  }
  
  return res.status(403).json({
    status: 'fail',
    message: 'CSRF protection: Token required for this operation'
  });
};

/**
 * Delete specific CSRF token after use
 * @param {string} userId - User ID
 * @param {string} token - CSRF token to delete
 */
exports.invalidateCsrfToken = async (userId, token) => {
  if (!userId || !token) return;
  
  const key = `csrf:${userId}:${token}`;
  await redis.delAsync(key);
};

/**
 * Invalidate all CSRF tokens for a user
 * Call this when logging out or on security-critical events
 * @param {string} userId - User ID
 */
exports.invalidateAllCsrfTokens = async (userId) => {
  if (!userId) return;
  
  const pattern = `csrf:${userId}:*`;
  
  // Use scan to find all tokens
  let cursor = '0';
  do {
    // Get batch of keys
    const [nextCursor, keys] = await redis.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    
    // Delete found keys
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => redis.delAsync(key)));
    }
  } while (cursor !== '0');
};