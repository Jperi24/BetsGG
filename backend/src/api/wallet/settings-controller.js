// src/api/wallet/settings-controller.js
const User = require('../../models/User');
const { AppError } = require('../../middleware/error');
const walletService = require('../../services/wallet');
const Web3 = require('web3');

/**
 * Get wallet settings
 */
exports.getWalletSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user with wallet address
    const user = await User.findById(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Get saved wallet addresses
    // In a real app, you would store multiple wallet addresses per user
    const walletAddresses = [];
    
    if (user.walletAddress) {
      walletAddresses.push({
        address: user.walletAddress,
        network: 'ethereum',
        isDefault: true,
        label: 'Primary wallet'
      });
    }
    
    // Get transaction preferences (defaults for now)
    const transactionPreferences = {
      defaultCurrency: 'ETH',
      defaultNetwork: 'ethereum',
      autoWithdrawal: false,
      withdrawalThreshold: 0,
      gasPreference: 'standard'
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        walletAddresses,
        transactionPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a wallet address
 */
exports.addWalletAddress = async (req, res, next) => {
  try {
    const { walletAddress, network, label } = req.body;
    
    // Validate wallet address
    const web3 = new Web3();
    const isValidAddress = web3.utils.isAddress(walletAddress);
    
    if (!isValidAddress) {
      return next(new AppError('Invalid wallet address', 400));
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // In a real app, you would store multiple wallet addresses
    // For now, we'll just update the single address on the user model
    user.walletAddress = walletAddress;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Wallet address added successfully',
      data: {
        walletAddress: {
          address: walletAddress,
          network: network || 'ethereum',
          isDefault: true,
          label: label || 'Primary wallet'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a wallet address
 */
exports.removeWalletAddress = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if this is the user's wallet
    if (user.walletAddress !== walletAddress) {
      return next(new AppError('Wallet address not found', 404));
    }
    
    // Remove wallet
    user.walletAddress = undefined;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Wallet address removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update transaction preferences
 */
exports.updateTransactionPreferences = async (req, res, next) => {
  try {
    const { 
      defaultCurrency, 
      defaultNetwork, 
      autoWithdrawal, 
      withdrawalThreshold,
      gasPreference 
    } = req.body;
    
    // Validate inputs
    if (defaultCurrency && !['ETH', 'BASE', 'SOL', 'USDC'].includes(defaultCurrency)) {
      return next(new AppError('Invalid currency', 400));
    }
    
    if (defaultNetwork && !['ethereum', 'base', 'solana'].includes(defaultNetwork)) {
      return next(new AppError('Invalid network', 400));
    }
    
    if (withdrawalThreshold !== undefined && withdrawalThreshold < 0) {
      return next(new AppError('Withdrawal threshold cannot be negative', 400));
    }
    
    if (gasPreference && !['low', 'standard', 'high'].includes(gasPreference)) {
      return next(new AppError('Invalid gas preference', 400));
    }
    
    // In a real app, you would store these preferences in a model
    // For now, we'll just return success
    
    res.status(200).json({
      status: 'success',
      message: 'Transaction preferences updated successfully',
      data: {
        transactionPreferences: {
          defaultCurrency: defaultCurrency || 'ETH',
          defaultNetwork: defaultNetwork || 'ethereum',
          autoWithdrawal: autoWithdrawal !== undefined ? autoWithdrawal : false,
          withdrawalThreshold: withdrawalThreshold !== undefined ? withdrawalThreshold : 0,
          gasPreference: gasPreference || 'standard'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};