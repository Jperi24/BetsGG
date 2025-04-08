// src/middleware/security.js
const { protect } = require('./auth');
const { csrfProtection } = require('./cookie-auth');

/**
 * Combined security middleware that ensures proper order:
 * 1. Authentication first (sets req.user)
 * 2. CSRF protection after (uses req.user)
 */
// Add to src/middleware/security.js
exports.secureRouteWithSafeMethods = (req, res, next) => {
    // First run authentication
    protect(req, res, (authErr) => {
      if (authErr) return next(authErr);
      
      // Skip CSRF for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }
      
      // Apply CSRF for unsafe methods
      csrfProtection(req, res, next);
    });
  };

// For routes that need authentication but not CSRF (e.g., GET requests)
exports.authenticatedRoute = protect;

// For public routes that need CSRF but not authentication
exports.publicCsrfRoute = csrfProtection;