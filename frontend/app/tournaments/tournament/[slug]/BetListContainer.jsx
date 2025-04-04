// frontend/app/tournaments/tournament/[slug]/BetListContainer.jsx
'use client';

import React, { useState, useEffect } from 'react';
import BetList from '@/components/betting/bet-list';
import { getBetsByTournament } from '@/lib/api/bets';
import { useAuth } from '@/providers/auth-providers';
import { Loader, Search } from 'lucide-react';

const BetListContainer = ({ tournamentSlug }) => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const loadBets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get bets for this tournament
        const betsResponse = await getBetsByTournament(tournamentSlug);
  
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
  }, [tournamentSlug, user]);
  
  // Filter bets based on search query
  const getFilteredBets = () => {
    if (!searchQuery.trim()) {
      return bets;
    }
    
    const query = searchQuery.toLowerCase();
    return bets.filter(bet => 
      bet.matchName.toLowerCase().includes(query) ||
      bet.contestant1.name.toLowerCase().includes(query) ||
      bet.contestant2.name.toLowerCase().includes(query) ||
      bet.tournamentName.toLowerCase().includes(query) ||
      bet.eventName.toLowerCase().includes(query) ||
      bet.phaseName.toLowerCase().includes(query)
    );
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Get displayed bets
  const filteredBets = getFilteredBets();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading bets...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Add search input for bets */}
      {bets.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bets by match, contestant, event..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
          </div>
          
          {/* Search results info */}
          {searchQuery.trim() && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Found {filteredBets.length} {filteredBets.length === 1 ? 'bet' : 'bets'} matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}
      
      <BetList
        bets={filteredBets}
        title=""
        emptyMessage={searchQuery.trim() 
          ? `No bets found matching "${searchQuery}"`
          : "No active bets for this tournament."
        }
        userPredictions={userPredictions}
        searchable={false} // We're using our custom search now
      />
    </div>
  );
};

export default BetListContainer;