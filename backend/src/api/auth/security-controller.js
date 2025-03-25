// src/api/auth/security-controller.js
const cookieAuth = require('../../middleware/cookie-auth');
const sessionService = require('../../services/auth/session');

/**
 * Refresh CSRF token
 * Used by frontend to get a new CSRF token periodically
 */
exports.refreshCsrfToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    
    // Set as cookie
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    res.status(200).json({
      status: 'success',
      csrfToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify current authentication status
 * Used by frontend to check if user is still authenticated
 */
exports.verifyAuthStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.cookies.session_id;
    
    // Check if session is valid
    let isValidSession = false;
    if (sessionId) {
      const session = await sessionService.getSession(sessionId);
      isValidSession = !!session && session.userId === userId.toString();
    }
    
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    res.status(200).json({
      status: 'success',
      csrfToken,
      data: {
        isAuthenticated: true,
        sessionValid: isValidSession,
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          role: req.user.role,
          twoFactorEnabled: req.user.twoFactorEnabled || false
        }
      }
    });
  } catch (error) {
    next(error);
  }
};