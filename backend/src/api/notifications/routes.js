// src/api/notifications/routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('./controller');
const { protect } = require('../../middleware/auth');
const { body, param, query } = require('express-validator');
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

// Get user notifications
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('unreadOnly').optional().isBoolean(),
    validateRequest
  ],
  notificationsController.getNotifications
);

// Get unread notification count
router.get('/unread-count', notificationsController.getUnreadCount);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  [
    param('notificationId').isMongoId().withMessage('Invalid notification ID'),
    validateRequest
  ],
  notificationsController.markAsRead
);

// Mark all notifications as read
router.patch('/mark-all-read', notificationsController.markAllAsRead);

// Delete notification
router.delete(
  '/:notificationId',
  [
    param('notificationId').isMongoId().withMessage('Invalid notification ID'),
    validateRequest
  ],
  notificationsController.deleteNotification
);

module.exports = router;