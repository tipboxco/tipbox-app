import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { notificationManager } from '../index';
import { BackgroundTaskPayload } from '../types';

/**
 * Background Task Name
 * app.json'da tanımlı olmalı
 */
export const BACKGROUND_NOTIFICATION_TASK = 'notification-handler';

/**
 * Background Notification Task
 * 
 * App kapalıyken veya background'dayken notification geldiğinde çalışır
 * 
 * app.json configuration:
 * ```json
 * {
 *   "expo": {
 *     "plugins": [
 *       [
 *         "expo-notifications",
 *         {
 *           "sounds": ["default.wav"],
 *           "mode": "production"
 *         }
 *       ]
 *     ]
 *   }
 * }
 * ```
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundTask] Task error:', error);
    return;
  }

  try {
    const { notification } = data as BackgroundTaskPayload;

    if (!notification) {
      return;
    }

    // Notification'ı handle et
    await notificationManager.handleNotification(notification, {
      isForeground: false,
      shouldNavigate: false,
      source: 'push',
    });
  } catch (error) {
    console.error('[BackgroundTask] Handle notification error:', error);
  }
});

/**
 * Register background task
 */
export async function registerBackgroundTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch (error) {
    console.error('[BackgroundTask] Register task error:', error);
  }
}

/**
 * Unregister background task
 */
export async function unregisterBackgroundTask(): Promise<void> {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch (error) {
    console.error('[BackgroundTask] Unregister task error:', error);
  }
}
