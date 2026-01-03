/**
 * Notification State Sync Types
 * Socket.IO event'lerini global state ile sync etmek için type tanımları
 */

import { Notification } from '@/src/features/notifications/api/types';

/**
 * State Sync Event
 */
export interface StateSyncEvent {
  type: 'NOTIFICATION_RECEIVED' | 'NOTIFICATION_READ' | 'NOTIFICATION_DELETED';
  notification: Notification;
  timestamp: Date;
}

/**
 * State Sync Handler
 */
export type StateSyncHandler = (event: StateSyncEvent) => void | Promise<void>;





