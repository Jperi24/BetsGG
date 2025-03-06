'use client';

import { useState, useEffect } from 'react';
import BetCard from './bet-card';
import { Bet, BetStatus } from '@/lib/api/bets';
import { Search, Loader, Filter } from 'lucide-react';

interface BetListProps {
  bets: Bet[];
  isLoading?: boolean;
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  emptyMessage?: string;
  userPredictions?: Record<string, 1 | 2>;
}

export default function BetList({
  bets: initialBets,
  isLoading = false,
  title = 'Bets',
  searchable = false,
  filterable = false,
  emptyMessage = 'No bets found',
  userPredictions = {}
}: BetListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BetStatus | 'all'>('all');
  const [filteredBets, setFilteredBets] = useState<Bet[]>(initialBets);
  
  // Update filtered bets when the initial bets, search query, or filter changes
  useEffect(() => {
    let filtered = initialBets;
    console.log("Initial Bets ",initialBets)
    
    // Apply search filter if query exists
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(bet => {
        return (
          bet.tournamentName.toLowerCase().includes(lowercasedQuery) ||
          bet.eventName.toLowerCase().includes(lowercasedQuery) ||
          bet.contestant1.name.toLowerCase().includes(lowercasedQuery) ||
          bet.contestant2.name.toLowerCase().includes(lowercasedQuery) ||
          bet.matchName.toLowerCase().includes(lowercasedQuery)
        );
      });
    }
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bet => bet.status === statusFilter);
    }
    
    setFilteredBets(filtered);
  }, [initialBets, searchQuery, statusFilter]);
  
  return (
    <div>
      {/* Header with Title and Search/Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">{title}</h2>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Status Filter */}
          {filterable && (
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BetStatus | 'all')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}
          
          {/* Search */}
          {searchable && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search bets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      )}
      
      {/* No Results */}
      {!isLoading && filteredBets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
      
      {/* Bets Grid */}
      {!isLoading && filteredBets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBets.map((bet) => (
            <BetCard 
              key={bet._id} 
              bet={bet} 
              userPrediction={userPredictions[bet._id] || null} 
            />
          ))}
        </div>
      )}
    </div>
  );
}