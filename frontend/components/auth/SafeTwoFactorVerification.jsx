'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { Loader, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';

const TwoFactorVerification = ({ temporaryToken, onVerificationSuccess, onCancel }) => {
  const { verify2FA } = useAuth(); // Use the auth context instead of direct API call
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false);
  const inputRef = useRef(null);
  
  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Check if we have an error stored in session storage
    if (typeof window !== 'undefined') {
      const storedError = sessionStorage.getItem('2fa_error');
      if (storedError) {
        setError(storedError);
        sessionStorage.removeItem('2fa_error');
      }
    }
  }, [isUsingRecoveryCode]);
  
  // Format verification code input
  const formatVerificationCode = (value) => {
    // For normal 2FA codes (6 digits)
    if (!isUsingRecoveryCode) {
      // Remove non-digits
      const digits = value.replace(/\D/g, '');
      // Limit to 6 digits
      const limitedDigits = digits.slice(0, 6);
      setVerificationCode(limitedDigits);
    } else {
      // For recovery codes (typically something like XXXX-XXXX-XXXX)
      // Allow alphanumeric characters and hyphens
      const cleanValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      setVerificationCode(cleanValue);
    }
  };
  
  // Handle verification code submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || 
        (!isUsingRecoveryCode && verificationCode.length !== 6) ||
        (isUsingRecoveryCode && verificationCode.length < 8)) {
      setError(`Please enter a valid ${isUsingRecoveryCode ? 'recovery' : 'verification'} code`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use auth context's verify2FA method instead of direct API call
      const response = await verify2FA(verificationCode, isUsingRecoveryCode);
      
      // Call the success callback with the token and user info
      if (onVerificationSuccess) {
        onVerificationSuccess(response.token, response.data.user);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to verify code. Please try again.');
      
      // Store the error in session storage in case we navigate away
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('2fa_error', err.message || 'Failed to verify code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle between verification code and recovery code
  const toggleCodeType = () => {
    setVerificationCode('');
    setIsUsingRecoveryCode(!isUsingRecoveryCode);
    setError(null);
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600">
          {isUsingRecoveryCode 
            ? 'Enter a recovery code from your list of saved recovery codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="verificationCode" className="sr-only">
            {isUsingRecoveryCode ? 'Recovery Code' : 'Verification Code'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              id="verificationCode"
              type="text"
              inputMode={isUsingRecoveryCode ? "text" : "numeric"}
              pattern={isUsingRecoveryCode ? undefined : "[0-9]*"}
              autoComplete={isUsingRecoveryCode ? "off" : "one-time-code"}
              required
              value={verificationCode}
              onChange={(e) => formatVerificationCode(e.target.value)}
              placeholder={isUsingRecoveryCode ? "XXXX-XXXX-XXXX" : "000000"}
              className="block w-full pl-10 pr-3 py-3 font-mono text-lg text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            {isUsingRecoveryCode 
              ? 'Recovery codes are case-insensitive and hyphens are optional'
              : 'This code will expire in 5 minutes'}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Verifying...
            </span>
          ) : (
            'Verify'
          )}
        </button>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleCodeType}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isUsingRecoveryCode 
              ? 'Use authenticator app instead'
              : 'Use a recovery code instead'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TwoFactorVerification;