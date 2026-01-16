/**
 * ExpoNotificationService
 * 
 * Main entry point for notification service
 * 
 * Usage:
 * ```typescript
 * import { notificationService } from '@/services/ExpoNotificationService';
 * 
 * // Initialize
 * await notificationService.initialize();
 * 
 * // Register token
 * await notificationService.registerPushTokenToBackend();
 * 
 * // Send local notification
 * await notificationService.sendLocalNotification({
 *   title: 'Test',
 *   body: 'Test notification',
 * });
 * ```
 */

import { NotificationService } from './core/notification-service';
import { NotificationManager } from './core/notification-manager';
import { NotificationHandlers } from './core/notification-handlers';
import { notificationConfig } from '../../config/notification.config';
import { DEFAULT_ANDROID_CHANNELS } from './config/default-channels';
import { DEFAULT_IOS_CATEGORIES } from './config/default-categories';
import { Platform } from 'react-native';

// Service instance
const notificationService = new NotificationService({
  ...notificationConfig,
  androidChannels: Platform.OS === 'android' ? DEFAULT_ANDROID_CHANNELS : undefined,
  iosCategories: Platform.OS === 'ios' ? DEFAULT_IOS_CATEGORIES : undefined,
});

// Manager instance
const notificationManager = new NotificationManager(notificationService);

// Handlers instance
const notificationHandlers = new NotificationHandlers(notificationManager);

// Setup handlers
notificationService.setNotificationHandler(notificationHandlers.createCombinedHandler());

export { notificationService, notificationManager, notificationHandlers };
export * from './types';
export * from './core';
