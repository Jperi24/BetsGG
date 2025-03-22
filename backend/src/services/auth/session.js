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

// src/services/auth/session.js - Updated invalidateAllUserSessions function
const invalidateAllUserSessions = async (userId, excludeSessionIds = []) => {
  try {
    // Convert excludeSessionIds to a Set for faster lookups
    const excludeSet = new Set(excludeSessionIds);
    
    // Track sessions to delete
    const sessionsToDelete = [];
    
    // Use SCAN instead of KEYS for production use
    let cursor = '0';
    do {
      // Use SCAN to iterate through keys in batches
      const [nextCursor, keys] = await client.scan(
        cursor, 
        'MATCH', 
        'session:*', 
        'COUNT', 
        100
      );
      
      cursor = nextCursor;
      
      // Get session data for each key
      for (const key of keys) {
        const sessionData = await getAsync(key);
        
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const sessionId = key.replace('session:', '');
            
            // If session belongs to our user and not in exclude list, add to delete list
            if (session.userId === userId && !excludeSet.has(sessionId)) {
              sessionsToDelete.push(key);
            }
          } catch (parseError) {
            console.error(`Error parsing session data for key ${key}:`, parseError);
            // Delete invalid session data
            sessionsToDelete.push(key);
          }
        }
      }
    } while (cursor !== '0'); // Continue until we've scanned all keys
    
    // Delete all found sessions
    if (sessionsToDelete.length > 0) {
      await Promise.all(sessionsToDelete.map(key => delAsync(key)));
      console.log(`Invalidated ${sessionsToDelete.length} sessions for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error invalidating user sessions:', error);
    return false;
  }
};

module.exports = {
  createSession,
  getSession,
  invalidateSession,
  invalidateAllUserSessions
};