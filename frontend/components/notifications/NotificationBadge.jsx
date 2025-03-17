'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-providers';
import { useNotifications } from '@/providers/notification-provider';
import { Bell } from 'lucide-react';

// NotificationBadge component for displaying unread notification count
export default function NotificationBadge() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  
  if (!isAuthenticated) return null;
  
  return (
    <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none">
      <Bell className="h-6 w-6" />
      
      {/* Notification badge */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}