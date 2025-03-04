import React, { useState, useEffect } from 'react';
import { getBetsByTournament } from '@/lib/api/bets';
import { Loader, AlertCircle, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';

const TournamentBetsTab = ({ tournament }) => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadBets = async () => {
      if (!tournament || !tournament.slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const betsResponse = await getBetsByTournament(tournament.slug);
        console.log("THIS IS RAN")
        
        setBets(betsResponse.data.bets);
        
        // If user is logged in, extract their predictions
        if (user) {
          const predictions = {};
          
          betsResponse.data.bets.forEach(bet => {
            const userParticipation = bet.participants.find(
              p => p.user === user.id || p.user?._id === user.id
            );
            
            if (userParticipation) {
              predictions[bet._id] = userParticipation.prediction;
            }
          });
          
          setUserPredictions(predictions);
        }
      } catch (err) {
        setError('Failed to load bets. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBets();
  }, [tournament, user]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
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
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };
  
  // Get odds
  const getOdds = (bet, contestant) => {
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-6 w-6 text-indigo-600 animate-spin mr-2" />
        <span className="text-gray-600">Loading bets...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (bets.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-md text-center">
        <p className="text-gray-600">No bets have been created for this tournament yet.</p>
        <Link
          href={`/bets/create?tournament=${tournament.slug}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 mt-4"
        >
          Create a Bet
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bets.map(bet => (
          <div key={bet._id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{bet.matchName}</h4>
                <p className="text-sm text-gray-500">{bet.phaseName}</p>
              </div>
              {getStatusBadge(bet.status)}
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className={`text-center flex-1 ${
                userPredictions[bet._id] === 1 ? 'bg-blue-50 p-2 rounded' : ''
              } ${
                bet.winner === 1 ? 'bg-green-50 p-2 rounded' : ''
              }`}>
                <p className="font-medium">{bet.contestant1.name}</p>
                <p className="text-xs text-gray-500">Odds: {getOdds(bet, 1)}x</p>
                {userPredictions[bet._id] === 1 && (
                  <span className="text-xs text-blue-600">Your pick</span>
                )}
                {bet.winner === 1 && (
                  <span className="text-xs text-green-600">Winner</span>
                )}
              </div>
              
              <div className="mx-2 text-gray-400">VS</div>
              
              <div className={`text-center flex-1 ${
                userPredictions[bet._id] === 2 ? 'bg-blue-50 p-2 rounded' : ''
              } ${
                bet.winner === 2 ? 'bg-green-50 p-2 rounded' : ''
              }`}>
                <p className="font-medium">{bet.contestant2.name}</p>
                <p className="text-xs text-gray-500">Odds: {getOdds(bet, 2)}x</p>
                {userPredictions[bet._id] === 2 && (
                  <span className="text-xs text-blue-600">Your pick</span>
                )}
                {bet.winner === 2 && (
                  <span className="text-xs text-green-600">Winner</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Pool: {bet.totalPool.toFixed(4)} ETH</span>
              <Link href={`/bet/${bet._id}`} className="text-indigo-600 hover:text-indigo-800">
                {bet.status === 'open' ? 'Place Bet' : 'View Details'}
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <Link
          href={`/bets/create?tournament=${tournament.slug}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create New Bet
        </Link>
      </div>
    </div>
  );
};

export default TournamentBetsTab;