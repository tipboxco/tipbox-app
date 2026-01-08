/**
 * Local Notification Scheduler Service
 * Yerel bildirim planlama servisi
 * 
 * Özellikler:
 * - Zamanlanmış bildirimler
 * - Tekrarlayan bildirimler (daily, weekly, etc.)
 * - Bildirim iptal etme
 * - Tüm planlanmış bildirimleri listeleme
 */

import * as Notifications from 'expo-notifications';
import {
  ScheduledNotification,
  ScheduleOptions,
  RecurrencePattern,
} from './types';

class LocalNotificationScheduler {
  private static instance: LocalNotificationScheduler;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  private constructor() {}

  public static getInstance(): LocalNotificationScheduler {
    if (!LocalNotificationScheduler.instance) {
      LocalNotificationScheduler.instance = new LocalNotificationScheduler();
    }
    return LocalNotificationScheduler.instance;
  }

  /**
   * Bildirim planla
   */
  public async schedule(options: ScheduleOptions): Promise<string> {
    const identifier = options.identifier || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Trigger oluştur
    const trigger = this.createTrigger(options.date, options.recurrence);

    // Bildirim içeriği
    const notificationContent: Notifications.NotificationContentInput = {
      title: options.title,
      body: options.body,
      data: options.data || {},
      sound: options.sound !== false,
      badge: options.badge,
    };

    // Bildirimi planla
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: notificationContent,
      trigger,
    });

    // Local cache'e ekle
    const scheduledNotification: ScheduledNotification = {
      identifier,
      title: options.title,
      body: options.body,
      data: options.data,
      trigger,
      priority: options.priority || 'default',
      sound: options.sound !== false,
      badge: options.badge,
    };

    this.scheduledNotifications.set(identifier, scheduledNotification);

    console.log(`[LocalNotificationScheduler] ✅ Scheduled notification: ${identifier}`, {
      date: options.date,
      recurrence: options.recurrence,
    });

    return identifier;
  }

  /**
   * Trigger oluştur
   */
  private createTrigger(
    date: Date,
    recurrence?: RecurrencePattern
  ): Notifications.NotificationTriggerInput {
    const now = new Date();
    const seconds = Math.max(0, Math.floor((date.getTime() - now.getTime()) / 1000));

    if (recurrence && recurrence !== RecurrencePattern.NONE) {
      // Tekrarlayan bildirim
      return {
        repeats: true,
        seconds,
        ...this.getRecurrenceInterval(recurrence),
      };
    } else {
      // Tek seferlik bildirim
      return {
        seconds,
      };
    }
  }

  /**
   * Recurrence interval'ı al
   */
  private getRecurrenceInterval(recurrence: RecurrencePattern): {
    seconds?: number;
    minutes?: number;
    hours?: number;
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
  } {
    switch (recurrence) {
      case RecurrencePattern.DAILY:
        return { days: 1 };
      case RecurrencePattern.WEEKLY:
        return { weeks: 1 };
      case RecurrencePattern.MONTHLY:
        return { months: 1 };
      case RecurrencePattern.YEARLY:
        return { years: 1 };
      default:
        return {};
    }
  }

  /**
   * Planlanmış bildirimi iptal et
   */
  public async cancel(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    this.scheduledNotifications.delete(identifier);
    console.log(`[LocalNotificationScheduler] ❌ Cancelled notification: ${identifier}`);
  }

  /**
   * Tüm planlanmış bildirimleri iptal et
   */
  public async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
    console.log('[LocalNotificationScheduler] 🧹 Cancelled all scheduled notifications');
  }

  /**
   * Planlanmış bildirimleri listele
   */
  public async getAllScheduled(): Promise<ScheduledNotification[]> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Local cache'i güncelle
    const scheduled: ScheduledNotification[] = [];
    for (const notification of notifications) {
      const cached = this.scheduledNotifications.get(notification.identifier);
      if (cached) {
        scheduled.push(cached);
      }
    }

    return scheduled;
  }

  /**
   * Belirli bir bildirimi al
   */
  public async getScheduled(identifier: string): Promise<ScheduledNotification | null> {
    const cached = this.scheduledNotifications.get(identifier);
    if (cached) {
      return cached;
    }

    // Expo'dan al
    const allScheduled = await this.getAllScheduled();
    return allScheduled.find((n) => n.identifier === identifier) || null;
  }
}

export const localNotificationScheduler = LocalNotificationScheduler.getInstance();
export * from './types';









