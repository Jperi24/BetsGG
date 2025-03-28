// src/app.js - Enhanced security implementation
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoose = require('mongoose');
const { csrfProtection } = require('./middleware/cookie-auth');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./api/auth/routes');
const tournamentRoutes = require('./api/tournaments/routes');
const betsRoutes = require('./api/bets/routes');
const walletRoutes = require('./api/wallet/routes');
const userRoutes = require('./api/user/routes');
const notificationsRoutes = require('./api/notifications/routes');
const sessionRoutes = require('./api/auth/session-routes');

// Import middleware
const errorHandler = require('./middleware/error');
const { 
  standardLimiter, 
  authLimiter, 
  financialLimiter,
  bettingLimiter
} = require('./middleware/rate-limit');
const securityLogger = require('./services/logging/security-logger');

// Create Express app
const app = express();

// Set security HTTP headers with enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  expectCt: { 
    enforce: true, 
    maxAge: 30 * 24 * 60 * 60, // 30 days
    reportUri: process.env.REPORT_URI || null
  },
  frameguard: { action: "deny" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "same-origin" },
  xssFilter: true
}));

// Enable CORS with enhanced security
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin required in production'), false);
      }
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID'],
  exposedHeaders: ['X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  preflightContinue: false
};

app.use(cors(corsOptions));

// Advanced rate limiting
app.use('/api', standardLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password/:token', authLimiter);
app.use('/api/wallet', financialLimiter);
app.use('/api/bets', bettingLimiter);

// Cookie parser middleware with enhanced security options
app.use(cookieParser(process.env.COOKIE_SECRET));

// Body parser with stricter limits and validation
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ 
        status: 'fail',
        message: 'Invalid JSON provided' 
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb',
  parameterLimit: 100 // Limit the number of parameters
}));

// Enhanced data sanitization against NoSQL query injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    securityLogger.logAuthEvent(
      'INJECTION_ATTEMPT',
      req.user ? req.user.id : null,
      { 
        path: req.path,
        key,
        ip: req.ip,
        method: req.method
      }
    );
  }
}));

// Enhanced XSS protection
app.use(xss());

// Prevent parameter pollution with expanded whitelist
app.use(hpp({
  whitelist: [
    'limit', 'page', 'perPage', 'status', 'type',
    'startAt', 'endAt', 'numAttendees', 'offset', 
    'tournamentId', 'eventId', 'phaseId', 'query'
  ]
}));

// Compression middleware
app.use(compression({ level: 6 })); // Balanced compression level

// Enhanced CSRF protection for state-changing operations
app.use(csrfProtection);

// Trust proxy configuration for proper IP detection
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
}

// Request logging with enhanced privacy
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const sanitizedUrl = req.originalUrl.replace(/token=([^&]+)/, 'token=[REDACTED]');
    console.log(`${req.method} ${sanitizedUrl}`);
    next();
  });
}

// Log all requests in production (for security)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Only log necessary metadata, not request body
    securityLogger.logAuthEvent(
      'REQUEST',
      req.user ? req.user.id : null,
      {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    );
    next();
  });
}

// Enhanced security headers for all responses
app.use((req, res, next) => {
  // Add Permissions-Policy header
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  // Add additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Mark cookies as SameSite
  res.setHeader('Set-Cookie', 'SameSite=Strict');
  
  next();
});

// Apply enhanced routes with specific CSRF requirements
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/auth/sessions', sessionRoutes);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
    }
  });
});

// Improved 404 handling
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 'fail';
  err.statusCode = 404;
  
  // Log 404s for security monitoring
  securityLogger.logAuthEvent(
    'NOT_FOUND',
    req.user ? req.user.id : null,
    { path: req.originalUrl, ip: req.ip }
  );
  
  next(err);
});

// Global error handler
app.use(errorHandler);

// Enhanced database connection with retry logic
const connectDB = async () => {
  let retries = 5;
  
  while (retries) {
    try {
      const options = {
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        connectTimeoutMS: 10000,
        retryWrites: true,
        // Add TLS/SSL for production environments
        ...(process.env.NODE_ENV === 'production' && {
          ssl: true,
          sslValidate: true,
          sslCA: process.env.MONGODB_CA_CERT
        })
      };
      
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('MongoDB connected successfully.');
      break;
    } catch (err) {
      retries -= 1;
      console.error(`MongoDB connection error (${5 - retries}/5):`, err);
      
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after multiple retries');
        process.exit(1);
      }
      
      // Wait before trying again (exponential backoff)
      const delay = 1000 * Math.pow(2, 5 - retries);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Enhanced graceful shutdown with additional cleanup
process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  
  // Close Redis connections
  if (redis?.client?.quit) {
    await redis.client.quit();
    console.log('Redis disconnected');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('MongoDB disconnected');
  
  console.log('All connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  
  // Close Redis connections
  if (redis?.client?.quit) {
    await redis.client.quit();
    console.log('Redis disconnected');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('MongoDB disconnected');
  
  console.log('All connections closed');
  process.exit(0);
});

// Improved error handling for unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err);
  
  // Log to security logger
  securityLogger.logAuthEvent(
    'UNHANDLED_REJECTION',
    null,
    { error: err.message, stack: err.stack }
  );
  
  // Give time for logging to complete
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

// Improved error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error(err);
  
  // Log to security logger
  securityLogger.logAuthEvent(
    'UNCAUGHT_EXCEPTION',
    null,
    { error: err.message, stack: err.stack }
  );
  
  // Give time for logging to complete
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

module.exports = { app, connectDB };