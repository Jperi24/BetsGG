// src/services/notification/index.js
const Notification = require('../../models/Notification');
const NotificationPreferences = require('../../models/NotificationPreferences');
const User = require('../../models/User');
const emailService = require('../email');

/**
 * Create and send a notification to a user
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data for the notification
 * @param {boolean} sendEmail - Whether to also send an email
 */
const createNotification = async (userId, type, title, message, data = {}, sendEmail = true) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      emailSent: false
    });

    // Check if we should send an email based on user preferences
    if (sendEmail) {
      // Get user preferences
      const preferences = await NotificationPreferences.findOne({ user: userId });
      let shouldSendEmail = true;

      // Check specific preference based on notification type
      if (preferences) {
        // Map notification type to preference category
        const typeToPreference = {
          bet_placed: 'betResults',
          bet_accepted: 'betResults',
          bet_completed: 'betResults',
          bet_cancelled: 'betResults',
          bet_win: 'betResults',
          bet_loss: 'betResults',
          deposit_confirmed: 'paymentNotifications',
          withdrawal_processed: 'paymentNotifications',
          tournament_starting: 'tournamentReminders',
          match_starting: 'tournamentReminders',
          account_updated: 'securityAlerts',
          password_changed: 'securityAlerts',
          security_alert: 'securityAlerts',
          welcome: true // Always send welcome emails
        };

        // Get the preference category
        const preferenceCategory = typeToPreference[type];
        
        // Check if email should be sent based on preferences
        if (typeof preferenceCategory === 'string') {
          shouldSendEmail = preferences.email[preferenceCategory];
        } else if (typeof preferenceCategory === 'boolean') {
          shouldSendEmail = preferenceCategory;
        }
      }

      if (shouldSendEmail) {
        await sendNotificationEmail(userId, title, message, type);
        
        // Update notification emailSent flag
        notification.emailSent = true;
        await notification.save();
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Send a notification email
 */
const sendNotificationEmail = async (userId, subject, message, type) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Cannot send notification email: User ${userId} not found`);
      return false;
    }

    // Convert plain message to HTML
    const html = buildNotificationEmail(user.username, subject, message, type);
    
    await emailService.sendEmail({
      to: user.email,
      subject,
      text: message,
      html
    });
    
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};

/**
 * Build HTML email for notification
 */
const buildNotificationEmail = (username, title, message, type) => {
  let backgroundColor = '#3498db'; // Default blue
  
  // Set background color based on notification type
  switch (type) {
    case 'security_alert':
    case 'bet_cancelled':
      backgroundColor = '#e74c3c'; // Red for alerts/cancellations
      break;
    case 'bet_win':
    case 'deposit_confirmed':
      backgroundColor = '#2ecc71'; // Green for positive events
      break;
    case 'bet_loss':
      backgroundColor = '#f39c12'; // Orange for losses
      break;
    default:
      backgroundColor = '#3498db'; // Blue for neutral notifications
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${backgroundColor}; padding: 15px; color: white;">
        <h2>${title}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none;">
        <p>Hi ${username},</p>
        <p>${message}</p>
        <p>You can view all your notifications in your account dashboard.</p>
        <p>Regards,<br>ESports Betting Team</p>
      </div>
    </div>
  `;
};

/**
 * Get all notifications for a user
 */
const getUserNotifications = async (userId, limit = 50, offset = 0, unreadOnly = false) => {
  try {
    const query = { user: userId };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    
    // Count total unread notifications
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });
    
    return {
      notifications,
      unreadCount
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.findOneAndDelete({ 
      _id: notificationId, 
      user: userId 
    });
    
    return result !== null;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Notification creation convenience methods

/**
 * Send a bet placement notification to creator
 */
const notifyBetCreated = async (userId, betDetails) => {
  return await createNotification(
    userId,
    'bet_placed',
    'Bet Created Successfully',
    `You've successfully created a bet for ${betDetails.contestant1.name} vs ${betDetails.contestant2.name} in ${betDetails.tournamentName}.`,
    { betId: betDetails._id, matchName: betDetails.matchName }
  );
};

/**
 * Send a bet acceptance notification
 */
const notifyBetAccepted = async (userId, betDetails, amount, prediction) => {
  const contestantName = prediction === 1 ? betDetails.contestant1.name : betDetails.contestant2.name;
  
  return await createNotification(
    userId,
    'bet_accepted',
    'Bet Placed Successfully',
    `You've bet ${amount} ETH on ${contestantName} in the match ${betDetails.matchName}.`,
    { 
      betId: betDetails._id, 
      matchName: betDetails.matchName,
      amount,
      prediction
    }
  );
};

/**
 * Notify the bet creator when someone accepts their bet
 */
const notifyCreatorOfAcceptance = async (creatorId, betDetails, amount, userInfo) => {
  return await createNotification(
    creatorId,
    'bet_accepted',
    'Your Bet Has Been Accepted',
    `${userInfo.username} has placed a ${amount} ETH bet on your ${betDetails.matchName} pool.`,
    { 
      betId: betDetails._id, 
      matchName: betDetails.matchName,
      amount
    }
  );
};

/**
 * Send a win notification
 */
const notifyBetWin = async (userId, betDetails, amount, winnings) => {
  return await createNotification(
    userId,
    'bet_win',
    'You Won Your Bet!',
    `Congratulations! You won your bet on the match ${betDetails.matchName}. You've been awarded ${winnings} ETH.`,
    { 
      betId: betDetails._id, 
      matchName: betDetails.matchName,
      amount,
      winnings
    }
  );
};

/**
 * Send a loss notification
 */
const notifyBetLoss = async (userId, betDetails, amount) => {
  return await createNotification(
    userId,
    'bet_loss',
    'Bet Result: Loss',
    `Unfortunately, you lost your bet of ${amount} ETH on the match ${betDetails.matchName}.`,
    { 
      betId: betDetails._id, 
      matchName: betDetails.matchName,
      amount
    }
  );
};

/**
 * Send a bet cancellation notification
 */
const notifyBetCancelled = async (userId, betDetails, reason, amount = null) => {
  let message = `The bet for match ${betDetails.matchName} has been cancelled.`;
  if (reason) {
    message += ` Reason: ${reason}`;
  }
  if (amount) {
    message += ` Your ${amount} ETH has been refunded to your account.`;
  }
  
  return await createNotification(
    userId,
    'bet_cancelled',
    'Bet Cancelled',
    message,
    { 
      betId: betDetails._id, 
      matchName: betDetails.matchName,
      reason
    }
  );
};

/**
 * Send a deposit confirmation notification
 */
const notifyDepositConfirmed = async (userId, amount, txHash) => {
  return await createNotification(
    userId,
    'deposit_confirmed',
    'Deposit Confirmed',
    `Your deposit of ${amount} ETH has been confirmed and added to your account balance.`,
    { amount, txHash }
  );
};

/**
 * Send a withdrawal confirmation notification
 */
const notifyWithdrawalProcessed = async (userId, amount, address) => {
  // Truncate address for display
  const shortAddress = address.length > 10 ? 
    `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 
    address;
  
  return await createNotification(
    userId,
    'withdrawal_processed',
    'Withdrawal Processed',
    `Your withdrawal of ${amount} ETH to address ${shortAddress} has been processed.`,
    { amount, address }
  );
};

/**
 * Send a security notification for account updates
 */
const notifyAccountUpdated = async (userId, changes) => {
  const changesList = Object.entries(changes)
    .map(([key, value]) => `- Your ${key} has been updated`)
    .join('\n');
  
  return await createNotification(
    userId,
    'account_updated',
    'Account Information Updated',
    `The following changes have been made to your account:\n${changesList}`,
    { changes }
  );
};

/**
 * Send a tournament starting soon notification
 */
const notifyTournamentStarting = async (userId, tournament) => {
  // Calculate hours until tournament
  const now = Math.floor(Date.now() / 1000);
  const hoursRemaining = Math.floor((tournament.startAt - now) / 3600);
  
  return await createNotification(
    userId,
    'tournament_starting',
    'Tournament Starting Soon',
    `The tournament "${tournament.name}" is starting in ${hoursRemaining} hours.`,
    { tournamentId: tournament.id, tournamentName: tournament.name }
  );
};

/**
 * Send a match starting soon notification
 */
const notifyMatchStarting = async (userId, betDetails) => {
  return await createNotification(
    userId,
    'match_starting',
    'Your Bet Match Starting Soon',
    `The match ${betDetails.matchName} that you bet on is starting soon.`,
    { betId: betDetails._id, matchName: betDetails.matchName }
  );
};

/**
 * Send welcome notification to new users
 */
const sendWelcomeNotification = async (userId, username) => {
  return await createNotification(
    userId,
    'welcome',
    'Welcome to ESports Betting',
    `Welcome to ESports Betting, ${username}! Start exploring tournaments and placing bets on your favorite players.`,
    {},
    true // Always send welcome email
  );
};

// Keep the existing security notification methods for compatibility
const sendSecurityNotification = async (userId, subject, message) => {
  return await createNotification(
    userId,
    'security_alert',
    subject,
    message,
    {}
  );
};

const sendPasswordChangedNotification = async (userId) => {
  return await createNotification(
    userId,
    'security_alert',
    'Password Changed',
    'Your password has been successfully changed. If you didn\'t make this change, please contact support immediately.',
    {}
  );
};

const sendProfileUpdatedNotification = async (userId, changes) => {
  return await notifyAccountUpdated(userId, changes);
};

const send2FAEnabledNotification = async (userId) => {
  return await createNotification(
    userId,
    'security_alert',
    'Two-Factor Authentication Enabled',
    'Two-factor authentication has been enabled on your account. This will provide additional security for your account.',
    {}
  );
};

const send2FADisabledNotification = async (userId) => {
  return await createNotification(
    userId,
    'security_alert',
    'Two-Factor Authentication Disabled',
    'Two-factor authentication has been disabled on your account. This may reduce the security of your account.',
    {}
  );
};

const sendNewDeviceLoginNotification = async (userId, deviceInfo) => {
  return await createNotification(
    userId,
    'security_alert',
    'New Device Login',
    `We detected a new login to your account from a new device or location.\nDevice info: ${deviceInfo}`,
    { deviceInfo }
  );
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  // Bet notification methods
  notifyBetCreated,
  notifyBetAccepted,
  notifyCreatorOfAcceptance,
  notifyBetWin,
  notifyBetLoss,
  notifyBetCancelled,
  // Transaction notification methods
  notifyDepositConfirmed,
  notifyWithdrawalProcessed,
  // Account notification methods
  notifyAccountUpdated,
  // Event notification methods
  notifyTournamentStarting,
  notifyMatchStarting,
  sendWelcomeNotification,
  // Legacy security notification methods for compatibility
  sendSecurityNotification,
  sendPasswordChangedNotification,
  sendProfileUpdatedNotification,
  send2FAEnabledNotification,
  send2FADisabledNotification,
  sendNewDeviceLoginNotification
};