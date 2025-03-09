'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/api/auth';
import { Loader, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

const ResetPasswordForm = ({ token }) => {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!isPasswordStrong) {
      setError('Please create a stronger password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
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
      
      {success ? (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Your password has been successfully reset! You will be redirected to the login page shortly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-10 sm:text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          
          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="space-y-2">
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
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Resetting password...
                </span>
              ) : (
                'Set New Password'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordForm;