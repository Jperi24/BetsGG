'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '@/lib/api/notifications';
import { 
  Bell, 
  Mail, 
  Save, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

// Notification preferences page
export default function NotificationPreferencesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState({
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
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?from=/notifications/preferences');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await getNotificationPreferences();
        setPreferences(response.data.preferences);
        setError(null);
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [isAuthenticated]);
  
  // Handle toggle for email preferences
  const handleEmailToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key]
      }
    }));
    setSuccess(false);
  };
  
  // Handle toggle for push preferences
  const handlePushToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key]
      }
    }));
    setSuccess(false);
  };
  
  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(preferences);
      setSuccess(true);
      setError(null);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences');
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };
  
  // Loading state
  if (isLoading || (loading && !error)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-10 w-10 text-indigo-600 animate-spin mx-auto">
            <Bell />
          </div>
          <p className="mt-4 text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/notifications')}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
          aria-label="Back to notifications"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-sm text-green-700">Preferences updated successfully!</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Email preferences */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-indigo-600" />
            Email Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Tournament Reminders</h3>
                <p className="text-xs text-gray-500">Get notified about upcoming tournaments</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="email-tournament-reminders"
                  checked={preferences.email.tournamentReminders}
                  onChange={() => handleEmailToggle('tournamentReminders')}
                  className="sr-only"
                />
                <label
                  htmlFor="email-tournament-reminders"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.email.tournamentReminders ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.email.tournamentReminders ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Bet Results</h3>
                <p className="text-xs text-gray-500">Receive updates about your bets</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="email-bet-results"
                  checked={preferences.email.betResults}
                  onChange={() => handleEmailToggle('betResults')}
                  className="sr-only"
                />
                <label
                  htmlFor="email-bet-results"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.email.betResults ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.email.betResults ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Payment Notifications</h3>
                <p className="text-xs text-gray-500">Get notifications about deposits and withdrawals</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="email-payment-notifications"
                  checked={preferences.email.paymentNotifications}
                  onChange={() => handleEmailToggle('paymentNotifications')}
                  className="sr-only"
                />
                <label
                  htmlFor="email-payment-notifications"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.email.paymentNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.email.paymentNotifications ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Marketing Emails</h3>
                <p className="text-xs text-gray-500">Receive promotional offers and updates</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="email-marketing-emails"
                  checked={preferences.email.marketingEmails}
                  onChange={() => handleEmailToggle('marketingEmails')}
                  className="sr-only"
                />
                <label
                  htmlFor="email-marketing-emails"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.email.marketingEmails ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.email.marketingEmails ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Security Alerts</h3>
                <p className="text-xs text-gray-500">Important alerts about your account security</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="email-security-alerts"
                  checked={preferences.email.securityAlerts}
                  onChange={() => handleEmailToggle('securityAlerts')}
                  className="sr-only"
                />
                <label
                  htmlFor="email-security-alerts"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.email.securityAlerts ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.email.securityAlerts ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Push notification preferences */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-indigo-600" />
            In-App Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Tournament Reminders</h3>
                <p className="text-xs text-gray-500">Get notified about upcoming tournaments</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="push-tournament-reminders"
                  checked={preferences.push.tournamentReminders}
                  onChange={() => handlePushToggle('tournamentReminders')}
                  className="sr-only"
                />
                <label
                  htmlFor="push-tournament-reminders"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.push.tournamentReminders ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.push.tournamentReminders ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Bet Results</h3>
                <p className="text-xs text-gray-500">Receive updates about your bets</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="push-bet-results"
                  checked={preferences.push.betResults}
                  onChange={() => handlePushToggle('betResults')}
                  className="sr-only"
                />
                <label
                  htmlFor="push-bet-results"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.push.betResults ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.push.betResults ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Payment Notifications</h3>
                <p className="text-xs text-gray-500">Get notifications about deposits and withdrawals</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="push-payment-notifications"
                  checked={preferences.push.paymentNotifications}
                  onChange={() => handlePushToggle('paymentNotifications')}
                  className="sr-only"
                />
                <label
                  htmlFor="push-payment-notifications"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.push.paymentNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.push.paymentNotifications ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">New Betting Opportunities</h3>
                <p className="text-xs text-gray-500">Get notified about new matches available for betting</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="push-new-betting-opportunities"
                  checked={preferences.push.newBettingOpportunities}
                  onChange={() => handlePushToggle('newBettingOpportunities')}
                  className="sr-only"
                />
                <label
                  htmlFor="push-new-betting-opportunities"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.push.newBettingOpportunities ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.push.newBettingOpportunities ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Security Alerts</h3>
                <p className="text-xs text-gray-500">Important alerts about your account security</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="push-security-alerts"
                  checked={preferences.push.securityAlerts}
                  onChange={() => handlePushToggle('securityAlerts')}
                  className="sr-only"
                />
                <label
                  htmlFor="push-security-alerts"
                  className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                    preferences.push.securityAlerts ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                      preferences.push.securityAlerts ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save button */}
        <div className="p-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}