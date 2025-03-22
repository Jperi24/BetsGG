const { createClient } = require('redis');
const EventEmitter = require('events');

// Circuit breaker implementation
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  success() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.emit('close');
    }
  }
  
  failure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.emit('open');
    }
  }
  
  canExecute() {
    if (this.state === 'CLOSED') {
      return true;
    }
    
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.emit('half-open');
      return true;
    }
    
    return this.state === 'HALF_OPEN';
  }
}

// Create Redis client with robust configuration
const createRedisClient = () => {
  // Define retry strategy with exponential backoff
  const retryStrategy = (retries) => {
    if (retries > 10) {
      console.error('Redis connection failed after maximum retries, giving up');
      return new Error('Maximum Redis connection retries reached');
    }
    // Exponential backoff: 2^retries * 100 ms (100, 200, 400, 800, etc)
    const delay = Math.min(Math.pow(2, retries) * 100, 30000); // Cap at 30 seconds
    console.log(`Redis connection retry in ${delay}ms (attempt ${retries})`);
    return delay;
  };

  // Create Redis client with robust configuration
  const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      connectTimeout: 10000, // 10 seconds
      keepAlive: 5000, // 5 seconds
      reconnectStrategy: retryStrategy
    },
    // Limit the command queue to avoid memory issues during reconnection
    commandsQueueMaxLength: 5000
  });

  return client;
};

// Create client instance
const client = createRedisClient();

// Create circuit breaker
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000  // 30 seconds
});

// Track connection state
let isConnected = false;

// Set up event handlers
client.on('error', err => {
  console.error('Redis Client Error', err);
  breaker.failure();
  isConnected = false;
});

client.on('connect', () => {
  console.log('Redis client connected successfully');
  breaker.success();
  isConnected = true;
});

client.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
  isConnected = false;
});

client.on('end', () => {
  console.log('Redis client connection closed');
  isConnected = false;
});

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Circuit breaker event handlers
breaker.on('open', () => {
  console.warn('Redis circuit breaker opened - stopping Redis operations');
});

breaker.on('half-open', () => {
  console.log('Redis circuit breaker half-open - testing connection');
});

breaker.on('close', () => {
  console.log('Redis circuit breaker closed - resuming normal operations');
});

// Create promisified functions with circuit breaker
const executeWithBreaker = async (operation) => {
  if (!breaker.canExecute()) {
    throw new Error('Redis circuit breaker is open - operation rejected');
  }
  
  try {
    const result = await operation();
    breaker.success();
    return result;
  } catch (error) {
    breaker.failure();
    throw error;
  }
};

const getAsync = async (key) => {
  try {
    return await executeWithBreaker(() => client.get(key));
  } catch (error) {
    console.error(`Error getting key ${key}:`, error);
    return null;
  }
};

const setAsync = async (key, value, ...options) => {
  try {
    // Handle the EX option which is common
    if (options.length >= 2 && options[0] === 'EX') {
      const expireTime = parseInt(options[1]);
      return await executeWithBreaker(() => client.set(key, value, { EX: expireTime }));
    }
    
    // Handle more complex options (parsed from the arguments)
    if (options.length === 1 && typeof options[0] === 'object') {
      return await executeWithBreaker(() => client.set(key, value, options[0]));
    }
    
    // Default case
    return await executeWithBreaker(() => client.set(key, value));
  } catch (error) {
    console.error(`Error setting key ${key}:`, error);
    return null;
  }
};

const delAsync = async (key) => {
  try {
    return await executeWithBreaker(() => client.del(key));
  } catch (error) {
    console.error(`Error deleting key ${key}:`, error);
    return 0;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    if (!isConnected) {
      return {
        status: 'error',
        message: 'Redis client not connected'
      };
    }
    
    // Try a simple PING operation
    const start = Date.now();
    const result = await executeWithBreaker(() => client.ping());
    const latency = Date.now() - start;
    
    return {
      status: 'ok',
      latency: `${latency}ms`,
      circuitBreakerState: breaker.state
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      circuitBreakerState: breaker.state
    };
  }
};

// Function to gracefully close the Redis connection
const shutdown = async () => {
  try {
    console.log('Closing Redis connection...');
    await client.quit();
    console.log('Redis connection closed successfully');
    return true;
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    return false;
  }
};

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  healthCheck,
  shutdown,
  isConnected: () => isConnected
};