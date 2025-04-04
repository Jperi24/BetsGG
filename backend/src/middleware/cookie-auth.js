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




/**
 * Clears auth cookies with consistent settings
 * @param {Object} res - Express response object
 */
exports.clearAuthCookies = (res) => {
  // Common cookie options to ensure cookies are properly cleared
  const cookieOptions = {
    path: '/',
    expires: new Date(0), // Setting to epoch time forces immediate deletion
    maxAge: 0, // Alternative way to force deletion
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  // Clear auth token cookie - must be httpOnly: true to match how it was set
  res.clearCookie('auth_token', {
    ...cookieOptions,
    httpOnly: true
  });
  
  // Clear session ID cookie - must be httpOnly: true to match how it was set
  res.clearCookie('session_id', {
    ...cookieOptions,
    httpOnly: true
  });
  
  // Clear CSRF token cookie - must be httpOnly: false to match how it was set
  res.clearCookie('csrf_token', {
    ...cookieOptions,
    httpOnly: false
  });
  
  // Also clear alternate CSRF token cookie name if it exists
  res.clearCookie('XSRF-TOKEN', {
    ...cookieOptions,
    httpOnly: false
  });
  
  // Log the cookie clearing action in development
  if (process.env.NODE_ENV === 'development') {
    console.log('All auth cookies cleared with options:', cookieOptions);
  }
};

// Make sure the setTokenCookie function uses consistent httpOnly settings
exports.setTokenCookie = (res, token, options = {}) => {
  // Default cookie options - secure and HTTP-only
  const cookieOptions = {
    httpOnly: true, // This is crucial for auth_token
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: options.tempToken 
      ? 5 * 60 * 1000  // 5 minutes for temp 2FA tokens
      : 7 * 24 * 60 * 60 * 1000, // 7 days for regular tokens
  };

  // Set auth token as HTTP-only cookie
  res.cookie('auth_token', token, cookieOptions);
  
  // Set the session ID cookie with the same httpOnly setting
  if (options.sessionId) {
    res.cookie('session_id', options.sessionId, {
      ...cookieOptions,
      httpOnly: true // Ensure this is consistent
    });
  }
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
// In middleware/cookie-auth.js
exports.verifyCsrfToken = async (userId, token) => {
  if (!userId || !token) return false;
  
  const key = `csrf:${userId}:${token}`;
  const exists = await redis.getAsync(key);
  
  if (exists === '1') {
    // Always invalidate token after use for security-critical operations
    await redis.delAsync(key);
    return true;
  }
  
  return false;
};

/**
 * Improved CSRF protection middleware
 * Validates CSRF token for state-changing methods
 */
// In middleware/cookie-auth.js
// backend/src/middleware/cookie-auth.js
// Improved CSRF middleware that handles 2FA routes securely

exports.csrfProtection = async (req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get CSRF token from header or request body
  const csrfToken = req.headers['x-csrf-token'] || 
                   req.headers['x-csrf-TOKEN'] || 
                   req.body._csrf;
  
  // Special handling for 2FA routes - use cookie/session-based validation
  // instead of user-based validation
  if (
    req.path === '/api/auth/2fa/setup' || 
    req.path === '/api/auth/2fa/verify'
  ) {
    // For 2FA routes, validate the token using the session ID if available
    const sessionId = req.cookies.session_id;

    
    
    
    if (sessionId && csrfToken) {
      // Verify against a session-based CSRF token
      // This would require storing CSRF tokens by session ID in Redis
      const isValid = await exports.verifySessionCsrfToken(sessionId, csrfToken);
      
      if (!isValid) {
        console.log("NOT VALID")
        return res.status(403).json({
          status: 'fail',
          message: 'Invalid or expired CSRF token for 2FA operation'
        });
      }
      
      // Generate a new token for the response
      const newToken = await exports.generateSessionCsrfToken(sessionId);
      res.setHeader('X-CSRF-Token', newToken);
      exports.setCsrfCookie(res, newToken);
      
      return next();
    }
    
    // If we have an auth token but not a session ID, allow the request
    // This is a fallback for scenarios where the session cookie is missing
    if (req.cookies.auth_token) {
      return next();
    }
  }
  
  // For login/register routes without existing auth
  if (['POST'].includes(req.method) && 
      (req.path === '/api/auth/login' || 
         '/api/auth/logout' ||
       req.path === '/api/auth/register' || 
       req.path === '/api/auth/forgot-password' || 
       req.path.startsWith('/api/auth/reset-password/'))) {
    // Allow these specific public endpoints without CSRF
    return next();
  }
  
  // Standard CSRF protection for authenticated routes
  if (req.user && csrfToken) {
    console.log("USER ID",req.user.id)
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
  
  // If we get here, CSRF validation failed
  return res.status(403).json({
    status: 'fail',
    message: 'CSRF protection: Token required for this operation'
  });
};

// New function to verify CSRF tokens by session ID
exports.verifySessionCsrfToken = async (sessionId, token) => {
  if (!sessionId || !token) return false;
  
  const key = `csrf:session:${sessionId}:${token}`;
  const exists = await redis.getAsync(key);
  
  return exists === '1';
};

// New function to generate CSRF tokens by session ID
exports.generateSessionCsrfToken = async (sessionId) => {
  const csrfToken = crypto.randomBytes(64).toString('hex');
  
  const key = `csrf:session:${sessionId}:${csrfToken}`;
  await redis.setAsync(key, '1', 'EX', 28800); // 8 hours
  
  return csrfToken;
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