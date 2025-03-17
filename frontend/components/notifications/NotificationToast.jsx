'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markAsRead } from '@/lib/api/notifications';
import { useAuth } from '@/providers/auth-providers';
import { useNotifications } from '@/providers/notification-provider';
import { Bell, X, Trophy, Wallet, AlertTriangle } from 'lucide-react';

// Toast notification component for real-time updates
export default function NotificationToast() {
  const { isAuthenticated } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const router = useRouter();
  
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);
  
  // Check for new notifications when unreadCount changes
  useEffect(() => {
    const checkForNewNotifications = async () => {
      if (!isAuthenticated || unreadCount === 0 || unreadCount <= lastCheckedCount) {
        return;
      }
      
      try {
        const response = await getNotifications(1, 0, true);
        if (response.data.notifications.length > 0) {
          const newestNotification = response.data.notifications[0];
          setNotification(newestNotification);
          setVisible(true);
          
          // Auto hide after 5 seconds
          setTimeout(() => {
            setVisible(false);
          }, 5000);
        }
        
        setLastCheckedCount(unreadCount);
      } catch (error) {
        console.error('Error fetching new notifications:', error);
      }
    };
    
    // Add a slight delay to avoid too many API calls
    const timer = setTimeout(() => {
      checkForNewNotifications();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, unreadCount, lastCheckedCount]);
  
  // Handle notification click
  const handleClick = async () => {
    if (!notification) return;
    
    try {
      // Mark as read
      await markAsRead(notification._id);
      refreshUnreadCount();
      
      // Navigate based on notification type
      if (notification.data?.betId) {
        router.push(`/bets/${notification.data.betId}`);
      } else {
        router.push('/notifications');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    } finally {
      setVisible(false);
    }
  };
  
  // Dismiss notification
  const handleDismiss = async (e) => {
    e.stopPropagation();
    setVisible(false);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bet_win':
      case 'bet_placed':
      case 'bet_accepted':
      case 'bet_completed':
      case 'bet_loss':
        return <Trophy className="h-5 w-5 text-white" />;
      case 'deposit_confirmed':
      case 'withdrawal_processed':
        return <Wallet className="h-5 w-5 text-white" />;
      case 'security_alert':
      case 'bet_cancelled':
        return <AlertTriangle className="h-5 w-5 text-white" />;
      default:
        return <Bell className="h-5 w-5 text-white" />;
    }
  };
  
  // Get background color based on notification type
  const getBackgroundColor = (type) => {
    switch (type) {
      case 'bet_win':
        return 'bg-green-600';
      case 'security_alert':
      case 'bet_cancelled':
        return 'bg-red-600';
      case 'bet_loss':
        return 'bg-yellow-600';
      default:
        return 'bg-indigo-600';
    }
  };
  
  if (!visible || !notification) {
    return null;
  }
  
  return (
    <div 
      className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 z-50"
      onClick={handleClick}
    >
      <div className="flex items-start">
        {/* Left colored bar */}
        <div className={`p-3 ${getBackgroundColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900">
              {notification.title}
            </h3>
            <button 
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {notification.message.length > 100 
              ? notification.message.substring(0, 100) + '...' 
              : notification.message}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Just now
          </p>
        </div>
      </div>
    </div>
  );
}