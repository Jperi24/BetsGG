'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSetsByPhaseId, getTournamentBySlug } from '@/lib/api/tournaments';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';

export default function PhaseMatchesPage() {
  const params = useParams();
  const { slug, eventId, phaseId } = params;
  
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [event, setEvent] = useState(null);
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load tournament details
        const tournamentResponse = await getTournamentBySlug(slug);
        const tournamentData = tournamentResponse.data.tournament;
        setTournament(tournamentData);
        
        // Find event and phase
        const eventData = tournamentData.events.find(e => e.id === eventId);
        setEvent(eventData);
        
        const phaseData = eventData?.phases.find(p => p.id === phaseId);
        setPhase(phaseData);
        
        // Load sets for this phase
        const setsResponse = await getSetsByPhaseId(phaseId);
        setSets(setsResponse.data.sets);
      } catch (err) {
        setError('Failed to load matches data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug && eventId && phaseId) {
      loadData();
    }
  }, [slug, eventId, phaseId]);
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading matches...</span>
        </div>
      </div>
    );
  }
  
  if (error || !tournament || !event || !phase) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Tournament, event, or phase data not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href={`/tournaments/tournament/${slug}`}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tournament
        </Link>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <span>{event.name}</span>
          <span className="mx-2">•</span>
          <span>{phase.name}</span>
        </div>
      </div>
      
      {/* Matches List */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {sets.length === 0 ? (
            <li className="p-6 text-center text-gray-500">
              No matches found for this phase
            </li>
          ) : (
            sets.map((set) => (
              <li key={set.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="w-full">
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {set.fullRoundText || 'Match'}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {/* Entrant 1 */}
                      <div className={`text-center flex-1 p-2 rounded ${
                        set.winnerId === set.slots[0]?.entrant?.id 
                          ? 'bg-green-50 border border-green-200' 
                          : ''
                      }`}>
                        <p className="font-medium">
                          {set.slots[0]?.entrant?.name || 'TBD'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {set.slots[0]?.standing?.stats?.score?.value !== undefined
                            ? `Score: ${set.slots[0]?.standing?.stats?.score?.value}`
                            : ''}
                        </p>
                      </div>
                      
                      <div className="mx-4 text-gray-400 font-medium">VS</div>
                      
                      {/* Entrant 2 */}
                      <div className={`text-center flex-1 p-2 rounded ${
                        set.winnerId === set.slots[1]?.entrant?.id 
                          ? 'bg-green-50 border border-green-200' 
                          : ''
                      }`}>
                        <p className="font-medium">
                          {set.slots[1]?.entrant?.name || 'TBD'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {set.slots[1]?.standing?.stats?.score?.value !== undefined
                            ? `Score: ${set.slots[1]?.standing?.stats?.score?.value}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Match status */}
                    <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between">
                      <span className="text-sm text-gray-500">
                        Status: {
                          set.state === 1 ? 'Not Started' :
                          set.state === 2 ? 'In Progress' :
                          set.state === 3 ? 'Completed' : 'Unknown'
                        }
                      </span>
                      
                      {/* If there's data about match time, you could add it here */}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}