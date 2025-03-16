// lib/api/notifications.ts
import apiClient, { handleApiResponse } from './index';

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
 * Get the user's notification preferences
 */
export const getNotificationPreferences = async (): Promise<{ data: { preferences: NotificationPreferences } }> => {
  const response = await apiClient.get('/notifications/preferences');
  return handleApiResponse(response);
};

/**
 * Update the user's notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.patch('/notifications/preferences', { preferences });
  return handleApiResponse(response);
};