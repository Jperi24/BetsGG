// components/betting/IntegratedBettingView.jsx
import React, { useState } from 'react';
import PlaceBetForm from './place-bet';
import CustomOddsBetting from './CustomOddsBetting';
import CustomOddsBetDetails from './CustomOddsBetDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const IntegratedBettingView = ({ bet, userParticipation }) => {
  const [activeTab, setActiveTab] = useState('standard');
  
  // Check if bet is open for betting
  const isBetOpen = bet.status === 'open';
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  
  // Handle successful bet placement
  const handleBetSuccess = () => {
    // Reload the page after 2 seconds to refresh data
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };
  
  return (
    <div className="mt-8">
      <Tabs 
        defaultValue="standard" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard">Standard Betting</TabsTrigger>
          <TabsTrigger value="custom">Custom Odds Betting</TabsTrigger>
        </TabsList>
        
        {/* Standard Betting UI */}
        <TabsContent value="standard" className="py-4">
          {isBetOpen && !userParticipation ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Place Your Bet</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fixed-odds betting pool against all other participants
                </p>
              </div>
              
              <div className="p-6">
                <PlaceBetForm bet={bet} onSuccess={handleBetSuccess} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
              {userParticipation ? (
                <p>You have already placed a bet in this standard betting pool.</p>
              ) : (
                <p>This bet is no longer accepting new participants.</p>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Custom Odds Betting UI */}
        <TabsContent value="custom" className="py-4">
          <CustomOddsBetDetails betId={bet._id} bet={bet} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedBettingView;