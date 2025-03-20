// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

// General API rate limit
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter limits for authentication
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 attempts per hour
  message: 'Too many authentication attempts, please try again later.'
});

// Limits for financial operations
const financialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 financial operations per hour
  message: 'Too many financial operations, please try again later.'
});

// Limits for betting operations
const bettingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 bet placements per 15 minutes
  message: 'Too many betting operations, please try again later.'
});

module.exports = {
  standardLimiter,
  authLimiter,
  financialLimiter,
  bettingLimiter
};