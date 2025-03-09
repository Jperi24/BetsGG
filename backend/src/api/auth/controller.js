// src/api/auth/controller.js (Updated)
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');
const passwordResetService = require('../../services/auth/password-reset');
const twoFactorService = require('../../services/auth/two-factor');
const emailService = require('../../services/email');

// Helper function to create and send token
const createSendToken = (user, statusCode, res, options = {}) => {
  // Generate token based on 2FA status
  const token = options.temp2FA 
    ? user.generateTempJWT() 
    : user.generateJWT();
  
  // Remove sensitive fields from output
  user.password = undefined;
  user.twoFactorSecret = undefined;
  user.twoFactorRecoveryCodes = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    requires2FA: user.twoFactorEnabled && options.temp2FA,
    data: {
      user
    }
  });
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email or username already in use'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      email,
      username,
      password
    });
    
    // Generate JWT and send response
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// Link wallet address to user
exports.linkWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    // Check if wallet address is already linked to another user
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Wallet address already linked to another account'
      });
    }
    
    // Update user with wallet address
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Log in user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email and include password field + 2FA status
    const user = await User.findOne({ email })
      .select('+password +twoFactorSecret');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if account is locked due to too many failed attempts
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({
        status: 'fail',
        message: `Account locked due to too many failed login attempts. Try again in ${lockTime} minutes.`
      });
    }
    
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Reset login attempts on successful password verification
    await user.resetLoginAttempts();
    
    // If 2FA is enabled, send a temporary token
    if (user.twoFactorEnabled) {
      return createSendToken(user, 200, res, { temp2FA: true });
    }
    
    // Generate JWT and send response (full login)
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Verify 2FA token
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID and verification code are required'
      });
    }
    
    // Verify the token
    const isValid = await twoFactorService.verifyTwoFactorToken(userId, token);
    
    if (!isValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid verification code'
      });
    }
    
    // Get the user
    const user = await User.findById(userId);
    
    // Generate full JWT and send response
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    // User is already available in req.user from auth middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user from collection (include password)
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new JWT and send response
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your email address'
      });
    }
    
    // Generate reset token
    const { resetToken, user } = await passwordResetService.generateResetToken(email);
    
    try {
      // Send password reset email
      await emailService.sendPasswordResetEmail(email, resetToken, user.username);
      
      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      // If email fails, revert the changes
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a new password'
      });
    }
    
    // Validate password complexity
    if (password.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Reset password
    const user = await passwordResetService.resetPassword(token, password);
    
    // Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Setup 2FA
exports.setupTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    
    // Generate TOTP secret and QR code
    const { secret, qrCodeUrl, recoveryCodes } = await twoFactorService.generateTotpSecret(userId, email);
    
    res.status(200).json({
      status: 'success',
      data: {
        secret,
        qrCodeUrl,
        recoveryCodes
      },
      message: 'Two-factor authentication setup initiated. Please scan the QR code with your authenticator app and verify with a code.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify and enable 2FA
exports.verifyAndEnableTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: 'fail',
        message: 'Verification code is required'
      });
    }
    
    // Verify the token and enable 2FA
    await twoFactorService.verifyAndEnableTwoFactor(userId, token);
    
    // Get updated user
    const user = await User.findById(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      },
      message: 'Two-factor authentication has been enabled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
exports.disableTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is required'
      });
    }
    
    // Disable 2FA
    await twoFactorService.disableTwoFactor(userId, password);
    
    // Get updated user
    const user = await User.findById(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      },
      message: 'Two-factor authentication has been disabled'
    });
  } catch (error) {
    next(error);
  }
};

// Generate new recovery codes
exports.regenerateRecoveryCodes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is required'
      });
    }
    
    // Generate new recovery codes
    const recoveryCodes = await twoFactorService.generateNewRecoveryCodes(userId, password);
    
    res.status(200).json({
      status: 'success',
      data: {
        recoveryCodes
      },
      message: 'New recovery codes generated. Please save these in a secure location.'
    });
  } catch (error) {
    next(error);
  }
};