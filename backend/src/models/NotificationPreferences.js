// src/models/NotificationPreferences.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationPreferencesSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    tournamentReminders: {
      type: Boolean,
      default: true
    },
    betResults: {
      type: Boolean,
      default: true
    },
    paymentNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  push: {
    tournamentReminders: {
      type: Boolean,
      default: false
    },
    betResults: {
      type: Boolean,
      default: true
    },
    paymentNotifications: {
      type: Boolean,
      default: true
    },
    newBettingOpportunities: {
      type: Boolean,
      default: false
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
notificationPreferencesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);

module.exports = NotificationPreferences;