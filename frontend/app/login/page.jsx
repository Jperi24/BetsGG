'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/providers/auth-providers';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, authInitialized, requires2FA, token } = useAuth();
  
  // Get the redirect path from URL query params if it exists
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const [redirectionChecked, setRedirectionChecked] = useState(false);
  
  useEffect(() => {
    // Only set the redirect path once on initial load
    const fromParam = searchParams.get('from');
    if (fromParam && redirectPath === '/dashboard') {
      console.log('Setting redirect path from URL:', fromParam);
      setRedirectPath(fromParam);
    }
  }, [searchParams, redirectPath]);
  
  // Check authentication status and redirect if needed
  useEffect(() => {
    if (!authInitialized || redirectionChecked) return;
    
    console.log('Login page auth check:', { 
      isAuthenticated, 
      isLoading, 
      authInitialized, 
      requires2FA,
      hasToken: !!token
    });
    
    if (!isLoading && isAuthenticated && token && !requires2FA) {
      console.log('User is authenticated, redirecting to:', redirectPath);
      router.push(redirectPath);
    }
    
    setRedirectionChecked(true);
  }, [isLoading, isAuthenticated, router, redirectPath, authInitialized, requires2FA, token, redirectionChecked]);
  
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
  if (isAuthenticated && token && !requires2FA && redirectionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  // Debug information to help troubleshoot
  console.log('Rendering login form with auth state:', { 
    isAuthenticated, requires2FA, hasToken: !!token 
  });
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
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