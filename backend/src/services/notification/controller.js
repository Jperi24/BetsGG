// src/api/notifications/controller.js
const { AppError } = require('../../middleware/error');
const preferencesService = require('../../services/notification/preferences');

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