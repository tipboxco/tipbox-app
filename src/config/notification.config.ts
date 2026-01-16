import { NotificationServiceConfig } from '../services/ExpoNotificationService/types';

/**
 * Notification Service Configuration
 * 
 * Expo Notifications için yapılandırma ayarları
 * 
 * Özellikler:
 * - Default notification settings
 * - Android channels (default-channels.ts'de tanımlı)
 * - iOS categories (default-categories.ts'de tanımlı)
 * - Token refresh interval
 * - Background task configuration
 */
export const notificationConfig: NotificationServiceConfig = {
  // Default notification settings
  defaultSound: true,
  defaultVibrate: true,
  defaultBadge: 0,
  
  // Notification behavior
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,
  shouldShowList: true,
  
  // Token management
  enableTokenRefresh: true,
  tokenRefreshInterval: 24 * 60 * 60 * 1000, // 24 saat
  
  // Background task configuration
  enableBackgroundTasks: true,
  backgroundTaskName: 'notification-handler',
  
  // Android channels ve iOS categories
  // default-channels.ts ve default-categories.ts'de tanımlı
  // Platform'a göre otomatik olarak yüklenir
};
