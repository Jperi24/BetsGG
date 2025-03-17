// src/models/Notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'bet_placed', 
      'bet_accepted', 
      'bet_completed',
      'bet_cancelled',
      'bet_win',
      'bet_loss',
      'deposit_confirmed',
      'withdrawal_processed',
      'account_updated',
      'password_changed',
      'security_alert',
      'tournament_starting',
      'match_starting',
      'welcome'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    // Additional data related to the notification that might be useful for frontend
    type: Schema.Types.Mixed
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add TTL index to automatically expire old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for formatted creation date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;