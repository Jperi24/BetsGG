'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { updateProfile } from '@/lib/api/auth';
import { Loader, ArrowLeft, CheckCircle, AlertCircle, User } from 'lucide-react';

export default function ProfileSettings() {
  const { user, updateUserData } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  // Handle username update
  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username === user.username) {
      setError('No changes made to username');
      return;
    }
    
    if (!currentPassword) {
      setError('Please enter your current password to confirm changes');
      return;
    }
    
    try {
      setIsUpdatingUsername(true);
      setError(null);
      
      // Call your API to update username
      const response = await updateProfile({
        username,
        currentPassword
      });
      
      // Update local user data
      updateUserData({ username });
      
      // Show success message
      setSuccessMessage('Username updated successfully');
      setCurrentPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update username. Please try again.');
    } finally {
      setIsUpdatingUsername(false);
    }
  };
  
  // Handle email update
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email cannot be empty');
      return;
    }
    
    if (email === user.email) {
      setError('No changes made to email');
      return;
    }
    
    if (!currentPassword) {
      setError('Please enter your current password to confirm changes');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsUpdatingEmail(true);
      setError(null);
      
      // Call your API to update email
      const response = await updateProfile({
        email,
        currentPassword
      });
      
      // Update local user data
      updateUserData({ email });
      
      // Show success message
      setSuccessMessage('Email updated successfully');
      setCurrentPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Profile Settings | EsportsBets">
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
            <User className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
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
            {/* Username Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Username</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your username is visible to other users and is used to identify you on the platform.
              </p>
              
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isUpdatingUsername}
                  />
                </div>
                
                <div>
                  <label htmlFor="currentPasswordUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPasswordUsername"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter password to confirm changes"
                    disabled={isUpdatingUsername}
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isUpdatingUsername || username === user?.username}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isUpdatingUsername ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Username'
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Email Section */}
            <div className="p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Email Address</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your email is used for account notifications and recovery. We won't share it with others.
              </p>
              
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isUpdatingEmail}
                  />
                </div>
                
                <div>
                  <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPasswordEmail"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter password to confirm changes"
                    disabled={isUpdatingEmail}
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isUpdatingEmail || email === user?.email}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isUpdatingEmail ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Email'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}