// components/betting/CustomOddsBetDetails.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { 
  Loader, 
  AlertCircle, 
  Award, 
  TrendingUp, 
  RefreshCw
} from 'lucide-react';
import CheckCircle from '../ui/CheckCircle';
import { 
  getBetWithOffers, 
  claimCustomBetWinnings 
} from '@/lib/api/custom-odds';
import CustomOddsBetting from './CustomOddsBetting';

const CustomOddsBetDetails = ({ betId, bet }) => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingWinnings, setIsClaimingWinnings] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [betDetails, setBetDetails] = useState(null);
  const [userParticipation, setUserParticipation] = useState(null);
  
  // Load bet details with offers
  useEffect(() => {
    loadBetDetails();
  }, [betId]);
  
  const loadBetDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getBetWithOffers(betId);
      setBetDetails(response.data.bet);
      
      if (response.data.userParticipation) {
        setUserParticipation(response.data.userParticipation);
      }
    } catch (err) {
      setError('Failed to load bet details. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle claiming winnings
  const handleClaimWinnings = async () => {
    try {
      setIsClaimingWinnings(true);
      setError(null);
      
      const response = await claimCustomBetWinnings(betId);
      
      // Update user balance
      if (response.newBalance !== undefined && user) {
        updateUserData({ balance: response.newBalance });
      }
      
      setSuccess(`Successfully claimed ${response.netWinnings.toFixed(4)} ETH in winnings!`);
      
      // Refresh bet details
      loadBetDetails();
    } catch (err) {
      setError(err.message || 'Failed to claim winnings. Please try again.');
    } finally {
      setIsClaimingWinnings(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(4);
  };
  
  // Check if user can claim winnings
  const canClaimWinnings = () => {
    if (!bet || !userParticipation || bet.status !== 'completed' || !bet.winner) {
      return false;
    }
    
    // Check if user has unclaimed winnings
    return userParticipation.bets.some(userBet => {
      const betOnWinner = 
        (userBet.prediction === bet.winner) ||
        (userBet.type === 'match' && userBet.prediction !== bet.winner);
      
      return betOnWinner && !userBet.claimed;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading detailed bet information...</span>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* User participation summary */}
      {userParticipation && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-indigo-800 mb-2">Your Betting Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-indigo-700">
                <span className="font-medium">Active Bets:</span> {userParticipation.bets.length}
              </p>
              <p className="text-sm text-indigo-700 mt-1">
                <span className="font-medium">Total at Stake:</span> {
                  formatCurrency(
                    userParticipation.bets.reduce((sum, bet) => sum + bet.amount, 0)
                  )
                } ETH
              </p>
            </div>
            
            <div>
              <p className="text-sm text-indigo-700">
                <span className="font-medium">Potential Winnings:</span> {
                  formatCurrency(userParticipation.potentialWinnings || 0)
                } ETH
              </p>
              
              {bet.status === 'completed' && bet.winner && (
                <p className="text-sm text-indigo-700 mt-1">
                  <span className="font-medium">Result:</span> {
                    userParticipation.bets.some(b => 
                      (b.prediction === bet.winner && b.type === 'offer') || 
                      (b.prediction !== bet.winner && b.type === 'match')
                    ) 
                    ? 'You won! 🎉' 
                    : 'You lost'
                  }
                </p>
              )}
            </div>
          </div>
          
          {/* Claim winnings button */}
          {canClaimWinnings() && (
            <button
              onClick={handleClaimWinnings}
              disabled={isClaimingWinnings}
              className="mt-4 flex items-center justify-center w-full md:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isClaimingWinnings ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  <span>Claiming Winnings...</span>
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  <span>Claim Winnings</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Main custom odds betting UI */}
      <CustomOddsBetting 
        betId={betId} 
        bet={bet}
        onUpdate={loadBetDetails}
      />
    </div>
  );
};

export default CustomOddsBetDetails;