import { useCallback } from 'react';
import { NotificationPayload } from '../types/notification';
import { notificationService } from '../services/ExpoNotificationService';

export const useNotification = () => {
  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    return notificationService.sendLocalNotification(payload);
  }, []);

  const getPermissionStatus = useCallback(async () => {
    return notificationService.getPermissionStatus();
  }, []);

  const requestPermission = useCallback(async () => {
    return notificationService.requestPermission();
  }, []);

  return {
    sendNotification,
    getPermissionStatus,
    requestPermission,
  };
};
