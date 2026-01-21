import { Subscription } from 'expo-notifications';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface NotificationSubscription {
  subscription: Subscription;
  identifier: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  // Large icon/image support for different notification types
  largeIcon?: string; // Android: Local file path or remote URL for large icon (user avatar, post image, etc.)
  attachments?: Array<{
    identifier: string;
    url: string;
    mimeType?: string;
  }>; // iOS: Image attachments for rich notifications
  imageUrl?: string; // General image URL (can be used for both platforms)
}
