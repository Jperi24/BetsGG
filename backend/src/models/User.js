// src/models/User.js (Updated)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  deployedBets: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Bet'
  }],
  participatedBets: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Bet'
  }],
  balance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  passwordResetAttemptsLockUntil: {
    type: Date
  },
  
  // Two-factor authentication fields
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorRecoveryCodes: {
    type: [String],
    select: false
  },
  
  // Login attempt tracking (for security)
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
});

// Hash the password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
userSchema.methods.generateJWT = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role,
      require2FA: this.twoFactorEnabled,
      tokenVersion: this.tokenVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Generate a temporary JWT for 2FA authentication
userSchema.methods.generateTempJWT = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      pending2FA: true
    },
    process.env.JWT_SECRET,
    { expiresIn: '5m' } // Short expiration for security
  );
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  // Check for lock until time in the future
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to handle failed login attempts
// src/models/User.js - in incrementLoginAttempts method
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset login attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    // Increment login attempts
    this.loginAttempts += 1;
    
    // Lock account if too many attempts (5)
    if (this.loginAttempts >= 5 && !this.isLocked()) {
      // Lock for 30 minutes
      this.lockUntil = Date.now() + 30 * 60 * 1000;
      
      // Invalidate all tokens when account is locked
      await this.invalidateAllTokens();
      
      // Invalidate all sessions when account is locked
      await sessionService.invalidateAllUserSessions(this._id);
      
      // Send notification about account lock
      await notificationService.createNotification(
        this._id,
        'security_alert',
        'Account Locked',
        'Your account has been temporarily locked due to too many failed login attempts. Try again in 30 minutes.',
        { action: 'account_lock' }
      );
    }
  }
  
  return await this.save();
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return await this.save();
};

userSchema.methods.invalidateAllTokens = async function() {
  this.tokenVersion += 1;
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;