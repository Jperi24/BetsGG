// src/services/notification/preferences.js
const NotificationPreferences = require('../../models/NotificationPreferences');
const { AppError } = require('../../middleware/error');

/**
 * Get a user's notification preferences
 * If preferences don't exist, create default ones
 */
const getUserPreferences = async (userId) => {
  try {
    // Find preferences
    let preferences = await NotificationPreferences.findOne({ user: userId });
    
    // If none exist, create default preferences
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        user: userId,
        email: {
          tournamentReminders: true,
          betResults: true,
          paymentNotifications: true,
          marketingEmails: false,
          securityAlerts: true
        },
        push: {
          tournamentReminders: false,
          betResults: true,
          paymentNotifications: true,
          newBettingOpportunities: false,
          securityAlerts: true
        }
      });
    }
    
    return preferences;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a user's notification preferences
 */
const updateUserPreferences = async (userId, newPreferences) => {
  try {
    // Validate structure
    if (!newPreferences || typeof newPreferences !== 'object') {
      throw new AppError('Invalid preferences format', 400);
    }
    
    // Get existing preferences or create new ones
    let preferences = await getUserPreferences(userId);
    
    // Update email preferences
    if (newPreferences.email && typeof newPreferences.email === 'object') {
      const validEmailPrefs = [
        'tournamentReminders', 
        'betResults', 
        'paymentNotifications', 
        'marketingEmails', 
        'securityAlerts'
      ];
      
      validEmailPrefs.forEach(pref => {
        if (typeof newPreferences.email[pref] === 'boolean') {
          preferences.email[pref] = newPreferences.email[pref];
        }
      });
    }
    
    // Update push preferences
    if (newPreferences.push && typeof newPreferences.push === 'object') {
      const validPushPrefs = [
        'tournamentReminders', 
        'betResults', 
        'paymentNotifications', 
        'newBettingOpportunities', 
        'securityAlerts'
      ];
      
      validPushPrefs.forEach(pref => {
        if (typeof newPreferences.push[pref] === 'boolean') {
          preferences.push[pref] = newPreferences.push[pref];
        }
      });
    }
    
    // Save changes
    preferences.updatedAt = Date.now();
    await preferences.save();
    
    return preferences;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences
};