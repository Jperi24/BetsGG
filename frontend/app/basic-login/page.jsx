'use client';

import { useState } from 'react';
import { login as apiLogin } from '@/lib/api/auth';

export default function BasicLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      console.log('Attempting direct login with:', { email });
      const response = await apiLogin({ email, password });
      
      console.log('Login API response:', response);
      setResult({
        success: true,
        token: response.token ? response.token.substring(0, 20) + '...' : 'No token',
        requires2FA: response.requires2FA || false,
        tempToken: response.tempToken || 'None'
      });
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        document.cookie = `token=${response.token}; path=/; max-age=${60*60*24*7}`;
      }
      
      // Store 2FA info if needed
      if (response.requires2FA && response.tempToken) {
        sessionStorage.setItem('tempToken', response.tempToken);
        sessionStorage.setItem('requires2FA', 'true');
        sessionStorage.setItem('pendingAuthEmail', email);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
      setResult({
        success: false,
        error: err.message || 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-white text-xl font-bold">Basic Login Test</h1>
          <p className="text-indigo-200 text-sm">This bypasses the auth provider to test the API directly</p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {result && (
            <div className={`mb-4 p-4 rounded border-l-4 ${
              result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
            }`}>
              <h3 className="font-bold">{result.success ? 'Login Successful' : 'Login Failed'}</h3>
              <pre className="mt-2 text-sm overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="flex justify-between mt-4">
              <a href="/debug-auth" className="text-sm text-indigo-600 hover:text-indigo-500">
                Auth Debug Tool
              </a>
              <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
                Return to Main Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}