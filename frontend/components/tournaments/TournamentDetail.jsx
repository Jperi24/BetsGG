"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Define tab type
const tabs = [
  { name: 'Overview', id: 'overview' },
  { name: 'Events', id: 'events' },
  { name: 'Bets', id: 'bets' }
];

const TournamentDetail = ({ tournament }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedEvents, setExpandedEvents] = useState({});
  
  if (!tournament) return null;
  
  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status
  const getStatus = () => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < tournament.startAt) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now > tournament.endAt) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { label: 'Live Now', color: 'bg-green-100 text-green-800' };
    }
  };
  
  // Get location string
  const getLocation = () => {
    const parts = [];
    
    if (tournament.venueAddress) parts.push(tournament.venueAddress);
    if (tournament.city) parts.push(tournament.city);
    if (tournament.addrState) parts.push(tournament.addrState);
    if (tournament.countryCode) parts.push(tournament.countryCode);
    
    return parts.join(', ') || 'Online Event';
  };
  
  // Toggle event expansion
  const toggleEvent = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  const status = getStatus();
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Tournament Banner */}
      <div className="relative h-64 w-full bg-gray-200">
        {tournament.images && tournament.images[0] ? (
          <Image
            src={tournament.images[0].url}
            alt={tournament.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <h2 className="text-2xl text-white font-bold">{tournament.name}</h2>
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span className={`${status.color} px-3 py-1 rounded-full text-sm font-medium`}>
            {status.label}
          </span>
        </div>
      </div>
      
      {/* Basic Info */}
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Dates</p>
              <p className="font-medium">
                {formatDate(tournament.startAt)} - {formatDate(tournament.endAt)}
              </p>
              <p className="text-sm text-gray-500">
                {formatTime(tournament.startAt)} - {formatTime(tournament.endAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{getLocation()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Attendees</p>
              <p className="font-medium">{tournament.numAttendees || 0}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">
                {Math.ceil((tournament.endAt - tournament.startAt) / (24 * 60 * 60))} days
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-t border-gray-200">
        <div className="px-6">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="px-6 py-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Overview</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  {tournament.name} is a {tournament.events?.length || 0} event tournament
                  taking place in {tournament.city || 'Online'}.
                  The tournament starts on {formatDate(tournament.startAt)} and ends on {formatDate(tournament.endAt)}.
                  {tournament.numAttendees > 0 && ` There are ${tournament.numAttendees} attendees registered.`}
                </p>
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Tournament Summary</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="bg-indigo-50 p-4 rounded-md text-center">
                    <p className="text-sm text-gray-600">Events</p>
                    <p className="text-xl font-bold text-indigo-600">{tournament.events?.length || 0}</p>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-md text-center">
                    <p className="text-sm text-gray-600">Attendees</p>
                    <p className="text-xl font-bold text-indigo-600">{tournament.numAttendees || 0}</p>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-md text-center">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {Math.ceil((tournament.endAt - tournament.startAt) / (24 * 60 * 60))} days
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-md text-center">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-xl font-bold text-indigo-600">{status.label}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Events</h3>
              
              {tournament.events && tournament.events.length > 0 ? (
                <div className="space-y-4">
                  {tournament.events.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-md overflow-hidden">
                      <div 
                        className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleEvent(event.id)}
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{event.name}</h4>
                          <p className="text-sm text-gray-500">
                            {event.videogame?.name || 'Game not specified'} | {event.numEntrants || 0} Entrants
                          </p>
                        </div>
                        <div>
                          {expandedEvents[event.id] ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>
                      
                      {expandedEvents[event.id] && (
                        <div className="p-4 bg-white">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Phases</h5>
                          
                          {event.phases && event.phases.length > 0 ? (
                            <ul className="space-y-2">
                              {event.phases.map((phase) => (
                                <li key={phase.id} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{phase.name}</span>
                                    <Link
                                      href={`/tournaments/${tournament.slug}/events/${event.id}/phases/${phase.id}`}
                                      className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                      View Matches
                                    </Link>
                                  </div>
                                  {phase.numSeeds && (
                                    <p className="text-sm text-gray-500">
                                      {phase.numSeeds} participants | {phase.bracketType || 'Standard'} bracket
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No phases available</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">No events available for this tournament.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Bets Tab */}
          {activeTab === 'bets' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tournament Bets</h3>
                <Link
                  href={`/bets/create?tournament=${tournament.slug}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Bet
                </Link>
              </div>
              
              <div className="space-y-4">
                {/* We'll load bets for this tournament from the API */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">
                    Loading active bets for this tournament...
                  </p>
                </div>
                
                {/* This would be replaced with actual bet data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">Sample Match</h4>
                        <p className="text-sm text-gray-500">Quarterfinals - Game 1</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Open
                      </span>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="font-medium">Player 1</p>
                        <p className="text-xs text-gray-500">Odds: 1.5x</p>
                      </div>
                      
                      <div className="mx-2 text-gray-400">VS</div>
                      
                      <div className="text-center flex-1">
                        <p className="font-medium">Player 2</p>
                        <p className="text-xs text-gray-500">Odds: 2.8x</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                      <span className="text-gray-500">Pool: 0.5 ETH</span>
                      <Link href="/bet/sample-id" className="text-indigo-600 hover:text-indigo-800">
                        Place Bet
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;