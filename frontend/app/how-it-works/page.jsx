// frontend/app/how-it-works/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import { ArrowRight, Wallet, Trophy, Users, Calendar, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-600">
            How EsportsBets Works
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto">
            Your platform for peer-to-peer esports betting with cryptocurrency
          </p>
        </div>

        {/* Steps Container */}
        <div className="grid gap-12 mt-12">
          
          {/* Step 1 */}
          <StepCard 
            number="01"
            title="Create Your Account"
            icon={<Users size={48} className="text-indigo-400" />}
            color="from-pink-500 to-purple-500"
          >
            <p className="text-lg">
              Sign up with your email, username, and password. Link your cryptocurrency wallet to deposit and withdraw funds.
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <WalletBadge type="ETH" />
              <WalletBadge type="BASE" />
              <WalletBadge type="SOL" />
              <WalletBadge type="USDC" />
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard 
            number="02"
            title="Fund Your Account"
            icon={<Wallet size={48} className="text-green-400" />}
            color="from-blue-500 to-cyan-500"
          >
            <p className="text-lg">
              Deposit cryptocurrency into your account. Your balance will update once the blockchain transaction is confirmed.
            </p>
            <div className="mt-4 p-4 bg-black bg-opacity-30 rounded-lg">
              <h4 className="text-green-300 font-medium mb-2">Benefits:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fast blockchain transactions</li>
                <li>Secure wallet integration</li>
                <li>No minimum deposit amount</li>
                <li>Withdraw anytime</li>
              </ul>
            </div>
          </StepCard>

          {/* Step 3 */}
          <StepCard 
            number="03"
            title="Discover Tournaments"
            icon={<Calendar size={48} className="text-yellow-400" />}
            color="from-purple-500 to-indigo-500"
          >
            <p className="text-lg">
              Browse upcoming and ongoing esports tournaments pulled directly from Start.GG. Find matches across multiple games and events.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <EventTag name="Super Smash Bros." />
              <EventTag name="Street Fighter" />
              <EventTag name="League of Legends" />
              <EventTag name="Tekken" />
              <EventTag name="+ Many More" />
            </div>
          </StepCard>

          {/* Step 4 */}
          <StepCard 
            number="04"
            title="Create or Join Bets"
            icon={<CheckCircle size={48} className="text-orange-400" />}
            color="from-amber-500 to-orange-500"
          >
            <p className="text-lg mb-4">
              Create a betting pool on any match or join existing ones. Set your minimum and maximum bet amounts when creating.
            </p>
            
            <div className="bg-black bg-opacity-20 rounded-lg p-4">
              <h4 className="text-orange-300 font-medium mb-2">How Peer-to-Peer Betting Works:</h4>
              <div className="flex items-center justify-center p-3">
                <div className="text-center px-4 py-2 rounded-lg bg-blue-600 font-semibold">
                  Player A bets<br/>0.4 ETH on Mang0
                </div>
                <ArrowRight className="mx-3 text-gray-400" />
                <div className="text-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold">
                  Total Pool<br/>1.0 ETH
                </div>
                <ArrowRight className="mx-3 text-gray-400" />
                <div className="text-center px-4 py-2 rounded-lg bg-red-600 font-semibold">
                  Player B bets<br/>0.6 ETH on Hbox
                </div>
              </div>
            </div>
          </StepCard>

          {/* Step 5 */}
          <StepCard 
            number="05"
            title="Collect Your Winnings"
            icon={<Trophy size={48} className="text-yellow-400" />}
            color="from-green-500 to-teal-500"
          >
            <p className="text-lg">
              After the match concludes, winners can claim their winnings based on their share of the winning pool.
            </p>
            
            <div className="mt-6 bg-black bg-opacity-20 rounded-lg p-4">
              <h4 className="text-green-300 font-medium mb-3">Payout Formula:</h4>
              <div className="text-center p-3 bg-indigo-900 bg-opacity-50 rounded-lg">
                <span className="text-lg font-mono">
                  Winnings = (Your Bet ÷ Winning Pool) × Total Pool - 1% Fee
                </span>
              </div>
              
              <div className="mt-4 p-3 bg-indigo-900 bg-opacity-50 rounded-lg">
                <h5 className="text-center font-medium mb-2">Example:</h5>
                <div className="text-sm md:flex justify-center items-center text-center">
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <p className="font-semibold">If you bet 0.4 ETH</p>
                    <p>out of 0.5 ETH total on winning side</p>
                  </div>
                  <ArrowRight className="hidden md:block mx-4" />
                  <div className="md:w-1/3">
                    <p className="font-semibold">Your share: 80%</p>
                    <p>Win 0.8 ETH (minus 1% fee)</p>
                    <p className="text-green-300 font-bold">Profit: 0.392 ETH</p>
                  </div>
                </div>
              </div>
            </div>
          </StepCard>
        </div>

        {/* Important Notes */}
        <div className="mt-20 p-6 bg-gray-900 bg-opacity-70 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-cyan-300">Important Notes:</h2>
          <ul className="space-y-3 text-gray-200">
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span> 
              <span>All bets are <span className="font-bold text-cyan-300">non-withdrawable</span> once placed - make your predictions carefully!</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span> 
              <span>Match results are automatically tracked through our Start.GG integration</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span> 
              <span>The platform takes a small 1% commission on winnings to cover operational costs</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-2">•</span> 
              <span>Betting pools are balanced automatically - lower odds for favorites, higher odds for underdogs</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          {!isAuthenticated ? (
            <>
              <Link href="/register">
                <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xl font-bold shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-105 active:scale-95">
                  Start Betting Now
                </button>
              </Link>
              <p className="mt-4 text-blue-300">
                Already have an account? <Link href="/login" className="text-pink-400 hover:underline">Log In</Link>
              </p>
            </>
          ) : (
            <div className="space-x-4">
              <Link href="/tournaments">
                <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-xl font-bold shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-105 active:scale-95">
                  Explore Tournaments
                </button>
              </Link>
              <Link href="/bets/create">
                <button className="px-8 py-4 bg-white text-indigo-600 rounded-full text-xl font-bold shadow-lg hover:shadow-white/20 transition-all hover:scale-105 active:scale-95">
                  Create a Bet
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StepCard({ number, title, children, icon, color }) {
  return (
    <div className="relative bg-gray-900 bg-opacity-40 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-800 transition-all duration-300 hover:shadow-2xl">
      <div className="absolute -top-6 -left-6 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br border-2 border-white border-opacity-20 shadow-lg font-bold text-xl z-10"
           style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`, 
                   backgroundImage: `linear-gradient(to bottom right, ${color})` }}>
        {number}
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/5 mb-4 md:mb-0 flex justify-center md:justify-start">
          {icon}
        </div>
        <div className="md:w-4/5">
          <h3 className="text-2xl font-bold mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function WalletBadge({ type }) {
  const getBgColor = () => {
    switch(type) {
      case 'ETH': return 'bg-blue-600';
      case 'BASE': return 'bg-blue-400';
      case 'SOL': return 'bg-purple-600';
      case 'USDC': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <div className={`${getBgColor()} rounded-lg px-3 py-2 text-center font-medium`}>
      {type}
    </div>
  );
}

function EventTag({ name }) {
  return (
    <div className="bg-indigo-700 bg-opacity-60 px-3 py-1 rounded-full text-sm">
      {name}
    </div>
  );
}