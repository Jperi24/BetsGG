// src/api/notifications/routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('./controller');
const { protect } = require('../../middleware/auth');
const { body } = require('express-validator');
const { validateRequest } = require('../../middleware/validation');

// All notification routes require authentication
router.use(protect);

// Get notification preferences
router.get('/preferences', notificationsController.getPreferences);

// Update notification preferences
router.patch(
  '/preferences',
  [
    body('preferences')
      .isObject()
      .withMessage('Preferences must be an object'),
    validateRequest
  ],
  notificationsController.updatePreferences
);

module.exports = router;