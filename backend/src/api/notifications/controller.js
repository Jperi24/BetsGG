// src/api/notifications/controller.js
const NotificationPreferences = require('../../models/NotificationPreferences');
const { AppError } = require('../../middleware/error');

/**
 * Get user's notification preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    // Find preferences or create default
    let preferences = await NotificationPreferences.findOne({ user: req.user.id });
    
    // If preferences don't exist yet, create default ones
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        user: req.user.id
      });
    }
    
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
    
    // Validate that we're only updating allowed fields
    const validUpdate = {
      email: {},
      push: {}
    };
    
    // Process email preferences
    if (preferences.email) {
      const validEmailPrefs = [
        'tournamentReminders', 
        'betResults', 
        'paymentNotifications', 
        'marketingEmails', 
        'securityAlerts'
      ];
      
      validEmailPrefs.forEach(pref => {
        if (typeof preferences.email[pref] === 'boolean') {
          validUpdate.email[pref] = preferences.email[pref];
        }
      });
    }
    
    // Process push preferences
    if (preferences.push) {
      const validPushPrefs = [
        'tournamentReminders', 
        'betResults', 
        'paymentNotifications', 
        'newBettingOpportunities', 
        'securityAlerts'
      ];
      
      validPushPrefs.forEach(pref => {
        if (typeof preferences.push[pref] === 'boolean') {
          validUpdate.push[pref] = preferences.push[pref];
        }
      });
    }
    
    // Find and update preferences
    let userPrefs = await NotificationPreferences.findOne({ user: req.user.id });
    
    if (!userPrefs) {
      // Create new preferences if they don't exist
      userPrefs = await NotificationPreferences.create({
        user: req.user.id,
        email: validUpdate.email,
        push: validUpdate.push
      });
    } else {
      // Update existing preferences
      if (Object.keys(validUpdate.email).length > 0) {
        Object.keys(validUpdate.email).forEach(pref => {
          userPrefs.email[pref] = validUpdate.email[pref];
        });
      }
      
      if (Object.keys(validUpdate.push).length > 0) {
        Object.keys(validUpdate.push).forEach(pref => {
          userPrefs.push[pref] = validUpdate.push[pref];
        });
      }
      
      userPrefs.updatedAt = Date.now();
      await userPrefs.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: {
        preferences: {
          email: userPrefs.email,
          push: userPrefs.push
        }
      }
    });
  } catch (error) {
    next(error);
  }
};