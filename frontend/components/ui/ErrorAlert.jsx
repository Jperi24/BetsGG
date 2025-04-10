// components/ui/ErrorAlert.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * A reusable error alert component with a dismiss button.
 * 
 * @param {Object} props
 * @param {string} props.message - The error message to display
 * @param {Function} props.onDismiss - Optional callback when the alert is dismissed
 * @param {string} props.className - Optional additional CSS classes
 */
const ErrorAlert = ({ message, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{message}</p>
          </div>
        </div>
        
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg p-1.5 
                      hover:bg-red-100 inline-flex h-8 w-8 focus:outline-none"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;