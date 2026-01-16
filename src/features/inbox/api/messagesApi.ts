import { apiService } from '../../../services/ApiService';
import type { InboxMessage } from '../types';

/**
 * Get Messages Parameters
 */
export interface GetMessagesParams {
  search?: string; // Karşı tarafın adı, unvanı veya son mesaj içeriğinde arama
  unreadOnly?: boolean; // Sadece okunmamış mesajı olan thread'ler
  threadType?: 'DM' | 'SUPPORT' | 'ALL'; // Thread tipi filtresi (default: 'ALL')
  limit?: number; // Maksimum thread sayısı (1-100, default: 50)
}

/**
 * Get Messages endpoint
 * Kullanıcının mesaj listesini getirir
 *
 * Kullanıcı ID'si backend tarafında Authorization header'indaki token'dan bulunur.
 * 
 * @param params - Query parameters (search, unreadOnly, threadType, limit)
 */
export const getMessages = async (params?: GetMessagesParams): Promise<InboxMessage[]> => {
  const response = await apiService.getClient().get<InboxMessage[]>('/messages', { params });
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
  isSupportThread?: boolean; // ✅ Backend'den gelen: Support thread mi?
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
 * Get Thread Detail endpoint
 * Thread detay bilgisini getirir (userOneId, userTwoId, isSupportThread)
 * 
 * @param threadId - Thread ID
 * @returns Thread detay bilgisi
 */
export const getThreadDetail = async (threadId: string): Promise<ThreadResponse> => {
  try {
    const response = await apiService.getClient().get<ThreadResponse>(`/messages/threads/${threadId}`);
    return response.data;
  } catch (error: any) {
    // 404 hatası: Thread detail endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      const notFoundError = new Error('Thread detail endpoint not found (404). Backend may not have implemented this endpoint yet.');
      (notFoundError as any).response = { status: 404 };
      (notFoundError as any).isThreadDetailEndpointNotFound = true;
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
    status?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
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
  context?: 'DM' | 'SUPPORT'; // Sadece mesajlar için geçerli (type: "message")
  isRead: boolean;
  sentAt: string; // ISO 8601
  readAt?: string; // ISO 8601 (opsiyonel)
  amount?: number; // For send-tips
  // Sender info
  senderName?: string;
  senderTitle?: string;
  senderAvatar?: string | null;
  // Support request specific (DM_THREAD.md'ye göre)
  supportRequestType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
  supportRequestStatus?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
  requestId?: string;
  fromUserId?: string; // Support request için: Request'i oluşturan kullanıcı ID'si (required)
  toUserId?: string; // Support request için: Request'in gönderildiği kullanıcı ID'si (required)
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
        // Context sadece mesajlar için geçerli (DM_THREAD.md'ye göre)
        // Support request ve send-tips için context yok
        // Backend'de context filtreleme yapılıyor olmalı
        context: type === 'message' ? 'DM' : undefined,
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
        // Support request için fromUserId ve toUserId bilgilerini kaydet (DM_THREAD.md'ye göre - required)
        if (data.fromUserId && data.toUserId) {
          baseMessage.fromUserId = data.fromUserId;
          baseMessage.toUserId = data.toUserId;
          baseMessage.recipientId = data.toUserId; // Backward compatibility
        } else {
          console.warn('[getThreadMessages] Support request missing fromUserId or toUserId:', { id: data.id || id, fromUserId: data.fromUserId, toUserId: data.toUserId });
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
  try {
    console.log('[sendGift] 📤 Request Details:', {
      url: '/messages/tips',
      method: 'POST',
      data: {
        senderUserId: data.senderUserId,
        recipientUserId: data.recipientUserId,
        message: data.message,
        amount: data.amount,
        timestamp: data.timestamp,
      },
      dataType: typeof data.amount,
      amountIsNumber: typeof data.amount === 'number',
      amountValue: data.amount,
    });

    const response = await apiService.getClient().post('/messages/tips', data);

    console.log('[sendGift] ✅ Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    });

    return;
  } catch (error: any) {
    console.error('[sendGift] ❌ Error Details:', {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      },
      request: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
      },
      requestData: data,
    });

    // Hata mesajını daha detaylı logla
    if (error.response?.data) {
      console.error('[sendGift] ❌ Backend Error Response:', JSON.stringify(error.response.data, null, 2));
    }

    throw error;
  }
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
 * Close Support Request Request Interface
 */
export interface CloseSupportRequestRequest {
  rating: number; // 1-5 arası rating
  comment?: string; // Opsiyonel yorum
}

/**
 * Close Support Request endpoint
 * Support request'i rating ile kapatır (completed durumuna geçer)
 *
 * @param requestId - Support request ID
 * @param data - Close request data (rating, comment)
 * @returns Promise<void> - 200 OK
 */
export const closeSupportRequest = async (requestId: string, data: CloseSupportRequestRequest): Promise<void> => {
  await apiService.getClient().post(`/messages/support-requests/${requestId}/close`, data);
};

/**
 * Report Support Request Request Interface
 */
export interface ReportSupportRequestRequest {
  reason: string; // Raporlama nedeni
  description?: string; // Opsiyonel açıklama
}

/**
 * Report Support Request endpoint
 * Support request'i raporlar (reported durumuna geçer)
 *
 * @param requestId - Support request ID
 * @param data - Report request data (reason, description)
 * @returns Promise<void> - 200 OK
 */
export const reportSupportRequest = async (requestId: string, data: ReportSupportRequestRequest): Promise<void> => {
  await apiService.getClient().post(`/messages/support-requests/${requestId}/report`, data);
};

/**
 * Mark Thread As Read endpoint
 * Thread'deki tüm mesajları okundu olarak işaretler
 * 
 * @param threadId - Thread ID
 * @returns Promise<void> - 200 OK
 */
export const markThreadAsRead = async (threadId: string): Promise<void> => {
  try {
    await apiService.getClient().post(`/messages/threads/${threadId}/read`);
  } catch (error: any) {
    // 404 hatası: Thread read endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      console.warn('[markThreadAsRead] Thread read endpoint not found (404). Backend may not have implemented this endpoint yet.');
      // 404 hatasını sessizce yut (socket ile işaretleme yapılabilir)
      return;
    }
    // Diğer hataları olduğu gibi fırlat
    throw error;
  }
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

