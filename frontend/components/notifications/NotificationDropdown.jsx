'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import { useNotifications } from '@/providers/notification-provider';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '@/lib/api/notifications';
import { 
  Bell, 
  CheckCircle, 
  Trophy, 
  Wallet, 
  AlertTriangle, 
  Settings, 
  ChevronRight, 
  X 
} from 'lucide-react';

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch notifications when dropdown is opened
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !isOpen) return;
      
      try {
        setLoading(true);
        const response = await getNotifications(5, 0, false);
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Poll for updates if dropdown is open
    let interval;
    if (isOpen) {
      interval = setInterval(fetchNotifications, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, isOpen]);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    
    try {
      await markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Refresh the global unread count
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    
    try {
      await markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Refresh the global unread count
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bet_win':
      case 'bet_placed':
      case 'bet_accepted':
      case 'bet_completed':
      case 'bet_loss':
        return <Trophy className="h-5 w-5 text-indigo-600" />;
      case 'deposit_confirmed':
      case 'withdrawal_processed':
        return <Wallet className="h-5 w-5 text-green-600" />;
      case 'security_alert':
      case 'bet_cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'account_updated':
      case 'password_changed':
        return <Settings className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) return 'Yesterday';
      else if (days < 7) return `${days} days ago`;
      else return date.toLocaleDateString();
    }
  };
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-6 w-6" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                View all
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && notifications.length === 0 && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && notifications.length === 0 && (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}
          
          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification._id}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification._id, { stopPropagation: () => {} });
                  }
                  
                  setIsOpen(false);
                  
                  // Navigate to the appropriate page based on notification type
                  if (notification.data?.betId) {
                    router.push(`/bets/${notification.data.betId}`);
                  } else {
                    router.push('/notifications');
                  }
                }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between mb-1">
                      <p className={`text-sm font-medium ${
                        notification.read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message.length > 100 
                        ? notification.message.substring(0, 100) + '...' 
                        : notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="p-3 bg-gray-50 text-center">
            <Link
              href="/notifications/preferences"
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center justify-center"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Notification Settings
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}