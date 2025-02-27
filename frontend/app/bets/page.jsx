"use client"

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import BetList from '@/components/betting/bet-list';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getUserCreatedBets, getUserParticipatedBets } from '@/lib/api/bets';
import { Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-providers';

const BetsPage = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('participated');
  const [createdBets, setCreatedBets] = useState([]);
  const [participatedBets, setParticipatedBets] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load bets data
  useEffect(() => {
    const loadBetsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (activeTab === 'created') {
          // Only load created bets if that tab is active or both are first load
          const createdResponse = await getUserCreatedBets();
          setCreatedBets(createdResponse.data.bets);
        }
        
        if (activeTab === 'participated') {
          // Only load participated bets if that tab is active or both are first load
          const participatedResponse = await getUserParticipatedBets();
          setParticipatedBets(participatedResponse.data.bets);
          
          // Build user predictions map
          if (user) {
            const predictions = {};
            
            participatedResponse.data.bets.forEach(bet => {
              const userParticipation = bet.participants.find(
                p => p.user === user.id || p.user?._id === user.id
              );
              
              if (userParticipation) {
                predictions[bet._id] = userParticipation.prediction;
              }
            });
            
            setUserPredictions(predictions);
          }
        }
      } catch (err) {
        setError('Failed to load bets. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBetsData();
  }, [activeTab, user]);
  
  return (
    <ProtectedRoute>
      <MainLayout title="My Bets | EsportsBets">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Bets</h1>
            <p className="mt-2 text-gray-600">
              Manage your bets and track your wins
            </p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('participated')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8
                  ${activeTab === 'participated'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Bets I've Participated In
              </button>
              
              <button
                onClick={() => setActiveTab('created')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8
                  ${activeTab === 'created'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Bets I've Created
              </button>
            </nav>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 p-4 rounded-md mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading bets...</span>
            </div>
          ) : (
            <>
              {/* Participated Bets Tab */}
              {activeTab === 'participated' && (
                <BetList
                  bets={participatedBets}
                  title="Bets I've Participated In"
                  searchable={true}
                  filterable={true}
                  emptyMessage="You haven't participated in any bets yet."
                  userPredictions={userPredictions}
                />
              )}
              
              {/* Created Bets Tab */}
              {activeTab === 'created' && (
                <BetList
                  bets={createdBets}
                  title="Bets I've Created"
                  searchable={true}
                  filterable={true}
                  emptyMessage="You haven't created any bets yet."
                />
              )}
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default BetsPage;