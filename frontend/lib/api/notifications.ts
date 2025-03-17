// lib/api/notifications.ts
import apiClient, { handleApiResponse } from './index';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

export interface NotificationPreferences {
  email: {
    tournamentReminders: boolean;
    betResults: boolean;
    paymentNotifications: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
  };
  push: {
    tournamentReminders: boolean;
    betResults: boolean;
    paymentNotifications: boolean;
    newBettingOpportunities: boolean;
    securityAlerts: boolean;
  };
}

/**
 * Get user notifications with pagination
 */
export const getNotifications = async (
  limit = 50,
  offset = 0,
  unreadOnly = false
): Promise<{ 
  data: { notifications: Notification[] },
  unreadCount: number,
  results: number
}> => {
  const response = await apiClient.get(
    `/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`
  );
  return handleApiResponse(response);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<{ data: { unreadCount: number } }> => {
  const response = await apiClient.get('/notifications/unread-count');
  return handleApiResponse(response);
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<{ data: { notification: Notification } }> => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return handleApiResponse(response);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{ message: string; data: { count: number } }> => {
  const response = await apiClient.patch('/notifications/mark-all-read');
  return handleApiResponse(response);
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return handleApiResponse(response);
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<{ data: { preferences: NotificationPreferences } }> => {
  const response = await apiClient.get('/notifications/preferences');
  return handleApiResponse(response);
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<{ data: { preferences: NotificationPreferences } }> => {
  const response = await apiClient.patch('/notifications/preferences', { preferences });
  return handleApiResponse(response);
};