/**
 * Notification Analytics Types
 * Bildirim analitiği için type tanımları
 */

/**
 * Notification Event
 */
export enum AnalyticsEvent {
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  NOTIFICATION_OPENED = 'NOTIFICATION_OPENED',
  NOTIFICATION_DISMISSED = 'NOTIFICATION_DISMISSED',
  NOTIFICATION_ACTION_CLICKED = 'NOTIFICATION_ACTION_CLICKED',
}

/**
 * Notification Analytics Data
 */
export interface NotificationAnalyticsData {
  notificationId: string;
  type: string;
  event: AnalyticsEvent;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Analytics Storage
 */
export interface AnalyticsStorage {
  received: number;
  opened: number;
  dismissed: number;
  actionClicked: number;
  lastEventTime?: Date;
}





