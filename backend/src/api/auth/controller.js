// src/api/auth/controller.js (Updated)
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');
const passwordResetService = require('../../services/auth/password-reset');
const twoFactorService = require('../../services/auth/two-factor');
const emailService = require('../../services/email');
const sessionService = require("../../services/auth/session")

// Helper function to create and send token
// src/api/auth/controller.js - Update createSendToken function
const createSendToken = async (user, statusCode, res, options = {}, deviceInfo = {}) => {
  // Generate token based on 2FA status
  const token = options.temp2FA 
    ? user.generateTempJWT() 
    : user.generateJWT();
  
  // Create session and get session ID
  const sessionId = await sessionService.createSession(user.id, deviceInfo);
  
  // Remove sensitive fields from output
  user.password = undefined;
  user.twoFactorSecret = undefined;
  user.twoFactorRecoveryCodes = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    sessionId, // Include session ID in response
    requires2FA: user.twoFactorEnabled && options.temp2FA,
    tempToken: options.temp2FA ? user.id : undefined,
    data: {
      user
    }
  });
};

// Register a new user
// exports.register = async (req, res, next) => {
//   try {
//     const { email, username, password } = req.body;
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ 
//       $or: [{ email }, { username }] 
//     });
    
//     if (existingUser) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Email or username already in use'
//       });
//     }
    
//     // Create new user
//     const newUser = await User.create({
//       email,
//       username,
//       password
//     });
    
//     // Generate JWT and send response
//     createSendToken(newUser, 201, res);
//   } catch (error) {
//     next(error);
//   }
// };

// Update to src/api/auth/controller.js - Add welcome notification

// Add this to the register function
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
    
    // Send welcome notification
    await notificationService.sendWelcomeNotification(newUser._id, username);
    
    // Generate JWT and send response
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// Update the verifyAndEnableTwoFactor function to add notification
exports.verifyAndEnableTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    // Try to verify the token
    await twoFactorService.verifyAndEnableTwoFactor(userId, code);
    
    // Get user with recovery codes
    const user = await User.findById(userId).select('+twoFactorRecoveryCodes');
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Invalidate all sessions except current
    const currentSessionId = req.headers['x-session-id'];
    await sessionService.invalidateAllUserSessions(userId, [currentSessionId]);
    
    // Send 2FA enabled notification
    await notificationService.send2FAEnabledNotification(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication has been enabled successfully',
      data: {
        recoveryCodes: user.twoFactorRecoveryCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update the disableTwoFactor function to add notification
exports.disableTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Disable 2FA
    await twoFactorService.disableTwoFactor(userId);
    
    // Get user
    const user = await User.findById(userId);
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Invalidate all sessions except current
    const currentSessionId = req.headers['x-session-id'];
    await sessionService.invalidateAllUserSessions(userId, [currentSessionId]);
    
    // Send 2FA disabled notification
    await notificationService.send2FADisabledNotification(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication has been disabled'
    });
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
    
    // Find user by email and include 2FA status
    const user = await User.findOne({ email }).select('+password +twoFactorEnabled');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if account is locked due to too many failed attempts
    if (user.isLocked && user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({
        status: 'fail',
        message: `Account locked due to too many failed login attempts. Try again in ${lockTime} minutes.`
      });
    }
    
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      // Increment failed login attempts if that feature exists
      if (user.incrementLoginAttempts) {
        await user.incrementLoginAttempts();
      }
      
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Reset login attempts on successful password verification
    if (user.resetLoginAttempts) {
      await user.resetLoginAttempts();
    }
    
    // If 2FA is enabled, send temporary token
    if (user.twoFactorEnabled) {
      createSendToken(user, 200, res, { temp2FA: true });
    } else {
      // If 2FA is not enabled, generate JWT and send response
      createSendToken(user, 200, res);
    }
  } catch (error) {
    console.error('Login Error:', error);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = req.headers['x-session-id'];
    
    // If sessionId is provided, invalidate just that session
    if (sessionId) {
      await sessionService.invalidateSession(sessionId);
    } else {
      // Otherwise invalidate all sessions for this user
      await sessionService.invalidateAllUserSessions(userId);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA token
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { token, code, isRecoveryCode } = req.body;
    
    if (!token || !code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Verification token and code are required'
      });
    }
    
    // Verify the token - handle both regular codes and recovery codes
    const isValid = await twoFactorService.verifyTwoFactorToken(token, code, isRecoveryCode);
    
    if (!isValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid verification code'
      });
    }
    
    // Get the user
    const user = await User.findById(token);
    
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
// src/api/auth/controller.js - in updatePassword function
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Invalidate all sessions except current one
    const currentSessionId = req.headers['x-session-id'];
    await sessionService.invalidateAllUserSessions(user.id, [currentSessionId]);
    
    // Create new token and send notification
    await notificationService.sendPasswordChangedNotification(user.id);
    
    // Generate new token
    await createSendToken(user, 200, res);
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
// src/api/auth/controller.js - in resetPassword function
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    
    // Reset password
    const user = await passwordResetService.resetPassword(token, password);
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Invalidate all sessions
    await sessionService.invalidateAllUserSessions(user.id);
    
    // Send notification
    await notificationService.sendPasswordChangedNotification(user.id);
    
    // Log the user in with new token
    await createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's 2FA status
 */
exports.getTwoFactorStatus = async (req, res, next) => {
  try {
    // User is already available from auth middleware
    res.status(200).json({
      status: 'success',
      data: {
        enabled: req.user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Setup 2FA for a user
 */
exports.setupTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    
    // Generate TOTP secret and QR code
    const { secret, qrCodeUrl, recoveryCodes } = await twoFactorService.generateTotpSecret(userId, email);
    
    res.status(200).json({
      status: 'success',
      data: {
        secretKey: secret,
        qrCodeUrl,
        recoveryCodes
      }
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    next(error);
  }
};

/**
 * Verify and enable 2FA
 */

// exports.verifyAndEnableTwoFactor = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const { code } = req.body;
    
//     console.log(`2FA verification request received for user ${userId}`);
//     console.log(`Verification code provided: ${code}`);
    
//     if (!code) {
//       console.log('No verification code provided');
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Verification code is required'
//       });
//     }
    
//     // Try to verify the token
//     try {
//       await twoFactorService.verifyAndEnableTwoFactor(userId, code);
//       console.log(`2FA verification successful for user ${userId}`);
      
//       // Get user with recovery codes to return them
//       const user = await User.findById(userId).select('+twoFactorRecoveryCodes');
      
//       res.status(200).json({
//         status: 'success',
//         message: 'Two-factor authentication has been enabled successfully',
//         data: {
//           recoveryCodes: user.twoFactorRecoveryCodes
//         }
//       });
//     } catch (validationError) {
//       console.error(`2FA verification failed for user ${userId}:`, validationError);
      
//       // Check if there are specific details we can provide to help troubleshooting
//       let errorMessage = validationError.message || 'Failed to verify code. Please try again.';
      
//       return res.status(validationError.statusCode || 400).json({
//         status: 'fail',
//         message: errorMessage,
//         debug: process.env.NODE_ENV === 'development' ? {
//           providedCode: code,
//           error: validationError.message
//         } : undefined
//       });
//     }
//   } catch (error) {
//     console.error('2FA Verification Error:', error);
//     next(error);
//   }
// };

/**
 * Disable 2FA for a user
 */
// exports.disableTwoFactor = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
    
//     // Disable 2FA
//     await twoFactorService.disableTwoFactor(userId);
    
//     res.status(200).json({
//       status: 'success',
//       message: 'Two-factor authentication has been disabled'
//     });
//   } catch (error) {
//     console.error('2FA Disable Error:', error);
//     next(error);
//   }
// };

/**
 * Get recovery codes
 */
exports.getRecoveryCodes = async (req, res, next) => {
  try {
    // Check if 2FA is enabled
    if (!req.user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'fail',
        message: 'Two-factor authentication is not enabled'
      });
    }
    
    // Generate new recovery codes
    const recoveryCodes = await twoFactorService.generateNewRecoveryCodes(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        recoveryCodes
      }
    });
  } catch (error) {
    console.error('Get Recovery Codes Error:', error);
    next(error);
  }
};

/**
 * Regenerate recovery codes
 */
exports.regenerateRecoveryCodes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    // Verify password
    const user = await User.findById(userId).select('+password');
    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Current password is incorrect'
      });
    }
    
    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'fail',
        message: 'Two-factor authentication is not enabled'
      });
    }
    
    // Generate new recovery codes
    const recoveryCodes = await twoFactorService.generateNewRecoveryCodes(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        recoveryCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Additions to src/api/auth/controller.js

/**
 * Export the user's data
 */
exports.exportData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user data without sensitive fields
    const user = await User.findById(userId);
    
    // Get user's transactions
    const transactions = await Transaction.find({ user: userId });
    
    // Get user's bets
    const createdBets = await Bet.find({ creator: userId });
    const participatedBets = await Bet.find({ 'participants.user': userId });
    
    // Assemble the export data
    const exportData = {
      userProfile: {
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        balance: user.balance,
        createdAt: user.createdAt
      },
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
    
    res.status(200).json({
      status: 'success',
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};