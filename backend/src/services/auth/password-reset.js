// src/services/auth/password-reset.js
const crypto = require('crypto');
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');

/**
 * Generate password reset token and save to user
 * @param {string} email - User's email
 * @returns {Object} - Contains reset token and user info
 */
const generateResetToken = async (email) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user with that email address exists', 404);
  }

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Create hashed token for database
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Save to user document with expiration (10 minutes)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  
  return {
    resetToken,
    user
  };
};

/**
 * Verify a password reset token
 * @param {string} token - The raw reset token
 * @returns {Object} - User document if token is valid
 */
const verifyResetToken = async (token) => {
  // Hash the token for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with the token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }
  
  // Check if account is locked for too many attempts
  if (user.passwordResetAttemptsLockUntil && user.passwordResetAttemptsLockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.passwordResetAttemptsLockUntil - Date.now()) / (60 * 1000));
    throw new AppError(`Too many reset attempts. Please try again in ${minutesLeft} minutes.`, 429);
  }
  
  return user;
};

/**
 * Reset user password
 * @param {string} token - The raw reset token
 * @param {string} newPassword - New password
 * @returns {Object} - Updated user document
 */
const resetPassword = async (token, newPassword) => {
  try {
    // Verify token
    const user = await verifyResetToken(token);
    
    // Reset password
    user.password = newPassword;
    
    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetAttemptsLockUntil = undefined;
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Save changes
    await user.save();
    
    return user;
  } catch (error) {
    // If token is invalid, increment attempt counter
    if (error.statusCode === 400 && error.message.includes('Token is invalid')) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // Find user by token and increment attempt counter
      const user = await User.findOne({
        passwordResetToken: hashedToken
      });
      
      if (user) {
        user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
        
        // If too many attempts (5), lock for 30 minutes
        if (user.passwordResetAttempts >= 5) {
          user.passwordResetAttemptsLockUntil = Date.now() + (30 * 60 * 1000);
          user.passwordResetAttempts = 0;
        }
        
        await user.save();
      }
    }
    
    throw error;
  }
};

module.exports = {
  generateResetToken,
  verifyResetToken,
  resetPassword
};