// Install redis and redis-client packages first
// npm install redis

// src/utils/redis.js
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient(process.env.REDIS_URL);

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const expireAsync = promisify(client.expire).bind(client);

module.exports = {
  getAsync,
  setAsync,
  delAsync,
  expireAsync,
  client
};