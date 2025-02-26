// src/services/wallet/index.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const Transaction = require('../../models/Transactions');
const { AppError } = require('../../middleware/error');
const Web3 = require('web3');
const ethers = require('ethers');

/**
 * Helper to validate wallet addresses
 */
const validateWalletAddress = (address, network) => {
  if (network === 'ethereum' || network === 'base') {
    const web3 = new Web3();
    return web3.utils.isAddress(address);
  } else if (network === 'solana') {
    // Simple regex check for Solana address format
    // In a production app, you'd use a proper Solana library
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  return false;
};

/**
 * Get provider for the given network
 */
const getProvider = (network) => {
  switch (network) {
    case 'ethereum':
      return new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    case 'base':
      return new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL);
    case 'solana':
      // In a real app, you'd use a Solana-specific library here
      throw new AppError('Solana not yet implemented', 501);
    default:
      throw new AppError(`Unsupported network: ${network}`, 400);
  }
};

/**
 * Get user balance
 */
const getUserBalance = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user.balance;
};

/**
 * Get user transactions with pagination
 */
const getUserTransactions = async (userId, type = null, limit = 20, skip = 0) => {
  // Build query
  const query = { user: userId };
  if (type) {
    query.type = type;
  }
  
  // Find transactions
  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Count total documents for pagination
  const total = await Transaction.countDocuments(query);
  
  return { transactions, total };
};

/**
 * Create a deposit transaction
 */
const createDepositTransaction = async (userId, amount, currency, walletAddress, network) => {
  // Validate input
  if (amount < 0.0001) {
    throw new AppError('Amount must be at least 0.0001', 400);
  }
  
  if (!['ETH', 'BASE', 'SOL', 'USDC'].includes(currency)) {
    throw new AppError('Invalid currency', 400);
  }
  
  if (!['ethereum', 'base', 'solana'].includes(network)) {
    throw new AppError('Invalid network', 400);
  }
  
  // Validate wallet address format
  if (!validateWalletAddress(walletAddress, network)) {
    throw new AppError('Invalid wallet address for selected network', 400);
  }
  
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Create transaction record
  const transaction = new Transaction({
    user: userId,
    type: 'deposit',
    amount,
    currency,
    walletAddress,
    network,
    status: 'pending',
    description: `Deposit of ${amount} ${currency} from ${walletAddress}`
  });
  
  await transaction.save();
  
  return transaction;
};

/**
 * Process a deposit after blockchain confirmation
 */
const processDeposit = async (transactionId, txHash) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the transaction
    const transaction = await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }
    
    if (transaction.status !== 'pending') {
      throw new AppError('Transaction already processed', 400);
    }
    
    // Verify the transaction on the blockchain
    // This would typically be done by a separate service that monitors the blockchain
    // For simplicity, we'll just verify the hash format here
    if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new AppError('Invalid transaction hash', 400);
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.txHash = txHash;
    await transaction.save({ session });
    
    // Update user balance
    const user = await User.findById(transaction.user).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    user.balance += transaction.amount;
    await user.save({ session });
    
    await session.commitTransaction();
    
    return { transaction, newBalance: user.balance };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Create a withdrawal transaction
 */
const createWithdrawalTransaction = async (userId, amount, currency, walletAddress, network) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validate input
    if (amount < 0.0001) {
      throw new AppError('Amount must be at least 0.0001', 400);
    }
    
    if (!['ETH', 'BASE', 'SOL', 'USDC'].includes(currency)) {
      throw new AppError('Invalid currency', 400);
    }
    
    if (!['ethereum', 'base', 'solana'].includes(network)) {
      throw new AppError('Invalid network', 400);
    }
    
    // Validate wallet address format
    if (!validateWalletAddress(walletAddress, network)) {
      throw new AppError('Invalid wallet address for selected network', 400);
    }
    
    // Find user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Check balance
    if (user.balance < amount) {
      throw new AppError('Insufficient balance', 400);
    }
    
    // Deduct from user balance immediately to prevent double-spending
    user.balance -= amount;
    await user.save({ session });
    
    // Calculate fee (example: 0.1% fee)
    const fee = amount * 0.001;
    const netAmount = amount - fee;
    
    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      amount,
      fee,
      currency,
      walletAddress,
      network,
      status: 'pending',
      description: `Withdrawal of ${netAmount} ${currency} to ${walletAddress}`
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    return { transaction, newBalance: user.balance };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process a withdrawal (admin function)
 */
const processWithdrawal = async (transactionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the transaction
    const transaction = await Transaction.findById(transactionId).session(session);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }
    
    if (transaction.status !== 'pending') {
      throw new AppError('Transaction already processed', 400);
    }
    
    if (transaction.type !== 'withdrawal') {
      throw new AppError('Transaction is not a withdrawal', 400);
    }
    
    // In a real application, you would:
    // 1. Get a wallet instance with the platform's private key
    // 2. Send the withdrawal to the user's wallet address
    // 3. Update the transaction with the tx hash
    
    // For this prototype, we'll just simulate success
    transaction.status = 'completed';
    transaction.txHash = `0x${generateRandomHash()}`; // Fake hash
    await transaction.save({ session });
    
    await session.commitTransaction();
    
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    
    // If failed, refund the user
    if (error.statusCode !== 404) {
      try {
        const refundSession = await mongoose.startSession();
        refundSession.startTransaction();
        
        const transaction = await Transaction.findById(transactionId).session(refundSession);
        if (transaction) {
          transaction.status = 'failed';
          await transaction.save({ session: refundSession });
          
          // Refund user
          const user = await User.findById(transaction.user).session(refundSession);
          if (user) {
            user.balance += transaction.amount;
            await user.save({ session: refundSession });
            
            // Create refund transaction record
            const refundTransaction = new Transaction({
              user: transaction.user,
              type: 'refund',
              amount: transaction.amount,
              currency: transaction.currency,
              status: 'completed',
              description: `Refund for failed withdrawal: ${transaction._id}`
            });
            
            await refundTransaction.save({ session: refundSession });
          }
          
          await refundSession.commitTransaction();
        }
      } catch (refundError) {
        // If even the refund fails, log it - this needs manual intervention
        console.error('Failed to refund failed withdrawal:', refundError);
      }
    }
    
    throw error;
  }
};

/**
 * Helper function to generate a random hash
 */
const generateRandomHash = () => {
  return Array(64)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
};

module.exports = {
  getUserBalance,
  getUserTransactions,
  createDepositTransaction,
  processDeposit,
  createWithdrawalTransaction,
  processWithdrawal
};