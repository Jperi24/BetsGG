const { v4: uuidv4 } = require('uuid');
const redis = require('../../utils/redis');
const UAParser = require('ua-parser-js'); // Add this dependency
const { AppError } = require('../../middleware/error');

/**
 * Parse and sanitize device info from request
 * @param {Object} req - Express request object
 * @returns {Object} - Sanitized device info
 */
const parseDeviceInfo = (req) => {
  try {
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const parser = new UAParser(ua);
    
    return {
      browser: {
        name: parser.getBrowser().name || 'Unknown',
        version: parser.getBrowser().version || 'Unknown'
      },
      os: {
        name: parser.getOS().name || 'Unknown',
        version: parser.getOS().version || 'Unknown'
      },
      device: {
        type: parser.getDevice().type || 'Unknown',
        vendor: parser.getDevice().vendor || 'Unknown',
        model: parser.getDevice().model || 'Unknown'
      },
      ip: ip.replace(/^.*:/, ''), // Sanitize IPv6 addresses
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing device info:', error);
    return {
      browser: { name: 'Unknown', version: 'Unknown' },
      os: { name: 'Unknown', version: 'Unknown' },
      device: { type: 'Unknown', vendor: 'Unknown', model: 'Unknown' },
      ip: 'Unknown',
      createdAt: new Date().toISOString()
    };
  }
};

/**
 * Generate a hash of device fingerprint
 * @param {Object} deviceInfo - Device information
 * @returns {string} - Hashed device fingerprint
 */
const generateDeviceFingerprint = (deviceInfo) => {
  const crypto = require('crypto');
  const fingerprintData = `${deviceInfo.browser.name}|${deviceInfo.browser.version}|${deviceInfo.os.name}|${deviceInfo.os.version}|${deviceInfo.device.vendor}|${deviceInfo.device.model}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

/**
 * Store active session
 * @param {string} userId - User ID
 * @param {Object} req - Express request object
 * @returns {string} - Session ID
 */
const createSession = async (userId, req) => {
  try {
    const sessionId = uuidv4();
    const deviceInfo = parseDeviceInfo(req);
    const deviceFingerprint = generateDeviceFingerprint(deviceInfo);
    
    const session = {
      userId,
      deviceInfo,
      deviceFingerprint,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    // Store session with 30-day expiry
    await redis.setAsync(`session:${sessionId}`, JSON.stringify(session), 'EX', 2592000);
    
    // Also store a reference to this session in a user's session list
    await redis.saddAsync(`user:sessions:${userId}`, sessionId);
    
    // Check if this is a new device
    const isNewDevice = await checkIfNewDevice(userId, deviceFingerprint);
    if (isNewDevice) {
      // Trigger new device notification (async, don't await)
      notifyNewDevice(userId, deviceInfo);
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    // Return a session ID anyway to not break the flow
    return uuidv4();
  }
};

/**
 * Check if device is new for this user
 * @param {string} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint
 * @returns {boolean} - Whether device is new
 */
const checkIfNewDevice = async (userId, deviceFingerprint) => {
  try {
    const deviceKey = `user:devices:${userId}`;
    const isNewDevice = !(await redis.sismemberAsync(deviceKey, deviceFingerprint));
    
    if (isNewDevice) {
      // Add to known devices
      await redis.saddAsync(deviceKey, deviceFingerprint);
    }
    
    return isNewDevice;
  } catch (error) {
    console.error('Error checking if device is new:', error);
    return false; // Assume not new in case of error
  }
};

/**
 * Send notification for new device login
 * @param {string} userId - User ID
 * @param {Object} deviceInfo - Device information
 */
const notifyNewDevice = async (userId, deviceInfo) => {
  try {
    // Import notification service
    const notificationService = require('../notification');
    
    // Format device info for display
    const deviceDescription = `${deviceInfo.browser.name} ${deviceInfo.browser.version} on ${deviceInfo.os.name} ${deviceInfo.os.version}`;
    
    // Send notification
    await notificationService.sendNewDeviceLoginNotification(userId, deviceDescription);
  } catch (error) {
    console.error('Error sending new device notification:', error);
  }
};

/**
 * Get session details
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session details or null
 */
const getSession = async (sessionId) => {
  try {
    const sessionJson = await redis.getAsync(`session:${sessionId}`);
    if (!sessionJson) return null;
    
    const session = JSON.parse(sessionJson);
    
    // Update last active timestamp
    session.lastActive = new Date().toISOString();
    await redis.setAsync(`session:${sessionId}`, JSON.stringify(session), 'EX', 2592000);
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of session objects
 */
const getUserSessions = async (userId) => {
  try {
    // Get all session IDs for user
    const sessionIds = await redis.smembersAsync(`user:sessions:${userId}`);
    if (!sessionIds || sessionIds.length === 0) return [];
    
    // Get session data for each ID
    const sessionPromises = sessionIds.map(async (id) => {
      const sessionJson = await redis.getAsync(`session:${id}`);
      if (!sessionJson) return null;
      
      try {
        const session = JSON.parse(sessionJson);
        return {
          id,
          ...session,
          current: false // Will be set by caller if needed
        };
      } catch (e) {
        return null;
      }
    });
    
    const sessions = await Promise.all(sessionPromises);
    
    // Filter out null sessions (expired but not removed from set)
    return sessions.filter(session => session !== null);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

/**
 * Invalidate a specific session
 * @param {string} sessionId - Session ID
 * @returns {boolean} - Whether session was invalidated
 */
const invalidateSession = async (sessionId) => {
  try {
    // Get session to find user ID
    const sessionJson = await redis.getAsync(`session:${sessionId}`);
    if (sessionJson) {
      const session = JSON.parse(sessionJson);
      
      // Remove from user's session set
      if (session.userId) {
        await redis.sremAsync(`user:sessions:${session.userId}`, sessionId);
      }
    }
    
    // Delete session
    await redis.delAsync(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
};

/**
 * Invalidate all sessions for a user except excluded IDs
 * @param {string} userId - User ID
 * @param {Array} excludeSessionIds - Array of session IDs to exclude
 * @returns {boolean} - Whether sessions were invalidated
 */
const invalidateAllUserSessions = async (userId, excludeSessionIds = []) => {
  try {
    // Convert exclude list to Set for O(1) lookups
    const excludeSet = new Set(excludeSessionIds);
    
    // Get all session IDs for the user
    const sessionIds = await redis.smembersAsync(`user:sessions:${userId}`);
    if (!sessionIds || sessionIds.length === 0) return true;
    
    // Split sessions into batches to avoid blocking Redis
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      batches.push(sessionIds.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      // Process each batch
      const deletePromises = batch
        .filter(id => !excludeSet.has(id))
        .map(async (id) => {
          // Delete session
          return redis.delAsync(`session:${id}`);
        });
      
      await Promise.all(deletePromises);
    }
    
    // Update user's session set to only contain excluded IDs
    if (excludeSessionIds.length > 0) {
      // Delete entire set then add back excluded sessions
      await redis.delAsync(`user:sessions:${userId}`);
      await redis.saddAsync(`user:sessions:${userId}`, ...excludeSessionIds);
    } else {
      // Delete the entire set
      await redis.delAsync(`user:sessions:${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error invalidating user sessions:', error);
    return false;
  }
};

/**
 * Clean up expired sessions for all users
 * This can be run as a scheduled task
 */
const cleanupExpiredSessions = async () => {
  try {
    console.log('Starting session cleanup...');
    
    // Initialize Redis scan cursor
    let cursor = '0';
    let totalProcessed = 0;
    let totalRemoved = 0;
    
    do {
      // Scan for session keys in batches
      const [nextCursor, keys] = await redis.scanAsync(cursor, 'MATCH', 'session:*', 'COUNT', 100);
      cursor = nextCursor;
      totalProcessed += keys.length;
      
      // Check each key for existence (if it's expired, it won't exist)
      for (const key of keys) {
        const exists = await redis.existsAsync(key);
        
        if (!exists) {
          totalRemoved++;
          // Session expired, extract session ID
          const sessionId = key.replace('session:', '');
          
          // Find which user this belonged to and remove from their set
          // This is inefficient but necessary for cleanup
          const userKeys = await redis.keysAsync('user:sessions:*');
          
          for (const userKey of userKeys) {
            const isMember = await redis.sismemberAsync(userKey, sessionId);
            if (isMember) {
              await redis.sremAsync(userKey, sessionId);
              console.log(`Removed expired session ${sessionId} from ${userKey}`);
              break;
            }
          }
        }
      }
    } while (cursor !== '0');
    
    console.log(`Session cleanup completed: Processed ${totalProcessed}, removed ${totalRemoved} expired sessions`);
    return { processed: totalProcessed, removed: totalRemoved };
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return { processed: 0, removed: 0, error: error.message };
  }
};

// Add these functions to redis.js or create a helper
redis.scanAsync = async (cursor, command, pattern, count, size) => {
  return redis.client.scan(cursor, command, pattern, count, size);
};

redis.saddAsync = async (key, ...members) => {
  return redis.client.sadd(key, ...members);
};

redis.sismemberAsync = async (key, member) => {
  return redis.client.sismember(key, member);
};

redis.smembersAsync = async (key) => {
  return redis.client.smembers(key);
};

redis.sremAsync = async (key, ...members) => {
  return redis.client.srem(key, ...members);
};

redis.existsAsync = async (key) => {
  return redis.client.exists(key);
};

redis.keysAsync = async (pattern) => {
  // Warning: keys is not recommended for production use
  // Consider implementing with scan instead
  return redis.client.keys(pattern);
};

module.exports = {
  createSession,
  getSession,
  getUserSessions,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions
};
