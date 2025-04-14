'use client';

import Link from 'next/link';
import { ArrowRight, Trophy, Clock, DollarSign } from 'lucide-react';
import TournamentList from '@/components/tournaments/tournament-list';
import { useAuth } from '@/providers/auth-providers';
import { 
  getFeaturedTournaments,
  getOngoingTournaments
} from '@/lib/api/tournaments';
import { getActiveBets } from '@/lib/api/bets';

// This is a Client Component in App Router
export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  
  // Async data fetching would be moved to Server Components
  // or a loading state would be shown while data is fetched
  
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
              {isAuthenticated 
                ? `Welcome back${user?.username ? ', ' + user.username : ''}! Ready to place some bets?` 
                : 'Join the community, place bets on matches, and win rewards'}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/tournaments" className="bg-white text-indigo-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                Browse Tournaments
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              {!isAuthenticated ? (
                <Link href="/register" className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                  Sign Up Now
                </Link>
              ) : (
                <Link href="/bets" className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                  My Bets
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <Link 
  href="/how-it-works" 
  className="inline-flex items-center text-indigo-100 hover:text-white mt-4 sm:mt-6"
>
  <span>Learn how it works</span>
  <ArrowRight className="ml-1 h-4 w-4" />
</Link>
      
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
      
      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{isAuthenticated ? 'Browse Tournaments' : 'Create an Account'}</h3>
              <p className="text-gray-600">
                {isAuthenticated 
                  ? 'Check out ongoing and upcoming esports tournaments.' 
                  : 'Sign up and connect your crypto wallet to get started.'}
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
            {!isAuthenticated ? (
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started Now
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/bets/create"
                  className="inline-flex items-center justify-center px-5 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Create a Bet
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Featured content would go here - using Server Components in production */}
      {isAuthenticated && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Recent Activity</h2>
            
            <div className="text-center">
              <p className="text-gray-600 mb-6">Check out your latest bets and ongoing tournaments</p>
              
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/bets"
                  className="px-5 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  View Your Bets
                </Link>
                <Link 
                  href="/wallet"
                  className="px-5 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Manage Wallet
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}