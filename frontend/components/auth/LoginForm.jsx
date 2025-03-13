'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import { useRouter } from 'next/navigation';
import { Loader, AlertCircle } from 'lucide-react';
import TwoFactorVerification from './TwoFactorVerification';

const LoginForm = ({ redirectPath = '/dashboard' }) => {
  const router = useRouter();
  const { login, verify2FA, requires2FA, tempToken, cancelLogin, isAuthenticated, token } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showingTwoFactor, setShowingTwoFactor] = useState(false);
  
  // Log component rendering
  console.log('LoginForm rendered with state:', { 
    requires2FA, 
    hasToken: !!token, 
    isAuthenticated, 
    showingTwoFactor, 
    hasTempToken: !!tempToken 
  });
  
  // Check if we should redirect on auth change
  useEffect(() => {
    if (isAuthenticated && token && !requires2FA) {
      console.log('User is authenticated, redirecting to:', redirectPath);
      
      // Add a short delay to ensure state is fully updated
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, requires2FA, router, redirectPath]);
  
  // Check if we have a pending 2FA verification on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Restore email from session storage if available
      const pendingEmail = sessionStorage.getItem('pendingAuthEmail');
      if (pendingEmail) {
        console.log('Restoring pending email:', pendingEmail);
        setEmail(pendingEmail);
      }
      
      // Check for requires2FA flag
      if (requires2FA && tempToken) {
        console.log('2FA verification is required, showing verification form');
        setShowingTwoFactor(true);
      }
    }
  }, [requires2FA, tempToken]);
  
  // Handle normal login (first step)
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting login with:', { email });
      
      const response = await login(email, password);
      
      // Handle 2FA requirement - set flag to show 2FA form
      if (response.requires2FA) {
        console.log('2FA required, showing verification form');
        setShowingTwoFactor(true);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle 2FA verification success
  const handle2FAVerificationSuccess = (token, user) => {
    console.log('2FA verification successful, redirecting to:', redirectPath);
    
    // Explicit redirect instead of relying on effect
    const decodedPath = decodeURIComponent(redirectPath);
    router.push(decodedPath);
  };
  
  // Handle canceling 2FA verification
  const handleCancel2FA = () => {
    console.log('2FA verification canceled');
    cancelLogin();
    setShowingTwoFactor(false);
  };
  
  // Show 2FA verification form if required
  if (showingTwoFactor || (requires2FA && tempToken)) {
    console.log('Rendering 2FA verification form');
    return (
      <div className="w-full max-w-md mx-auto">
        <TwoFactorVerification
          temporaryToken={tempToken || sessionStorage.getItem('tempToken')}
          onVerificationSuccess={handle2FAVerificationSuccess}
          onCancel={handleCancel2FA}
        />
      </div>
    );
  }
  
  // Show normal login form
  console.log('Rendering normal login form');
  return (
    <div className="w-full max-w-md mx-auto">
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
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;