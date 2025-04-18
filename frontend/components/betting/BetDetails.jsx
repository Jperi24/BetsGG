// components/betting/BetDetails.jsx (Updated)
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import { getBetById, claimWinnings } from '@/lib/api/bets';
import { Loader, AlertCircle, Award, ArrowLeft, TrendingUp, Clock, CheckCircle, Trophy } from 'lucide-react';
import PlaceBetForm from './place-bet';
import IntegratedBettingView from './IntegratedBettingView';

const BetDetails = ({ betId }) => {
  const { user, updateUserData } = useAuth();
  
  const [bet, setBet] = useState(null);
  const [userParticipation, setUserParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  
  // Load bet data
  useEffect(() => {
    const loadBetData = async () => {
      if (!betId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getBetById(betId);
        setBet(response.data.bet);
        setUserParticipation(response.data.userParticipation);
      } catch (err) {
        setError('Failed to load bet data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBetData();
  }, [betId]);
  
  // Handle claim winnings
  const handleClaimWinnings = async () => {
    try {
      setClaimLoading(true);
      
      const response = await claimWinnings(bet._id);
      
      // Update user balance
      if (response.newBalance !== undefined && user) {
        updateUserData({ balance: response.newBalance });
      }
      
      setClaimSuccess(true);
      
      // Update user participation to claimed
      setUserParticipation({
        ...userParticipation,
        claimed: true
      });
      
    } catch (err) {
      setError(err.message || 'Failed to claim winnings. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate odds
  const getOdds = (contestant) => {
    if (!bet) return '-';
    
    if (contestant === 1) {
      return bet.contestant1Pool === 0 
        ? '-' 
        : (bet.totalPool / bet.contestant1Pool).toFixed(2);
    } else {
      return bet.contestant2Pool === 0 
        ? '-' 
        : (bet.totalPool / bet.contestant2Pool).toFixed(2);
    }
  };
  
  // Get status badge
  const getStatusBadge = () => {
    if (!bet) return null;
    
    switch (bet.status) {
      case 'open':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Open</span>;
      case 'in_progress':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">In Progress</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelled</span>;
      case 'disputed':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Disputed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{bet.status}</span>;
    }
  };
  
  // Check if user can claim winnings
  const canClaimWinnings = () => {
    if (!bet || !userParticipation) return false;
    
    return (
      bet.status === 'completed' &&
      bet.winner === userParticipation.prediction &&
      !userParticipation.claimed
    );
  };
  
  // Check if user has participated
  const hasParticipated = () => {
    return userParticipation !== null;
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading bet details...</span>
      </div>
    );
  }
  
  // Show error state
  if (error || !bet) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error || 'Bet not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href={`/tournaments/${bet.tournamentSlug}`}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tournament
        </Link>
      </div>
      
      {/* Bet Header */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-indigo-600 px-6 py-4 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-xl font-semibold">{bet.tournamentName}</h1>
              <p className="text-indigo-200 text-sm">{bet.eventName} • {bet.phaseName}</p>
            </div>
            <div className="mt-2 sm:mt-0">
              {getStatusBadge()}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{bet.matchName}</h2>
          
          {/* Winner Banner - Only show when bet is completed and has a winner */}
          {bet.status === 'completed' && bet.winner > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-8 w-8 text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-green-800">
                    Winner: {bet.winner === 1 ? bet.contestant1.name : bet.contestant2.name}
                  </h3>
                </div>
                <p className="text-green-600">
                  Final result determined on {formatDate(bet.resultDeterminedAt)}
                </p>
              </div>
            </div>
          )}
          
          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-sm text-gray-500">Total Pool:</span>
                      <span className="ml-2 font-medium">{bet.totalPool.toFixed(4)} ETH</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-sm text-gray-500">Participants:</span>
                      <span className="ml-2 font-medium">{bet.participants.length}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-sm text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(bet.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contestant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contestant 1 */}
            <div className={`border rounded-lg p-6 relative ${
              bet.winner === 1 
                ? 'border-green-400 bg-green-50' 
                : userParticipation?.prediction === 1
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200'
            }`}>
              {bet.winner === 1 && (
                <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-2">
                  <Trophy className="h-6 w-6" />
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{bet.contestant1.name}</h3>
                {bet.winner === 1 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pool:</span>
                  <span className="font-medium">{bet.contestant1Pool.toFixed(4)} ETH</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Odds:</span>
                  <span className="font-medium">{getOdds(1)}x</span>
                </div>
                
                {userParticipation?.prediction === 1 && (
                  <div className="mt-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
                    Your bet: {userParticipation.amount.toFixed(4)} ETH
                    {bet.winner === 1 && !userParticipation.claimed && (
                      <span className="block mt-1 text-green-600 font-semibold">
                        You won! Claim your winnings below.
                      </span>
                    )}
                    {bet.winner === 1 && userParticipation.claimed && (
                      <span className="block mt-1 text-green-600 font-semibold">
                        Winnings claimed!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Contestant 2 */}
            <div className={`border rounded-lg p-6 relative ${
              bet.winner === 2 
                ? 'border-green-400 bg-green-50' 
                : userParticipation?.prediction === 2
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200'
            }`}>
              {bet.winner === 2 && (
                <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-2">
                  <Trophy className="h-6 w-6" />
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{bet.contestant2.name}</h3>
                {bet.winner === 2 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Winner
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pool:</span>
                  <span className="font-medium">{bet.contestant2Pool.toFixed(4)} ETH</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Odds:</span>
                  <span className="font-medium">{getOdds(2)}x</span>
                </div>
                
                {userParticipation?.prediction === 2 && (
                  <div className="mt-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
                    Your bet: {userParticipation.amount.toFixed(4)} ETH
                    {bet.winner === 2 && !userParticipation.claimed && (
                      <span className="block mt-1 text-green-600 font-semibold">
                        You won! Claim your winnings below.
                      </span>
                    )}
                    {bet.winner === 2 && userParticipation.claimed && (
                      <span className="block mt-1 text-green-600 font-semibold">
                        Winnings claimed!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Match Result - Show for completed bets with a winner */}
          {bet.status === 'completed' && bet.winner > 0 && (
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Match Result</h3>
              <p className="text-gray-700">
                {bet.winner === 1 ? bet.contestant1.name : bet.contestant2.name} has won this match. 
                {userParticipation && userParticipation.prediction === bet.winner ? (
                  userParticipation.claimed ? 
                    " You have already claimed your winnings." : 
                    " You can claim your winnings below."
                ) : userParticipation ? 
                  " Unfortunately, you bet on the other contestant." : 
                  " You did not participate in this bet."
                }
              </p>
              {bet.resultDeterminedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Result was determined on {formatDate(bet.resultDeterminedAt)}
                </p>
              )}
            </div>
          )}
          
          {/* Claim Winnings Button for standard bets */}
          {canClaimWinnings() && (
            <div className="mt-8">
              {claimSuccess ? (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm leading-5 text-green-700">
                        Winnings claimed successfully! Your balance has been updated.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClaimWinnings}
                  disabled={claimLoading}
                  className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {claimLoading ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Claiming Winnings...
                    </>
                  ) : (
                    <>
                      <Award className="h-5 w-5 mr-2" />
                      Claim Winnings
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Integrated Betting View - New component combining standard and custom odds betting */}
      <IntegratedBettingView bet={bet} userParticipation={userParticipation} />
    </div>
  );
};

export default BetDetails;