import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import CreateBetForm from '@/components/betting/CreateBetForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getFeaturedTournaments } from '@/lib/api/tournaments';
import { Loader, AlertCircle } from 'lucide-react';

const CreateBetPage = () => {
  const router = useRouter();
  const { tournament: tournamentSlug } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [error, setError] = useState(null);
  
  // Load tournaments if no specific tournament is provided
  useEffect(() => {
    const loadTournaments = async () => {
      if (tournamentSlug) {
        // If a tournament is provided in the URL, we don't need to load the list
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getFeaturedTournaments();
        setTournaments(response.data.tournaments);
      } catch (err) {
        setError('Failed to load tournaments. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTournaments();
  }, [tournamentSlug]);
  
  // Handle tournament selection
  const handleTournamentSelect = (slug) => {
    setSelectedTournament(slug);
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Create Bet | EsportsBets">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create a Bet</h1>
            <p className="mt-2 text-gray-600">
              Set up a new betting pool for a tournament match
            </p>
          </div>
          
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
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading tournaments...</span>
            </div>
          ) : (
            <>
              {/* If tournament is provided in URL or selected, show the create bet form */}
              {(tournamentSlug || selectedTournament) ? (
                <CreateBetForm tournamentSlug={tournamentSlug || selectedTournament} />
              ) : (
                // Otherwise, show tournament selection
                <div className="bg-white shadow-md rounded-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a Tournament</h2>
                  
                  {tournaments.length === 0 ? (
                    <p className="text-gray-500">No tournaments available for betting.</p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Select a tournament to create a bet for:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournaments.map(tournament => (
                          <button
                            key={tournament.id}
                            onClick={() => handleTournamentSelect(tournament.slug)}
                            className="block text-left border border-gray-200 rounded-md p-4 hover:border-indigo-500 hover:bg-indigo-50 transition"
                          >
                            <h3 className="font-medium text-gray-900">{tournament.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(tournament.startAt * 1000).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default CreateBetPage;