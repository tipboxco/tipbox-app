import { navigationService } from '../NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

/**
 * MessageService - Domain-Level Service
 * 
 * Message domain logic'i yönetir:
 * - Incoming message handling
 * - Navigation kararları
 * - State updates
 */
class MessageService {
  /**
   * Incoming message'ı handle et
   * 
   * @param payload - Message payload
   * @param context - UI context
   */
  handleIncomingMessage(
    payload: {
      messageId: string;
      threadId?: string;
      senderId?: string;
      recipientId?: string;
    },
    context: {
      isForeground: boolean;
      shouldNavigate?: boolean;
    }
  ): void {
    // State update (Zustand store'a ekle)
    // Bu kısım message store'a eklenecek (şimdilik sadece navigation)

    // Navigation kararı
    if (context.isForeground && context.shouldNavigate) {
      navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
        messageId: payload.messageId,
        threadId: payload.threadId || payload.messageId,
        recipientUserId: payload.recipientId || payload.senderId,
      });
      console.log('[MessageService] ✅ Navigated to message detail:', payload.messageId);
    }
  }
}

export const messageService = new MessageService();

