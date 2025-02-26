import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { getBalance, getTransactions, createDeposit, createWithdrawal } from '@/lib/api/wallet';
import { Loader, ArrowUp, ArrowDown, RefreshCw, AlertCircle } from 'lucide-react';

const WalletManagement = () => {
  const { user, updateUserData } = useAuth();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState('ETH');
  const [depositNetwork, setDepositNetwork] = useState('ethereum');
  const [depositAddress, setDepositAddress] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  
  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('ETH');
  const [withdrawNetwork, setWithdrawNetwork] = useState('ethereum');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  
  // Load wallet data
  useEffect(() => {
    loadWalletData();
  }, []);
  
  // Load wallet data function
  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get recent transactions
      const txResponse = await getTransactions(null, 10, 0);
      setTransactions(txResponse.data.transactions);
      setTransactionTotal(txResponse.total);
      
      // Get updated balance (even though we have it in user object)
      const balanceResponse = await getBalance();
      if (user && balanceResponse.data.balance !== user.balance) {
        updateUserData({ balance: balanceResponse.data.balance });
      }
    } catch (err) {
      setError('Failed to load wallet data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh wallet data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };
  
  // Handle deposit form submission
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!depositAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    try {
      setIsSubmittingDeposit(true);
      setError(null);
      
      await createDeposit({
        amount: parseFloat(depositAmount),
        currency: depositCurrency,
        walletAddress: depositAddress,
        network: depositNetwork
      });
      
      setDepositSuccess(true);
      setDepositAmount('');
      setDepositAddress('');
      
      // Reload wallet data
      await loadWalletData();
      
      // Reset success message after delay
      setTimeout(() => {
        setDepositSuccess(false);
      }, 5000);
      
    } catch (err) {
      setError(err.message || 'Failed to process deposit. Please try again.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };
  
  // Handle withdrawal form submission
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!withdrawAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Check if amount exceeds balance
    if (user && parseFloat(withdrawAmount) > user.balance) {
      setError('Withdrawal amount exceeds your balance');
      return;
    }
    
    try {
      setIsSubmittingWithdraw(true);
      setError(null);
      
      const response = await createWithdrawal({
        amount: parseFloat(withdrawAmount),
        currency: withdrawCurrency,
        walletAddress: withdrawAddress,
        network: withdrawNetwork
      });
      
      // Update user balance from response
      if (response.data.newBalance !== undefined) {
        updateUserData({ balance: response.data.newBalance });
      }
      
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setWithdrawAddress('');
      
      // Reload wallet data
      await loadWalletData();
      
      // Reset success message after delay
      setTimeout(() => {
        setWithdrawSuccess(false);
      }, 5000);
      
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal. Please try again.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get transaction status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };
  
  // Get transaction type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case 'deposit':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Deposit</span>;
      case 'withdrawal':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Withdrawal</span>;
      case 'bet':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Bet</span>;
      case 'win':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Win</span>;
      case 'refund':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Refund</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{type}</span>;
    }
  };
  
  // If loading initial data
  if (loading && !user) {
    return (
      <div className="text-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
        <p className="mt-2 text-gray-600">Loading wallet data...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Wallet</h2>
            <p className="text-indigo-100">Manage your funds and transactions</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <div className="text-3xl font-bold">{user?.balance.toFixed(4)} ETH</div>
            <div className="text-xs text-right text-indigo-200">Current Balance</div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
              ${activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('deposit')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
              ${activeTab === 'deposit'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Deposit
          </button>
          
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
              ${activeTab === 'withdraw'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Withdraw
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
              ${activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Transaction History
          </button>
        </nav>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Wallet Overview</h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-4">
                    <ArrowDown className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Deposits</p>
                    <p className="text-lg font-medium">
                      {transactions
                        .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toFixed(4)} ETH
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-4">
                    <ArrowUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Withdrawals</p>
                    <p className="text-lg font-medium">
                      {transactions
                        .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toFixed(4)} ETH
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="text-md font-medium mb-3">Recent Transactions</h4>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(tx.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            tx.type === 'withdrawal' || tx.type === 'bet' 
                              ? 'text-red-600' 
                              : tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund'
                                ? 'text-green-600'
                                : 'text-gray-900'
                          }`}>
                            {tx.type === 'withdrawal' || tx.type === 'bet' ? '-' : '+'}{tx.amount.toFixed(4)} {tx.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {transactions.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  View All Transactions
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Deposit Funds</h3>
            
            {depositSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm leading-5 text-green-700">
                      Deposit request submitted successfully! Please wait for confirmation.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleDeposit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    id="depositAmount"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="depositCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="depositCurrency"
                    value={depositCurrency}
                    onChange={(e) => setDepositCurrency(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="ETH">ETH</option>
                    <option value="BASE">BASE</option>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="depositAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  From Wallet Address
                </label>
                <input
                  id="depositAddress"
                  type="text"
                  value={depositAddress}
                  onChange={(e) => setDepositAddress(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0x..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="depositNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                  Network
                </label>
                <select
                  id="depositNetwork"
                  value={depositNetwork}
                  onChange={(e) => setDepositNetwork(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> After submitting this form, you'll need to send the funds from your wallet.
                  This is a simulated deposit for the demo.
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmittingDeposit ? (
                    <span className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </span>
                  ) : (
                    'Deposit Funds'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Withdraw Funds</h3>
            
            {withdrawSuccess && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm leading-5 text-green-700">
                      Withdrawal request submitted successfully! Please wait for processing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-700">
                <strong>Available Balance:</strong> {user?.balance.toFixed(4)} ETH
              </p>
            </div>
            
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    id="withdrawAmount"
                    type="number"
                    min="0.0001"
                    max={user?.balance}
                    step="0.0001"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="withdrawCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="withdrawCurrency"
                    value={withdrawCurrency}
                    onChange={(e) => setWithdrawCurrency(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="ETH">ETH</option>
                    <option value="BASE">BASE</option>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="withdrawAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  To Wallet Address
                </label>
                <input
                  id="withdrawAddress"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0x..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="withdrawNetwork" className="block text-sm font-medium text-gray-700 mb-1">
                  Network
                </label>
                <select
                  id="withdrawNetwork"
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-md">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Withdrawals may take up to 24 hours to process.
                  A small network fee may be deducted from your withdrawal amount.
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !user?.balance || user.balance <= 0 || parseFloat(withdrawAmount) > user.balance}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {isSubmittingWithdraw ? (
                    <span className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </span>
                  ) : (
                    'Withdraw Funds'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-md">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(tx.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            tx.type === 'withdrawal' || tx.type === 'bet' 
                              ? 'text-red-600' 
                              : tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund'
                                ? 'text-green-600'
                                : 'text-gray-900'
                          }`}>
                            {tx.type === 'withdrawal' || tx.type === 'bet' ? '-' : '+'}{tx.amount.toFixed(4)} {tx.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.description || '-'}
                          {tx.txHash && (
                            <a
                              href={`https://etherscan.io/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {transactionTotal > transactions.length && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await getTransactions(null, 10, transactions.length);
                      setTransactions([...transactions, ...response.data.transactions]);
                    } catch (error) {
                      setError('Failed to load more transactions');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagement;