import Link from 'next/link';
import { ArrowRight, Trophy, Clock, DollarSign } from 'lucide-react';
import TournamentList from '@/components/tournaments/tournament-list';
import { 
  getFeaturedTournaments,
  getOngoingTournaments
} from '@/lib/api/tournaments';
import { getActiveBets } from '@/lib/api/bets';

// This is a Server Component in App Router, so we can use async/await directly
async function getPageData() {
  try {
    // Fetch featured tournaments
    const featuredResponse = await getFeaturedTournaments(6);
    const featuredTournaments = featuredResponse.data.tournaments;
    
    // Fetch ongoing tournaments
    const ongoingResponse = await getOngoingTournaments(3);
    const ongoingTournaments = ongoingResponse.data.tournaments;
    
    // Fetch active bets
    const activeBetsResponse = await getActiveBets(6);
    const activeBets = activeBetsResponse.data.bets;
    
    return {
      featuredTournaments,
      ongoingTournaments,
      activeBets
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return {
      featuredTournaments: [],
      ongoingTournaments: [],
      activeBets: []
    };
  }
}

export default async function HomePage() {
  const { featuredTournaments, ongoingTournaments, activeBets } = await getPageData();
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Bet on your favorite esports tournaments
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Join the community, place bets on matches, and win rewards
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/tournaments" className="bg-white text-indigo-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                Browse Tournaments
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/register" className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <Trophy className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">100+ Tournaments</h3>
              <p className="text-gray-600 text-center">
                Bet on the biggest esports tournaments worldwide
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <Clock className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Real-time Updates</h3>
              <p className="text-gray-600 text-center">
                Get match results and payouts as they happen
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <DollarSign className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Crypto Payouts</h3>
              <p className="text-gray-600 text-center">
                Deposit and withdraw using ETH, Base, or SOL
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Rest of the page content remains similar but would use Server Components 
         approach with async/await directly in the component */}
      
      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create an Account</h3>
              <p className="text-gray-600">
                Sign up and connect your crypto wallet to get started.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Place Your Bets</h3>
              <p className="text-gray-600">
                Browse tournaments, choose matches, and place your bets.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Collect Winnings</h3>
              <p className="text-gray-600">
                When your prediction is correct, collect your winnings instantly.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}