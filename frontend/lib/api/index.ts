// frontend/lib/api/index.ts

import axios from 'axios';

// Utility for handling API responses
// Utility for handling API responses
export const handleApiResponse = (response: any) => {
  // Check if response exists
  if (!response) {
    throw new Error('No response received');
  }

  console.log("handleApiResponse processing:", response.data);

  // For auth endpoints that return token and potentially 2FA flags
  if (response.data?.status === 'success' && response.data?.token) {
    // IMPORTANT: Preserve ALL fields from the original response
    return {
      token: response.data.token,
      requires2FA: response.data.requires2FA === true,
      tempToken: response.data.tempToken,
      data: response.data.data
    };
  }

  // For other successful responses
  if (response.data?.status === 'success') {
    return response.data;
  }

  // If we get here, something's wrong with the response format
  console.error("Invalid API response format:", response.data);
  throw new Error('Invalid response format');
};

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      headers: config.headers
    });

    // Get token from localStorage if we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 408,
        message: 'Request timeout - server took too long to respond',
        errors: null
      });
    }

    if (!error.response) {
      return Promise.reject({
        status: 503,
        message: 'Network error - unable to connect to server',
        errors: null
      });
    }

    // Handle specific status codes
    if (error.response.status === 401) {
      // Clear auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status: error.response.status,
      message: error.response.data?.message || error.message,
      errors: error.response.data?.errors || null
    });
  }
);

export default apiClient;