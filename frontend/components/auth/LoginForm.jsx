'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import { useRouter } from 'next/navigation';
import { Loader, AlertCircle } from 'lucide-react';
import TwoFactorVerification from './TwoFactorVerification';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const LoginForm = ({ redirectPath = '/dashboard' }) => {
  const router = useRouter();
  const { login, verify2FA, requires2FA, cancelLogin, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showingTwoFactor, setShowingTwoFactor] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  
  // Check if we should redirect on auth change
  useEffect(() => {
    if (isAuthenticated && !requires2FA) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, requires2FA, router, redirectPath]);
  
  // Check if we have a pending 2FA verification
  useEffect(() => {
    if (requires2FA) {
      setShowingTwoFactor(true);
    }
  }, [requires2FA]);

  // Validate email
  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    return '';
  };

  // Handle form validation
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setFormErrors({
      email: emailError,
      password: passwordError
    });
    
    return !emailError && !passwordError;
  };

  // Handle normal login (first step)
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await login(email, password);
      
      // Handle 2FA requirement - set flag to show 2FA form
      if (response.requires2FA) {
        setShowingTwoFactor(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle 2FA verification success
  const handle2FAVerificationSuccess = () => {
    // Redirect will be handled by the auth state change effect
  };
  
  // Handle canceling 2FA verification
  const handleCancel2FA = () => {
    cancelLogin();
    setShowingTwoFactor(false);
  };
  
  // Show 2FA verification form if required
  if (showingTwoFactor || requires2FA) {
    return (
      <div className="w-full max-w-md mx-auto">
        <TwoFactorVerification
          onVerificationSuccess={handle2FAVerificationSuccess}
          onCancel={handleCancel2FA}
        />
      </div>
    );
  }
  
  // Show normal login form
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) {
                setFormErrors(prev => ({...prev, email: validateEmail(e.target.value)}));
              }
            }}
            onBlur={() => setFormErrors(prev => ({...prev, email: validateEmail(email)}))}
            className={`mt-1 block w-full rounded-md ${formErrors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            disabled={isLoading}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (formErrors.password) {
                setFormErrors(prev => ({...prev, password: validatePassword(e.target.value)}));
              }
            }}
            onBlur={() => setFormErrors(prev => ({...prev, password: validatePassword(password)}))}
            className={`mt-1 block w-full rounded-md ${formErrors.password ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            disabled={isLoading}
          />
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
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