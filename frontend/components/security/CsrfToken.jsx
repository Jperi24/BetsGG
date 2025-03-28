'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * CsrfToken component that ensures a valid CSRF token is set
 * This component fetches a CSRF token from the server when needed
 * and adds it to a meta tag for use by the API client
 */
const CsrfToken = () => {
  const [isTokenFetched, setIsTokenFetched] = useState(false);

  useEffect(() => {
    // Check if we already have a CSRF token cookie
    const hasCsrfCookie = document.cookie
      .split('; ')
      .some(row => row.startsWith('XSRF-TOKEN='));
    
    // Only fetch a new token if we don't have one
    if (!hasCsrfCookie) {
      fetchCsrfToken();
    } else {
      setIsTokenFetched(true);
    }
  }, []);

  const fetchCsrfToken = async () => {
    try {
      // This endpoint should set the CSRF token cookie
      await axios.get('/api/csrf-token', { withCredentials: true });
      setIsTokenFetched(true);
    } catch (error) {
      console.error('Failed to fetch CSRF token');
    }
  };

  // Add a meta tag with the CSRF token for the API client to use
  useEffect(() => {
    if (isTokenFetched) {
      // Extract token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
      
      if (token) {
        // Set or update the meta tag
        let meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'csrf-token';
          document.head.appendChild(meta);
        }
        meta.content = decodeURIComponent(token);
      }
    }
  }, [isTokenFetched]);

  // This component doesn't render anything visible
  return null;
};

export default CsrfToken;