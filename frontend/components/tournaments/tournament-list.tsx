'use client';

import { useState, useEffect } from 'react';
import TournamentCard from './tournament-card';
import { Tournament } from '@/lib/api/tournaments';
import { Search, Loader } from 'lucide-react';

interface TournamentListProps {
  tournaments: Tournament[];
  isLoading?: boolean;
  title?: string;
  searchable?: boolean;
  emptyMessage?: string;
}

export default function TournamentList({
  tournaments: initialTournaments,
  isLoading = false,
  title = 'Tournaments',
  searchable = false,
  emptyMessage = 'No tournaments found'
}: TournamentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(initialTournaments);
  
  // Update filtered tournaments when the initial tournaments or search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTournaments(initialTournaments);
      return;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = initialTournaments.filter(tournament => {
      return (
        tournament.name.toLowerCase().includes(lowercasedQuery) ||
        tournament.city?.toLowerCase().includes(lowercasedQuery) ||
        tournament.addrState?.toLowerCase().includes(lowercasedQuery) ||
        tournament.countryCode?.toLowerCase().includes(lowercasedQuery)
      );
    });
    
    setFilteredTournaments(filtered);
  }, [initialTournaments, searchQuery]);
  
  return (
    <div>
      {/* Header with Title and Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">{title}</h2>
        
        {searchable && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      )}
      
      {/* No Results */}
      {!isLoading && filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
      
      {/* Tournament Grid */}
      {!isLoading && filteredTournaments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
}