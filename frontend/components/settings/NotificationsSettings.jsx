'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { updateNotificationPreferences } from '@/lib/api/notifications';
import { 
  Loader, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Bell, 
  Mail,
  Smartphone,
  Award,
  DollarSign
} from 'lucide-react';

export default function NotificationsSettings() {
  const { user } = useAuth();
  
  // Default preferences - in a real app, these would be fetched from the API
  const defaultPreferences = {
    email: {
      tournamentReminders: true,
      betResults: true,
      paymentNotifications: true,
      marketingEmails: false,
      securityAlerts: true
    },
    push: {
      tournamentReminders: false,
      betResults: true,
      paymentNotifications: true,
      newBettingOpportunities: false,
      securityAlerts: true
    }
  };
  
  // State
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Fetch current notification preferences on component mount
  useEffect(() => {
    // In a real app, you would fetch the user's preferences from the API
    // For now, we'll just use the default ones
    setPreferences(defaultPreferences);
  }, []);
  
  // Toggle a specific preference
  const togglePreference = (channel, setting) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: !prev[channel][setting]
      }
    }));
  };
  
  // Save notification preferences
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Call your API to update preferences
      await updateNotificationPreferences(preferences);
      
      // Show success message
      setSuccessMessage('Notification preferences updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update notification preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Notification Settings | EsportsBets">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link 
              href="/settings"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Link>
          </div>
          
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          </div>
          
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Email Notifications */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center mb-4">
                <Mail className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-medium text-gray-900">Email Notifications</h2>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Select which email notifications you'd like to receive.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-tournamentReminders"
                      type="checkbox"
                      checked={preferences.email.tournamentReminders}
                      onChange={() => togglePreference('email', 'tournamentReminders')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-tournamentReminders" className="font-medium text-gray-700">Tournament Reminders</label>
                    <p className="text-gray-500">Receive reminders about upcoming tournaments and matches</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-betResults"
                      type="checkbox"
                      checked={preferences.email.betResults}
                      onChange={() => togglePreference('email', 'betResults')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-betResults" className="font-medium text-gray-700">Bet Results</label>
                    <p className="text-gray-500">Get notified when your bets are settled</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-paymentNotifications"
                      type="checkbox"
                      checked={preferences.email.paymentNotifications}
                      onChange={() => togglePreference('email', 'paymentNotifications')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-paymentNotifications" className="font-medium text-gray-700">Payment Notifications</label>
                    <p className="text-gray-500">Receive notifications about deposits, withdrawals, and winnings</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-securityAlerts"
                      type="checkbox"
                      checked={preferences.email.securityAlerts}
                      onChange={() => togglePreference('email', 'securityAlerts')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-securityAlerts" className="font-medium text-gray-700">Security Alerts</label>
                    <p className="text-gray-500">Get notified about important security events like password changes or login attempts</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-marketingEmails"
                      type="checkbox"
                      checked={preferences.email.marketingEmails}
                      onChange={() => togglePreference('email', 'marketingEmails')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-marketingEmails" className="font-medium text-gray-700">Marketing Emails</label>
                    <p className="text-gray-500">Receive promotional offers, news, and updates</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Push Notifications */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Smartphone className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-medium text-gray-900">Push Notifications</h2>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Control which push notifications you'll receive on your device.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-tournamentReminders"
                      type="checkbox"
                      checked={preferences.push.tournamentReminders}
                      onChange={() => togglePreference('push', 'tournamentReminders')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-tournamentReminders" className="font-medium text-gray-700">Tournament Reminders</label>
                    <p className="text-gray-500">Get notified before tournaments and matches start</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-betResults"
                      type="checkbox"
                      checked={preferences.push.betResults}
                      onChange={() => togglePreference('push', 'betResults')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-betResults" className="font-medium text-gray-700">Bet Results</label>
                    <p className="text-gray-500">Instant notifications when your bets are settled</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-paymentNotifications"
                      type="checkbox"
                      checked={preferences.push.paymentNotifications}
                      onChange={() => togglePreference('push', 'paymentNotifications')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-paymentNotifications" className="font-medium text-gray-700">Payment Notifications</label>
                    <p className="text-gray-500">Real-time updates on deposits, withdrawals, and winnings</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-newBettingOpportunities"
                      type="checkbox"
                      checked={preferences.push.newBettingOpportunities}
                      onChange={() => togglePreference('push', 'newBettingOpportunities')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-newBettingOpportunities" className="font-medium text-gray-700">New Betting Opportunities</label>
                    <p className="text-gray-500">Get notified about new tournaments and betting pools</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-securityAlerts"
                      type="checkbox"
                      checked={preferences.push.securityAlerts}
                      onChange={() => togglePreference('push', 'securityAlerts')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-securityAlerts" className="font-medium text-gray-700">Security Alerts</label>
                    <p className="text-gray-500">Immediate alerts for important security events</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}