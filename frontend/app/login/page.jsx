// frontend/app/login/page.jsx
// Add logout confirmation support to the login page

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/providers/auth-providers';
import { Loader, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, authInitialized, requires2FA } = useAuth();
  
  // Get the redirect path from URL query params if it exists
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const [redirectionChecked, setRedirectionChecked] = useState(false);
  
  // Check for logout success message parameter
  const hasLoggedOut = searchParams.get('loggedout') === 'true';
  const logoutError = searchParams.get('error') === 'true';
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  
  useEffect(() => {
    // Only set the redirect path once on initial load
    const fromParam = searchParams.get('from');
    if (fromParam && redirectPath === '/dashboard') {
      console.log('Setting redirect path from URL:', fromParam);
      setRedirectPath(fromParam);
    }
    
    // Show logout message for 3 seconds if present
    if (hasLoggedOut) {
      setShowLogoutMessage(true);
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, redirectPath, hasLoggedOut]);
  
  // Check authentication status and redirect if needed
  useEffect(() => {
    if (!authInitialized || isLoading) return;
    
    if (isAuthenticated && !requires2FA) {
      console.log('Redirecting to:', redirectPath);
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, requires2FA, authInitialized, redirectPath, router]);
  
  if (!authInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only show the redirecting UI if actually authenticated and not requiring 2FA
  if (isAuthenticated && !requires2FA && redirectionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      {/* Logout confirmation message */}
      {showLogoutMessage && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-md flex items-start max-w-xs z-50 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              {logoutError 
                ? "You've been logged out, but there was an issue. Your session should still be cleared."
                : "You've been successfully logged out"}
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            {requires2FA 
              ? 'Verify your identity to continue' 
              : 'Sign in to your account to continue'}
          </p>
        </div>
        
        <LoginForm redirectPath={redirectPath} />
        
        {!requires2FA && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}