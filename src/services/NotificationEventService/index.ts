import type { Notification } from '@/src/features/notifications/api/types';
import { useNotificationStore } from '@/src/store/notificationStore';

/**
 * Notification Event Service
 * 
 * Event-driven architecture for notifications:
 * - Event dispatching
 * - Event listeners
 * - Event filtering
 * - Priority handling
 */
interface NotificationEvent {
  type: string;
  notification: Notification;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  source: 'socket' | 'push' | 'api';
  timestamp: Date;
}

type EventListener = (event: NotificationEvent) => void | Promise<void>;

class NotificationEventService {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventQueue: NotificationEvent[] = [];
  private isProcessing: boolean = false;

  /**
   * Event listener ekle
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Cleanup function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Event listener kaldır
   */
  off(eventType: string, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Event dispatch et
   */
  async dispatch(event: NotificationEvent): Promise<void> {
    // Event'i queue'ya ekle
    this.eventQueue.push(event);

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Queue'yu işle
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) break;

      try {
        // Specific type listeners
        const specificListeners = this.listeners.get(event.type);
        if (specificListeners) {
          for (const listener of specificListeners) {
            await listener(event);
          }
        }

        // Wildcard listeners (all events)
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
          for (const listener of wildcardListeners) {
            await listener(event);
          }
        }

        // Priority-based listeners
        const priorityListeners = this.listeners.get(`priority:${event.priority}`);
        if (priorityListeners) {
          for (const listener of priorityListeners) {
            await listener(event);
          }
        }
      } catch (error) {
        console.error('[NotificationEventService] ❌ Error processing event:', error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Notification'dan event oluştur
   */
  createEvent(
    notification: Notification,
    source: 'socket' | 'push' | 'api' = 'api'
  ): NotificationEvent {
    // Priority belirleme
    let priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL';
    
    if (notification.type.includes('MESSAGE') || 
        notification.type.includes('DM') ||
        notification.type.includes('TIPS')) {
      priority = 'HIGH';
    } else if (notification.type.includes('SYSTEM') ||
               notification.type.includes('ANNOUNCEMENT')) {
      priority = 'LOW';
    }

    return {
      type: notification.type,
      notification,
      priority,
      source,
      timestamp: new Date(notification.createdAt),
    };
  }

  /**
   * Event filter (örn: sadece unread notifications)
   */
  filterEvents(
    events: NotificationEvent[],
    filter: (event: NotificationEvent) => boolean
  ): NotificationEvent[] {
    return events.filter(filter);
  }

  /**
   * Tüm listeners'ı temizle
   */
  cleanup(): void {
    this.listeners.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

export const notificationEventService = new NotificationEventService();
