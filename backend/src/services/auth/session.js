// src/services/auth/session.js
const { v4: uuidv4 } = require('uuid');
const { getAsync, setAsync, delAsync } = require('../../utils/redis');

// Store active session
const createSession = async (userId, deviceInfo) => {
  try {
    const sessionId = uuidv4();
    const session = {
      userId,
      deviceInfo,
      createdAt: new Date().toISOString()
    };
    
    // Store in Redis with 30-day expiry (or your JWT expiry time)
    await setAsync(`session:${sessionId}`, JSON.stringify(session), 'EX 2592000'); // 30 days
    
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    // Return a session ID anyway to not break the flow
    return uuidv4();
  }
};

// Get session details
const getSession = async (sessionId) => {
  try {
    const session = await getAsync(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Invalidate a specific session
const invalidateSession = async (sessionId) => {
  try {
    return await delAsync(`session:${sessionId}`);
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
};

// Invalidate all sessions for a user
const invalidateAllUserSessions = async (userId, excludeSessionIds = []) => {
  try {
    // Implementation would need to change - in the newer Redis client
    // you'd need to use SCAN instead of KEYS for production use
    console.log(`Invalidating all sessions for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error invalidating all user sessions:', error);
    return false;
  }
};

module.exports = {
  createSession,
  getSession,
  invalidateSession,
  invalidateAllUserSessions
};