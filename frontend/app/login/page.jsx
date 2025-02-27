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
  const { isAuthenticated, isLoading, authInitialized } = useAuth();
  
  // Get the redirect path from URL query params if it exists
  // Store the original 'from' parameter on first render to prevent it from being overwritten
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  
  useEffect(() => {
    // Only set the redirect path once on initial load
    const fromParam = searchParams.get('from');
    if (fromParam && redirectPath === '/dashboard') {
      console.log('Setting redirect path from URL:', fromParam);
      setRedirectPath(fromParam);
    }
  }, [searchParams, redirectPath]);
  
  // If user is already authenticated, redirect to the intended path
  useEffect(() => {
    if (authInitialized && !isLoading && isAuthenticated) {
      console.log('User is authenticated, redirecting to:', redirectPath);
      router.push(redirectPath);
    }
  }, [isLoading, isAuthenticated, router, redirectPath, authInitialized]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
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
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <LoginForm redirectPath={redirectPath} />
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}