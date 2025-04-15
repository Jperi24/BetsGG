// frontend/app/tournaments/page.jsx
"use client"
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TournamentList from '@/components/tournaments/tournament-list';
import { getFeaturedTournaments, getUpcomingTournaments, getOngoingTournaments } from '@/lib/api/tournaments';
import { Search, Loader } from 'lucide-react';

const TournamentsPage = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tournament data
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [ongoingTournaments, setOngoingTournaments] = useState([]);
  
  // Load tournament data based on active tab
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        switch (activeTab) {
          case 'featured':
            const featuredResponse = await getFeaturedTournaments();
            setFeaturedTournaments(featuredResponse.data.tournaments);
            break;
            
          case 'upcoming':
            const upcomingResponse = await getUpcomingTournaments();
            setUpcomingTournaments(upcomingResponse.data.tournaments);
            break;
            
          case 'live':
            const ongoingResponse = await getOngoingTournaments();
            setOngoingTournaments(ongoingResponse.data.tournaments);
            break;
            
          default:
            break;
        }
      } catch (err) {
        setError('Failed to load tournaments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTournaments();
  }, [activeTab]);

  // Get current tournaments based on active tab and search query
  const getCurrentTournaments = () => {
    let tournaments;
    
    // Get tournaments based on active tab
    switch (activeTab) {
      case 'featured':
        tournaments = featuredTournaments;
        break;
      case 'upcoming':
        tournaments = upcomingTournaments;
        break;
      case 'live':
        tournaments = ongoingTournaments;
        break;
      default:
        tournaments = [];
    }
    
    // If search query exists, filter tournaments
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return tournaments.filter(tournament => 
        tournament?.name?.toLowerCase().includes(query) || 
        (tournament.city && tournament.city.toLowerCase().includes(query)) ||
        (tournament.addrState && tournament.addrState.toLowerCase().includes(query)) ||
        (tournament.countryCode && tournament.countryCode.toLowerCase().includes(query))
      );
    }
    
    return tournaments;
  };
  
  // Get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'featured':
        return 'Featured Tournaments';
      case 'upcoming':
        return 'Upcoming Tournaments';
      case 'live':
        return 'Live Tournaments';
      default:
        return 'Tournaments';
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Get displayed tournaments
  const displayedTournaments = getCurrentTournaments();
  
  return (
    <MainLayout title="Tournaments | EsportsBets">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
          <p className="mt-2 text-gray-600">
            Browse and bet on esports tournaments
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          {/* Search Input */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'featured'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Featured
            </button>
            
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'live'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Live Now
            </button>
            
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'upcoming'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
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
        )}
        
        {/* Search results info */}
        {searchQuery.trim() && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Found {displayedTournaments.length} {displayedTournaments.length === 1 ? 'tournament' : 'tournaments'} matching "{searchQuery}"
            </p>
          </div>
        )}
        
        {/* Tournament List */}
        <TournamentList
          tournaments={displayedTournaments}
          isLoading={loading}
          title={getTabTitle()}
          searchable={false} // We're using our own search input above
          emptyMessage={searchQuery.trim() 
            ? `No tournaments found matching "${searchQuery}"`
            : `No ${activeTab} tournaments found.`
          }
        />
      </div>
    </MainLayout>
  );
};

export default TournamentsPage;