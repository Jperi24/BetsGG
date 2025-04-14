"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Wallet, Users, Clock, ChevronRight, Check, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/providers/auth-providers';
import { getOngoingTournaments } from '@/lib/api/tournaments';

const ModernHomepage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [liveTournaments, setLiveTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselCount, setCarouselCount] = useState(0);

  // Fetch live tournaments
  useEffect(() => {
    const fetchLiveTournaments = async () => {
      try {
        setIsLoading(true);
        const response = await getOngoingTournaments(6); // Get up to 6 ongoing tournaments
        const tournaments = response.data.tournaments || [];
        setLiveTournaments(tournaments);
        // Set the carousel count for the second useEffect
        setCarouselCount(Math.min(tournaments.length, 3));
      } catch (error) {
        console.error("Error fetching live tournaments:", error);
        // Set some fallback tournaments in case the API fails
        setLiveTournaments([]);
        setCarouselCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveTournaments();
  }, []);

  // Auto scroll through tabs - using carouselCount instead of liveTournaments
  useEffect(() => {
    // Only auto-scroll if we have multiple tournaments
    if (carouselCount > 1) {
      const interval = setInterval(() => {
        setActiveTab((prev) => (prev + 1) % carouselCount);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselCount]); // This dependency array has a stable size

  // Format date for tournament display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Live Now';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get tournament image or placeholder
  const getTournamentImage = (tournament) => {
    return tournament.images && tournament.images[0] ? 
      tournament.images[0].url : 
      "/api/placeholder/800/450";
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-indigo-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 text-white">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                <span className="block">Bet on</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Esports Tournaments</span>
                <span className="block">Win Big</span>
              </h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-xl">
                Join thousands of esports fans making predictions and winning rewards on the world's most exciting tournaments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Fixed button: Entire area is now clickable */}
                <Link 
                  href={isAuthenticated ? "/tournaments" : "/register"} 
                  className="inline-block text-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium text-white hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                >
                  {isAuthenticated ? "Browse Tournaments" : "Get Started"}
                </Link>
                
                {/* Fixed button: Entire area is now clickable */}
                <Link 
                  href="/how-it-works" 
                  className="inline-block text-center px-8 py-4 bg-white/10 backdrop-blur rounded-xl font-medium text-white hover:bg-white/20 transition-all duration-300"
                >
                  How It Works
                </Link>
              </div>
              <div className="mt-8 flex items-center text-indigo-300 text-sm">
                <div className="flex -space-x-2 mr-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-medium">J</div>
                  <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-medium">S</div>
                  <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-800 font-medium">M</div>
                </div>
                <p>Join <span className="font-semibold text-white">10,000+</span> esports fans already betting</p>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="p-4 bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div>
                    {liveTournaments.length > 0 ? (
                      <div className="relative">
                        <div className="flex overflow-hidden rounded-xl">
                          {liveTournaments.slice(0, 3).map((tournament, idx) => (
                            <div key={tournament.id} className={`w-full flex-shrink-0 transition-all duration-500 ease-in-out ${
                              idx === activeTab ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute'
                            }`}>
                              <div className="relative">
                                <img 
                                  src={getTournamentImage(tournament)} 
                                  alt={tournament.name} 
                                  className="w-full h-60 object-cover rounded-t-xl"
                                />
                                <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                  LIVE NOW
                                </div>
                                <div className="absolute top-4 right-4 bg-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                                  {tournament.events && tournament.events[0]?.videogame?.name || "Esports"}
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-2xl font-bold mb-2">{tournament.name}</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                                    <span className="text-sm">Ends: {formatDate(tournament.endAt)}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-indigo-400" />
                                    <span className="text-sm">{tournament.numAttendees || "Unknown"} Attendees</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Trophy className="w-4 h-4 mr-2 text-indigo-400" />
                                    <span className="text-sm">Events: {tournament.events?.length || 0}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 mr-2 text-indigo-400" />
                                    <span className="text-sm">Featured Event</span>
                                  </div>
                                </div>
                                {/* Fixed button: entire area is clickable */}
                                <Link 
                                  href={`/tournaments/${tournament.slug}`} 
                                  className="block w-full text-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                                >
                                  Place Bets Now
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Carousel controls - only if we have multiple tournaments */}
                        {carouselCount > 1 && (
                          <div className="flex justify-center mt-4 gap-2">
                            {liveTournaments.slice(0, carouselCount).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  activeTab === idx ? "bg-white" : "bg-white/30"
                                }`}
                                aria-label={`View tournament ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <Trophy className="h-16 w-16 text-indigo-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Live Tournaments</h3>
                        <p className="text-indigo-200 mb-6">There are no tournaments currently live. Check back soon or browse upcoming events.</p>
                        {/* Fixed button: entire area is clickable */}
                        <Link 
                          href="/tournaments" 
                          className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                        >
                          View All Tournaments
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Tournaments Section - Only show if we have more than 3 tournaments */}
      {liveTournaments.length > 3 && (
        <section className="py-20 bg-gray-900/50 backdrop-blur-md">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h5 className="text-red-400 font-medium uppercase tracking-wider text-sm">More Live Events</h5>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  More Live Tournaments
                </h2>
                <p className="text-indigo-200 md:max-w-xl">
                  Don't miss out on the action! Check out more live tournaments.
                </p>
              </div>
              
              {/* Fixed button: entire area is clickable */}
              <Link 
                href="/tournaments" 
                className="mt-6 md:mt-0 group inline-flex items-center px-5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 backdrop-blur-sm rounded-lg border border-indigo-500/30 transition-all duration-300"
              >
                <span className="text-indigo-300 group-hover:text-white transition-colors">View All</span>
                <ChevronRight className="ml-1 h-5 w-5 text-indigo-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveTournaments.slice(3).map((tournament) => (
                <Link key={tournament.id} href={`/tournaments/${tournament.slug}`} className="group block h-full">
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-indigo-900/50 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col">
                    <div className="relative">
                      <img 
                        src={getTournamentImage(tournament)}
                        alt={tournament.name} 
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{tournament.name}</h3>
                      
                      <div className="space-y-3 mb-6 flex-grow">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-indigo-400 mr-2 flex-shrink-0" />
                          <div className="text-sm text-gray-300">
                            <span className="text-red-400 font-medium">Live Now</span> • Ends: {formatDate(tournament.endAt)}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-indigo-400 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{tournament.numAttendees || "Unknown"} Attendees</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-indigo-400 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{tournament.events?.length || 0} Events</span>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-600/20 group-hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg p-3 text-center text-indigo-300 group-hover:text-white transition-colors">
                        View Tournament Details
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernHomepage;