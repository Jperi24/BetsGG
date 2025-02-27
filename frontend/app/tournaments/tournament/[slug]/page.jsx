// app/tournaments/[slug]/page.jsx
import { notFound } from 'next/navigation';
import TournamentDetail from '@/components/tournaments/TournamentDetail';
import BetListContainer from './BetListContainer';
import { getTournamentBySlug } from '@/lib/api/tournaments';

// Server Component to fetch tournament data
async function getTournamentData(slug) {
  console.log("Fetching tournament data for slug:", slug); // Debug log
  
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
  // Ensure params.slug is a string
  const slug = typeof params.slug === 'string' ? params.slug : params.slug[0];
  
  const tournament = await getTournamentData(slug);
  
  // If tournament not found, show 404
  if (!tournament) {
    console.log("Tournament not found, showing 404"); // Debug log
    notFound();
  }
  
  console.log("Successfully loaded tournament:", tournament.name); // Debug log
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tournament Detail */}
      <TournamentDetail tournament={tournament} />
      
      {/* Tournament Bets - Using a Client Component wrapper */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Bets</h2>
        <BetListContainer tournamentSlug={slug} />
      </div>
    </div>
  );
}