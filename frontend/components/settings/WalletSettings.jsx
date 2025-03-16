'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  getWalletSettings, 
  addWalletAddress, 
  removeWalletAddress, 
  updateTransactionPreferences 
} from '@/lib/api/wallet-settings';
import { 
  Loader, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Wallet, 
  Plus,
  Trash,
  Save
} from 'lucide-react';

export default function WalletSettings() {
  const { user, updateUserData } = useAuth();
  
  // State
  const [walletAddresses, setWalletAddresses] = useState([]);
  const [transactionPreferences, setTransactionPreferences] = useState({
    defaultCurrency: 'ETH',
    defaultNetwork: 'ethereum',
    autoWithdrawal: false,
    withdrawalThreshold: 0,
    gasPreference: 'standard'
  });
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletNetwork, setNewWalletNetwork] = useState('ethereum');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [isRemovingWallet, setIsRemovingWallet] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Load wallet settings
  useEffect(() => {
    const loadWalletSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getWalletSettings();
        setWalletAddresses(response.data.walletAddresses);
        setTransactionPreferences(response.data.transactionPreferences);
      } catch (err) {
        setError(err.message || 'Failed to load wallet settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWalletSettings();
  }, []);
  
  // Handle adding a wallet address
  const handleAddWalletAddress = async (e) => {
    e.preventDefault();
    
    if (!newWalletAddress.trim()) {
      setError('Wallet address is required');
      return;
    }
    
    try {
      setIsAddingWallet(true);
      setError(null);
      
      const response = await addWalletAddress({
        walletAddress: newWalletAddress,
        network: newWalletNetwork,
        label: newWalletLabel || undefined
      });
      
      setWalletAddresses([...walletAddresses, response.data.walletAddress]);
      
      // Update user data if this is the user's first wallet
      if (walletAddresses.length === 0) {
        updateUserData({ walletAddress: newWalletAddress });
      }
      
      // Reset form
      setNewWalletAddress('');
      setNewWalletNetwork('ethereum');
      setNewWalletLabel('');
      
      // Show success message
      setSuccessMessage('Wallet address added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to add wallet address');
    } finally {
      setIsAddingWallet(false);
    }
  };
  
  // Handle removing a wallet address
  const handleRemoveWalletAddress = async (address) => {
    try {
      setIsRemovingWallet(true);
      setError(null);
      
      await removeWalletAddress(address);
      
      // Remove from state
      setWalletAddresses(walletAddresses.filter(w => w.address !== address));
      
      // Update user data if this was the user's wallet
      if (user?.walletAddress === address) {
        updateUserData({ walletAddress: null });
      }
      
      // Show success message
      setSuccessMessage('Wallet address removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove wallet address');
    } finally {
      setIsRemovingWallet(false);
    }
  };
  
  // Handle updating transaction preferences
  const handleUpdatePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      setError(null);
      
      await updateTransactionPreferences(transactionPreferences);
      
      // Show success message
      setSuccessMessage('Transaction preferences updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update transaction preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Wallet Settings | EsportsBets">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link 
              href="/settings"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Link>
          </div>
          
          <div className="flex items-center mb-6">
            <Wallet className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Wallet Settings</h1>
          </div>
          
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading wallet settings...</span>
            </div>
          ) : (
            <>
              {/* Wallet Addresses Section */}
              <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">Your Wallet Addresses</h2>
                  
                  {walletAddresses.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded text-sm text-gray-500">
                      You haven't connected any wallet addresses yet. Add one below.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {walletAddresses.map((wallet) => (
                        <div 
                          key={wallet.address}
                          className="flex items-center justify-between bg-gray-50 p-4 rounded"
                        >
                          <div>
                            <p className="font-mono text-sm text-gray-800">{wallet.address}</p>
                            <div className="mt-1 flex items-center space-x-4 text-xs">
                              <span className="text-gray-500">{wallet.network}</span>
                              {wallet.label && (
                                <span className="text-gray-500">{wallet.label}</span>
                              )}
                              {wallet.isDefault && (
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveWalletAddress(wallet.address)}
                            disabled={isRemovingWallet}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                            aria-label="Remove wallet"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add a New Wallet</h3>
                  
                  <form onSubmit={handleAddWalletAddress} className="space-y-4">
                    <div>
                      <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Wallet Address
                      </label>
                      <input
                        id="walletAddress"
                        type="text"
                        value={newWalletAddress}
                        onChange={(e) => setNewWalletAddress(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0x..."
                        disabled={isAddingWallet}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="walletNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                          Network
                        </label>
                        <select
                          id="walletNetwork"
                          value={newWalletNetwork}
                          onChange={(e) => setNewWalletNetwork(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          disabled={isAddingWallet}
                        >
                          <option value="ethereum">Ethereum</option>
                          <option value="base">Base</option>
                          <option value="solana">Solana</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="walletLabel" className="block text-sm font-medium text-gray-700 mb-1">
                          Label (Optional)
                        </label>
                        <input
                          id="walletLabel"
                          type="text"
                          value={newWalletLabel}
                          onChange={(e) => setNewWalletLabel(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="e.g. My Main Wallet"
                          disabled={isAddingWallet}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isAddingWallet || !newWalletAddress.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                      >
                        {isAddingWallet ? (
                          <>
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Wallet
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Transaction Preferences Section */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">Transaction Preferences</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                        Default Currency
                      </label>
                      <select
                        id="defaultCurrency"
                        value={transactionPreferences.defaultCurrency}
                        onChange={(e) => setTransactionPreferences({
                          ...transactionPreferences,
                          defaultCurrency: e.target.value
                        })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="ETH">ETH</option>
                        <option value="BASE">BASE</option>
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="defaultNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                        Default Network
                      </label>
                      <select
                        id="defaultNetwork"
                        value={transactionPreferences.defaultNetwork}
                        onChange={(e) => setTransactionPreferences({
                          ...transactionPreferences,
                          defaultNetwork: e.target.value
                        })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="ethereum">Ethereum</option>
                        <option value="base">Base</option>
                        <option value="solana">Solana</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="gasPreference" className="block text-sm font-medium text-gray-700 mb-1">
                        Gas Price Preference
                      </label>
                      <select
                        id="gasPreference"
                        value={transactionPreferences.gasPreference}
                        onChange={(e) => setTransactionPreferences({
                          ...transactionPreferences,
                          gasPreference: e.target.value
                        })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="low">Low (Slower transactions)</option>
                        <option value="standard">Standard</option>
                        <option value="high">High (Faster transactions)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="autoWithdrawal"
                          type="checkbox"
                          checked={transactionPreferences.autoWithdrawal}
                          onChange={(e) => setTransactionPreferences({
                            ...transactionPreferences,
                            autoWithdrawal: e.target.checked
                          })}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="autoWithdrawal" className="font-medium text-gray-700">
                          Auto-Withdrawal
                        </label>
                        <p className="text-gray-500">
                          Automatically withdraw winnings to your wallet when they exceed a threshold amount
                        </p>
                      </div>
                    </div>
                    
                    {transactionPreferences.autoWithdrawal && (
                      <div>
                        <label htmlFor="withdrawalThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                          Withdrawal Threshold (ETH)
                        </label>
                        <input
                          id="withdrawalThreshold"
                          type="number"
                          min="0"
                          step="0.01"
                          value={transactionPreferences.withdrawalThreshold}
                          onChange={(e) => setTransactionPreferences({
                            ...transactionPreferences,
                            withdrawalThreshold: parseFloat(e.target.value)
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 text-right">
                  <button
                    type="button"
                    onClick={handleUpdatePreferences}
                    disabled={isSavingPreferences}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isSavingPreferences ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}