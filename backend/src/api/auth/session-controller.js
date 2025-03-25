// src/api/auth/session-controller.js
const sessionService = require('../../services/auth/session');
const { AppError } = require('../../middleware/error');
const cookieAuth = require('../../middleware/cookie-auth');
const notificationService = require('../../services/notification');

/**
 * Get all active sessions for the current user
 */
exports.getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.cookies.session_id;
    
    // Get formatted sessions for display
    const sessions = await sessionService.getUserSessionsForDisplay(userId, currentSessionId);
    
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    res.status(200).json({
      status: 'success',
      csrfToken,
      data: {
        sessions,
        current: sessions.find(s => s.isCurrent)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate a specific session
 * Requires 2FA verification for security
 */
exports.terminateSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const currentSessionId = req.cookies.session_id;
    
    // Check if trying to terminate current session
    if (sessionId === currentSessionId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot terminate your current session. Use logout instead.'
      });
    }
    
    // Verify the session belongs to this user
    const userSessions = await sessionService.getUserSessions(userId);
    const sessionBelongsToUser = userSessions.some(s => s.id === sessionId);
    
    if (!sessionBelongsToUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Session not found'
      });
    }
    
    // Terminate the session
    await sessionService.invalidateSession(sessionId);
    
    // Send security notification
    const session = userSessions.find(s => s.id === sessionId);
    if (session && session.deviceInfo) {
      const deviceDescription = `${session.deviceInfo.browser.name} on ${session.deviceInfo.os.name}`;
      
      await notificationService.createNotification(
        userId,
        'security_alert',
        'Session Terminated',
        `A session on ${deviceDescription} was terminated by you.`,
        { action: 'session_terminated', timestamp: new Date() }
      );
    }
    
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    res.status(200).json({
      status: 'success',
      csrfToken,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate all sessions except the current one
 * Requires 2FA verification for security
 */
exports.terminateAllOtherSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.cookies.session_id;
    
    if (!currentSessionId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current session could not be identified'
      });
    }
    
    // Terminate all other sessions
    await sessionService.invalidateAllUserSessions(userId, [currentSessionId]);
    
    // Send security notification
    await notificationService.createNotification(
      userId,
      'security_alert',
      'All Other Sessions Terminated',
      'All your sessions on other devices have been terminated.',
      { action: 'all_sessions_terminated', timestamp: new Date() }
    );
    
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    res.status(200).json({
      status: 'success',
      csrfToken,
      message: 'All other sessions terminated successfully'
    });
  } catch (error) {
    next(error);
  }
};