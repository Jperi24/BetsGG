'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { useRouter } from 'next/navigation';
import { Loader, AlertCircle, Check } from 'lucide-react';

const RegisterForm = ({ redirectPath = '/dashboard' }) => {
  const router = useRouter();
  const { register } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username || !email || !password) {
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      await register(username, email, password);
      router.push(redirectPath);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;