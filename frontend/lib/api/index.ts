// frontend/lib/api/index.ts
import axios from 'axios';

// Enhanced secure API response handling
export const handleApiResponse = (response: any) => {
  if (!response) {
    throw new Error('No response received');
  }

  // For auth endpoints that return token and potentially 2FA flags
  if (response.data?.status === 'success') {
    // Auth endpoints may include these fields
    if (response.data?.token) {
      return {
        token: response.data.token,
        requires2FA: response.data.requires2FA === true,
        tempToken: response.data.tempToken,
        data: response.data.data
      };
    }
    
    // For non-auth successful responses
    return response.data;
  }

  throw new Error(response.data?.message || 'Invalid response format');
};

// Secure CSRF token handling
// Fix the getCsrfToken function to be synchronous
const getCsrfToken = (): string => {
  if (typeof document === 'undefined') return '';
  
  // Check for csrf_token cookie first
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='));
    
  if (csrfCookie) {
    return decodeURIComponent(csrfCookie.split('=')[1]);
  }
  
  // Fallback to alternative cookie names
  const xsrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='));
    
  if (xsrfCookie) {
    return decodeURIComponent(xsrfCookie.split('=')[1]);
  }
  
  // Check meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    const token = metaTag.getAttribute('content');
    if (token) return token;
  }
  
  return '';
};

// Create secure axios instance with proper CSRF handling
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Essential for sending/receiving cookies
});

// Enhanced request interceptor with robust CSRF protection
// In frontend/lib/api/index.ts, modify the request interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    // Add CSRF token for state-changing methods
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      let csrfToken = '';
      
      // Get token from cookie
      if (typeof document !== 'undefined') {
        const csrfCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrf_token=') || row.startsWith('XSRF-TOKEN='));
          
        if (csrfCookie) {
          csrfToken = decodeURIComponent(csrfCookie.split('=')[1]);
          console.log('Using CSRF token from cookie:', csrfToken);
        }
      }
      
      // Set token in headers
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        config.headers['X-CSRF-TOKEN'] = csrfToken; // Add both formats to be safe
      } else {
        console.warn('No CSRF token found for state-changing request');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with secure logging practices
apiClient.interceptors.response.use(
  (response) => {
    // No logging in production, limited logging in development
    if (process.env.NODE_ENV === 'development') {
      // Log only non-sensitive metadata
      console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Secure error handling
    if (process.env.NODE_ENV === 'development') {
      // Log only non-sensitive metadata
      const status = error.response?.status || 'network error';
      const url = error.config?.url || 'unknown';
      console.error(`API Error: ${url} - ${status}`);
    }

    // Handle connection errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.'
      });
    }

    // Handle specific error cases
    switch (error.response.status) {
      case 401:
        // Authentication error
        // Let the auth provider handle this
        break;
      case 403:
        // Forbidden
        return Promise.reject({
          message: 'You do not have permission to perform this action.'
        });
      case 419:
        // CSRF token mismatch (common for Laravel)
        return Promise.reject({
          message: 'Your session has expired. Please refresh the page and try again.'
        });
      case 422:
        // Validation errors
        if (error.response.data?.errors) {
          // Handle validation errors
          const errors = Object.values(error.response.data.errors).flat();
          return Promise.reject({
            message: errors.join(', '),
            errors: error.response.data.errors
          });
        }
        break;
      case 429:
        // Rate limiting
        return Promise.reject({
          message: 'Too many requests. Please try again later.'
        });
    }

    // Default error handling
    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || 'An error occurred while processing your request.',
      errors: error.response.data?.errors || null
    });
  }
);

export default apiClient;