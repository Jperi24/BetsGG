'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { useRouter } from 'next/navigation';
import { Loader, AlertCircle, Check } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

// Regular expressions for validation
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;
const PASSWORD_SPECIAL_REGEX = /[^a-zA-Z0-9]/;

const RegisterForm = ({ redirectPath = '/dashboard' }) => {
  const router = useRouter();
  const { register } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Password strength indicators
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLowercase = PASSWORD_LOWERCASE_REGEX.test(password);
  const hasUppercase = PASSWORD_UPPERCASE_REGEX.test(password);
  const hasNumber = PASSWORD_NUMBER_REGEX.test(password);
  const hasSpecial = PASSWORD_SPECIAL_REGEX.test(password);
  const isPasswordStrong = hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecial;
  
  // Validate username
  const validateUsername = (value) => {
    if (!value) return 'Username is required';
    if (!USERNAME_REGEX.test(value)) {
      return 'Username must be between 3 and 30 characters and can only contain letters, numbers, and underscores';
    }
    return '';
  };
  
  // Validate email
  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };
  
  // Validate password
  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
    }
    if (!PASSWORD_LOWERCASE_REGEX.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!PASSWORD_UPPERCASE_REGEX.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!PASSWORD_NUMBER_REGEX.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!PASSWORD_SPECIAL_REGEX.test(value)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };
  
  // Validate confirm password
  const validateConfirmPassword = (value) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  };
  
  // Validate all form fields
  const validateForm = () => {
    const errors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword)
    };
    
    setFormErrors(errors);
    
    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
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
            onChange={(e) => {
              setUsername(e.target.value);
              if (formErrors.username) {
                setFormErrors(prev => ({...prev, username: validateUsername(e.target.value)}));
              }
            }}
            onBlur={() => setFormErrors(prev => ({...prev, username: validateUsername(username)}))}
            className={`mt-1 block w-full rounded-md ${formErrors.username ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            disabled={isLoading}
          />
          {formErrors.username && (
            <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
          )}
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (formErrors.password) {
                setFormErrors(prev => ({...prev, password: validatePassword(e.target.value)}));
              }
              // Also update confirm password validation when password changes
              if (confirmPassword) {
                setFormErrors(prev => ({
                  ...prev, 
                  confirmPassword: e.target.value === confirmPassword ? '' : 'Passwords do not match'
                }));
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
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formErrors.confirmPassword) {
                setFormErrors(prev => ({
                  ...prev, 
                  confirmPassword: validateConfirmPassword(e.target.value)
                }));
              }
            }}
            onBlur={() => setFormErrors(prev => ({
              ...prev, 
              confirmPassword: validateConfirmPassword(confirmPassword)
            }))}
            className={`mt-1 block w-full rounded-md ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            disabled={isLoading}
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
          )}
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
                  At least {PASSWORD_MIN_LENGTH} characters
                </span>
              </li>
              <li className="flex items-center">
                {hasLowercase ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center mr-2">
                    <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                  </span>
                )}
                <span className={hasLowercase ? 'text-green-700' : 'text-gray-500'}>
                  Contains at least one lowercase letter
                </span>
              </li>
              <li className="flex items-center">
                {hasUppercase ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center mr-2">
                    <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                  </span>
                )}
                <span className={hasUppercase ? 'text-green-700' : 'text-gray-500'}>
                  Contains at least one uppercase letter
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
              <li className="flex items-center">
                {hasSpecial ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center mr-2">
                    <span className="h-1.5 w-1.5 bg-gray-300 rounded-full"></span>
                  </span>
                )}
                <span className={hasSpecial ? 'text-green-700' : 'text-gray-500'}>
                  Contains at least one special character
                </span>
              </li>
            </ul>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isLoading || !isPasswordStrong}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
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
          <div className="relative mt-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">
          Or continue with
        </span>
      </div>
    </div>
    
    <div className="mt-6">
      <GoogleSignInButton />
    </div>
  
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;