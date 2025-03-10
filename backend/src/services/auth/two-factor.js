// src/services/auth/two-factor.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');

/**
 * Generate a new TOTP secret for a user
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
  
  // Use findByIdAndUpdate to avoid version conflicts
  await User.findByIdAndUpdate(
    userId,
    {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
      twoFactorRecoveryCodes: recoveryCodes
    },
    { new: true }
  );
  
  // Generate QR code data URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCodeUrl,
    recoveryCodes
  };
};

/**
 * Verify and enable 2FA
 */
const verifyAndEnableTwoFactor = async (userId, token) => {
  // Find user
  const user = await User.findById(userId).select('+twoFactorSecret');
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
  await User.findByIdAndUpdate(
    userId,
    { twoFactorEnabled: true },
    { new: true }
  );
  
  return true;
};

/**
 * Verify a TOTP token for login
 */
const verifyTwoFactorToken = async (userId, token) => {
  // Find user
  const user = await User.findById(userId).select('+twoFactorSecret +twoFactorRecoveryCodes');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Check if token is a recovery code
  if (token.includes('-') && token.length > 10) {
    // Normalize the code for comparison
    const normalizedCode = token.replace(/\s+/g, '').toUpperCase();
    
    // Check if the code exists in the user's recovery codes
    const codeIndex = user.twoFactorRecoveryCodes.findIndex(
      code => code.replace(/\s+/g, '').toUpperCase() === normalizedCode
    );
    
    if (codeIndex !== -1) {
      // Remove the used code
      const updatedCodes = [...user.twoFactorRecoveryCodes];
      updatedCodes.splice(codeIndex, 1);
      
      await User.findByIdAndUpdate(userId, {
        twoFactorRecoveryCodes: updatedCodes
      }, { new: true });
      
      return true;
    }
    
    return false;
  }
  
  // Verify the TOTP token
  return speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 period before/after for clock drift
  });
};

/**
 * Disable 2FA for a user
 */
const disableTwoFactor = async (userId) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Disable 2FA
  await User.findByIdAndUpdate(userId, {
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    twoFactorRecoveryCodes: undefined
  }, { new: true });
  
  return true;
};

/**
 * Generate new recovery codes for a user
 */
const generateNewRecoveryCodes = async (userId) => {
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Generate new recovery codes
  const recoveryCodes = Array(8).fill().map(() => 
    crypto.randomBytes(10).toString('hex').toUpperCase().match(/.{4}/g).join('-')
  );
  
  // Update user's recovery codes
  await User.findByIdAndUpdate(userId, {
    twoFactorRecoveryCodes: recoveryCodes
  }, { new: true });
  
  return recoveryCodes;
};

module.exports = {
  generateTotpSecret,
  verifyAndEnableTwoFactor,
  verifyTwoFactorToken,
  disableTwoFactor,
  generateNewRecoveryCodes
};