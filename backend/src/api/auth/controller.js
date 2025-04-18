// src/api/auth/controller.js - Updated with cookie-based auth
const User = require('../../models/User');

const crypto = require('crypto');
const { AppError } = require('../../middleware/error');
const passwordResetService = require('../../services/auth/password-reset');
const twoFactorService = require('../../services/auth/two-factor');
const emailService = require('../../services/email');
const sessionService = require('../../services/auth/session');
const notificationService = require('../../services/notification');
const cookieAuth = require('../../middleware/cookie-auth');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');

// Helper function to create and send token
// src/api/auth/controller.js - Update createSendToken function

// const createSendToken = async (user, statusCode, req, res, options = {}) => {
//   try {
//     // Generate token based on 2FA status
//     const token = options.temp2FA 
//       ? user.generateTempJWT() 
//       : user.generateJWT();
    
//     // Create session with error handling
//     let sessionId;
//     try {
//       // Extract device info from request
//       sessionId = await sessionService.createSession(user.id, req);
//     } catch (sessionError) {
//       console.error('Error creating session:', sessionError);
//       // Generate a fallback session ID to avoid breaking the login flow
//       sessionId = uuidv4();
//     }
    
//     // Generate CSRF token for protection against CSRF attacks
//     const csrfToken = await cookieAuth.generateCsrfToken(user.id);
    
//     // Set cookies: auth token (HTTP-only), session ID, and CSRF token
//     cookieAuth.setTokenCookie(res, token, {
//       tempToken: options.temp2FA,
//       sessionId
//     });
//     cookieAuth.setCsrfCookie(res, csrfToken);
    
//     // Remove sensitive fields from output
//     user.password = undefined;
//     user.twoFactorSecret = undefined;
//     user.twoFactorRecoveryCodes = undefined;
    
//     // Return response with user data and auth details
//     res.status(statusCode).json({
//       status: 'success',
//       csrfToken,
//       sessionId,
//       requires2FA: user.twoFactorEnabled && options.temp2FA,
//       tempToken: options.temp2FA ? token : undefined,
//       data: {
//         user
//       }
//     });
//   } catch (error) {
//     console.error('Error in createSendToken:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'An error occurred during authentication. Please try again.'
//     });
//   }
// };

// Update in src/api/auth/controller.js - createSendToken function

const createSendToken = async (user, statusCode, req, res, options = {}) => {
  try {
    // Generate token based on 2FA status
    const token = options.temp2FA 
      ? user.generateTempJWT() 
      : user.generateJWT();
    
    // Create session with error handling
    let sessionId;
    try {
      // Extract device info from request
      sessionId = await sessionService.createSession(user.id, req);
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      // Generate a fallback session ID to avoid breaking the login flow
      sessionId = uuidv4();
    }
    
    // Generate CSRF token for protection against CSRF attacks
    // Update to use session-based CSRF token for consistency
    let csrfToken;
    
    if (options.temp2FA) {
      // For 2FA flow, use session-based CSRF token
      csrfToken = await cookieAuth.initializeSessionCsrfToken(sessionId, res);
    } else {
      // For normal flow, use user-based CSRF token
      csrfToken = await cookieAuth.generateCsrfToken(user.id);
      cookieAuth.setCsrfCookie(res, csrfToken);
    }
    
    // Set cookies: auth token (HTTP-only), session ID
    cookieAuth.setTokenCookie(res, token, {
      tempToken: options.temp2FA,
      sessionId
    });
    
    // Remove sensitive fields from output
    user.password = undefined;
    user.twoFactorSecret = undefined;
    user.twoFactorRecoveryCodes = undefined;
    
    // Return response with user data and auth details
    res.status(statusCode).json({
      status: 'success',
      csrfToken,
      sessionId,
      requires2FA: user.twoFactorEnabled && options.temp2FA,
      tempToken: options.temp2FA ? token : undefined,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error in createSendToken:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during authentication. Please try again.'
    });
  }
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
    
    // Send welcome notification
    await notificationService.sendWelcomeNotification(newUser._id, username);
    
    // Generate JWT and send response with HTTP-only cookie
    await createSendToken(newUser, 201, req, res);
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
        message: 'Please provide both email and password'
      });
    }
    
    // Find user by email and include 2FA status
    const user = await User.findOne({ email }).select('+password +twoFactorEnabled');
    
    // Check if user exists
    if (!user || !(await user.comparePassword(password))) {
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
      await createSendToken(user, 200, req, res, { temp2FA: true });
    } else {
      // If 2FA is not enabled, generate JWT and send response
      await createSendToken(user, 200, req, res);
    }
  } catch (error) {
    console.error('Login Error:', error);
    next(error);
  }
};

// backend/src/api/auth/controller.js
// Replace the existing logout function with this improved version

exports.logout = async (req, res, next) => {
  try {
    console.log('Logout initiated for user:', req.user?.id || 'No user ID');
    console.log('Session ID from cookie:', req.cookies.session_id || 'None');
    
    // Get session ID from cookie
    const sessionId = req.cookies.session_id;
    
    // If sessionId is provided, invalidate just that session
    if (sessionId) {
      console.log(`Invalidating session: ${sessionId}`);
      await sessionService.invalidateSession(sessionId);
    } else if (req.user) {
      // Otherwise invalidate all sessions for this user
      console.log(`Invalidating all sessions for user: ${req.user.id}`);
      await sessionService.invalidateAllUserSessions(req.user.id);
    }
    
    // Clear all auth-related cookies with proper settings
    clearAllAuthCookies(res);
    
    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    next(error);
  }
};

// New helper function to ensure consistent cookie clearing
function clearAllAuthCookies(res) {
  // Common cookie options
  const cookieOptions = {
    // Using '/' ensures the cookie is cleared for the entire domain
    path: '/',
    // Setting an expiry date in the past forces immediate deletion
    expires: new Date(0),
    // Match the security settings used when setting cookies
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  console.log('Clearing auth_token cookie');
  res.clearCookie('auth_token', {
    ...cookieOptions,
    httpOnly: true // This must match how it was set
  });
  
  console.log('Clearing session_id cookie');
  res.clearCookie('session_id', {
    ...cookieOptions,
    httpOnly: true // This should match how it was set
  });
  
  console.log('Clearing csrf_token cookie');
  res.clearCookie('csrf_token', {
    ...cookieOptions,
    httpOnly: false // This should match how it was set
  });
  
  // Clear any other auth-related cookies
  res.clearCookie('XSRF-TOKEN', cookieOptions);
  
  // Log cookie clearing
  console.log('All auth cookies cleared');
}

// Verify 2FA token
// In backend/src/api/auth/controller.js
exports.verifyTwoFactor = async (req, res, next) => {
  try {
    console.log('Received 2FA verification request:');
    console.log('Body:', JSON.stringify(req.body));
    
    const { token, code, isRecoveryCode } = req.body;
    
    if (!token || !code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Verification token and code are required'
      });
    }

    // Add explicit logging to track the flow
    console.log('Starting 2FA verification process');
    
    // Step 1: ALWAYS use email lookup first if it looks like an email
    let user = null;
    if (typeof token === 'string' && token.includes('@')) {
      console.log('Token appears to be an email address, using email lookup');
      user = await User.findOne({ email: token }).select('+twoFactorSecret +twoFactorRecoveryCodes');
    } 
    
    // If we still don't have a user, check if token might be a valid ObjectId
    if (!user && /^[0-9a-fA-F]{24}$/.test(token)) {
      console.log('Token appears to be an ObjectId, using findById');
      user = await User.findById(token).select('+twoFactorSecret +twoFactorRecoveryCodes');
    }
    
    // Last resort: try JWT decode
    if (!user) {
      try {
        console.log('Attempting to decode token as JWT');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          console.log('Found user ID in JWT:', decoded.id);
          user = await User.findById(decoded.id).select('+twoFactorSecret +twoFactorRecoveryCodes');
        }
      } catch (error) {
        console.log('Token is not a valid JWT');
        // Failed to decode JWT, continue with null user
      }
    }
    
    if (!user) {
      console.log('No user found with provided token');
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    console.log('Found user:', user._id);
    
    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      console.log('2FA not enabled for user');
      return res.status(400).json({
        status: 'fail',
        message: 'Two-factor authentication is not enabled for this user'
      });
    }
    
    // Verify 2FA code
    let isValid = false;
    
    if (isRecoveryCode || (typeof code === 'string' && code.includes('-') && code.length > 10)) {
      console.log('Verifying recovery code');
      
      // Validate recovery code
      const normalizedCode = code.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
      
      // Get recovery codes - ensure we have them
      const recoveryCodes = user.twoFactorRecoveryCodes || [];
      
      const codeIndex = recoveryCodes.findIndex(
        storedCode => storedCode.replace(/\s+/g, '').replace(/-/g, '').toUpperCase() === normalizedCode
      );
      
      if (codeIndex !== -1) {
        // Remove the used code
        const updatedCodes = [...recoveryCodes];
        updatedCodes.splice(codeIndex, 1);
        
        await User.findByIdAndUpdate(user._id, {
          twoFactorRecoveryCodes: updatedCodes
        });
        
        isValid = true;
      }
    } else {
      console.log('Verifying TOTP code');
      
      // Validate TOTP code
      const cleanToken = code.replace(/\s+/g, '');
      
      // Use the two-factor secret directly
      isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: cleanToken,
        window: 1
      });
    }
    
    if (!isValid) {
      console.log('Verification failed: Invalid code');
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid verification code'
      });
    }
    
    console.log('Verification successful! Generating token.');
    
    // If we get here, verification was successful, generate token
    await createSendToken(user, 200, req, res);
  } catch (error) {
    console.error('Error in verifyTwoFactor:', error);
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    // Generate a fresh CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(req.user.id);
    
    // Set the CSRF cookie
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    // User is already available in req.user from auth middleware
    res.status(200).json({
      status: 'success',
      csrfToken,
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
    const currentSessionId = req.cookies.session_id;
    await sessionService.invalidateAllUserSessions(user.id, [currentSessionId]);
    
    // Send notification
    await notificationService.sendPasswordChangedNotification(user.id);
    
    // Generate new token and send with HTTP-only cookie
    await createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// Forgot password
// exports.forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;
    
//     if (!email) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Please provide your email address'
//       });
//     }
    
//     // Generate reset token
//     const { resetToken, user } = await passwordResetService.generateResetToken(email);
    
//     try {
//       // Send password reset email
//       await emailService.sendPasswordResetEmail(email, resetToken, user.username);
      
//       res.status(200).json({
//         status: 'success',
//         message: 'Password reset link sent to your email'
//       });
//     } catch (error) {
//       // If email fails, revert the changes
//       user.passwordResetToken = undefined;
//       user.passwordResetExpires = undefined;
//       await user.save({ validateBeforeSave: false });
      
//       return res.status(500).json({
//         status: 'error',
//         message: 'Failed to send password reset email. Please try again later.'
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your email address'
      });
    }
    
    // Find user by email
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });
    
    // IMPORTANT: Always return the same response whether user exists or not
    // to prevent account enumeration
    if (!user) {
      // Still do some work to maintain consistent timing
      const dummyToken = crypto.randomBytes(32).toString('hex');
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
      
      // Return success message even if email doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset link was sent'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Save token to user document
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save({ validateBeforeSave: false });
    
    try {
      // Send password reset email
      await emailService.sendPasswordResetEmail(email, resetToken, user.username);
      
      res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset link was sent'
      });
    } catch (error) {
      // If email fails, revert the changes
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending the email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// Reset password
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
    
    // Log the user in with new token and HTTP-only cookie
    await createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// Other 2FA-related methods remain largely unchanged...
exports.getTwoFactorStatus = async (req, res, next) => {
  try {
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

exports.setupTwoFactor = async (req, res, next) => {
  try {
    
    const userId = req.user.id;
    const email = req.user.email;
    console.log('2FA Setup Request:', {
          userId: req.user?.id || 'No user ID',
          isAuthenticated: !!req.user,
          userRole: req.user?.role || 'No role',
          headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
            'cookie': req.headers['cookie'] ? 'Present' : 'Missing'
          }
        });
    
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
    next(error);
  }
};
// Handle Google OAuth callback
// Fix for the googleAuthCallback function in src/api/auth/controller.js
// Modified createSendToken for Google Auth
const createSendTokenForOAuth = async (user, req, res) => {
  try {
    // Generate token
    const token = user.generateJWT();
    
    // Create session
    let sessionId;
    try {
      sessionId = await sessionService.createSession(user.id, req);
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      sessionId = uuidv4();
    }
    
    // Generate CSRF token
    const csrfToken = await cookieAuth.generateCsrfToken(user.id);
    
    // Set cookies: auth token (HTTP-only), session ID, and CSRF token
    cookieAuth.setTokenCookie(res, token, {
      sessionId
    });
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    // For OAuth flow, we don't send a JSON response, only set cookies
    // The redirect will happen after this function
  } catch (error) {
    console.error('Error in createSendTokenForOAuth:', error);
    throw error; // Let the calling function handle the error
  }
};

// Modified Google Auth Callback
exports.googleAuthCallback = async (req, res, next) => {
  try {
    // User will be attached to req by passport
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed&reason=no-user`);
    }
    
    try {
      // Use special OAuth token function that doesn't send a response
      await createSendTokenForOAuth(user, req, res);
      
      // Only after tokens are set, redirect to success page
      return res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
    } catch (tokenError) {
      console.error('Token creation error:', tokenError);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed&reason=token-error`);
    }
  } catch (error) {
    console.error('Google auth callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed&reason=general-error`);
  }
};

exports.verifyAndEnableTwoFactor = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const { code } = req.body;

    console.log('2FA Verification Request:', {
      userId: req.user?.id,
      hasCode: !!req.body.code,
      csrfToken: req.headers['x-csrf-token'] ? 'Present' : 'Missing'
    });
    
    await twoFactorService.verifyAndEnableTwoFactor(userId, code);
    
    // Get user with recovery codes
    const user = await User.findById(userId).select('+twoFactorRecoveryCodes');
    
    // Invalidate all existing tokens
    await user.invalidateAllTokens();
    
    // Invalidate all sessions except current
    const currentSessionId = req.cookies.session_id;
    await sessionService.invalidateAllUserSessions(userId, [currentSessionId]);
    
    // Generate new auth token and CSRF token
    const token = user.generateJWT();
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    
    // Set new cookies
    cookieAuth.setTokenCookie(res, token, { sessionId: currentSessionId });
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    // Send 2FA enabled notification
    await notificationService.send2FAEnabledNotification(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication has been enabled successfully',
      csrfToken,
      data: {
        recoveryCodes: user.twoFactorRecoveryCodes
      }
    });
  } catch (error) {
    next(error);
  }
};

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
    const currentSessionId = req.cookies.session_id;
    await sessionService.invalidateAllUserSessions(userId, [currentSessionId]);
    
    // Generate new auth token and CSRF token
    const token = user.generateJWT();
    const csrfToken = await cookieAuth.generateCsrfToken(userId);
    
    // Set new cookies
    cookieAuth.setTokenCookie(res, token, { sessionId: currentSessionId });
    cookieAuth.setCsrfCookie(res, csrfToken);
    
    // Send 2FA disabled notification
    await notificationService.send2FADisabledNotification(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication has been disabled',
      csrfToken
    });
  } catch (error) {
    next(error);
  }
};
///////////////////////////////////






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