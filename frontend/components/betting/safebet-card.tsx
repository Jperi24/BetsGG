'use client';

import Link from 'next/link';
import { Bet, BetStatus } from '@/lib/api/bets';
import { AlertCircle, Award, Clock, Coins } from 'lucide-react';

interface BetCardProps {
  bet: Bet;
  userPrediction?: 1 | 2 | null;
}

export default function BetCard({ bet, userPrediction }: BetCardProps) {
  // Format currency amount
  const formatCurrency = (amount: number) => {
    return amount.toFixed(4);
  };
  
  // Calculate odds
  const getOdds = (contestant: 1 | 2) => {
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
  
  // Get status badge style
  const getStatusBadge = (status: BetStatus) => {
    switch (status) {
      case 'open':
        return { label: 'Open', color: 'bg-green-500' };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-blue-500' };
      case 'completed':
        return { label: 'Completed', color: 'bg-gray-500' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-500' };
      case 'disputed':
        return { label: 'Disputed', color: 'bg-yellow-500' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };
  
  const statusBadge = getStatusBadge(bet.status);
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Link href={`/bet/${bet._id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Tournament & Match Info */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{bet.tournamentName}</h3>
              <p className="text-sm text-indigo-100">{bet.eventName}</p>
            </div>
            <span className={`${statusBadge.color} text-white text-xs px-2 py-1 rounded-full`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
        
        {/* Match Details */}
        <div className="p-4">
          <div className="flex items-center justify-center mb-4">
            <span className="text-sm text-gray-500">{bet.matchName}</span>
          </div>
          
          {/* Contestants */}
          <div className="flex justify-between items-center mb-6">
            {/* Contestant 1 */}
            <div className={`text-center flex-1 p-2 rounded ${
              userPrediction === 1 ? 'bg-blue-50 border border-blue-200' : ''
            } ${bet.winner === 1 ? 'bg-green-50 border border-green-200' : ''}`}>
              <p className="font-medium truncate">{bet.contestant1.name}</p>
              <div className="text-sm text-gray-500 mt-1">
                <span>Odds: {getOdds(1)}x</span>
              </div>
              {userPrediction === 1 && (
                <div className="mt-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded inline-block">
                  Your Pick
                </div>
              )}
              {bet.winner === 1 && (
                <div className="mt-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded inline-block">
                  Winner
                </div>
              )}
            </div>
            
            <div className="mx-4 text-gray-400 font-medium">VS</div>
            
            {/* Contestant 2 */}
            <div className={`text-center flex-1 p-2 rounded ${
              userPrediction === 2 ? 'bg-blue-50 border border-blue-200' : ''
            } ${bet.winner === 2 ? 'bg-green-50 border border-green-200' : ''}`}>
              <p className="font-medium truncate">{bet.contestant2.name}</p>
              <div className="text-sm text-gray-500 mt-1">
                <span>Odds: {getOdds(2)}x</span>
              </div>
              {userPrediction === 2 && (
                <div className="mt-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded inline-block">
                  Your Pick
                </div>
              )}
              {bet.winner === 2 && (
                <div className="mt-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded inline-block">
                  Winner
                </div>
              )}
            </div>
          </div>
          
          {/* Pool & Bet Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Coins className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-600">Pool: {formatCurrency(bet.totalPool)} ETH</span>
              </div>
              
              <div className="flex items-center">
                <Award className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-600">
                  Min/Max: {formatCurrency(bet.minimumBet)}/{formatCurrency(bet.maximumBet)}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-gray-600 truncate">Created: {formatDate(bet.createdAt)}</span>
              </div>
              
              <div className="flex items-center">
                {bet.disputed ? (
                  <div className="flex items-center text-yellow-500">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Disputed</span>
                  </div>
                ) : (
                  <span className="text-gray-600">Bettors: {bet.participants.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}