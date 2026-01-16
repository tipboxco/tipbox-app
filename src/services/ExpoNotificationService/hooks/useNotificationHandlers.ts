import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, notificationHandlers } from '../index';

/**
 * useNotificationHandlers
 * 
 * Notification event listener'ları yönetir
 * 
 * Features:
 * - Notification received listener
 * - Notification response listener
 * - Notifications dropped listener
 * - Last notification response handling
 */
export function useNotificationHandlers(options?: {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
  onNotificationsDropped?: () => void;
}) {
  const {
    onNotificationReceived,
    onNotificationResponse,
    onNotificationsDropped,
  } = options || {};

  const listenersRef = useRef<Notifications.Subscription[]>([]);

  useEffect(() => {
    const listeners: Notifications.Subscription[] = [];

    // Notification received listener
    if (onNotificationReceived) {
      const listener = Notifications.addNotificationReceivedListener(onNotificationReceived);
      listeners.push(listener);
    }

    // Notification response listener
    if (onNotificationResponse) {
      const listener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
      listeners.push(listener);
    }

    // Notifications dropped listener
    if (onNotificationsDropped) {
      const listener = Notifications.addNotificationsDroppedListener(onNotificationsDropped);
      listeners.push(listener);
    }

    listenersRef.current = listeners;

    return () => {
      listeners.forEach((listener) => {
        listener.remove();
      });
      listenersRef.current = [];
    };
  }, [onNotificationReceived, onNotificationResponse, onNotificationsDropped]);

  /**
   * Get last notification response (killed state handling)
   */
  const getLastNotificationResponse = async (): Promise<Notifications.NotificationResponse | null> => {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('[useNotificationHandlers] Get last notification response error:', error);
      return null;
    }
  };

  /**
   * Clear last notification response
   */
  const clearLastNotificationResponse = async (): Promise<void> => {
    try {
      await Notifications.clearLastNotificationResponseAsync();
    } catch (error) {
      console.error('[useNotificationHandlers] Clear last notification response error:', error);
    }
  };

  return {
    getLastNotificationResponse,
    clearLastNotificationResponse,
  };
}
