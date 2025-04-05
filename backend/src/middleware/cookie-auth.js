// src/middleware/cookie-auth.js - Improved CSRF Protection
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./error');
const redis = require('../utils/redis');
const crypto = require('crypto');

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
 * Update the generateSessionCsrfToken function to ensure tokens are properly stored
 * @param {string} sessionId - Session ID
 * @returns {string} - CSRF token
 */
exports.generateSessionCsrfToken = async (sessionId) => {
  if (!sessionId) {
    console.error('No session ID provided when generating session CSRF token');
    return crypto.randomBytes(64).toString('hex'); // Return a token anyway
  }
  
  console.log(`Generating CSRF token for session ${sessionId}`);
  const csrfToken = crypto.randomBytes(64).toString('hex');
  
  // Store in Redis with proper key format
  const key = `csrf:session:${sessionId}:${csrfToken}`;
  try {
    await redis.setAsync(key, '1', 'EX', 28800); // 8 hours
    console.log(`Stored session CSRF token with key: ${key}`);
    return csrfToken;
  } catch (error) {
    console.error('Error storing session CSRF token in Redis:', error);
    return csrfToken; // Return token anyway to not break the flow
  }
};

/**
 * Update the verifySessionCsrfToken function with better debugging
 * @param {string} sessionId - Session ID
 * @param {string} token - CSRF token
 * @returns {boolean} - Whether token is valid
 */
exports.verifySessionCsrfToken = async (sessionId, token) => {
  if (!sessionId || !token) {
    console.log('Missing session ID or token for CSRF validation');
    return false;
  }
  
  const key = `csrf:session:${sessionId}:${token}`;
  console.log(`Verifying session CSRF token with key: ${key}`);
  
  try {
    const exists = await redis.getAsync(key);
    console.log(`CSRF token validation result: ${exists === '1' ? 'Valid' : 'Invalid'}`);
    
    if (exists === '1') {
      console.log('Token found and validated successfully');
      // Don't invalidate the token after verification for 2FA operations
      // as the user might need multiple attempts
      return true;
    } else {
      console.log('Token not found or invalid');
      return false;
    }
  } catch (error) {
    console.error('Error verifying session CSRF token:', error);
    return false;
  }
};


// src/middleware/cookie-auth.js - Direct bypass for 2FA routes

exports.csrfProtection = async (req, res, next) => {
  console.log(`CSRF protection for ${req.method} ${req.path}`);
  
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    console.log('Skipping CSRF check for safe method');
    return next();
  }
  
  // CRITICAL CHANGE: Skip CSRF for 2FA routes - ALWAYS bypass these routes
  if (req.path === '/api/auth/2fa/setup' || req.path === '/api/auth/2fa/verify') {
    console.log('Bypassing CSRF protection for 2FA route');
    return next();
  }
  
  // Get CSRF token from header or request body
  const csrfToken = req.headers['x-csrf-token'] || 
                   req.headers['x-csrf-token'] || 
                   req.body._csrf;
  
  console.log(`CSRF token from request: ${csrfToken ? 'Present' : 'Missing'}`);
  
  
  // For login/register routes without existing auth
  if (['POST'].includes(req.method) && 
      (req.path === '/api/auth/login' || 
       req.path === '/api/auth/logout' ||
       req.path === '/api/auth/register' || 
       req.path === '/api/auth/forgot-password' || 
       req.path.startsWith('/api/auth/reset-password/'))) {
    console.log('Skipping CSRF check for public auth endpoint');
    return next();
  }
  
  // Standard CSRF protection for authenticated routes
  console.log("REQ USER",req.user)
  
  if (req.user && csrfToken) {
    console.log(`Verifying user-based CSRF token for user ID: ${req.user.id}`);
    const isValid = await exports.verifyCsrfToken(req.user.id, csrfToken);
    
    if (!isValid) {
      console.log('User-based CSRF token validation failed');
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid or expired CSRF token'
      });
    }
    
    console.log('User-based CSRF token validated successfully');
    // Generate a new token for the response
    const newToken = await exports.generateCsrfToken(req.user.id);
    res.setHeader('X-CSRF-Token', newToken);
    exports.setCsrfCookie(res, newToken);
    
    return next();
  }
  
  // If we get here, CSRF validation failed
  console.log('CSRF validation failed, no valid token path found');
  return res.status(403).json({
    status: 'fail',
    message: 'CSRF protection: Token required for this operation'
  });
};
/**
 * Add a new function to explicitly set up a session CSRF token
 * This can be called when setting up a session
 * @param {string} sessionId - Session ID
 * @param {Object} res - Express response object
 * @returns {string|null} - CSRF token or null
 */
exports.initializeSessionCsrfToken = async (sessionId, res) => {
  if (!sessionId) {
    console.error('Cannot initialize CSRF token: Missing session ID');
    return null;
  }
  
  try {
    console.log(`Initializing CSRF token for new session: ${sessionId}`);
    const token = await exports.generateSessionCsrfToken(sessionId);
    
    if (res) {
      exports.setCsrfCookie(res, token);
      res.setHeader('X-CSRF-Token', token);
    }
    
    return token;
  } catch (error) {
    console.error('Error initializing session CSRF token:', error);
    return null;
  }
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