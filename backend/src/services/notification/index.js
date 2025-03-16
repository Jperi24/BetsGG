// src/services/notification/index.js
const NotificationPreferences = require('../../models/NotificationPreferences');
const User = require('../../models/User');
const emailService = require('../email');

/**
 * Send a security notification email to a user
 */
const sendSecurityNotification = async (userId, subject, message) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Cannot send security notification: User ${userId} not found`);
      return false;
    }
    
    // Get notification preferences
    const preferences = await NotificationPreferences.findOne({ user: userId });
    
    // If no preferences exist or security alerts are enabled, send email
    if (!preferences || preferences.email.securityAlerts) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Security Alert</h2>
          <p>Hi ${user.username},</p>
          <p>${message}</p>
          <p>If you did not initiate this action, please change your password immediately 
             and contact customer support.</p>
          <p>Regards,<br>ESports Betting Security Team</p>
        </div>
      `;
      
      await emailService.sendEmail({
        to: user.email,
        subject,
        text: message,
        html
      });
      
      return true;
    }
    
    // Security alerts disabled
    return false;
  } catch (error) {
    console.error('Error sending security notification:', error);
    return false;
  }
};

/**
 * Send a password changed notification
 */
const sendPasswordChangedNotification = async (userId) => {
  return await sendSecurityNotification(
    userId,
    'Password Changed - ESports Betting',
    'Your password has been successfully changed. If you didn\'t make this change, please contact support immediately.'
  );
};

/**
 * Send a profile updated notification
 */
const sendProfileUpdatedNotification = async (userId, changes) => {
  const changeDescription = Object.keys(changes)
    .map(key => `- Your ${key} has been updated`)
    .join('\n');
    
  return await sendSecurityNotification(
    userId,
    'Profile Updated - ESports Betting',
    `The following changes have been made to your account:\n${changeDescription}`
  );
};

/**
 * Send a 2FA enabled notification
 */
const send2FAEnabledNotification = async (userId) => {
  return await sendSecurityNotification(
    userId,
    'Two-Factor Authentication Enabled - ESports Betting',
    'Two-factor authentication has been enabled on your account. This will provide additional security for your account.'
  );
};

/**
 * Send a 2FA disabled notification
 */
const send2FADisabledNotification = async (userId) => {
  return await sendSecurityNotification(
    userId,
    'Two-Factor Authentication Disabled - ESports Betting',
    'Two-factor authentication has been disabled on your account. This may reduce the security of your account.'
  );
};

/**
 * Send a login from new device notification
 */
const sendNewDeviceLoginNotification = async (userId, deviceInfo) => {
  return await sendSecurityNotification(
    userId,
    'New Device Login - ESports Betting',
    `We detected a new login to your account from a new device or location.\nDevice info: ${deviceInfo}`
  );
};

module.exports = {
  sendSecurityNotification,
  sendPasswordChangedNotification,
  sendProfileUpdatedNotification,
  send2FAEnabledNotification,
  send2FADisabledNotification,
  sendNewDeviceLoginNotification
};