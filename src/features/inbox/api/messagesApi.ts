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
/**
 * Backend Response Format - Paginated response
 */
interface GetMessagesResponse {
  items: InboxMessage[];
  pagination: {
    hasMore: boolean;
    limit: number;
  };
}

export const getMessages = async (params?: GetMessagesParams): Promise<InboxMessage[]> => {
  try {
    console.log('[getMessages] 📡 API çağrısı başlatılıyor:', {
      endpoint: '/inbox',
      params,
    });
    
    const response = await apiService.getClient().get<GetMessagesResponse>('/inbox', { params });
    
    // 🔍 DETAYLI DEBUG: Response'un tamamını logla
    console.log('[getMessages] ✅ API çağrısı başarılı:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      responseDataType: typeof response.data,
      responseDataKeys: response.data ? Object.keys(response.data) : null,
      responseDataFull: JSON.stringify(response.data, null, 2),
    });
    
    // Response formatını kontrol et
    if (!response.data) {
      console.error('[getMessages] ❌ Response data is null or undefined!');
      return [];
    }
    
    // Backend'den gelen response formatı: { items: [...], pagination: {...} }
    // Frontend direkt array bekliyor, bu yüzden items'ı döndürüyoruz
    const items = response.data?.items || [];
    
    console.log('[getMessages] 📋 Response analizi:', {
      hasItems: !!response.data.items,
      itemsIsArray: Array.isArray(response.data.items),
      itemsLength: items.length,
      pagination: response.data.pagination,
      firstItem: items[0] ? {
        id: items[0].id,
        recipientUserId: items[0].recipientUserId,
        senderName: items[0].senderName,
        senderTitle: items[0].senderTitle,
        lastMessage: items[0].lastMessage,
        isUnread: items[0].isUnread,
        unreadCount: items[0].unreadCount,
        timestamp: items[0].timestamp,
        fullItem: items[0],
      } : null,
      allItems: items.map((item, index) => ({
        index,
        id: item.id,
        recipientUserId: item.recipientUserId,
        senderName: item.senderName,
        lastMessage: item.lastMessage,
        lastMessageType: typeof item.lastMessage,
        lastMessageIsNull: item.lastMessage === null,
        lastMessageIsEmpty: item.lastMessage === '',
        isUnread: item.isUnread,
        unreadCount: item.unreadCount,
      })),
    });
    
    if (items.length === 0) {
      console.warn('[getMessages] ⚠️ Backend\'den boş array geldi! Veritabanında mesaj olmayabilir veya filtreleme sorunu olabilir.');
    }
    
    // 🔍 BACKEND SORUNU KONTROLÜ: lastMessage null ise ama thread'de mesaj varsa backend sorunu
    const itemsWithNullLastMessage = items.filter((item) => {
      const hasMessages = item.isUnread || (item.unreadCount && item.unreadCount > 0);
      const hasNullLastMessage = !item.lastMessage || item.lastMessage.trim() === '';
      return hasMessages && hasNullLastMessage;
    });
    
    if (itemsWithNullLastMessage.length > 0) {
      console.error('[getMessages] ❌ BACKEND SORUNU: lastMessage null ama thread\'de mesaj var!', {
        count: itemsWithNullLastMessage.length,
        items: itemsWithNullLastMessage.map((item) => ({
          threadId: item.id,
          senderName: item.senderName,
          isUnread: item.isUnread,
          unreadCount: item.unreadCount,
          lastMessage: item.lastMessage,
          timestamp: item.timestamp,
        })),
      });
      console.error('[getMessages] 💡 Backend\'de lastMessage hesaplaması yapılmıyor olabilir. Thread\'de mesaj varsa lastMessage mutlaka olmalı!');
    }
    
    return items;
  } catch (error: any) {
    console.error('[getMessages] ❌ API çağrısı başarısız:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      data: error?.response?.data,
      params,
    });
    
    // 404 hatası: Endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      console.error('[getMessages] 404 - Endpoint not found. Backend may not have implemented /inbox endpoint yet.');
      // Boş array döndür (UI'da hata göstermek yerine boş liste göster)
      return [];
    }
    throw error;
  }
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
    const response = await apiService.getClient().post<ThreadResponse>('/inbox/threads', {
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
    const response = await apiService.getClient().get<ThreadResponse>(`/inbox/threads/${threadId}`);
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
 * Thread Participant - Thread'deki kullanıcı bilgileri
 * ✅ OPTIMIZE: Thread başında participants bilgisi gönderilir (her mesajda sender bilgisi göndermek yerine)
 */
export interface ThreadParticipant {
  id: string;
  name: string;
  title: string | null;
  avatar: string | null;
}

/**
 * Backend Response Format - Thread mesajları için (Single Item)
 * ✅ OPTIMIZE: sender objesi yerine sadece senderId gönderilir
 * Sender bilgileri participants'tan alınır
 */
export interface ThreadMessageResponseItem {
  id: string;
  type: 'message' | 'image' | 'support-request' | 'send-tips'; // ✅ 'image' eklendi
  data: {
    id: string;
    senderId: string; // ✅ OPTIMIZE: Sadece senderId gönderilir (sender objesi yerine)
    // ✅ OPTIONAL: Backward compatibility için sender objesi hala gönderilebilir
    // Ama yeni implementasyonlarda sadece senderId kullanılmalı
    sender?: {
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
    // ✅ For image type - Görsel mesajlar için
    mediaUrl?: string;        // Görsel URL'i (CDN'den)
    thumbnailUrl?: string | null; // Thumbnail URL'i (opsiyonel)
    caption?: string;         // Görsel altı yazı (opsiyonel)
    imageUrl?: string;        // Backward compatibility için (mediaUrl yerine)
    groupedMessages?: any[];  // ✅ Gruplanmış mesajlar (backend'den gelebilir)
    dimensions?: {            // ✅ Görsel boyutları (opsiyonel)
      width: number;
      height: number;
    };
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
 * ✅ OPTIMIZE: Optimize Backend Response Format
 * Tarih grupları ve mesaj grupları ile organize edilmiş yapı
 */

// Optimize mesaj yapısı (backend'den gelen)
export interface OptimizedMessage {
  id: string;
  type: 'message' | 'image' | 'support-request' | 'send-tips';
  sentAt: string; // ISO 8601
  isRead: boolean;
  readAt?: string; // ISO 8601 (opsiyonel)
  content: {
    text?: string;
    mediaUrl?: string;
    thumbnailUrl?: string | null;
    caption?: string;
    fileSize?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    amount?: number;
    currency?: string;
    supportType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
    supportStatus?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
    requestId?: string;
    fromUserId?: string;
    toUserId?: string;
  };
  threadId?: string | null;
}

// Mesaj grubu (5 dakika içinde aynı kullanıcıdan gelen mesajlar)
export interface MessageGroup {
  groupId: string;
  senderId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  messages: OptimizedMessage[];
}

// Tarih grubu
export interface DateGroup {
  date: {
    timestamp: string; // ISO 8601: "2024-01-15T00:00:00.000Z"
    displayText: string; // "Today", "Yesterday", "January 15, 2024"
    dayKey: string; // "2024-01-15"
  };
  messageGroups: MessageGroup[];
}

// Optimize response formatı
export interface OptimizedChatResponse {
  thread: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
  participants: {
    [userId: string]: {
      id: string;
      name: string;
      title?: string;
      avatar: string | null;
      isOnline?: boolean;
      lastSeen?: string;
    };
  };
  dateGroups: DateGroup[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
  };
}

/**
 * Backend Response Format - Thread mesajları için (Paginated Response)
 * ✅ OPTIMIZE: Thread başında participants bilgisi gönderilir
 * Mesajlarda sadece senderId gönderilir, sender bilgileri participants'tan alınır
 * 
 * ✅ YENİ: Optimize format desteği (backward compatibility için eski format da destekleniyor)
 */
export interface GetThreadMessagesResponse {
  // ✅ YENİ: Optimize format (backend optimize format gönderirse)
  thread?: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
  participants?: {
    [userId: string]: {
      id: string;
      name: string;
      title?: string;
      avatar: string | null;
      isOnline?: boolean;
      lastSeen?: string;
    };
  } | {
    // Eski format (backward compatibility)
    userOne?: ThreadParticipant;
    userTwo?: ThreadParticipant;
  };
  dateGroups?: DateGroup[]; // ✅ YENİ: Optimize format
  items?: ThreadMessageResponseItem[]; // Eski format (backward compatibility)
  pagination: {
    hasMore: boolean;
    limit: number;
    nextCursor?: string; // Cursor-based pagination için
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
  messageType: 'message' | 'image' | 'support-request' | 'send-tips'; // ✅ 'image' eklendi
  context?: 'DM' | 'SUPPORT'; // Sadece mesajlar için geçerli (type: "message" veya "image")
  isRead: boolean;
  sentAt: string; // ISO 8601
  readAt?: string; // ISO 8601 (opsiyonel)
  amount?: number; // For send-tips
  // ✅ Image message fields - Görsel mesajlar için
  mediaUrl?: string;        // Görsel URL'i (CDN'den)
  thumbnailUrl?: string | null; // Thumbnail URL'i (opsiyonel)
  caption?: string;         // Görsel altı yazı (opsiyonel)
  dimensions?: {            // ✅ Görsel boyutları (opsiyonel)
    width: number;
    height: number;
  };
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
  // ✅ Grup mesajları (5 dakika içinde aynı kullanıcıdan gelen mesajlar - tek balonda gösterilecek)
  groupedMessages?: Array<{
    id: string;
    message: string;
    timestamp: string;
    sentAt: string;
    isRead: boolean;
  }>;
}

/**
 * Get Thread Messages Parameters
 */
export interface GetThreadMessagesParams {
  limit?: number; // Maksimum mesaj sayısı (default: 50)
  beforeMessageId?: string; // Bu mesaj ID'sinden önceki mesajları getir (pagination için)
  cursor?: string; // Cursor-based pagination için timestamp
}

/**
 * ✅ Helper: Optimize format'tan flat array'e çevir (backward compatibility için)
 * Eğer frontend optimize format'ı direkt kullanmak isterse, bu fonksiyon kullanılmayabilir
 */
export const convertOptimizedToFlat = (
  dateGroups: DateGroup[],
  participants: { [userId: string]: { id: string; name: string; title?: string; avatar: string | null } },
  threadId: string
): ThreadMessage[] => {
  const allMessages: ThreadMessage[] = [];
  
  const getSenderInfo = (senderId: string) => {
    if (participants && participants[senderId]) {
      return {
        id: participants[senderId].id,
        senderName: participants[senderId].name,
        senderTitle: participants[senderId].title || '',
        senderAvatar: participants[senderId].avatar,
      };
    }
    return null;
  };
  
  dateGroups.forEach((dateGroup) => {
    dateGroup.messageGroups.forEach((messageGroup) => {
      messageGroup.messages.forEach((optimizedMsg) => {
        const senderInfo = getSenderInfo(messageGroup.senderId);
        
        if (!senderInfo) {
          console.warn('[convertOptimizedToFlat] ⚠️ Sender bilgisi bulunamadı:', { senderId: messageGroup.senderId });
        }
        
        const threadMessage: ThreadMessage = {
          id: optimizedMsg.id,
          threadId: optimizedMsg.threadId || threadId,
          senderId: messageGroup.senderId,
          message: optimizedMsg.content.text || optimizedMsg.content.caption || '',
          messageType: optimizedMsg.type,
          isRead: optimizedMsg.isRead,
          sentAt: optimizedMsg.sentAt,
          readAt: optimizedMsg.readAt,
          senderName: senderInfo?.senderName,
          senderTitle: senderInfo?.senderTitle,
          senderAvatar: senderInfo?.senderAvatar || null,
        };
        
        if (optimizedMsg.type === 'image') {
          threadMessage.mediaUrl = optimizedMsg.content.mediaUrl;
          threadMessage.thumbnailUrl = optimizedMsg.content.thumbnailUrl;
          threadMessage.caption = optimizedMsg.content.caption;
        }
        
        if (optimizedMsg.type === 'send-tips') {
          threadMessage.amount = optimizedMsg.content.amount;
        }
        
        if (optimizedMsg.type === 'support-request') {
          threadMessage.supportRequestType = optimizedMsg.content.supportType;
          threadMessage.supportRequestStatus = optimizedMsg.content.supportStatus;
          threadMessage.requestId = optimizedMsg.content.requestId;
          threadMessage.fromUserId = optimizedMsg.content.fromUserId;
          threadMessage.toUserId = optimizedMsg.content.toUserId;
        }
        
        allMessages.push(threadMessage);
      });
    });
  });
  
  return allMessages;
};

/**
 * Get Thread Messages endpoint
 * Thread ID'sine göre mesaj geçmişini getirir
 * 
 * @param threadId - Thread ID
 * @param params - Pagination parametreleri (limit, beforeMessageId, cursor)
 * @returns Thread mesajları listesi (normalized) - Optimize format varsa flat array'e çevrilir
 */
export const getThreadMessages = async (threadId: string, params?: GetThreadMessagesParams): Promise<ThreadMessage[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.beforeMessageId) queryParams.append('beforeMessageId', params.beforeMessageId);
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    
    const queryString = queryParams.toString();
    const endpoint = `/inbox/${threadId}${queryString ? `?${queryString}` : ''}`;
    
    console.log('[getThreadMessages] 📡 API çağrısı başlatılıyor:', {
      endpoint,
      fullUrl: `${apiService.getClient().defaults.baseURL}${endpoint}`,
      threadId,
      params,
      baseURL: apiService.getClient().defaults.baseURL,
    });
    
    const response = await apiService.getClient().get<GetThreadMessagesResponse>(endpoint);
    
    console.log('[getThreadMessages] ✅ API çağrısı başarılı:', {
      status: response.status,
      statusText: response.statusText,
      hasDateGroups: !!response.data?.dateGroups,
      dateGroupsLength: response.data?.dateGroups?.length || 0,
      itemsLength: response.data?.items?.length || 0,
      itemsIsArray: Array.isArray(response.data?.items),
      itemsType: typeof response.data?.items,
      itemsValue: response.data?.items,
      pagination: response.data?.pagination,
      hasParticipants: !!response.data?.participants,
      participants: response.data?.participants,
      responseDataKeys: response.data ? Object.keys(response.data) : [],
      responseDataType: typeof response.data,
      responseDataIsArray: Array.isArray(response.data),
      responseDataFull: JSON.stringify(response.data, null, 2).substring(0, 500), // İlk 500 karakter
    });
    
    // ✅ YENİ: Optimize format kontrolü (dateGroups varsa optimize format kullan)
    if (response.data?.dateGroups && response.data.dateGroups.length > 0) {
      console.log('[getThreadMessages] ✅ Optimize format kullanılıyor (dateGroups)');
      
      // Participants bilgisini al (yeni format)
      const participants = response.data.participants as { [userId: string]: { id: string; name: string; title?: string; avatar: string | null } } | undefined;
      
      if (!participants) {
        console.warn('[getThreadMessages] ⚠️ Participants bilgisi yok, optimize format kullanılamıyor');
        // Fallback to old format
      } else {
        // Optimize format'tan flat array'e çevir
        const allMessages = convertOptimizedToFlat(
          response.data.dateGroups,
          participants,
          threadId
        );
        
        console.log('[getThreadMessages] ✅ Optimize format\'tan normalize edildi:', allMessages.length, 'mesaj');
        return allMessages;
      }
    }
    
    // ✅ Eski format (backward compatibility)
    // Eski format: Backend'den { items: [...], pagination: {...} } formatında geliyor
    // Yeni optimize format: Backend'den { dateGroups: [...], participants: {...}, pagination: {...} } formatında geliyor
    // Şu anda backend henüz optimize format göndermiyor, bu yüzden eski format kullanılıyor
    console.log('[getThreadMessages] 📦 Eski format kullanılıyor (items) - Backend henüz optimize format (dateGroups) göndermiyor');
    
    // CRITICAL DEBUG: Response data yapısını kontrol et
    console.log('[getThreadMessages] 🔍 Response data analizi:', {
      hasResponseData: !!response.data,
      responseDataKeys: response.data ? Object.keys(response.data) : [],
      hasItems: !!response.data?.items,
      itemsType: typeof response.data?.items,
      itemsIsArray: Array.isArray(response.data?.items),
      itemsLength: response.data?.items?.length,
      itemsFirstItem: response.data?.items?.[0],
    });
    
    const items = response.data?.items || [];
    
    if (items.length === 0) {
      console.warn('[getThreadMessages] ⚠️ Backend\'den boş array geldi! Thread\'de mesaj olmayabilir.');
      console.warn('[getThreadMessages] ⚠️ Response data:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataType: typeof response.data,
        fullData: response.data,
      });
      return [];
    }
    
    console.log('[getThreadMessages] ✅ Items bulundu:', {
      itemsCount: items.length,
      firstItem: items[0],
      itemTypes: items.map(item => item.type),
    });
    
    // ✅ OPTIMIZE: Participants bilgisini al (thread başında gönderilir)
    const participants = response.data?.participants;
    console.log('[getThreadMessages] 👥 Participants bilgisi:', participants);
    
    // Helper: senderId'ye göre sender bilgilerini participants'tan bul
    const getSenderInfo = (senderId: string) => {
      // Önce backward compatibility için data.sender objesi var mı kontrol et
      // (Eski format desteği için)
      
      // Participants'tan bul
      if (participants) {
        if (participants.userOne.id === senderId) {
          return {
            id: participants.userOne.id,
            senderName: participants.userOne.name,
            senderTitle: participants.userOne.title || '',
            senderAvatar: participants.userOne.avatar,
          };
        } else if (participants.userTwo.id === senderId) {
          return {
            id: participants.userTwo.id,
            senderName: participants.userTwo.name,
            senderTitle: participants.userTwo.title || '',
            senderAvatar: participants.userTwo.avatar,
          };
        }
      }
      
      // Participants'ta bulunamadıysa null döndür (fallback için)
      return null;
    };
    
    // Backend response'unu normalize et
    // ✅ YENİ: groupedMessages desteği - önce groupedMessages'ı parse et, sonra ana mesajları
    const allMessagesToNormalize: Array<{ item: ThreadMessageResponseItem; isGrouped: boolean; parentId?: string }> = [];
    
    items.forEach((item) => {
      // ✅ DEBUG: Her item'ı logla
      if (item.type === 'image') {
        console.log('[getThreadMessages] 🖼️ Image item found in items:', {
          id: item.id,
          type: item.type,
          mediaUrl: item.data.mediaUrl,
          thumbnailUrl: item.data.thumbnailUrl,
          caption: item.data.caption,
          hasGroupedMessages: !!(item.data.groupedMessages && item.data.groupedMessages.length > 0),
        });
      }
      
      // ✅ YENİ: groupedMessages varsa, bunları ana mesajın içinde tut (ayrı mesaj olarak ekleme)
      // Ana mesajı ekle (groupedMessages bilgisi ile birlikte)
      allMessagesToNormalize.push({ 
        item: {
          ...item,
          // groupedMessages bilgisini item'a ekle (normalize ederken kullanılacak)
          data: {
            ...item.data,
            _groupedMessages: item.data.groupedMessages, // Geçici olarak sakla
          },
        }, 
        isGrouped: false 
      });
    });
    
    const normalizedMessages: ThreadMessage[] = allMessagesToNormalize.map(({ item, isGrouped, parentId }) => {
      const { id, type, data } = item;
      // CRITICAL FIX: timestamp field'ını kontrol et - backend'den timestamp veya sentAt gelebilir
      const timestamp = data.timestamp || data.sentAt || (item as any).timestamp || (item as any).sentAt;
      
      if (!timestamp) {
        console.warn('[getThreadMessages] ⚠️ Timestamp bulunamadı, mesaj atlanıyor:', { id, type, data });
        return null; // Timestamp yoksa mesajı atla
      }
      
      // ✅ DEBUG: Image type kontrolü
      if (type === 'image' || data.mediaUrl || data.imageUrl) {
        console.log('[getThreadMessages] 🖼️ Processing image item:', {
          id,
          type,
          mediaUrl: data.mediaUrl,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          isGrouped,
          parentId,
        });
      }
      
      // ✅ OPTIMIZE: Sender bilgilerini participants'tan al (senderId'ye göre)
      // Backward compatibility: Eğer data.sender varsa onu kullan (eski format)
      const senderId = data.senderId || data.sender?.id;
      if (!senderId) {
        console.warn('[getThreadMessages] ⚠️ SenderId bulunamadı:', { itemId: id, data });
      }
      
      // Sender bilgilerini al (önce backward compatibility, sonra participants)
      let senderInfo = data.sender ? {
        id: data.sender.id,
        senderName: data.sender.senderName,
        senderTitle: data.sender.senderTitle || '',
        senderAvatar: data.sender.senderAvatar,
      } : getSenderInfo(senderId);
      
      // Eğer hala sender bilgisi yoksa, default değerler kullan
      if (!senderInfo) {
        console.warn('[getThreadMessages] ⚠️ Sender bilgisi bulunamadı, default kullanılıyor:', { senderId, itemId: id });
        senderInfo = {
          id: senderId || 'unknown',
          senderName: 'Unknown',
          senderTitle: '',
          senderAvatar: null,
        };
      }
      
      // Base message structure
      const baseMessage: ThreadMessage = {
        id: data.id || id,
        threadId: data.threadId || threadId,
        senderId: senderInfo.id,
        message: data.message || data.lastMessage || data.caption || '', // ✅ caption da message olarak kullanılabilir
        messageType: type,
        // Context sadece mesajlar için geçerli (DM_THREAD.md'ye göre)
        // Support request ve send-tips için context yok
        // Backend'de context filtreleme yapılıyor olmalı
        context: (type === 'message' || type === 'image') ? 'DM' : undefined, // ✅ image mesajları da DM context'inde
        isRead: !data.isUnread, // isUnread varsa, isRead = !isUnread
        sentAt: timestamp,
        senderName: senderInfo.senderName,
        senderTitle: senderInfo.senderTitle,
        senderAvatar: senderInfo.senderAvatar,
      };
      
      // ✅ Image message fields - Görsel mesajlar için
      if (type === 'image' || data.mediaUrl || data.imageUrl) {
        console.log('[getThreadMessages] 🖼️ Image message detected in normalization:', {
          id: baseMessage.id,
          type,
          mediaUrl: data.mediaUrl,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          caption: data.caption,
        });
        baseMessage.messageType = 'image';
        baseMessage.mediaUrl = data.mediaUrl || data.imageUrl; // Backward compatibility için imageUrl de kontrol et
        baseMessage.thumbnailUrl = data.thumbnailUrl || null;
        baseMessage.caption = data.caption || data.message || data.lastMessage || '';
        // ✅ Dimensions bilgisi varsa ekle (opsiyonel)
        if (data.dimensions && typeof data.dimensions === 'object' && data.dimensions.width && data.dimensions.height) {
          baseMessage.dimensions = {
            width: typeof data.dimensions.width === 'number' ? data.dimensions.width : parseInt(data.dimensions.width),
            height: typeof data.dimensions.height === 'number' ? data.dimensions.height : parseInt(data.dimensions.height),
          };
        }
        console.log('[getThreadMessages] 🖼️ Image message normalized:', {
          id: baseMessage.id,
          messageType: baseMessage.messageType,
          mediaUrl: baseMessage.mediaUrl,
          thumbnailUrl: baseMessage.thumbnailUrl,
          caption: baseMessage.caption,
        });
      }
      
      // Type-specific fields
      if (type === 'send-tips' && data.amount) {
        baseMessage.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      }
      
      if (type === 'support-request') {
        baseMessage.supportRequestType = data.type;
        baseMessage.supportRequestStatus = data.status; // ✅ Backend'den gelen data.status -> supportRequestStatus
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
        
        // ✅ DEBUG: Support request status bilgisini logla
        if (__DEV__) {
          console.log('[getThreadMessages] 🔍 Support Request Status Parse:', {
            messageId: id,
            type: type,
            dataStatus: data.status,
            parsedStatus: baseMessage.supportRequestStatus,
            requestId: baseMessage.requestId,
            threadId: data.threadId,
            fullData: data,
          });
        }
      }
      
      // ✅ Grup mesajları ekle (5 dakika içinde aynı kullanıcıdan gelen text mesajlar - tek balonda gösterilecek)
      // ✅ Backend güncellemesi: Sadece type: 'message' olan mesajlar gruplanıyor
      // Backend'den data.groupedMessages olarak geliyor (data._groupedMessages değil)
      const groupedMessages = data.groupedMessages || data._groupedMessages;
      // ✅ Backend güncellemesi: groupedMessages sadece text mesajları için gelir
      // Eğer baseMessage type: 'message' değilse, groupedMessages olmamalı
      if (groupedMessages && Array.isArray(groupedMessages) && groupedMessages.length > 0 && baseMessage.messageType === 'message') {
        baseMessage.groupedMessages = groupedMessages.map((groupedMsg: any) => ({
          id: groupedMsg.id,
          text: groupedMsg.message || groupedMsg.text || '', // Backend'den message olarak geliyor
          message: groupedMsg.message || groupedMsg.text || '', // Backward compatibility
          timestamp: groupedMsg.timestamp || timestamp,
          sentAt: groupedMsg.timestamp || timestamp,
          isRead: !groupedMsg.isUnread,
        }));
        console.log('[getThreadMessages] 📦 Grouped messages added to message:', {
          messageId: baseMessage.id,
          messageType: baseMessage.messageType,
          groupedCount: baseMessage.groupedMessages.length,
          groupedMessages: baseMessage.groupedMessages.map(gm => ({ id: gm.id, text: gm.text })),
        });
      } else if (groupedMessages && Array.isArray(groupedMessages) && groupedMessages.length > 0 && baseMessage.messageType !== 'message') {
        // ✅ Backend güncellemesi: Text olmayan mesajlarda groupedMessages olmamalı (backend'den gelse bile)
        console.warn('[getThreadMessages] ⚠️ groupedMessages received for non-text message, ignoring:', {
          messageId: baseMessage.id,
          messageType: baseMessage.messageType,
          groupedCount: groupedMessages.length,
        });
      }
      
      return baseMessage;
    }).filter((msg): msg is ThreadMessage => msg !== null); // null mesajları filtrele
    
    // CRITICAL FIX: Backend'den gelen mesajları timestamp'e göre sırala (en eski başta, en yeni sonda)
    // Backend'den gelen mesajlar ters sırada gelebilir, bu yüzden frontend'de sıralama yapıyoruz
    normalizedMessages.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeA - timeB; // Ascending (en eski başta, en yeni sonda)
    });
    
    // Pagination bilgisini mesajlara ekle (hasMore kontrolü için)
    // Backend'den gelen pagination.hasMore bilgisini kullan
    const paginationInfo = response.data?.pagination;
    if (paginationInfo) {
      // Pagination bilgisini her mesaja ekle (sonraki sayfa kontrolü için)
      (normalizedMessages as any).__pagination = {
        hasMore: paginationInfo.hasMore,
        nextCursor: paginationInfo.nextCursor,
      };
    }
    
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
      url: '/inbox/tips',
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

    const response = await apiService.getClient().post('/inbox/tips', data);

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
  await apiService.getClient().post('/inbox/support-requests', data);
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
  try {
    console.log('[sendDirectMessage] 📤 Request Details:', {
      url: '/inbox',
      method: 'POST',
      data: {
        recipientUserId: data.recipientUserId,
        message: data.message,
        messageLength: data.message.length,
      },
    });

    const response = await apiService.getClient().post('/inbox', data);

    console.log('[sendDirectMessage] ✅ Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      success: response.status >= 200 && response.status < 300,
    });

    return;
  } catch (error: any) {
    console.error('[sendDirectMessage] ❌ Error Details:', {
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
      console.error('[sendDirectMessage] ❌ Backend Error Response:', JSON.stringify(error.response.data, null, 2));
    }

    throw error;
  }
};

/**
 * Support Request Response Interface
 */
/**
 * Sender User Interface (Ortak Type)
 */
export interface SenderUser {
  id: string;
  senderName: string;
  senderTitle: string;
  senderAvatar: string;
}

/**
 * Support Request Interface
 * Backend'den gelen yeni response formatına göre güncellendi
 */
export interface SupportRequest {
  id: string;
  sender: SenderUser;
  type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT';
  message: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
  timestamp: string;
  threadId?: string | null;
  requestId?: string;
  fromUserId: string;
  toUserId: string;
  // Backward compatibility için eski field'lar (opsiyonel)
  userName?: string;
  userTitle?: string;
  userAvatar?: string | null;
  requestDescription?: string;
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

/**
 * Get Support Requests Response Interface
 */
interface GetSupportRequestsResponse {
  items: SupportRequest[];
}

export const getSupportRequests = async (params?: GetSupportRequestsParams): Promise<SupportRequest[]> => {
  try {
    console.log('[getSupportRequests] 📡 API çağrısı başlatılıyor:', {
      endpoint: '/inbox/support-requests',
      params,
    });
    
    const response = await apiService.getClient().get<GetSupportRequestsResponse>('/inbox/support-requests', {
      params,
    });
    
    console.log('[getSupportRequests] ✅ API çağrısı başarılı:', {
      status: response.status,
      itemsCount: response.data?.items?.length || 0,
      items: response.data?.items,
    });
    
    // Backend'den items array'i geliyor
    return response.data?.items || [];
  } catch (error: any) {
    // 404 hatası: Endpoint backend'de henüz implement edilmemiş olabilir
    if (error?.response?.status === 404) {
      console.error('[getSupportRequests] 404 - Endpoint not found. Backend may not have implemented /inbox/support-requests endpoint yet.');
      // Boş array döndür (UI'da hata göstermek yerine boş liste göster)
      return [];
    }
    throw error;
  }
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
    `/inbox/support-requests/${requestId}/accept`
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
  await apiService.getClient().post(`/inbox/support-requests/${requestId}/reject`);
};

/**
 * Cancel Support Request endpoint
 * Destek talebini gönderen kullanıcı, talep kabul edilmeden önce iptal edebilir
 *
 * @param requestId - Support request ID
 * @returns Promise<void> - 200 OK
 */
export const cancelSupportRequest = async (requestId: string): Promise<void> => {
  await apiService.getClient().post(`/inbox/support-requests/${requestId}/cancel`);
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
  await apiService.getClient().post(`/inbox/support-requests/${requestId}/close`, data);
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
  await apiService.getClient().post(`/inbox/support-requests/${requestId}/report`, data);
};

/**
 * Mark Thread As Read endpoint
 * Thread'deki tüm mesajları okundu olarak işaretler
 * 
 * @param threadId - Thread ID
 * @returns Promise<void> - 200 OK
 */
/**
 * Add Reaction Request
 */
export interface AddReactionRequest {
  emoji: string;
}

/**
 * Add Reaction Response
 */
export interface AddReactionResponse {
  reactionId: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

/**
 * Add reaction to a message
 * POST /inbox/:messageId/reactions
 */
export const addReaction = async (messageId: string, data: AddReactionRequest): Promise<AddReactionResponse> => {
  try {
    const response = await apiService.getClient().post<AddReactionResponse>(
      `/inbox/${messageId}/reactions`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[addReaction] ❌ Error:', error);
    throw error;
  }
};

/**
 * Remove reaction from a message
 * DELETE /inbox/:messageId/reactions/:reactionId
 */
export const removeReaction = async (messageId: string, reactionId: string): Promise<void> => {
  try {
    await apiService.getClient().delete(`/inbox/${messageId}/reactions/${reactionId}`);
  } catch (error: any) {
    console.error('[removeReaction] ❌ Error:', error);
    throw error;
  }
};

/**
 * Get message reactions
 * GET /inbox/:messageId/reactions
 */
export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface GetMessageReactionsResponse {
  messageId: string;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

export const getMessageReactions = async (messageId: string): Promise<GetMessageReactionsResponse> => {
  try {
    const response = await apiService.getClient().get<GetMessageReactionsResponse>(
      `/inbox/${messageId}/reactions`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getMessageReactions] ❌ Error:', error);
    throw error;
  }
};

export const markThreadAsRead = async (threadId: string): Promise<void> => {
  try {
    await apiService.getClient().post(`/inbox/threads/${threadId}/read`);
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
      `/inbox/feed?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getMessageFeed] API Error:', {
      url: `/inbox/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      limit,
    });
    throw error;
  }
};

