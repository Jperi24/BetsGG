// src/api/notifications/controller.js
const notificationService = require('../../services/notification');
const { AppError } = require('../../middleware/error');


/**
 * Get user's notification preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    // Get preferences using the service
    const preferences = await preferencesService.getUserPreferences(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        preferences: {
          email: preferences.email,
          push: preferences.push
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's notification preferences
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid preferences format'
      });
    }
    
    // Update preferences using the service
    const updatedPrefs = await preferencesService.updateUserPreferences(
      req.user.id,
      preferences
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: {
        preferences: {
          email: updatedPrefs.email,
          push: updatedPrefs.push
        }
      }
    });
  } catch (error) {
    next(error);
  }}

/**
 * Get user's notifications
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';
    
    const result = await notificationService.getUserNotifications(
      req.user.id,
      limit,
      offset,
      unreadOnly
    );
    
    res.status(200).json({
      status: 'success',
      results: result.notifications.length,
      unreadCount: result.unreadCount,
      data: {
        notifications: result.notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      return next(new AppError('Notification ID is required', 400));
    }
    
    const notification = await notificationService.markNotificationAsRead(
      notificationId,
      req.user.id
    );
    
    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: `${count} notification(s) marked as read`,
      data: {
        count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      return next(new AppError('Notification ID is required', 400));
    }
    
    const success = await notificationService.deleteNotification(
      notificationId,
      req.user.id
    );
    
    if (!success) {
      return next(new AppError('Notification not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { unreadCount } = await notificationService.getUserNotifications(
      req.user.id,
      0, // No notifications needed, just the count
      0,
      true
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};