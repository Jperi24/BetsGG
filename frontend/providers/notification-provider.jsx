'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-providers';
import { getUnreadCount } from '@/lib/api/notifications';

// Create notification context
const NotificationContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: () => {},
  lastRefreshed: null,
});

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// NotificationProvider component
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Function to refresh unread count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.unreadCount);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };
  
  // Fetch unread count on initial load and when auth status changes
  useEffect(() => {
    refreshUnreadCount();
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  // Context value
  const value = {
    unreadCount,
    refreshUnreadCount,
    lastRefreshed,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}