import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationPayload, NotificationPermissionStatus } from '../../types/notification';

/**
 * Notification Service Configuration
 * Expo Notifications için yapılandırma ayarları
 */
export interface NotificationServiceConfig {
  // Default notification settings
  defaultSound?: boolean;
  defaultVibrate?: boolean;
  defaultBadge?: number;
  
  // Android notification channels
  androidChannels?: AndroidChannelConfig[];
  
  // iOS notification categories (interactive notifications)
  iosCategories?: IOSCategoryConfig[];
  
  // Notification behavior
  shouldPlaySound?: boolean;
  shouldSetBadge?: boolean;
  shouldShowBanner?: boolean;
  shouldShowList?: boolean;
  
  // Token management
  enableTokenRefresh?: boolean;
  tokenRefreshInterval?: number; // milliseconds
  
  // Background task configuration
  enableBackgroundTasks?: boolean;
  backgroundTaskName?: string;
}

/**
 * Android Notification Channel Configuration
 */
export interface AndroidChannelConfig {
  id: string;
  name: string;
  description?: string;
  importance: Notifications.AndroidImportance;
  vibrationPattern?: number[];
  lightColor?: string;
  sound?: string | boolean;
  enableVibrate?: boolean;
  enableLights?: boolean;
  showBadge?: boolean;
  audioAttributes?: {
    contentType?: Notifications.AndroidAudioContentType;
    usage?: Notifications.AndroidAudioUsage;
  };
}

/**
 * iOS Notification Category Configuration (Interactive Notifications)
 */
export interface IOSCategoryConfig {
  identifier: string;
  actions: IOSNotificationAction[];
  intentIdentifiers?: string[];
  hiddenPreviewsBodyPlaceholder?: string;
  options?: {
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
  };
}

/**
 * iOS Notification Action (Interactive Button)
 */
export interface IOSNotificationAction {
  identifier: string;
  buttonTitle: string;
  options?: {
    opensAppToForeground?: boolean;
    isAuthenticationRequired?: boolean;
    isDestructive?: boolean;
    isForeground?: boolean;
  };
  textInput?: {
    submitButtonTitle: string;
    placeholder: string;
  };
}

/**
 * Notification Handler Interface
 * Foreground ve background notification handling için
 */
export interface NotificationHandler {
  onNotificationReceived?: (notification: Notifications.Notification) => void | Promise<void>;
  onNotificationResponseReceived?: (response: Notifications.NotificationResponse) => void | Promise<void>;
  onNotificationsDropped?: () => void | Promise<void>;
}

/**
 * Notification Service State
 */
export interface NotificationServiceState {
  isInitialized: boolean;
  permissionStatus: NotificationPermissionStatus;
  expoPushToken?: string;
  devicePushToken?: Notifications.DevicePushToken;
  badgeCount?: number;
  channels?: Notifications.NotificationChannel[];
  categories?: Notifications.NotificationCategory[];
}

/**
 * Scheduled Notification Input
 */
export interface ScheduledNotificationInput {
  content: Notifications.NotificationContentInput;
  trigger: Notifications.NotificationTriggerInput | null;
  identifier?: string;
}

/**
 * Notification Channel Manager
 */
export interface NotificationChannelManager {
  createChannel: (config: AndroidChannelConfig) => Promise<Notifications.NotificationChannel>;
  getChannel: (channelId: string) => Promise<Notifications.NotificationChannel | null>;
  deleteChannel: (channelId: string) => Promise<void>;
  getAllChannels: () => Promise<Notifications.NotificationChannel[]>;
  createChannelGroup: (groupId: string, name: string, description?: string) => Promise<void>;
  deleteChannelGroup: (groupId: string) => Promise<void>;
}

/**
 * Notification Category Manager
 */
export interface NotificationCategoryManager {
  createCategory: (config: IOSCategoryConfig) => Promise<Notifications.NotificationCategory>;
  getCategory: (categoryId: string) => Promise<Notifications.NotificationCategory | null>;
  getAllCategories: () => Promise<Notifications.NotificationCategory[]>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

/**
 * Background Task Payload
 */
export interface BackgroundTaskPayload {
  notification: Notifications.Notification;
  actionIdentifier?: string;
  userText?: string;
}

/**
 * Token Registration Options
 */
export interface TokenRegistrationOptions {
  projectId?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Notification Analytics Event
 */
export interface NotificationAnalyticsEvent {
  event: 'notification_received' | 'notification_opened' | 'notification_dismissed' | 'notification_action';
  notificationId?: string;
  notificationType?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
