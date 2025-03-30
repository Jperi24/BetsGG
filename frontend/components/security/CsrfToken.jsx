'use client';

import { useEffect, useState } from 'react';
import { getCsrfToken } from '@/lib/api/auth';

/**
 * CsrfToken component that ensures a valid CSRF token is set
 * This component fetches a CSRF token from the server when needed
 * and adds it to a meta tag for use by the API client
 */
const CsrfToken = () => {
  const [isTokenFetched, setIsTokenFetched] = useState(false);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        // Check if we already have a CSRF token
        const existingToken = await getCsrfToken(false);
        
        if (!existingToken) {
          // Fetch a new token if we don't have one
          await getCsrfToken(true);
        }
        
        setIsTokenFetched(true);
      } catch (error) {
        console.error('CSRF token initialization error:', error);
        setIsTokenFetched(true); // Continue anyway
      }
    };
    
    initializeToken();
  }, []);

  // Add a meta tag with the CSRF token for the API client to use
  useEffect(() => {
    if (isTokenFetched) {
      // Get the token using our utility function (non-async here)
      const token = getCsrfToken(false);
      
      if (token) {
        // Set or update the meta tag
        let meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'csrf-token';
          document.head.appendChild(meta);
        }
        meta.content = token;
      }
    }
  }, [isTokenFetched]);

  // This component doesn't render anything visible
  return null;
};

export default CsrfToken;