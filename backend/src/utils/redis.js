// src/utils/redis.js
const { createClient } = require('redis');

// Create client with Redis Cloud configuration
const client = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT
  }
});

// Set up error handler
client.on('error', err => console.error('Redis Client Error', err));

// Connect to Redis 
(async () => {
  try {
    await client.connect();
    console.log('Redis client connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Create promisified functions
const getAsync = async (key) => {
  try {
    return await client.get(key);
  } catch (error) {
    console.error(`Error getting key ${key}:`, error);
    return null;
  }
};

const setAsync = async (key, value, options) => {
  try {
    if (options && options.includes('EX')) {
      const expireTime = parseInt(options.split(' ')[1]);
      return await client.set(key, value, { EX: expireTime });
    }
    return await client.set(key, value);
  } catch (error) {
    console.error(`Error setting key ${key}:`, error);
    return null;
  }
};

const delAsync = async (key) => {
  try {
    return await client.del(key);
  } catch (error) {
    console.error(`Error deleting key ${key}:`, error);
    return 0;
  }
};

const keysAsync = async (pattern) => {
  try {
    return await client.keys(pattern);
  } catch (error) {
    console.error(`Error getting keys with pattern ${pattern}:`, error);
    return [];
  }
};

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  keysAsync
};