'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = params;
  const { isAuthenticated, isLoading } = useAuth();
  
  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  // If no token is provided in the URL, show an error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Invalid Reset Link</h2>
            <p className="mt-2 text-gray-600">
              The password reset link is invalid or has expired.
            </p>
            <div className="mt-4">
              <a
                href="/auth/forgot-password"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Request a new password reset link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Set a new password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a strong password that you don't use for other websites
          </p>
        </div>
        
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}