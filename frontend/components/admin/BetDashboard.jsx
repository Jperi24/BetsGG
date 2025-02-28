// frontend/components/admin/BetsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { getActiveBets, getUserCreatedBets, cancelBet, updateBetStatus } from '@/lib/api/bets';
import { Loader, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

const BetsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeBets, setActiveBets] = useState([]);
  const [disputedBets, setDisputedBets] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  
  // Load bets data
  useEffect(() => {
    loadBetsData();
  }, []);
  
  const loadBetsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all active bets
      const activeBetsResponse = await getActiveBets(100, 0);
      setActiveBets(activeBetsResponse.data.bets);
      
      // Filter for disputed bets (from any source)
      const disputedResponse = await getUserCreatedBets(); // We'll fetch all and filter
      const disputed = disputedResponse.data.bets.filter(bet => bet.disputed);
      setDisputedBets(disputed);
      
    } catch (err) {
      setError('Failed to load bets data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBetsData();
    setRefreshing(false);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Open</span>;
      case 'in_progress':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">In Progress</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelled</span>;
      case 'disputed':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Disputed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };
  
  // Handle canceling a bet
  const handleCancelBet = async (betId) => {
    try {
      setActionLoading(prev => ({ ...prev, [betId]: true }));
      
      await cancelBet(betId, {
        reason: 'Cancelled by admin due to dispute'
      });
      
      // Refresh the data
      await loadBetsData();
      
    } catch (err) {
      setError(`Failed to cancel bet: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [betId]: false }));
    }
  };
  
  // Handle resolving a dispute
  const handleResolveBet = async (betId, winner) => {
    try {
      setActionLoading(prev => ({ ...prev, [betId]: true }));
      
      await updateBetStatus(betId, {
        status: 'completed',
        winner: winner
      });
      
      // Refresh the data
      await loadBetsData();
      
    } catch (err) {
      setError(`Failed to resolve bet: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [betId]: false }));
    }
  };
  
  // Check if user has admin privileges
  if (!user || user.role !== 'admin') {
    return (
      <div className="bg-red-50 p-6 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
            <p className="mt-2 text-sm text-red-700">
              You do not have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading bets data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bets Management</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Disputed bets section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Disputed Bets</h3>
        </div>
        <div className="p-6">
          {disputedBets.length === 0 ? (
            <p className="text-gray-500">No disputed bets at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pool
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute Reason
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputedBets.map((bet) => (
                    <tr key={bet._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bet.tournamentName}</div>
                        <div className="text-xs text-gray-500">{formatDate(bet.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bet.matchName}</div>
                        <div className="text-xs text-gray-500">
                          {bet.contestant1.name} vs {bet.contestant2.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(bet.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.totalPool.toFixed(4)} ETH
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {bet.disputeReason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/bet/${bet._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleCancelBet(bet._id)}
                            disabled={actionLoading[bet._id]}
                            className="text-red-600 hover:text-red-900"
                          >
                            {actionLoading[bet._id] ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              'Cancel'
                            )}
                          </button>
                          <div className="border-l border-gray-300 pl-2 flex space-x-2">
                            <button
                              onClick={() => handleResolveBet(bet._id, 1)}
                              disabled={actionLoading[bet._id]}
                              className="text-green-600 hover:text-green-900"
                              title={`Declare ${bet.contestant1.name} as winner`}
                            >
                              {actionLoading[bet._id] ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                '1 Wins'
                              )}
                            </button>
                            <button
                              onClick={() => handleResolveBet(bet._id, 2)}
                              disabled={actionLoading[bet._id]}
                              className="text-green-600 hover:text-green-900"
                              title={`Declare ${bet.contestant2.name} as winner`}
                            >
                              {actionLoading[bet._id] ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                '2 Wins'
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Active bets section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Bets</h3>
        </div>
        <div className="p-6">
          {activeBets.length === 0 ? (
            <p className="text-gray-500">No active bets at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pool
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBets.map((bet) => (
                    <tr key={bet._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bet.tournamentName}</div>
                        <div className="text-xs text-gray-500">{formatDate(bet.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bet.matchName}</div>
                        <div className="text-xs text-gray-500">
                          {bet.contestant1.name} vs {bet.contestant2.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(bet.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.totalPool.toFixed(4)} ETH
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.participants.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/bet/${bet._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                          {bet.status === 'open' && (
                            <button
                              onClick={() => handleResolveBet(bet._id, 0)}
                              disabled={actionLoading[bet._id]}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {actionLoading[bet._id] ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                'Mark In Progress'
                              )}
                            </button>
                          )}
                          {bet.status === 'in_progress' && (
                            <div className="border-l border-gray-300 pl-2 flex space-x-2">
                              <button
                                onClick={() => handleResolveBet(bet._id, 1)}
                                disabled={actionLoading[bet._id]}
                                className="text-green-600 hover:text-green-900"
                                title={`Declare ${bet.contestant1.name} as winner`}
                              >
                                {actionLoading[bet._id] ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  '1 Wins'
                                )}
                              </button>
                              <button
                                onClick={() => handleResolveBet(bet._id, 2)}
                                disabled={actionLoading[bet._id]}
                                className="text-green-600 hover:text-green-900"
                                title={`Declare ${bet.contestant2.name} as winner`}
                              >
                                {actionLoading[bet._id] ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  '2 Wins'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetsDashboard;