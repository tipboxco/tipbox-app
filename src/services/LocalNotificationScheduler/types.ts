/**
 * Local Notification Scheduler Types
 * Yerel bildirim planlama için type tanımları
 */

import * as Notifications from 'expo-notifications';

/**
 * Scheduled Notification
 */
export interface ScheduledNotification {
  identifier: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: Notifications.NotificationTriggerInput;
  priority?: 'default' | 'max';
  sound?: boolean;
  badge?: number;
}

/**
 * Recurrence Pattern
 */
export enum RecurrencePattern {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

/**
 * Notification Schedule Options
 */
export interface ScheduleOptions {
  identifier?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  date: Date;
  recurrence?: RecurrencePattern;
  priority?: 'default' | 'max';
  sound?: boolean;
  badge?: number;
}











