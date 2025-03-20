// src/services/auth/session.js
const { v4: uuidv4 } = require('uuid');
const { setAsync, getAsync, delAsync } = require('../../utils/redis');

// Store active session
const createSession = async (userId, deviceInfo) => {
  const sessionId = uuidv4();
  const session = {
    userId,
    deviceInfo,
    createdAt: new Date().toISOString()
  };
  
  // Store in Redis with 30-day expiry (or your JWT expiry time)
  await setAsync(`session:${sessionId}`, JSON.stringify(session), 'EX', 60 * 60 * 24 * 30);
  
  return sessionId;
};

// Get session details
const getSession = async (sessionId) => {
  const session = await getAsync(`session:${sessionId}`);
  return session ? JSON.parse(session) : null;
};

// Invalidate a specific session
const invalidateSession = async (sessionId) => {
  return await delAsync(`session:${sessionId}`);
};

// Invalidate all sessions for a user
const invalidateAllUserSessions = async (userId) => {
  // In a production environment, you would implement a pattern scan
  // For simplicity, we're assuming you'll maintain an index of sessions by user
  const userSessionsKey = `user:${userId}:sessions`;
  const sessions = await getAsync(userSessionsKey);
  
  if (sessions) {
    const sessionIds = JSON.parse(sessions);
    const promises = sessionIds.map(id => invalidateSession(id));
    await Promise.all(promises);
    await delAsync(userSessionsKey);
  }
};

module.exports = {
  createSession,
  getSession,
  invalidateSession,
  invalidateAllUserSessions
};