// src/services/auth/two-factor.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../../models/User');
const redis = require("../../utils/redis")
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
  
  // Generate a new secret with explicit parameters
  const secret = speakeasy.generateSecret({
    name: `ESports Betting:${email}`,
    length: 20,
    issuer: 'ESports Betting',
    encoding: 'base32',
    digits: 6 // Explicitly set 6 digits
  });
  
  
  
  // Generate recovery codes
  const recoveryCodes = Array(8).fill().map(() => 
    crypto.randomBytes(10).toString('hex').toUpperCase().match(/.{4}/g).join('-')
  );
  
  try {
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
    
    // Verify the secret has been saved correctly
    const updatedUser = await User.findById(userId).select('+twoFactorSecret');
    console.log(`Stored secret in DB: ${updatedUser.twoFactorSecret}`);

   

    
    const storedSecret = updatedUser.twoFactorSecret ? String(updatedUser.twoFactorSecret).trim().toLowerCase() : '';
    const generatedSecret = secret.base32 ? String(secret.base32).trim().toLowerCase() : '';

    // if (storedSecret !== generatedSecret) {
    //   console.error('Secret mismatch between generated and stored values!', { storedSecret, generatedSecret });
    //   throw new AppError('Failed to save 2FA secret correctly', 500);
    // }

    
    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCodeUrl,
      recoveryCodes
    };
  } catch (error) {
    console.error('Error saving 2FA secret:', error);
    throw new AppError('Failed to save 2FA settings', 500);
  }
};

/**
 * Verify and enable 2FA
 */
// Update this function in backend/src/services/auth/two-factor.js

// const verifyAndEnableTwoFactor = async (userId, token) => {
  
  
//   // Find user
//   const user = await User.findById(userId).select('+twoFactorSecret');
//   if (!user) {
//     console.error(`User not found: ${userId}`);
//     throw new AppError('User not found', 404);
//   }
  
//   // If no secret is stored, 2FA setup was not initiated
//   if (!user.twoFactorSecret) {
//     console.error(`No 2FA secret found for user: ${userId}`);
//     throw new AppError('Two-factor authentication setup not initiated', 400);
//   }
  

//   // Clean the token - remove any spaces or non-digit characters
//   const cleanToken = token.replace(/\D/g, '');

  
//   // Generate the current expected token for debugging
//   const expectedToken = speakeasy.totp({
//     secret: user.twoFactorSecret,
//     encoding: 'base32'
//   });

  
//   // Try verification with a larger window to account for time drift
//   // Window size of 4 allows for time skew of about +/- 2 minutes
//   let verified = speakeasy.totp.verify({
//     secret: user.twoFactorSecret,
//     encoding: 'base32',
//     token: cleanToken,
//     window: 4
//   });

  
//   // If not verified yet, try with different encoding options
//   if (!verified) {
//     // Try with ASCII encoding
//     verified = speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32', 
//       token: cleanToken,
//       window: 4
//     });
   
//   }
  
//   // If still not verified, try with a more explicit approach
//   if (!verified) {
//     const currentTime = Math.floor(Date.now() / 1000);
   
    
//     // Try with an even larger window and explicit time
//     verified = speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32',
//       token: cleanToken,
//       time: currentTime,
//       window: 6, // Increase to +/- 3 minutes
//       digits: 6 // Explicitly set digits to 6
//     });
//     console.log(`Verification with explicit time and larger window: ${verified}`);
//   }
  
//   if (!verified) {
//     console.error(`Verification failed for user: ${userId}, token: ${cleanToken}`);
//     throw new AppError('Invalid verification code. Please try again with a new code from your authenticator app.', 400);
//   }
  
//   console.log(`Verification successful for user: ${userId}`);
  
//   try {
//     // Enable 2FA for the user with updated approach
//     await User.findByIdAndUpdate(
//       userId,
//       { twoFactorEnabled: true },
//       { new: true }
//     );
  
//     console.log(`2FA enabled for user: ${userId}`);
//     return true;
//   } catch (dbError) {
//     console.error(`Database error when enabling 2FA: ${dbError.message}`);
//     throw new AppError('Failed to enable 2FA due to a database error', 500);
//   }
// };
// src/services/auth/two-factor.js - Update verify and enable function

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
  
  // Clean the token - remove any spaces or non-digit characters
  const cleanToken = token.replace(/\D/g, '');
  
  // Use a smaller window of 1 (current + previous period only)
  let verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: cleanToken,
    window: 1 // Reduced from previous values
  });
  
  if (!verified) {
    throw new AppError('Invalid verification code. Please try again with a new code from your authenticator app.', 400);
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
// const verifyTwoFactorToken = async (userId, token, isRecoveryCode = false) => {
//   console.log(`Verifying 2FA login for user: ${userId}, token: ${token}, isRecoveryCode: ${isRecoveryCode}`);
  
//   // Find user
//   const user = await User.findById(userId).select('+twoFactorSecret +twoFactorRecoveryCodes');
//   if (!user) {
//     console.error(`User not found: ${userId}`);
//     throw new AppError('User not found', 404);
//   }
  
//   // Check if 2FA is enabled
//   if (!user.twoFactorEnabled || !user.twoFactorSecret) {
//     console.error(`2FA not enabled for user: ${userId}`);
//     throw new AppError('Two-factor authentication is not enabled for this user', 400);
//   }
  
//   console.log(`User has 2FA enabled, secret: ${user.twoFactorSecret}`);
  
//   // Check if we're using a recovery code
//   if (isRecoveryCode || (token.includes('-') && token.length > 10)) {
//     console.log(`Attempting recovery code verification`);
//     // Normalize the code for comparison
//     const normalizedCode = token.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
//     console.log(`Normalized recovery code: ${normalizedCode}`);
    
//     // Log all recovery codes for debugging
//     console.log('Available recovery codes:');
//     user.twoFactorRecoveryCodes.forEach((code, index) => {
//       const normalizedSavedCode = code.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
//       console.log(`[${index}] ${code} (normalized: ${normalizedSavedCode})`);
//     });
    
//     // Find the code in the user's recovery codes (also normalize them)
//     const codeIndex = user.twoFactorRecoveryCodes.findIndex(
//       code => code.replace(/\s+/g, '').replace(/-/g, '').toUpperCase() === normalizedCode
//     );
    
//     console.log(`Recovery code index found: ${codeIndex}`);
    
//     if (codeIndex !== -1) {
//       // Remove the used code
//       const updatedCodes = [...user.twoFactorRecoveryCodes];
//       updatedCodes.splice(codeIndex, 1);
      
//       await User.findByIdAndUpdate(userId, {
//         twoFactorRecoveryCodes: updatedCodes
//       }, { new: true });
      
//       console.log(`Recovery code used and removed for user: ${userId}`);
//       return true;
//     }
    
//     console.log(`Invalid recovery code for user: ${userId}`);
//     return false;
//   }
  
//   console.log(`Attempting TOTP code verification`);
//   // Clean the token
//   const cleanToken = token.replace(/\s+/g, '');
//   console.log(`Cleaned TOTP token: ${cleanToken}`);
  
//   // Generate the current expected token for debugging
//   const expectedToken = speakeasy.totp({
//     secret: user.twoFactorSecret,
//     encoding: 'base32'
//   });
//   console.log(`Current expected token: ${expectedToken}`);
  
//   // Try verification with various windows
//   let verified = false;
  
//   // Try with window = 0 (exact match)
//   verified = speakeasy.totp.verify({
//     secret: user.twoFactorSecret,
//     encoding: 'base32',
//     token: cleanToken,
//     window: 0
//   });
//   console.log(`Verification with window=0: ${verified}`);
  
//   // If not verified, try with window = 1
//   if (!verified) {
//     verified = speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32',
//       token: cleanToken,
//       window: 1
//     });
//     console.log(`Verification with window=1: ${verified}`);
//   }
  
//   // If still not verified, try with window = 2
//   if (!verified) {
//     verified = speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32',
//       token: cleanToken,
//       window: 2
//     });
//     console.log(`Verification with window=2: ${verified}`);
//   }
  
//   // Try with explicit time parameter as well
//   if (!verified) {
//     const currentTime = Math.floor(Date.now() / 1000);
//     console.log(`Current time in seconds: ${currentTime}`);
    
//     verified = speakeasy.totp.verify({
//       secret: user.twoFactorSecret,
//       encoding: 'base32',
//       token: cleanToken,
//       time: currentTime,
//       window: 2
//     });
//     console.log(`Verification with explicit time and window=2: ${verified}`);
//   }
  
//   if (verified) {
//     console.log(`TOTP verification successful for user: ${userId}`);
//   } else {
//     console.log(`TOTP verification failed for user: ${userId}`);
//   }
  
//   return verified;
// };


// src/services/auth/two-factor.js - More secure verification

const verifyTwoFactorToken = async (userId, token, isRecoveryCode = false) => {
  // Find user
  const user = await User.findById(userId).select('+twoFactorSecret +twoFactorRecoveryCodes');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Check if we're using a recovery code
  if (isRecoveryCode || (token.includes('-') && token.length > 10)) {
    // Normalize the code for comparison
    const normalizedCode = token.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
    
    // Find the code in the user's recovery codes
    const codeIndex = user.twoFactorRecoveryCodes.findIndex(
      code => code.replace(/\s+/g, '').replace(/-/g, '').toUpperCase() === normalizedCode
    );
    
    if (codeIndex !== -1) {
      // Remove the used code
      const updatedCodes = [...user.twoFactorRecoveryCodes];
      updatedCodes.splice(codeIndex, 1);
      
      await User.findByIdAndUpdate(userId, {
        twoFactorRecoveryCodes: updatedCodes
      });
      
      return true;
    }
    
    return false;
  }
  
  // Clean the token
  const cleanToken = token.replace(/\s+/g, '');
  
  // IMPORTANT: Use a smaller window (1) to prevent replay attacks
  // A window of 1 allows the token from the previous 30-second period to be valid
  // This is usually sufficient to account for clock skew while remaining secure
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: cleanToken,
    window: 1 // Reduced from previous value of 4-6
  });
  
  // Add anti-replay protection by storing used tokens with a short TTL
  if (verified) {
    const tokenKey = `2fa:used:${userId}:${cleanToken}`;
    const exists = await redis.getAsync(tokenKey);
    
    if (exists) {
      // Token has been used before - reject it
      return false;
    }
    
    // Store this token as used for 2 minutes (longer than its validity period)
    await redis.setAsync(tokenKey, '1', 'EX 120');
  }
  
  return verified;
};
/**
 * Disable 2FA for a user
 */
const disableTwoFactor = async (userId) => {
  console.log(`Disabling 2FA for user: ${userId}`);
  
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    console.error(`User not found: ${userId}`);
    throw new AppError('User not found', 404);
  }
  
  // Disable 2FA
  await User.findByIdAndUpdate(userId, {
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    twoFactorRecoveryCodes: undefined
  }, { new: true });
  
  console.log(`2FA disabled for user: ${userId}`);
  return true;
};

/**
 * Generate new recovery codes for a user
 */
const generateNewRecoveryCodes = async (userId) => {
  console.log(`Generating new recovery codes for user: ${userId}`);
  
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    console.error(`User not found: ${userId}`);
    throw new AppError('User not found', 404);
  }
  
  // Check if 2FA is enabled
  if (!user.twoFactorEnabled) {
    console.error(`2FA not enabled for user: ${userId}`);
    throw new AppError('Two-factor authentication is not enabled for this user', 400);
  }
  
  // Generate new recovery codes
  const recoveryCodes = Array(8).fill().map(() => 
    crypto.randomBytes(10).toString('hex').toUpperCase().match(/.{4}/g).join('-')
  );
  
  console.log(`Generated ${recoveryCodes.length} new recovery codes`);
  
  // Update user's recovery codes
  await User.findByIdAndUpdate(userId, {
    twoFactorRecoveryCodes: recoveryCodes
  }, { new: true });
  
  console.log(`Recovery codes saved for user: ${userId}`);
  return recoveryCodes;
};

module.exports = {
  generateTotpSecret,
  verifyAndEnableTwoFactor,
  verifyTwoFactorToken,
  disableTwoFactor,
  generateNewRecoveryCodes
};