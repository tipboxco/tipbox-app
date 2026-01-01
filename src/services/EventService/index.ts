import { notificationService } from '../NotificationService';
import { messageService } from '../MessageService';

/**
 * EventService - Domain-Level Service
 * 
 * Event domain logic'i yönetir:
 * - Socket event normalization
 * - Domain routing
 * - State + Navigation kararları
 */
class EventService {
  /**
   * Socket event'i normalize et ve domain service'e yönlendir
   * 
   * @param event - Raw socket event
   * @param context - UI context
   */
  handleSocketEvent(
    event: {
      type: string;
      payload: any;
    },
    context: {
      isForeground: boolean;
      shouldNavigate?: boolean;
    }
  ): void {
    // Event normalize
    const normalizedEvent = this.normalizeEvent(event);

    // Domain routing
    switch (normalizedEvent.type) {
      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        // MessageService'e yönlendir
        messageService.handleIncomingMessage(normalizedEvent.payload, context);
        break;

      case 'NOTIFICATION':
        // NotificationService'e yönlendir
        notificationService.handleNotification(normalizedEvent.payload, context);
        break;

      default:
        console.log('[EventService] ℹ️ Unknown event type:', normalizedEvent.type);
    }
  }

  /**
   * Event'i normalize et
   */
  private normalizeEvent(event: { type: string; payload: any }): {
    type: string;
    payload: any;
  } {
    // Event type'ı normalize et
    const normalizedType = event.type.toUpperCase().replace(/-/g, '_');

    return {
      type: normalizedType,
      payload: event.payload,
    };
  }
}

export const eventService = new EventService();

