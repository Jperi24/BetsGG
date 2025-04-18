// components/betting/CustomOddsBetting.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { Loader, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { 
  createBetOffer, 
  acceptBetOffer, 
  getBetOffers, 
  getUserBets, 
  cancelBetOffer 
} from '@/lib/api/custom-odds';





const CustomOddsBetting = ({ betId, bet, onUpdate }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);
  const [userBets, setUserBets] = useState([]);
  
  // Form state for creating a new offer
  const [prediction, setPrediction] = useState(null);
  const [amount, setAmount] = useState('');
  const [oddsNumerator, setOddsNumerator] = useState('1');
  const [oddsDenominator, setOddsDenominator] = useState('1');
  
  // Form state for accepting an offer
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [acceptAmount, setAcceptAmount] = useState('');
  
  // Load active offers and user bets
  useEffect(() => {
    loadData();
  }, [betId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch active offers
      const offersResponse = await getBetOffers(betId);
      setActiveOffers(offersResponse.data.offers);
      
      // Fetch user bets if authenticated
      if (user) {
        const userBetsResponse = await getUserBets(betId);
        setUserBets(userBetsResponse.data.bets);
      }
    } catch (err) {
      setError('Failed to load betting data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle creating a new bet offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!prediction) {
      setError('Please select a contestant');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > user.balance) {
      setError('Insufficient balance');
      return;
    }
    
    if (parseInt(oddsNumerator) <= 0 || parseInt(oddsDenominator) <= 0) {
      setError('Odds must be positive numbers');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await createBetOffer({
        betId,
        prediction,
        amount: parseFloat(amount),
        odds: {
          numerator: parseInt(oddsNumerator),
          denominator: parseInt(oddsDenominator)
        }
      });
      
      setSuccess('Bet offer created successfully!');
      
      // Reset form
      setPrediction(null);
      setAmount('');
      setOddsNumerator('1');
      setOddsDenominator('1');
      
      // Refresh data
      loadData();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create bet offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle accepting an existing offer
  const handleAcceptOffer = async (e) => {
    e.preventDefault();
    
    if (!selectedOffer) {
      setError('Please select an offer to accept');
      return;
    }
    
    if (!acceptAmount || parseFloat(acceptAmount) <= 0) {
      setError('Please enter a valid amount to accept');
      return;
    }
    
    // Calculate required amount based on odds
    const requiredAmount = (parseFloat(acceptAmount) * selectedOffer.odds.denominator) / selectedOffer.odds.numerator;
    
    if (requiredAmount > user.balance) {
      setError(`Insufficient balance. You need ${requiredAmount.toFixed(4)} ETH to accept this amount.`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await acceptBetOffer({
        betId,
        offerId: selectedOffer.id,
        acceptAmount: parseFloat(acceptAmount)
      });
      
      setSuccess('Offer accepted successfully!');
      
      // Reset form
      setSelectedOffer(null);
      setAcceptAmount('');
      
      // Refresh data
      loadData();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to accept offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancelling an offer
  const handleCancelOffer = async (offerId) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await cancelBetOffer(betId, offerId);
      
      setSuccess('Offer cancelled successfully!');
      
      // Refresh data
      loadData();
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format currency amount
  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(4);
  };
  
  // Calculate potential winnings for creating an offer
  const calculatePotentialWinnings = () => {
    if (!prediction || !amount || parseFloat(amount) <= 0 || 
        parseInt(oddsNumerator) <= 0 || parseInt(oddsDenominator) <= 0) {
      return 0;
    }
    
    // For a winning bet, you get back your stake plus winnings
    const stake = parseFloat(amount);
    const winnings = (stake * parseInt(oddsDenominator)) / parseInt(oddsNumerator);
    
    return stake + winnings;
  };
  
  // Calculate required amount to match for accepting an offer
  const calculateRequiredAmount = () => {
    if (!selectedOffer || !acceptAmount || parseFloat(acceptAmount) <= 0) {
      return 0;
    }
    
    // Calculate how much you need to put up based on the odds
    return (parseFloat(acceptAmount) * selectedOffer.odds.denominator) / selectedOffer.odds.numerator;
  };
  
  // Calculate potential winnings for accepting an offer
  const calculateAcceptPotentialWinnings = () => {
    if (!selectedOffer || !acceptAmount || parseFloat(acceptAmount) <= 0) {
      return 0;
    }
    
    // For accepting, you get the amount you're accepting plus your stake
    const amountAccepting = parseFloat(acceptAmount);
    const yourStake = calculateRequiredAmount();
    
    return amountAccepting + yourStake;
  };
  
  if (bet.status !== 'open') {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center text-gray-600 mt-6">
        <p>This bet is no longer accepting new offers.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">Custom Odds Betting</h2>
          <button 
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
            aria-label="Refresh betting data"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Create New Bet Offer */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create a New Bet Offer</h3>
            
            <form onSubmit={handleCreateOffer}>
              {/* Select Contestant */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Contestant
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPrediction(1)}
                    className={`p-3 rounded-lg text-center border transition-colors ${
                      prediction === 1
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-medium">{bet.contestant1.name}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPrediction(2)}
                    className={`p-3 rounded-lg text-center border transition-colors ${
                      prediction === 2
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-medium">{bet.contestant2.name}</span>
                  </button>
                </div>
              </div>
              
              {/* Bet Amount */}
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Bet Amount (ETH)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="amount"
                    placeholder="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">ETH</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Your balance: {user?.balance.toFixed(4)} ETH
                </p>
              </div>
              
              {/* Odds Setting */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Odds
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={oddsNumerator}
                    onChange={(e) => setOddsNumerator(e.target.value)}
                    className="w-24 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-700 font-medium">:</span>
                  <input
                    type="number"
                    min="1"
                    value={oddsDenominator}
                    onChange={(e) => setOddsDenominator(e.target.value)}
                    className="w-24 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Example: 2:1 means you bet 2 units to win 1 unit (plus your stake back)
                </p>
              </div>
              
              {/* Potential Winnings */}
              {prediction && amount && parseFloat(amount) > 0 && (
                <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="h-4 w-4 text-indigo-600 mr-2" />
                    <p className="text-sm text-gray-700 font-medium">
                      Potential Return: {formatCurrency(calculatePotentialWinnings())} ETH
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    If your prediction is correct, you'll win {formatCurrency(calculatePotentialWinnings() - parseFloat(amount))} ETH plus your {formatCurrency(amount)} ETH stake back
                  </p>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !prediction || !amount || parseFloat(amount) <= 0}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    <span>Creating Offer...</span>
                  </div>
                ) : (
                  'Create Bet Offer'
                )}
              </button>
            </form>
          </div>
          
          {/* Active Bet Offers */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Bet Offers</h3>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader className="h-6 w-6 text-indigo-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading offers...</span>
              </div>
            ) : activeOffers.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No active offers available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOffers.map((offer) => (
                  <div 
                    key={offer.id} 
                    className={`border ${selectedOffer?.id === offer.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4 hover:border-indigo-300 transition-colors cursor-pointer`}
                    onClick={() => setSelectedOffer(selectedOffer?.id === offer.id ? null : offer)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          User: {offer.user.username}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            offer.prediction === 1 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {offer.contestant}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(offer.amount)} ETH</div>
                        <div className="text-xs text-gray-500">
                          Odds: {offer.odds.display}
                        </div>
                      </div>
                    </div>
                    
                    {/* Show cancel button for user's own offers */}
                    {user && offer.user.id === user.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOffer(offer.id);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Cancel offer
                      </button>
                    ) : selectedOffer?.id === offer.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <form onSubmit={handleAcceptOffer} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-end space-x-2">
                            <div className="flex-grow">
                              <label htmlFor={`accept-${offer.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                                Amount to accept (max: {formatCurrency(offer.amount)})
                              </label>
                              <div className="relative rounded-md shadow-sm">
                                <input
                                  type="text"
                                  id={`accept-${offer.id}`}
                                  placeholder={`Max: ${formatCurrency(offer.amount)}`}
                                  value={acceptAmount}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setAcceptAmount(val);
                                  }}
                                  className="block w-full text-sm pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <span className="text-gray-500 sm:text-sm">ETH</span>
                                </div>
                              </div>
                              {acceptAmount && (
                                <p className="mt-1 text-xs text-gray-500">
                                  You'll pay: {formatCurrency(calculateRequiredAmount())} ETH
                                </p>
                              )}
                            </div>
                            <button
                              type="submit"
                              disabled={isSubmitting || !acceptAmount || parseFloat(acceptAmount) <= 0 || parseFloat(acceptAmount) > offer.amount}
                              className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <Loader className="animate-spin h-4 w-4" />
                              ) : (
                                'Accept'
                              )}
                            </button>
                          </div>
                          
                          {acceptAmount && parseFloat(acceptAmount) > 0 && (
                            <div className="mt-2 p-2 bg-indigo-50 rounded text-xs">
                              <p className="font-medium text-indigo-800">
                                Potential Return: {formatCurrency(calculateAcceptPotentialWinnings())} ETH
                              </p>
                              <p className="text-indigo-600">
                                If {offer.prediction === 1 ? bet.contestant2.name : bet.contestant1.name} wins, you'll receive {formatCurrency(calculateAcceptPotentialWinnings())} ETH
                              </p>
                            </div>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* User's Active Bets */}
          {user && userBets.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Bets on This Match</h3>
              
              <div className="space-y-4">
                {userBets.map((userBet, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Type: {userBet.type === 'offer' ? 'Created Offer' : 'Accepted Offer'}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            userBet.prediction === 1 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userBet.prediction === 1 ? bet.contestant1.name : bet.contestant2.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(userBet.type === 'offer' ? userBet.amount : userBet.amount)} ETH
                        </div>
                        <div className="text-xs text-gray-500">
                          Odds: {userBet.odds.numerator}:{userBet.odds.denominator}
                        </div>
                      </div>
                    </div>
                    
                    {userBet.type === 'offer' && userBet.remainingAmount > 0 && (
                      <button
                        onClick={() => handleCancelOffer(userBet.id)}
                        disabled={isSubmitting}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Cancel remaining offer ({formatCurrency(userBet.remainingAmount)} ETH)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomOddsBetting;