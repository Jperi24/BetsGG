import { notFound } from 'next/navigation';
import TournamentDetail from '@/components/tournaments/TournamentDetail';
import BetListContainer from './BetListContainer';
import { getTournamentBySlug } from '@/lib/api/tournaments';

// Generate metadata for the page
export async function generateMetadata({ params }) {
  try {
    const response = await getTournamentBySlug(params.slug);
    const tournament = response.data.tournament;
    
    return {
      title: `${tournament.name} | Tournaments`,
      description: `View details and betting opportunities for ${tournament.name}.`
    };
  } catch (error) {
    return {
      title: 'Tournament Not Found',
      description: 'The requested tournament could not be found.'
    };
  }
}

// Server Component to fetch tournament data
async function getTournamentData(slug) {
  try {
    // Get tournament details
    const tournamentResponse = await getTournamentBySlug(slug);
    const tournament = tournamentResponse.data.tournament;
    
    return tournament;
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return null;
  }
}

export default async function TournamentDetailPage({ params }) {
  const tournament = await getTournamentData(params.slug);
  
  // If tournament not found, show 404
  if (!tournament) {
    notFound();
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tournament Detail */}
      <TournamentDetail tournament={tournament} />
      
      {/* Tournament Bets - Using a Client Component wrapper */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Bets</h2>
        <BetListContainer tournamentSlug={params.slug} />
      </div>
    </div>
  );
}