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
 * Backend Response Format - Thread mesajları için
 */
export interface ThreadMessageResponse {
  id: string;
  type: 'message' | 'support-request' | 'send-tips';
  data: {
    id: string;
    sender: {
      id: string;
      senderName: string;
      senderTitle: string;
      senderAvatar: string | null;
    };
    // For message type
    lastMessage?: string;
    message?: string;
    timestamp: string;
    isUnread?: boolean;
    // For support-request type
    type?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
    amount?: number | string;
    status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
    threadId?: string | null;
    requestId?: string;
    fromUserId?: string;
    toUserId?: string;
  };
}

/**
 * Thread Message - Normalized thread mesajı tipi (internal use)
 */
export interface ThreadMessage {
  id: string;
  threadId: string | null;
  senderId: string;
  recipientId?: string;
  message: string;
  messageType: 'message' | 'support-request' | 'send-tips';
  context: 'DM' | 'SUPPORT';
  isRead: boolean;
  sentAt: string; // ISO 8601
  readAt?: string; // ISO 8601 (opsiyonel)
  amount?: number; // For send-tips
  // Sender info
  senderName?: string;
  senderTitle?: string;
  senderAvatar?: string | null;
  // Support request specific
  supportRequestType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
  supportRequestStatus?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  requestId?: string;
}

/**
 * Get Thread Messages endpoint
 * Thread ID'sine göre mesaj geçmişini getirir
 * 
 * @param threadId - Thread ID
 * @returns Thread mesajları listesi (normalized)
 */
export const getThreadMessages = async (threadId: string): Promise<ThreadMessage[]> => {
  try {
    const response = await apiService.getClient().get<ThreadMessageResponse[]>(`/messages/${threadId}`);
    
    // Backend response'unu normalize et
    const normalizedMessages: ThreadMessage[] = response.data.map((item) => {
      const { id, type, data } = item;
      const { sender, timestamp } = data;
      
      // Base message structure
      const baseMessage: ThreadMessage = {
        id: data.id || id,
        threadId: data.threadId || threadId,
        senderId: sender.id,
        message: data.message || data.lastMessage || '',
        messageType: type,
        context: type === 'support-request' ? 'SUPPORT' : 'DM',
        isRead: !data.isUnread, // isUnread varsa, isRead = !isUnread
        sentAt: timestamp,
        senderName: sender.senderName,
        senderTitle: sender.senderTitle,
        senderAvatar: sender.senderAvatar,
      };
      
      // Type-specific fields
      if (type === 'send-tips' && data.amount) {
        baseMessage.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      }
      
      if (type === 'support-request') {
        baseMessage.supportRequestType = data.type;
        baseMessage.supportRequestStatus = data.status;
        baseMessage.requestId = data.requestId || data.id;
        if (data.amount) {
          baseMessage.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        }
        if (data.fromUserId && data.toUserId) {
          baseMessage.recipientId = data.toUserId;
        }
      }
      
      return baseMessage;
    });
    
    return normalizedMessages;
  } catch (error: any) {
    // 404 hatası: Thread messages endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      const notFoundError = new Error('Thread messages endpoint not found (404). Backend may not have implemented this endpoint yet.');
      (notFoundError as any).response = { status: 404 };
      (notFoundError as any).isThreadMessagesEndpointNotFound = true;
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

/**
 * Support Request Response Interface
 */
export interface SupportRequest {
  id: string;
  userName: string;
  userTitle: string;
  userAvatar: string | null;
  requestDescription: string;
  status: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  threadId: string | null;
  type?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
  message?: string;
  amount?: string;
  timestamp?: string;
}

/**
 * Get Support Requests endpoint
 * Kullanıcının birebir destek sohbetlerini getirir
 *
 * @param params - Query parameters (status, search, limit)
 * @returns Support request listesi
 */
export interface GetSupportRequestsParams {
  status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  search?: string;
  limit?: number;
}

export const getSupportRequests = async (params?: GetSupportRequestsParams): Promise<SupportRequest[]> => {
  const response = await apiService.getClient().get<SupportRequest[]>('/messages/support-requests', {
    params,
  });
  return response.data;
};

/**
 * Accept Support Request Response Interface
 */
export interface AcceptSupportRequestResponse {
  requestId: string;
  threadId: string;
}

/**
 * Accept Support Request endpoint
 * Expert, support request'i accept eder ve yeni bir support thread oluşturulur
 *
 * @param requestId - Support request ID
 * @returns Accept response (requestId, threadId)
 */
export const acceptSupportRequest = async (requestId: string): Promise<AcceptSupportRequestResponse> => {
  const response = await apiService.getClient().post<AcceptSupportRequestResponse>(
    `/messages/support-requests/${requestId}/accept`
  );
  return response.data;
};

/**
 * Reject Support Request endpoint
 * Expert, support request'i reject eder
 *
 * @param requestId - Support request ID
 * @returns Promise<void> - 200 OK
 */
export const rejectSupportRequest = async (requestId: string): Promise<void> => {
  await apiService.getClient().post(`/messages/support-requests/${requestId}/reject`);
};

/**
 * Cancel Support Request endpoint
 * Destek talebini gönderen kullanıcı, talep kabul edilmeden önce iptal edebilir
 *
 * @param requestId - Support request ID
 * @returns Promise<void> - 200 OK
 */
export const cancelSupportRequest = async (requestId: string): Promise<void> => {
  await apiService.getClient().post(`/messages/support-requests/${requestId}/cancel`);
};

/**
 * Message Feed Response Item
 */
export interface MessageFeedItem {
  id: string;
  type: 'message' | 'send-tips' | 'support-request';
  data: {
    id: string;
    sender: {
      id: string;
      senderName: string;
      senderTitle: string;
      senderAvatar: string | null;
    };
    lastMessage?: string;
    message?: string;
    amount?: number | string;
    type?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
    status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
    threadId?: string | null;
    timestamp: string;
    isUnread?: boolean;
  };
}

/**
 * Get Message Feed endpoint
 * Mesaj feed'ini getirir (messages, tips, support requests birleşik)
 *
 * @param limit - Maksimum feed item sayısı (default: 50, max: 100)
 * @returns MessageFeedItem[] - Feed item listesi
 */
export const getMessageFeed = async (limit: number = 50): Promise<MessageFeedItem[]> => {
  try {
    const params = new URLSearchParams();
    params.append('limit', Math.min(limit, 100).toString());

    const response = await apiService.getClient().get<MessageFeedItem[]>(
      `/messages/feed?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getMessageFeed] API Error:', {
      url: `/messages/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      limit,
    });
    throw error;
  }
};

