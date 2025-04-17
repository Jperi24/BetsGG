// src/services/notification/cleanup.js
const Notification = require('../../models/Notification');
const mongoose = require('mongoose');
const { AppError } = require('../../middleware/error');

/**
 * Cleanup notifications that are older than the specified number of days
 * @param {Number} daysThreshold - Number of days after which notifications are considered for cleanup
 * @returns {Object} - Cleanup statistics
 */
const cleanupOldNotifications = async (daysThreshold = 20) => {
  try {
    console.log(`Starting notification cleanup for items older than ${daysThreshold} days...`);
    
    // Calculate the date threshold (20 days ago)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    // Find and delete notifications older than the threshold
    const result = await Notification.deleteMany({
      createdAt: { $lt: thresholdDate }
    });
    
    const cleanupStats = {
      notificationsRemoved: result.deletedCount,
      thresholdDate: thresholdDate.toISOString(),
      timestamp: new Date().toISOString()
    };
    
    console.log(`Notification cleanup completed: removed ${result.deletedCount} notifications`);
    return cleanupStats;
  } catch (error) {
    console.error('Error in cleanupOldNotifications:', error);
    throw new AppError('Notification cleanup failed', 500);
  }
};

/**
 * Schedule notification cleanup to run at a specific interval
 * @param {Number} intervalHours - Interval in hours
 * @param {Number} daysThreshold - Number of days after which notifications are considered for cleanup
 */
const scheduleCleanup = (intervalHours = 24, daysThreshold = 20) => {
  // Convert hours to milliseconds
  const interval = intervalHours * 60 * 60 * 1000;
  
  console.log(`Scheduling notification cleanup to run every ${intervalHours} hours for items older than ${daysThreshold} days`);
  
  // Run cleanup immediately on startup
  cleanupOldNotifications(daysThreshold);
  
  // Schedule regular cleanup
  setInterval(() => {
    cleanupOldNotifications(daysThreshold);
  }, interval);
};

module.exports = {
  cleanupOldNotifications,
  scheduleCleanup
};