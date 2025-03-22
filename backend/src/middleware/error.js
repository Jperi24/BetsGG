// src/middleware/error.js

// Define custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper to sanitize error messages
const sanitizeErrorMessage = (message) => {
  // Remove any potential sensitive data from error messages
  if (!message) return 'An error occurred';
  
  // Remove file paths
  message = message.replace(/\/[\w\/\.-]+/g, '[path]');
  
  // Remove potential DB connection strings
  message = message.replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[database-url]');
  
  // Remove any stack trace information
  message = message.replace(/at\s[\w\s\.<>\(\)\/]+/g, '[stack]');
  
  return message;
};

// Development error handler - with sanitized details
const sendErrorDev = (err, res) => {
  // Log the full error with stack trace for developers
  console.error('ERROR:', err);
  
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // Include non-sensitive error details that might help debugging
    error: {
      name: err.name,
      code: err.code,
      path: err.path
      // Don't include full stack trace in response
    }
  });
};

// Production error handler - client-friendly responses
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    // Sanitize error message before sending to client
    const safeMessage = sanitizeErrorMessage(err.message);
    
    res.status(err.statusCode).json({
      status: err.status,
      message: safeMessage
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Handle common Mongoose/MongoDB errors
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401);

// Main error handler middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // In both development and production, use appropriate error handling
  // but never expose full stack traces to clients
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Export AppError class for use elsewhere
module.exports.AppError = AppError;