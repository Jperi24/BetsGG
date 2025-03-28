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

// Improved CSRF token retrieval with proper error handling
const getCsrfToken = (): string => {
  if (typeof document === 'undefined') return '';
  
  // Get from a csrf meta tag if available
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    const token = metaTag.getAttribute('content');
    if (token) return token;
  }
  
  // Get from the dedicated CSRF cookie
  const cookies = document.cookie.split(';')
    .map(cookie => cookie.trim())
    .reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
  
  return cookies['XSRF-TOKEN'] || '';
};

// Create secure axios instance with proper CSRF handling
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Ensures cookies are sent with requests
});

// Enhanced request interceptor with robust CSRF protection
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token for state-changing methods
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const token = getCsrfToken();
      if (token) {
        config.headers['X-XSRF-TOKEN'] = token; // Standard CSRF header
      } else if (process.env.NODE_ENV === 'development') {
        // Only log in development
        console.warn('CSRF token not found. Request may be rejected by the server.');
      }
    }
    
    return config;
  },
  (error) => {
    // Don't log the full error, just a generic message
    const endpoint = error.config?.url || 'unknown endpoint';
    if (process.env.NODE_ENV === 'development') {
      console.error(`Request error for ${endpoint}`);
    }
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with secure logging
apiClient.interceptors.response.use(
  (response) => {
    // Safe logging without sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        endpoint: response.config.url?.replace(/\/api\//, ''), // Omit full path
        success: true
      });
    }
    return response;
  },
  (error) => {
    // Safe error logging without sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status: error.response?.status,
        endpoint: error.config?.url?.replace(/\/api\//, ''), // Omit full path
        type: error.code || 'request_error'
      });
    }

    // Handle connection errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 408,
        message: 'Request timeout - server took too long to respond'
      });
    }

    if (!error.response) {
      return Promise.reject({
        status: 503,
        message: 'Network error - unable to connect to server'
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      // Let the auth provider handle redirection
      // We'll just pass the error through
    }

    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || 'An error occurred while processing your request',
      errors: error.response.data?.errors || null
    });
  }
);

export default apiClient;