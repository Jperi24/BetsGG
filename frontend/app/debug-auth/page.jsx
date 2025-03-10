'use client';

import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [authState, setAuthState] = useState({
    localStorageToken: null,
    cookieToken: null,
    sessionStorageItems: {}
  });

  useEffect(() => {
    // Function to parse cookies
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    
    // Collect all auth-related data
    const debugData = {
      localStorageToken: localStorage.getItem('token'),
      cookieToken: getCookie('token'),
      sessionStorageItems: {}
    };
    
    // Get all session storage items
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      debugData.sessionStorageItems[key] = sessionStorage.getItem(key);
    }
    
    setAuthState(debugData);
    
    // Log the data for convenience
    console.log('Auth debug data:', debugData);
  }, []);

  // Function to clear auth data
  const clearAuthData = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    document.cookie = 'verifying_2fa=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    // Clear session storage
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('requires2FA');
    sessionStorage.removeItem('pendingAuthEmail');
    sessionStorage.removeItem('2fa_error');
    
    // Refresh the page to show updated state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-white text-xl font-bold">Authentication Debug Tool</h1>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Current Authentication State</h2>
          
          <div className="space-y-6">
            {/* LocalStorage */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900">LocalStorage Token</h3>
              <div className="mt-2 font-mono text-sm">
                {authState.localStorageToken 
                  ? `Token: ${authState.localStorageToken.substring(0, 20)}...` 
                  : 'No token found'}
              </div>
            </div>
            
            {/* Cookies */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900">Cookie Token</h3>
              <div className="mt-2 font-mono text-sm">
                {authState.cookieToken 
                  ? `Token: ${authState.cookieToken.substring(0, 20)}...` 
                  : 'No token found'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                All cookies: {document.cookie || 'No cookies set'}
              </div>
            </div>
            
            {/* Session Storage */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900">Session Storage Items</h3>
              <div className="mt-2 space-y-2">
                {Object.keys(authState.sessionStorageItems).length > 0 ? (
                  Object.entries(authState.sessionStorageItems).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))
                ) : (
                  <div className="text-sm">No session storage items found</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col space-y-4">
            <button 
              onClick={clearAuthData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear All Auth Data
            </button>
            
            <a 
              href="/login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
            >
              Go to Login Page
            </a>
            
            <a 
              href="/dashboard" 
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}