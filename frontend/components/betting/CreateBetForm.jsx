import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, AlertCircle, Info } from 'lucide-react';
import { createBet } from '@/lib/api/bets';
import { getTournamentBySlug, getSetsByPhaseId } from '@/lib/api/tournaments';

const CreateBetForm = ({ tournamentSlug }) => {
  const router = useRouter();
  
  // Form state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Tournament data
  const [tournament, setTournament] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [availableSets, setAvailableSets] = useState([]);
  const [revisedSlug,setRevisedSlug]= useState('');
  
  // Bet parameters
  const [minBet, setMinBet] = useState('0.001');
  const [maxBet, setMaxBet] = useState('0.5');
  
  // Load tournament data
  useEffect(() => {
    const loadTournament = async () => {
      if (!tournamentSlug) return;
      
      try {
        setLoading(true);
        const newSlug = tournamentSlug.replace("tournament/","")
        setRevisedSlug(newSlug)

      
        const response = await getTournamentBySlug(newSlug);
        console.log("Response::",response)
        setTournament(response.data.tournament);
      } catch (err) {
        setError('Failed to load tournament data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTournament();
  }, [tournamentSlug]);
  
  // Load sets when phase is selected
  useEffect(() => {
    const loadSets = async () => {
      if (!selectedPhase) {
        setAvailableSets([]);
        return;
      }
      
      try {
        setLoading(true);
        const response = await getSetsByPhaseId(selectedPhase);
        
        // Filter for valid sets (must have 2 entrants)
        const validSets = response.data.sets.filter(set => 
          set.slots && 
          set.slots.length === 2 && 
          set.slots[0].entrant && 
          set.slots[1].entrant
        );
        
        setAvailableSets(validSets);
      } catch (err) {
        setError('Failed to load matches. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSets();
  }, [selectedPhase]);
  
  // Handle event selection
  const handleEventChange = (e) => {
    setSelectedEvent(e.target.value);
    setSelectedPhase('');
    setSelectedSet('');
    setAvailableSets([]);
  };
  
  // Handle phase selection
  const handlePhaseChange = (e) => {
    setSelectedPhase(e.target.value);
    setSelectedSet('');
  };
  
  // Handle set selection
  const handleSetChange = (e) => {
    setSelectedSet(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent || !selectedPhase || !selectedSet) {
      setError('Please select an event, phase, and match.');
      return;
    }
    
    if (parseFloat(minBet) <= 0 || parseFloat(maxBet) <= 0) {
      setError('Minimum and maximum bet amounts must be greater than 0.');
      return;
    }
    
    if (parseFloat(minBet) >= parseFloat(maxBet)) {
      setError('Maximum bet must be greater than minimum bet.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Find the selected event and phase for names
      const event = tournament.events.find(e => e.id === selectedEvent);
      const phase = event.phases.find(p => p.id === selectedPhase);
      
      // Create the bet
      await createBet({
        tournamentSlug: revisedSlug,
        eventId: selectedEvent,
        eventName: event.name,
        phaseId: selectedPhase,
        phaseName: phase.name,
        setId: selectedSet,
        minimumBet: parseFloat(minBet),
        maximumBet: parseFloat(maxBet)
      });
      
      setSuccess(true);
      
      // Redirect to the tournament page after a short delay
      setTimeout(() => {
        router.push(`/tournaments/${tournament.slug}`);
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to create bet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state
  if (loading && !tournament) {
    return (
      <div className="text-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
        <p className="mt-2 text-gray-600">Loading tournament data...</p>
      </div>
    );
  }
  
  // Show not found state
  if (!tournament) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <p className="mt-2 text-gray-600">Tournament not found. Please check the URL and try again.</p>
      </div>
    );
  }
  
  // If success, show success message
  if (success) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm leading-5 text-green-700">
              Bet created successfully! Redirecting you back to the tournament page...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Bet</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Creating a bet for: <span className="font-medium">{tournament.name}</span>
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Event Selection */}
        <div className="mb-4">
          <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
            Select Event
          </label>
          <select
            id="event"
            value={selectedEvent}
            onChange={handleEventChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="" disabled>Select an event</option>
            {tournament.events && tournament.events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.videogame?.name || 'Unknown Game'})
              </option>
            ))}
          </select>
        </div>
        
        {/* Phase Selection (available only if event is selected) */}
        {selectedEvent && (
          <div className="mb-4">
            <label htmlFor="phase" className="block text-sm font-medium text-gray-700 mb-1">
              Select Phase
            </label>
            <select
              id="phase"
              value={selectedPhase}
              onChange={handlePhaseChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="" disabled>Select a phase</option>
              {tournament.events.find(e => e.id === selectedEvent)?.phases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Match Selection (available only if phase is selected) */}
        {selectedPhase && (
          <div className="mb-4">
            <label htmlFor="match" className="block text-sm font-medium text-gray-700 mb-1">
              Select Match
            </label>
            {loading ? (
              <div className="flex items-center text-sm text-gray-500">
                <Loader className="h-4 w-4 text-indigo-600 animate-spin mr-2" />
                Loading matches...
              </div>
            ) : (
              <>
                {availableSets.length > 0 ? (
                  <select
                    id="match"
                    value={selectedSet}
                    onChange={handleSetChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="" disabled>Select a match</option>
                    {availableSets.map(set => (
                      <option key={set.id} value={set.id}>
                        {set.slots[0].entrant.name} vs {set.slots[1].entrant.name} ({set.fullRoundText})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500">
                    No valid matches found for this phase. Please select another phase.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Betting Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="minBet" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Bet (ETH)
            </label>
            <input
              id="minBet"
              type="number"
              min="0.0001"
              step="0.0001"
              value={minBet}
              onChange={(e) => setMinBet(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="maxBet" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Bet (ETH)
            </label>
            <input
              id="maxBet"
              type="number"
              min="0.001"
              step="0.001"
              value={maxBet}
              onChange={(e) => setMaxBet(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={submitting || !selectedSet || availableSets.length === 0}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Creating Bet...
              </span>
            ) : (
              'Create Bet'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBetForm;