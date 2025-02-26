import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import TournamentDetail from '@/components/tournaments/TournamentDetail';
import BetList from '@/components/betting/bet-list';
import { Loader, AlertCircle } from 'lucide-react';
import { getTournamentBySlug } from '@/lib/api/tournaments';
import { getBetsByTournament } from '@/lib/api/bets';
import { useAuth } from '@/providers/auth-providers';

const TournamentDetailPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState(null);
  const [bets, setBets] = useState([]);
  const [userPredictions, setUserPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load tournament data when slug is available
  useEffect(() => {
    const loadTournamentData = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get tournament details
        const tournamentResponse = await getTournamentBySlug(slug);
        setTournament(tournamentResponse.data.tournament);
        
        // Get bets for this tournament
        const betsResponse = await getBetsByTournament(slug);
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
        setError('Failed to load tournament data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTournamentData();
  }, [slug, user]);
  
  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading tournament...</span>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Show error state
  if (error || !tournament) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'Tournament not found'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={`${tournament.name} | EsportsBets`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Detail */}
        <TournamentDetail tournament={tournament} />
        
        {/* Tournament Bets */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Bets</h2>
          
          <BetList
            bets={bets}
            title=""
            emptyMessage="No active bets for this tournament."
            userPredictions={userPredictions}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default TournamentDetailPage;