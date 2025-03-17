// src/services/account/index.js - Add notification integration

const mongoose = require('mongoose');
const User = require('../../models/User');
const Transaction = require('../../models/Transactions');
const Bet = require('../../models/Bet');
const NotificationPreferences = require('../../models/NotificationPreferences');
const { AppError } = require('../../middleware/error');
const notificationService = require('../notification');

/**
 * Update user profile information
 */
const updateUserProfile = async (userId, updateData, currentPassword) => {
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get user with password
    const user = await User.findById(userId).select('+password').session(session);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    
    if (!isPasswordCorrect) {
      throw new AppError('Current password is incorrect', 401);
    }
    
    // Check for username uniqueness if updating
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: userId }
      }).session(session);
      
      if (existingUser) {
        throw new AppError('Username already in use', 400);
      }
    }
    
    // Check for email uniqueness if updating
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      }).session(session);
      
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true, session }
    );
    
    // Commit transaction
    await session.commitTransaction();
    
    // Send notification about profile changes
    await notificationService.notifyAccountUpdated(userId, updateData);
    
    return updatedUser;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Export all user data
 */
const exportUserData = async (userId) => {
  try {
    // Get user data without sensitive fields
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Get user's transactions
    const transactions = await Transaction.find({ user: userId });
    
    // Get user's bets
    const createdBets = await Bet.find({ creator: userId });
    const participatedBets = await Bet.find({ 'participants.user': userId });
    
    // Get notification preferences
    const notificationPreferences = await NotificationPreferences.findOne({ user: userId });
    
    // Assemble the export data
    const exportData = {
      userProfile: {
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        balance: user.balance,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      },
      notificationPreferences: notificationPreferences ? {
        email: notificationPreferences.email,
        push: notificationPreferences.push
      } : null,
      transactions: transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
        description: t.description
      })),
      betsCreated: createdBets.map(b => ({
        tournamentName: b.tournamentName,
        matchName: b.matchName,
        contestant1: b.contestant1.name,
        contestant2: b.contestant2.name,
        totalPool: b.totalPool,
        status: b.status,
        winner: b.winner,
        createdAt: b.createdAt
      })),
      betsParticipated: participatedBets.map(b => {
        const userParticipation = b.participants.find(
          p => p.user.toString() === userId
        );
        
        return {
          tournamentName: b.tournamentName,
          matchName: b.matchName,
          contestant1: b.contestant1.name,
          contestant2: b.contestant2.name,
          prediction: userParticipation ? 
            (userParticipation.prediction === 1 ? b.contestant1.name : b.contestant2.name) : null,
          amount: userParticipation ? userParticipation.amount : null,
          status: b.status,
          winner: b.winner ? 
            (b.winner === 1 ? b.contestant1.name : b.contestant2.name) : null,
          createdAt: b.createdAt
        };
      })
    };
    
    // Create notification for data export
    await notificationService.createNotification(
      userId,
      'security_alert',
      'Account Data Exported',
      'Your account data was exported at your request. If you did not request this, please contact support immediately.',
      { action: 'data_export', timestamp: new Date() }
    );
    
    return exportData;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user account
 */
const deleteUserAccount = async (userId, password) => {
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get user with password
    const user = await User.findById(userId).select('+password').session(session);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      throw new AppError('Password is incorrect', 401);
    }
    
    // Before deleting, store email to send final notification
    const userEmail = user.email;
    const username = user.username;
    
    // Delete user's transactions
    await Transaction.deleteMany({ user: userId }).session(session);
    
    // Handle user's bets
    // For bets the user created, set creator to null
    await Bet.updateMany(
      { creator: userId },
      { $set: { creator: null } },
      { session }
    );
    
    // For bets where user participated, pull them from participants
    await Bet.updateMany(
      { 'participants.user': userId },
      { $pull: { participants: { user: userId } } },
      { session }
    );
    
    // Delete notification preferences
    await NotificationPreferences.deleteOne({ user: userId }).session(session);
    
    // Delete all notifications for this user
    const Notification = require('../../models/Notification');  
    await Notification.deleteMany({ user: userId }).session(session);
    
    // Finally, delete the user
    await User.findByIdAndDelete(userId).session(session);
    
    // Commit transaction
    await session.commitTransaction();
    
    // Send email notification (outside the transaction since user is deleted)
    // Using direct email service since the notification service needs a user ID
    const emailService = require('../email');
    await emailService.sendEmail({
      to: userEmail,
      subject: 'Account Deleted - ESports Betting',
      text: `Dear ${username}, Your ESports Betting account has been permanently deleted as requested. We're sorry to see you go. If this was a mistake, please contact our support team immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deleted</h2>
          <p>Dear ${username},</p>
          <p>Your ESports Betting account has been permanently deleted as requested.</p>
          <p>We're sorry to see you go. If this was a mistake, please contact our support team immediately.</p>
          <p>Regards,<br>ESports Betting Team</p>
        </div>
      `
    });
    
    return true;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
};



module.exports = {
  updateUserProfile,
  exportUserData,
  deleteUserAccount,

};