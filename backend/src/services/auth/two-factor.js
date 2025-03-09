// src/services/auth/two-factor.js
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');

/**
 * Generate a new TOTP secret for a user
 * @param {string} userId - User ID
 * @param {string} email - User email (for identification in authenticator app)
 * @returns {Object} - Contains secret, QR code data URL, and recovery codes
 */
const generateTotpSecret = async (userId, email) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Generate a new secret
  const secret = speakeasy.generateSecret({
    name: `ESports Betting:${email}`,
    length: 20
  });
  
  // Generate recovery codes
  const recoveryCodes = Array(8).fill().map(() => 
    crypto.randomBytes(10).toString('hex').toUpperCase().match(/.{4}/g).join('-')
  );
  
  // Hash recovery codes for storage
  const hashedRecoveryCodes = recoveryCodes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  // Generate QR code data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  // Store secret and recovery codes in user document
  user.twoFactorSecret = secret.base32;
  user.twoFactorEnabled = false; // Will be enabled after verification
  user.twoFactorRecoveryCodes = hashedRecoveryCodes;
  await user.save({ validateBeforeSave: false });
  
  return {
    secret: secret.base32,
    qrCodeUrl,
    recoveryCodes
  };
};

/**
 * Verify a TOTP token and enable 2FA for the user
 * @param {string} userId - User ID
 * @param {string} token - TOTP token from authenticator app
 * @returns {boolean} - Success status
 */
const verifyAndEnableTwoFactor = async (userId, token) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // If no secret is stored, 2FA setup was not initiated
  if (!user.twoFactorSecret) {
    throw new AppError('Two-factor authentication setup not initiated', 400);
  }
  
  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 period before/after for clock drift
  });
  
  if (!verified) {
    throw new AppError('Invalid verification code', 400);
  }
  
  // Enable 2FA for the user
  user.twoFactorEnabled = true;
  await user.save();
  
  return true;
};

/**
 * Verify a TOTP token for login
 * @param {string} userId - User ID
 * @param {string} token - TOTP token from authenticator app
 * @returns {boolean} - Verification result
 */
const verifyTwoFactorToken = async (userId, token) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Check if token is a recovery code
  if (token.includes('-') && token.length > 10) {
    return await verifyRecoveryCode(user, token);
  }
  
  // Verify the TOTP token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 period before/after for clock drift
  });
  
  return verified;
};

/**
 * Verify a recovery code
 * @param {Object} user - User document
 * @param {string} code - Recovery code
 * @returns {boolean} - Verification result
 */
const verifyRecoveryCode = async (user, code) => {
  // Remove any spaces or dashes for consistent comparison
  const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
  
  // Hash the code for comparison
  const hashedCode = crypto.createHash('sha256').update(normalizedCode).digest('hex');
  
  // Check if the code exists in the user's recovery codes
  const codeIndex = user.twoFactorRecoveryCodes.indexOf(hashedCode);
  
  if (codeIndex === -1) {
    return false;
  }
  
  // Remove the used code
  user.twoFactorRecoveryCodes.splice(codeIndex, 1);
  await user.save();
  
  return true;
};

/**
 * Disable 2FA for a user
 * @param {string} userId - User ID
 * @param {string} password - Current password for verification
 * @returns {boolean} - Success status
 */
const disableTwoFactor = async (userId, password) => {
  // Find user
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect password', 401);
  }
  
  // Disable 2FA
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorRecoveryCodes = undefined;
  await user.save();
  
  return true;
};

/**
 * Generate new recovery codes for a user
 * @param {string} userId - User ID
 * @param {string} password - Current password for verification
 * @returns {Array} - New recovery codes
 */
const generateNewRecoveryCodes = async (userId, password) => {
  // Find user
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect password', 401);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Generate new recovery codes
  const recoveryCodes = Array(8).fill().map(() => 
    crypto.randomBytes(10).toString('hex').toUpperCase().match(/.{4}/g).join('-')
  );
  
  // Hash recovery codes for storage
  const hashedRecoveryCodes = recoveryCodes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  // Save new recovery codes
  user.twoFactorRecoveryCodes = hashedRecoveryCodes;
  await user.save();
  
  return recoveryCodes;
};

module.exports = {
  generateTotpSecret,
  verifyAndEnableTwoFactor,
  verifyTwoFactorToken,
  disableTwoFactor,
  generateNewRecoveryCodes
};