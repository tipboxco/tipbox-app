import { apiService } from '../../../services/ApiService';
import type { InboxMessage } from '../types';

/**
 * Get Messages endpoint
 * Kullanıcının mesaj listesini getirir
 *
 * Kullanıcı ID'si backend tarafında Authorization header'indaki token'dan bulunur.
 */
export const getMessages = async (): Promise<InboxMessage[]> => {
  const response = await apiService.getClient().get<InboxMessage[]>('/messages');
  return response.data;
};

/**
 * Get or Create Thread endpoint
 * Thread oluşturur veya mevcut thread'i getirir
 * 
 * @param recipientId - Mesaj gönderilecek kullanıcı ID'si
 * @returns Thread response
 */
export interface ThreadResponse {
  id: string;
  userOneId: string;
  userTwoId: string;
  isActive: boolean;
  startedAt: string;
}

export const getOrCreateThread = async (recipientId: string): Promise<ThreadResponse> => {
  try {
    const response = await apiService.getClient().post<ThreadResponse>('/messages/threads', {
      recipientId,
    });
    return response.data;
  } catch (error: any) {
    // 404 hatası: Thread endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      // Daha açıklayıcı bir hata fırlat
      const notFoundError = new Error('Thread endpoint not found (404). Backend may not have implemented this endpoint yet.');
      (notFoundError as any).response = { status: 404 };
      (notFoundError as any).isThreadEndpointNotFound = true;
      throw notFoundError;
    }
    // Diğer hataları olduğu gibi fırlat
    throw error;
  }
};

/**
 * Send Gift (TIPS) Request Interface
 */
export interface SendGiftRequest {
  senderUserId: string;
  recipientUserId: string;
  message: string;
  amount: number;
  timestamp: string; // ISO 8601 format
}

/**
 * Send Gift (TIPS) endpoint
 * Kullanıcıya TIPS gönderir
 *
 * @param data - Send Gift request data
 * @returns Promise<void> - 201 Created (no body)
 */
export const sendGift = async (data: SendGiftRequest): Promise<void> => {
  await apiService.getClient().post('/messages/tips', data);
};

/**
 * Support Request Create Interface
 */
export interface SupportRequestCreate {
  senderUserId: string;
  recipientUserId: string;
  type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
  message: string;
  amount: string;
  status: 'pending';
  timestamp: string; // ISO 8601 format
}

/**
 * Create Support Request endpoint
 * 1-on-1 destek talebi oluşturur
 *
 * @param data - Support Request data
 * @returns Promise<void> - 201 Created (no body)
 */
export const createSupportRequest = async (data: SupportRequestCreate): Promise<void> => {
  await apiService.getClient().post('/messages/support-requests', data);
};

/**
 * Direct Message Request Interface
 */
export interface DirectMessageRequest {
  recipientUserId: string;
  message: string;
}

/**
 * Send Direct Message endpoint
 * Kullanıcıya direkt mesaj gönderir
 *
 * @param data - Direct Message request data
 * @returns Promise<void> - 201 Created (no body)
 */
export const sendDirectMessage = async (data: DirectMessageRequest): Promise<void> => {
  await apiService.getClient().post('/messages', data);
};

