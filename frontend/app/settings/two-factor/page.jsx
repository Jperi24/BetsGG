'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import { getUser2FAStatus, disable2FA, getRecoveryCodes } from '@/lib/api/auth';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import RecoveryCodeDisplay from '@/components/auth/RecoveryCodeDisplay';
import { Loader, ShieldCheck, ShieldOff, Key, AlertCircle } from 'lucide-react';

export default function TwoFactorSettingsPage() {
  const router = useRouter();
  const { user, updateUserData } = useAuth();
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isShowingRecoveryCodes, setIsShowingRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Load 2FA status when component mounts
  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getUser2FAStatus();
        setIs2FAEnabled(response.data.enabled);
        
      } catch (err) {
        setError('Failed to load 2FA status. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStatus();
  }, []);
  
  // Handle enabling 2FA
  const handleEnable2FA = () => {
    setIsSettingUp2FA(true);
    setError(null);
  };
  
  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    // Show a confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to disable two-factor authentication? This will reduce the security of your account.'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      await disable2FA();
      setIs2FAEnabled(false);
      
      // Update user object if needed
      if (user && updateUserData) {
        updateUserData({ has2FA: false });
      }
      
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle showing recovery codes
  const handleShowRecoveryCodes = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await getRecoveryCodes();
      setRecoveryCodes(response.data.recoveryCodes);
      setIsShowingRecoveryCodes(true);
      
    } catch (err) {
      setError(err.message || 'Failed to load recovery codes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle 2FA setup completion
  const handleSetupComplete = () => {
    setIsSettingUp2FA(false);
    setIs2FAEnabled(true);
    
    // Update user object if needed
    if (user && updateUserData) {
      updateUserData({ has2FA: true });
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Two-Factor Authentication Settings | EsportsBets">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h1>
          
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
          
          {isLoading ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading 2FA status...</p>
            </div>
          ) : isSettingUp2FA ? (
            <div className="bg-white shadow rounded-lg p-6">
              <TwoFactorSetup onComplete={handleSetupComplete} />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-2 rounded-full ${is2FAEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {is2FAEnabled ? (
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    ) : (
                      <ShieldOff className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {is2FAEnabled ? 'Two-Factor Authentication is enabled' : 'Two-Factor Authentication is disabled'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {is2FAEnabled
                        ? 'Your account is protected with an extra layer of security. When you log in, you\'ll need to provide a code from your authenticator app as well as your password.'
                        : 'Add an extra layer of security to your account by requiring a verification code from your mobile authenticator app when you log in.'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  {is2FAEnabled ? (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleShowRecoveryCodes}
                        disabled={isProcessing}
                        className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isProcessing ? (
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        View Recovery Codes
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        disabled={isProcessing}
                        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {isProcessing ? (
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <ShieldOff className="h-4 w-4 mr-2" />
                        )}
                        Disable Two-Factor Authentication
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnable2FA}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Enable Two-Factor Authentication
                    </button>
                  )}
                </div>
                
                {/* Show recovery codes if requested */}
                {isShowingRecoveryCodes && recoveryCodes.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Your Recovery Codes</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Save these recovery codes in a secure location. They can be used to log in if you lose access to your authenticator app.
                      Each code can only be used once.
                    </p>
                    
                    <RecoveryCodeDisplay codes={recoveryCodes} />
                    
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setIsShowingRecoveryCodes(false)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Hide recovery codes
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-6 py-4">
                <div className="text-sm">
                  <h4 className="font-medium text-gray-900">Security Tips:</h4>
                  <ul className="mt-2 ml-4 list-disc text-gray-600 space-y-1">
                    <li>Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.</li>
                    <li>Store your recovery codes in a secure location like a password manager.</li>
                    <li>Don't share your verification codes or recovery codes with anyone.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}