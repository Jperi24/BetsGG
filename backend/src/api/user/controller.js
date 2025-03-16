// src/api/user/controller.js
const { AppError } = require('../../middleware/error');
const accountService = require('../../services/account');

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, currentPassword } = req.body;
    
    if (!currentPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is required to make changes'
      });
    }
    
    // Create update data object
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No changes detected'
      });
    }
    
    // Update user profile using the service
    const updatedUser = await accountService.updateUserProfile(
      req.user.id,
      updateData,
      currentPassword
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
 * Export user data
 */
exports.exportUserData = async (req, res, next) => {
  try {
    // Get export data using the service
    const exportData = await accountService.exportUserData(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password is required to delete your account'
      });
    }
    
    // Delete account using the service
    await accountService.deleteUserAccount(req.user.id, password);
    
    res.status(200).json({
      status: 'success',
      message: 'Your account has been permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};