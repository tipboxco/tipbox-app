import * as Notifications from 'expo-notifications';
import { notificationService } from '../index';
import { ScheduledNotificationInput } from '../types';

/**
 * Notification Scheduling Utilities
 * 
 * Local notification scheduling helper functions
 */

/**
 * Schedule a notification for a specific date
 */
export async function scheduleNotificationForDate(
  content: Notifications.NotificationContentInput,
  date: Date,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
    identifier,
  });
}

/**
 * Schedule a notification after a time interval
 */
export async function scheduleNotificationAfterInterval(
  content: Notifications.NotificationContentInput,
  seconds: number,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
    identifier,
  });
}

/**
 * Schedule a daily notification
 */
export async function scheduleDailyNotification(
  content: Notifications.NotificationContentInput,
  hour: number,
  minute: number,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier,
  });
}

/**
 * Schedule a weekly notification
 */
export async function scheduleWeeklyNotification(
  content: Notifications.NotificationContentInput,
  weekday: number, // 1-7 (Sunday = 1)
  hour: number,
  minute: number,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
    identifier,
  });
}

/**
 * Schedule a monthly notification
 */
export async function scheduleMonthlyNotification(
  content: Notifications.NotificationContentInput,
  day: number, // 1-31
  hour: number,
  minute: number,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day,
      hour,
      minute,
    },
    identifier,
  });
}

/**
 * Schedule a yearly notification
 */
export async function scheduleYearlyNotification(
  content: Notifications.NotificationContentInput,
  month: number, // 1-12
  day: number, // 1-31
  hour: number,
  minute: number,
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.YEARLY,
      month,
      day,
      hour,
      minute,
    },
    identifier,
  });
}

/**
 * Schedule a calendar-based notification
 */
export async function scheduleCalendarNotification(
  content: Notifications.NotificationContentInput,
  dateComponents: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    weekday?: number;
    weekdayOrdinal?: number;
    weekOfMonth?: number;
    weekOfYear?: number;
  },
  identifier?: string
): Promise<string> {
  return await notificationService.scheduleNotification({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      ...dateComponents,
    },
    identifier,
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  await notificationService.cancelScheduledNotification(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await notificationService.cancelAllScheduledNotifications();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await notificationService.getAllScheduledNotifications();
}
