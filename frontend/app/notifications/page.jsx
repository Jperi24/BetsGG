'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-providers';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '@/lib/api/notifications';
import { 
  Bell, 
  Check, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  Trophy, 
  Wallet, 
  Settings,
  CheckCircle
} from 'lucide-react';

// Notification page with list and preferences
export default function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'unread', or notification type
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?from=/notifications');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        
        const isUnreadOnly = selectedFilter === 'unread';
        const response = await getNotifications(
          limit, 
          page * limit, 
          isUnreadOnly
        );
        
        if (page === 0) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        
        setUnreadCount(response.unreadCount);
        setHasMore(response.data.notifications.length === limit);
        setError(null);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, [isAuthenticated, page, selectedFilter]);
  
  // Filter notifications by type if needed
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all' || selectedFilter === 'unread') {
      return true;
    }
    return notification.type === selectedFilter;
  });
  
  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
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
      
      // Decrement unread count if this was unread
      const wasUnread = notifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if necessary
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
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
  
  // Get background color class based on notification type
  const getBackgroundColorClass = (notification) => {
    if (notification.read) return 'bg-gray-50';
    
    switch (notification.type) {
      case 'bet_win':
        return 'bg-green-50';
      case 'security_alert':
      case 'bet_cancelled':
        return 'bg-red-50';
      case 'bet_loss':
        return 'bg-yellow-50';
      default:
        return 'bg-blue-50';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ', ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };
  
  // Loading state
  if (isLoading || (loading && page === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-10 w-10 text-indigo-600 animate-spin mx-auto">
            <Bell />
          </div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark all read
            </button>
          )}
          <button 
            onClick={() => router.push('/notifications/preferences')}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            <Settings className="h-4 w-4 mr-1" />
            Preferences
          </button>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setSelectedFilter('all');
              setPage(0);
            }}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${selectedFilter === 'all' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            All
          </button>
          <button
            onClick={() => {
              setSelectedFilter('unread');
              setPage(0);
            }}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${selectedFilter === 'unread' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </nav>
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-500">
            {selectedFilter === 'unread' 
              ? 'You have no unread notifications.' 
              : 'You have no notifications yet.'}
          </p>
        </div>
      )}
      
      {/* Notifications list */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div 
            key={notification._id} 
            className={`border rounded-lg shadow-sm overflow-hidden ${getBackgroundColorClass(notification)}`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <div className="mt-2 flex justify-end space-x-3">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                    {notification.data?.betId && (
                      <button
                        onClick={() => router.push(`/bets/${notification.data.betId}`)}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                      >
                        <ChevronRight className="h-3 w-3 mr-1" />
                        View bet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load more button */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}