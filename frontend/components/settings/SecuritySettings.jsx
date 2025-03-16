'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { updatePassword } from '@/lib/api/auth';
import { 
  Loader, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Eye, 
  EyeOff,
  Check
} from 'lucide-react';

export default function SecuritySettings() {
  const { user } = useAuth();
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber;
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };
  
  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (!isPasswordStrong) {
      setError('Please create a stronger password');
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      setError(null);
      
      // Call your API to update password
      await updatePassword({ 
        currentPassword, 
        newPassword 
      });
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Show success message
      setSuccessMessage('Password updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout title="Security Settings | EsportsBets">
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
            <Shield className="h-6 w-6 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
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
          
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            {/* Password Change Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Change Password</h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose a strong password that you haven't used elsewhere.
              </p>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                </div>
                
                {/* Toggle password visibility */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide passwords
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show passwords
                      </>
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator - only show when there's a new password */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 bg-gray-50 p-4 rounded">
                    <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-center">
                        {hasMinLength ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center mr-2">
                            <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                          </span>
                        )}
                        <span className={hasMinLength ? 'text-green-700' : 'text-gray-500'}>
                          At least 8 characters
                        </span>
                      </li>
                      <li className="flex items-center">
                        {hasLetter ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center mr-2">
                            <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                          </span>
                        )}
                        <span className={hasLetter ? 'text-green-700' : 'text-gray-500'}>
                          Contains at least one letter
                        </span>
                      </li>
                      <li className="flex items-center">
                        {hasNumber ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center mr-2">
                            <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                          </span>
                        )}
                        <span className={hasNumber ? 'text-green-700' : 'text-gray-500'}>
                          Contains at least one number
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
                
                <div>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !currentPassword || !isPasswordStrong || newPassword !== confirmPassword}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Two-Factor Authentication Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900">Two-Factor Authentication</h2>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.twoFactorEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Add an extra layer of security to your account by requiring a verification code from your mobile authenticator app when you log in.
              </p>
              
              <Link
                href="/settings/two-factor"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {user?.twoFactorEnabled ? 'Manage 2FA Settings' : 'Enable Two-Factor Authentication'}
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}