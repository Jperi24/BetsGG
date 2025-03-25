// frontend/lib/api/index.ts
import axios from 'axios';

// Secure API response handling
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

  console.error("Invalid API response format");
  throw new Error('Invalid response format');
};

// CSRF token management
const getCsrfToken = (): string => {
  if (typeof document === 'undefined') return '';
  
  // Get from a csrf meta tag if available
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) return metaTag.getAttribute('content') || '';
  
  // Alternatively, get from cookies
  const cookies = document.cookie.split(';')
    .map(cookie => cookie.trim())
    .reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
  
  return cookies['csrf-token'] || '';
};

// Create secure axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Sends cookies with requests for authentication
});

// Request interceptor with CSRF protection
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token for state-changing methods
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const token = getCsrfToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor with improved security
apiClient.interceptors.response.use(
  (response) => {
    // Safe logging that doesn't expose sensitive data
    console.log('API Response:', {
      status: response.status,
      endpoint: response.config.url,
      success: true
    });
    return response;
  },
  (error) => {
    // Safe error logging
    console.error('API Error:', {
      status: error.response?.status,
      endpoint: error.config?.url,
      message: error.message
    });

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
      // Let the component handle redirection or re-authentication
      // (Don't automatically redirect from the API client)
    }

    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || error.message,
      errors: error.response.data?.errors || null
    });
  }
);

export default apiClient;