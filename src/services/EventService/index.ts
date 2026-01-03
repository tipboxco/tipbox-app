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

    console.log('[EventService] 📥 Socket event received:', {
      originalType: event.type,
      normalizedType: normalizedEvent.type,
      payload: normalizedEvent.payload,
    });

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
        // Payload zaten Notification objesi olmalı
        notificationService.handleNotification(normalizedEvent.payload, context);
        break;

      default:
        // Backend'den direkt notification type'ları gelebilir (POST_LIKED, NEW_TRUSTER, vb.)
        // Bu durumda payload'ın kendisi notification objesi olabilir
        const notificationTypes = [
          'POST_LIKED', 'POST_COMMENTED', 'POST_SHARED', 'POST_FAVORITED',
          'COMMENT_LIKED', 'COMMENT_REPLIED',
          'NEW_TRUSTER', 'NEW_TRUSTED_BY',
          'NEW_MESSAGE', 'DM_REQUEST_RECEIVED', 'DM_REQUEST_ACCEPTED',
          'NEW_BADGE', 'ACHIEVEMENT_UNLOCKED', 'REWARD_EARNED',
          'EXPERT_REQUEST_AVAILABLE', 'EXPERT_REQUEST_ANSWERED',
          'SYSTEM_ANNOUNCEMENT', 'TIPS_RECEIVED', 'TIPS_SENT',
          'EVENT_STARTED', 'EVENT_ENDING_SOON', 'EVENT_REWARD_AVAILABLE',
        ];
        
        if (notificationTypes.includes(normalizedEvent.type)) {
          // Bu bir notification type'ı, payload'ı direkt notification olarak handle et
          console.log('[EventService] ✅ Treating as notification type:', normalizedEvent.type);
          notificationService.handleNotification(normalizedEvent.payload, context);
        } else {
          console.log('[EventService] ℹ️ Unknown event type:', normalizedEvent.type, 'Payload:', normalizedEvent.payload);
        }
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

