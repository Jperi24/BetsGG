'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { Bet, placeBet } from '@/lib/api/bets';
import { Loader } from 'lucide-react';

interface PlaceBetFormProps {
  bet: Bet;
  onSuccess?: () => void;
}

export default function PlaceBetForm({ bet, onSuccess }: PlaceBetFormProps) {
  const { user, updateUserData } = useAuth();
  const [prediction, setPrediction] = useState<1 | 2 | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const userBalance = user?.balance || 0;
  const minBet = bet.minimumBet;
  const maxBet = bet.maximumBet;
  
  // Handle amount change with validation
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!prediction) {
      setError('Please select a contestant');
      return;
    }
    
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < minBet || betAmount > maxBet) {
      setError(`Bet amount must be between ${minBet} and ${maxBet} ETH`);
      return;
    }
    
    if (betAmount > userBalance) {
      setError('Insufficient balance');
      return;
    }
    
    // Submit bet
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await placeBet(bet._id, {
        prediction,
        amount: betAmount
      });
      
      // Update user balance
      if (user) {
        updateUserData({ balance: userBalance - betAmount });
      }
      
      setSuccess(true);
      setAmount('');
      setPrediction(null);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place bet');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate potential winnings
  const calculatePotentialWinnings = () => {
    if (!prediction || !amount || isNaN(parseFloat(amount))) {
      return 0;
    }
    
    const betAmount = parseFloat(amount);
    const pool = prediction === 1 ? bet.contestant1Pool : bet.contestant2Pool;
    const totalPool = bet.totalPool;
    
    if (pool === 0) return betAmount;
    
    // Formula: (bet amount / contestant pool) * total pool
    return (betAmount / (pool + betAmount)) * (totalPool + betAmount);
  };
  
  const potentialWinnings = calculatePotentialWinnings();
  
  // Render bet closed notice if not open
  if (bet.status !== 'open') {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
        This bet is no longer accepting new participants.
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Place Your Bet</h3>
      
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Your bet has been placed successfully!</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Select Contestant */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Select Contestant
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPrediction(1)}
              className={`p-3 rounded-lg text-center border transition-colors ${
                prediction === 1
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <span className="font-medium">{bet.contestant1.name}</span>
              <p className="text-sm text-gray-500 mt-1">
                Odds: {bet.contestant1Pool === 0 ? '-' : (bet.totalPool / bet.contestant1Pool).toFixed(2)}x
              </p>
            </button>
            
            <button
              type="button"
              onClick={() => setPrediction(2)}
              className={`p-3 rounded-lg text-center border transition-colors ${
                prediction === 2
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <span className="font-medium">{bet.contestant2.name}</span>
              <p className="text-sm text-gray-500 mt-1">
                Odds: {bet.contestant2Pool === 0 ? '-' : (bet.totalPool / bet.contestant2Pool).toFixed(2)}x
              </p>
            </button>
          </div>
        </div>
        
        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-medium mb-2">
            Bet Amount (ETH)
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="amount"
              placeholder={`${minBet} - ${maxBet} ETH`}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">ETH</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your balance: {userBalance.toFixed(4)} ETH
          </p>
        </div>
        
        {/* Potential Winnings */}
        {amount && prediction && (
          <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Potential Winnings:</span>{' '}
              {potentialWinnings.toFixed(4)} ETH
            </p>
            <p className="text-xs text-gray-500 mt-1">
              (Actual winnings may vary based on final pool size)
            </p>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !prediction || !amount}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              <span>Processing...</span>
            </div>
          ) : (
            'Place Bet'
          )}
        </button>
      </form>
    </div>
  );
}