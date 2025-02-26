import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import DashboardHeader from './DashboardHeader';
import BetList from '../betting/bet-list';
import { getUserCreatedBets, getUserParticipatedBets } from '@/lib/api/bets';
import { getBalance } from '@/lib/api/wallet';
import { getFeaturedTournaments } from '@/lib/api/tournaments';
import { Calendar, Trophy, Wallet, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const Dashboard = () => {
  const { user, updateUserData } = useAuth();
  
  // Dashboard state
  const [loading, setLoading] = useState(true);
  const [createdBets, setCreatedBets] = useState([]);
  const [participatedBets, setParticipatedBets] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [error, setError] = useState(null);
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get balance
        const balanceResponse = await getBalance();
        if (user && balanceResponse.data.balance !== user.balance) {
          updateUserData({ balance: balanceResponse.data.balance });
        }
        
        // Get user's created bets
        const createdResponse = await getUserCreatedBets();
        setCreatedBets(createdResponse.data.bets);
        
        // Get user's participated bets
        const participatedResponse = await getUserParticipatedBets();
        setParticipatedBets(participatedResponse.data.bets);
        
        // Build user predictions map
        const predictions = {};
        participatedResponse.data.bets.forEach(bet => {
          const userParticipation = bet.participants.find(
            p => p.user === user?.id || p.user?._id === user?.id
          );
          
          if (userParticipation) {
            predictions[bet._id] = userParticipation.prediction;
          }
        });
        
        setUserPredictions(predictions);
        
        // Get featured tournaments
        const tournamentsResponse = await getFeaturedTournaments(5);
        setUpcomingTournaments(tournamentsResponse.data.tournaments);
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadDashboardData();
    }
  }, [user, updateUserData]);
  
  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };
  
  return (
    <div>
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Stats
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <div className="bg-indigo-50 rounded-full p-3 mr-4">
                    <Trophy className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Bets</p>
                    <p className="text-xl font-semibold">
                      {participatedBets.filter(bet => 
                        ['open', 'in_progress'].includes(bet.status)
                      ).length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-green-50 rounded-full p-3 mr-4">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created Bets</p>
                    <p className="text-xl font-semibold">{createdBets.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-purple-50 rounded-full p-3 mr-4">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-xl font-semibold">{user?.balance.toFixed(4)} ETH</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Your Bets */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Active Bets
                </h3>
                <Link href="/bets" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="p-6">
                <BetList
                  bets={participatedBets.filter(bet => 
                    ['open', 'in_progress'].includes(bet.status)
                  ).slice(0, 3)}
                  isLoading={loading}
                  emptyMessage="You have no active bets. Explore tournaments to place bets!"
                  userPredictions={userPredictions}
                />
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Tournaments */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Upcoming Tournaments
                </h3>
                <Link href="/tournaments" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="p-6">
                {upcomingTournaments.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming tournaments found</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingTournaments.map(tournament => (
                      <Link 
                        key={tournament.id} 
                        href={`/tournaments/${tournament.slug}`}
                        className="block group"
                      >
                        <div className="flex items-start p-3 rounded-md hover:bg-gray-50 transition">
                          <div className="flex-shrink-0">
                            <Calendar className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                              {tournament.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(tournament.startAt)} • {tournament.numAttendees || 0} attendees
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                <Link 
                  href="/wallet"
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Wallet className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Deposit Funds
                      </p>
                      <p className="text-xs text-gray-500">
                        Add funds to your wallet
                      </p>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="/tournaments"
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Trophy className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Browse Tournaments
                      </p>
                      <p className="text-xs text-gray-500">
                        Find tournaments to bet on
                      </p>
                    </div>
                  </div>
                </Link>
                
                <Link 
                  href="/bets/create"
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Star className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Create a Bet
                      </p>
                      <p className="text-xs text-gray-500">
                        Create a new betting pool
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                {/* This could be populated with a feed of activity from the API */}
                <p className="text-sm text-gray-500">
                  Your recent activity will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;