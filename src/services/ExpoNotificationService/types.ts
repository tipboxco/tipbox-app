import { NotificationPermissionStatus, NotificationPayload } from '../../types/notification';

export interface NotificationServiceConfig {
  defaultSound?: boolean;
  defaultVibrate?: boolean;
  defaultBadge?: number;
}

export interface NotificationHandler {
  onNotificationReceived: (notification: NotificationPayload) => void;
  onNotificationResponseReceived: (response: NotificationPayload) => void;
}

export interface NotificationServiceState {
  isInitialized: boolean;
  permissionStatus: NotificationPermissionStatus;
  expoPushToken?: string;
}
