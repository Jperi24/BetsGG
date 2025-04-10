// lib/utils/errorHandler.js

/**
 * Standardized error messages for common authentication errors
 */
const ERROR_MESSAGES = {
    // Authentication errors
    'Invalid credentials': 'The email or password you entered is incorrect.',
    'User not found': 'No account found with this email address.',
    'Wrong password': 'The password you entered is incorrect.',
    'Account locked': 'Your account has been locked due to too many failed login attempts. Please try again later.',
    
    // 2FA errors
    'Invalid verification code': 'The verification code you entered is incorrect. Please try again.',
    'Code expired': 'The verification code has expired. Please request a new one.',
    'Invalid recovery code': 'The recovery code you entered is invalid.',
    'Recovery code already used': 'This recovery code has already been used. Please try another one.',
    
    // Registration errors
    'Email already exists': 'An account with this email already exists.',
    'Username already exists': 'This username is already taken. Please choose another one.',
    'Password requirements not met': 'Your password does not meet the security requirements.',
    
    // Token errors
    'Token expired': 'Your session has expired. Please log in again.',
    'Invalid token': 'Your authentication token is invalid. Please log in again.',
    
    // General errors
    'Network error': 'Unable to connect to the server. Please check your internet connection.',
    'Server error': 'Something went wrong on our end. Please try again later.',
    'Request failed': 'Your request could not be processed. Please try again.'
  };
  
  /**
   * Get a user-friendly error message for display
   * 
   * @param {Error|Object|string} error - The error object or message
   * @param {string} fallbackMessage - Fallback message if no specific error is found
   * @returns {string} User-friendly error message
   */
  export const getErrorMessage = (error, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
    if (!error) return fallbackMessage;
    
    // Extract the error message
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.error) {
      errorMessage = typeof error.error === 'string' ? error.error : error.error.message || JSON.stringify(error.error);
    } else {
      return fallbackMessage;
    }
    
    // Check for specific error patterns
    if (errorMessage.includes('Network Error')) {
      return ERROR_MESSAGES['Network error'];
    }
    
    // Look for known error messages
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (errorMessage.includes(key)) {
        return message;
      }
    }
    
    // For validation errors that might be arrays of messages
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map(err => err.msg || err).join(', ');
    }
    
    // Return the original error message if no friendly message is found
    return errorMessage;
  };
  
  /**
   * Log errors for debugging with sensitive information redacted
   * 
   * @param {Error|Object|string} error - The error object or message
   * @param {string} context - Where the error occurred
   */
  export const logError = (error, context = 'General') => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context} Error]`, error);
    }
  };
  
  export default {
    getErrorMessage,
    logError
  };