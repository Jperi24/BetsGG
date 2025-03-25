// src/api/auth/session-routes.js
const express = require('express');
const router = express.Router();
const sessionController = require('./session-controller');
const { protect, require2FAVerified } = require('../../middleware/auth');

// All routes require authentication
router.use(protect);

// Get active sessions
router.get('/sessions', sessionController.getActiveSessions);

// Terminate a specific session (requires 2FA for sensitive operation)
router.delete('/sessions/:sessionId', require2FAVerified, sessionController.terminateSession);

// Terminate all other sessions (requires 2FA for sensitive operation)
router.delete('/sessions', require2FAVerified, sessionController.terminateAllOtherSessions);

module.exports = router;