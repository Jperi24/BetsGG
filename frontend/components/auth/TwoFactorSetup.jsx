'use client';

import React, { useState, useEffect } from 'react';
import { setup2FA, verify2FA } from '@/lib/api/auth';
import { Loader, AlertCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import RecoveryCodeDisplay from './RecoveryCodeDisplay';





const TwoFactorSetup = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  
  // Load 2FA setup data when component mounts
// In frontend/components/auth/TwoFactorSetup.jsx
// In your useEffect within TwoFactorSetup.jsx
useEffect(() => {
  const loadSetupData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Log current cookies
      console.log("Cookies before request:", document.cookie);
      
      // Check for auth token
      const hasAuthToken = document.cookie.includes('auth_token=');
      console.log("Has auth token:", hasAuthToken);
      
      // This is the important change - use the imported function
      const response = await setup2FA();
      console.log("2FA setup response:", response);
      
      setSetupData(response.data);
    } catch (err) {
      console.error('Setup Error:', err);
      setError(err.message || 'Failed to start 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  loadSetupData();
}, []);

  // Handle verification code submission
// In components/auth/TwoFactorSetup.jsx
const handleVerify = async (e) => {
  e.preventDefault();
  
  if (!verificationCode || verificationCode.length !== 6) {
    setError('Please enter a valid 6-digit verification code');
    return;
  }
  
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('Submitting verification code:', verificationCode);
    
    // Also log cookies at this point
    console.log('Cookies before verification:', document.cookie);
    
    // Get CSRF token
    const csrfToken = document.cookie.split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    console.log("CSRF token for verification:", csrfToken);
    
    const response = await verify2FA(verificationCode);
    console.log('Verification successful:', response);
    
    setRecoveryCodes(response.data.recoveryCodes);
    setCurrentStep(3);
    
  } catch (err) {
    console.error('Verification error:', err);
    
    // More specific error message based on the error
    if (err.response?.status === 403) {
      setError('Permission denied. There may be an issue with your session or CSRF token.');
    } else {
      setError(err.message || 'Failed to verify code. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
  
  // Format verification code input (add space after 3 digits)
  const formatVerificationCode = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 6 digits
    const limitedDigits = digits.slice(0, 6);
    setVerificationCode(limitedDigits);
  };
  
  // Handle setup completion
  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
  };
  
  // Render loading state
  if (isLoading && !setupData) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Preparing 2FA setup...</span>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Steps indicator */}
      <div className="mb-8">
        <ol className="flex items-center w-full">
          {[1, 2, 3].map((step) => (
            <li key={step} className={`flex items-center ${step < 3 ? 'w-full' : ''}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step
                )}
              </span>
              
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>
              )}
            </li>
          ))}
        </ol>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 1: Scan QR code */}
      {currentStep === 1 && setupData && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Set up Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 mb-6">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 flex justify-center">
            <img 
              src={setupData.qrCodeUrl} 
              alt="QR Code for 2FA setup" 
              className="h-48 w-48"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700 mb-2 font-medium">Manual setup code:</p>
            <p className="font-mono text-sm bg-white p-2 rounded border border-gray-200 select-all">
              {setupData.secretKey}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              If you can't scan the QR code, you can manually enter this code into your authenticator app.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Step 2: Verify code */}
      {currentStep === 2 && (
        <div>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Your Setup</h3>
          <p className="text-sm text-gray-600 mb-6">
            Enter the 6-digit verification code from your authenticator app to confirm your setup.
          </p>
          
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
                value={verificationCode}
                onChange={(e) => formatVerificationCode(e.target.value)}
                placeholder="000000"
                className="block w-full text-center font-mono tracking-widest text-xl rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Verifying...
                </span>
              ) : (
                'Verify and Enable 2FA'
              )}
            </button>
          </form>
        </div>
      )}
      
      {/* Step 3: Recovery codes */}
      {currentStep === 3 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Save Your Recovery Codes</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you lose access to your authenticator app, you can use these recovery codes to sign in.
            Each code can only be used once.
          </p>
          
          <div className="mb-8">
            <RecoveryCodeDisplay codes={recoveryCodes} />
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> Store these recovery codes in a safe place. They will only be shown once.
                </p>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleFinish}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            I've saved my recovery codes
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;