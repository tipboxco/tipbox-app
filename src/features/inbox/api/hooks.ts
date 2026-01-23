import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMessages,
  sendGift,
  createSupportRequest,
  sendDirectMessage,
  getThreadMessages,
  getSupportRequests,
  acceptSupportRequest,
  rejectSupportRequest,
  cancelSupportRequest,
  closeSupportRequest,
  reportSupportRequest,
  markThreadAsRead,
  type GetMessagesParams,
} from './messagesApi';
import type { InboxMessage } from '../types';
import type {
  SendGiftRequest,
  SupportRequestCreate,
  DirectMessageRequest,
  ThreadMessage,
  SupportRequest,
  GetSupportRequestsParams,
  AcceptSupportRequestResponse,
  CloseSupportRequestRequest,
  ReportSupportRequestRequest,
} from './messagesApi';

/**
 * Query Keys - Inbox feature için cache key pattern'leri
 */
export const inboxKeys = {
  all: ['inbox'] as const,
  messages: () => [...inboxKeys.all, 'messages'] as const,
  threadMessages: (threadId: string) => [...inboxKeys.all, 'thread-messages', threadId] as const,
  supportRequests: (params?: GetSupportRequestsParams) =>
    [...inboxKeys.all, 'support-requests', params] as const,
};

/**
 * Get Messages query hook
 * Kullanıcının mesaj listesini getirir ve cache'ler
 *
 * @param params - Query parameters (search, unreadOnly, threadType, limit)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useMessages({ threadType: 'DM', search: 'ahmet' });
 */
export const useMessages = (params?: GetMessagesParams) => {
  const queryClient = useQueryClient();
  
  return useQuery<InboxMessage[], Error>({
    queryKey: [...inboxKeys.messages(), params],
    queryFn: async () => {
      console.log('[useMessages] 🔄 Query başlatılıyor:', { params });
      const result = await getMessages(params);
      console.log('[useMessages] ✅ Query tamamlandı:', {
        resultLength: result?.length || 0,
        result: result,
      });
      return result;
    },
    // Cache ayarları: Veri bir kez gelince invalid olana kadar cache'den kullan
    staleTime: 5 * 60 * 1000,  // 5 dakika - cache invalid olana kadar backend'e istek atma
    gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
    // PERFORMANCE FIX: refetchOnMount kaldırıldı - tab'a geçildiğinde otomatik refetch yapılmıyor
    // Mesajlar socket event'leri ile otomatik güncelleniyor
    // Kullanıcı manuel olarak pull to refresh yapabilir
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    // ✅ Backend iyileştirmesi: Backend artık doğru veriyi döndürüyor (unreadCount, isUnread)
    // Cache ile merge et - Eğer cache'de optimistic update varsa (okundu olarak işaretlenmişse), backend verisini override et
    select: (data) => {
      const queryKey = [...inboxKeys.messages(), params];
      const cachedData = queryClient.getQueryData<InboxMessage[]>(queryKey);
      
      // Eğer cache'de optimistic update varsa, backend verisini merge et
      if (cachedData && cachedData.length > 0) {
        console.log('[useMessages] 🔄 Backend verisi cache ile merge ediliyor');
        console.log(`[useMessages]   Backend'den gelen: ${data.length} thread`);
        console.log(`[useMessages]   Cache'de: ${cachedData.length} thread`);
        
        // Backend'den gelen veriyi cache ile merge et
        const mergedData = data.map((backendMsg) => {
          const cachedMsg = cachedData.find((c) => c.id === backendMsg.id);
          
          if (!cachedMsg) {
            // Cache'de yoksa backend verisini kullan (backend artık doğru veriyi döndürüyor)
            return backendMsg;
          }
          
          // ✅ Backend iyileştirmesi: Backend artık thread_read event'inde unreadCount ve isUnread gönderiyor
          // Backend'den gelen veri ile cache'i merge et
          const isCachedRead = !cachedMsg.isUnread && (cachedMsg.unreadCount || 0) === 0;
          const isBackendRead = !backendMsg.isUnread && (backendMsg.unreadCount || 0) === 0;
          const isBackendUnread = backendMsg.isUnread || (backendMsg.unreadCount || 0) > 0;
          
          // ✅ Öncelik 1: Cache'de okunmamış mesaj varsa (optimistic update), cache'i koru
          // Yeni mesaj geldiğinde handleNewMessage optimistic update yapıyor (isUnread: true, unreadCount++)
          // Backend otomatik okundu işaretliyor olsa bile, cache'deki optimistic update'i koru
          // Çünkü kullanıcı henüz mesajı okumadı, sadece yeni mesaj geldi
          const isCachedUnread = cachedMsg.isUnread || (cachedMsg.unreadCount || 0) > 0;
          if (isCachedUnread) {
            console.log(`[useMessages]   ✅ Thread ${backendMsg.id.substring(0, 8)}... cache'de okunmamış (optimistic update), cache'i koru`);
            console.log(`[useMessages]     Backend: isUnread=${backendMsg.isUnread}, unreadCount=${backendMsg.unreadCount || 0}`);
            console.log(`[useMessages]     Cache: isUnread=${cachedMsg.isUnread}, unreadCount=${cachedMsg.unreadCount || 0}`);
            // Cache'deki optimistic update'i koru (yeni mesaj geldiğinde badge gösterilmeli)
            // Backend otomatik okundu işaretliyor olsa bile, kullanıcı henüz mesajı görmedi
            return cachedMsg;
          }
          
          // ✅ Öncelik 2: Backend'den unreadCount === 0 geldiyse (thread okundu), backend verisini kullan
          // thread_read event'i geldiğinde backend doğru veriyi döndürüyor
          if (isBackendRead) {
            console.log(`[useMessages]   ✅ Thread ${backendMsg.id.substring(0, 8)}... backend'de okundu (unreadCount=0), backend verisini kullan`);
            console.log(`[useMessages]     Backend: isUnread=${backendMsg.isUnread}, unreadCount=${backendMsg.unreadCount || 0}`);
            console.log(`[useMessages]     Cache: isUnread=${cachedMsg.isUnread}, unreadCount=${cachedMsg.unreadCount || 0}`);
            // Backend verisini kullan (thread_read event'inden sonra backend doğru veriyi döndürüyor)
            return backendMsg;
          }
          
          // ✅ Öncelik 3: Cache'de okundu ama backend'de okunmamış görünüyorsa, backend verisini kullan
          // Backend'den gelen veri daha güncel olabilir (başka cihazdan mesaj geldi)
          if (isCachedRead && isBackendUnread) {
            console.log(`[useMessages]   ✅ Thread ${backendMsg.id.substring(0, 8)}... backend'de okunmamış, backend verisini kullan`);
            console.log(`[useMessages]     Backend: isUnread=${backendMsg.isUnread}, unreadCount=${backendMsg.unreadCount || 0}`);
            console.log(`[useMessages]     Cache: isUnread=${cachedMsg.isUnread}, unreadCount=${cachedMsg.unreadCount || 0}`);
            // Backend verisini kullan (başka cihazdan yeni mesaj gelmiş olabilir)
            return backendMsg;
          }
          
          // ✅ Öncelik 4: Her iki tarafta da okundu, backend verisini kullan (daha güncel olabilir)
          if (isCachedRead && !isBackendUnread) {
            return backendMsg;
          }
          
          // ✅ Öncelik 5: Diğer durumlarda backend verisini kullan
          return backendMsg;
        });
        
        // Cache'de olup backend'de olmayan thread'leri ekle (optimistic update'ler için)
        const cacheOnlyThreads = cachedData.filter(
          (cachedMsg) => !data.find((backendMsg) => backendMsg.id === cachedMsg.id)
        );
        
        if (cacheOnlyThreads.length > 0) {
          console.log(`[useMessages]   📝 ${cacheOnlyThreads.length} cache-only thread eklendi`);
          return [...mergedData, ...cacheOnlyThreads];
        }
        
        console.log(`[useMessages]   ✅ Merge tamamlandı: ${mergedData.length} thread`);
        return mergedData;
      }
      
      // Cache yoksa backend verisini direkt döndür (backend artık doğru veriyi döndürüyor)
      console.log('[useMessages]   ⚠️ Cache boş, backend verisi direkt kullanılıyor:', {
        dataLength: data?.length || 0,
        data: data,
      });
      return data || [];
    },
  });
};

/**
 * Send Gift (TIPS) mutation hook
 * Kullanıcıya TIPS gönderir
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const sendGiftMutation = useSendGift();
 * sendGiftMutation.mutate({
 *   senderUserId: 'user-123',
 *   recipientUserId: 'user-456',
 *   message: 'Teşekkürler!',
 *   amount: 100.50,
 *   timestamp: new Date().toISOString()
 * });
 */
export const useSendGift = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SendGiftRequest>({
    mutationFn: sendGift,
    onSuccess: () => {
      // Mesaj listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Create Support Request mutation hook
 * 1-on-1 destek talebi oluşturur
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const createSupportMutation = useCreateSupportRequest();
 * createSupportMutation.mutate({
 *   senderUserId: 'user-123',
 *   recipientUserId: 'user-456',
 *   type: 'GENERAL',
 *   message: 'Yardıma ihtiyacım var',
 *   amount: '50.00',
 *   status: 'pending',
 *   timestamp: new Date().toISOString()
 * });
 */
export const useCreateSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SupportRequestCreate>({
    mutationFn: createSupportRequest,
    onSuccess: () => {
      // Mesaj listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Send Direct Message mutation hook
 * Kullanıcıya direkt mesaj gönderir
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const sendDMMutation = useSendDirectMessage();
 * sendDMMutation.mutate({
 *   recipientUserId: 'user-456',
 *   message: 'Merhaba, nasılsın?'
 * });
 */
export const useSendDirectMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DirectMessageRequest>({
    mutationFn: sendDirectMessage,
    onSuccess: () => {
      // Mesaj listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Get Thread Messages query hook
 * Thread ID'sine göre mesaj geçmişini getirir ve cache'ler
 *
 * @param threadId - Thread ID
 * @param params - Pagination parametreleri (limit, beforeMessageId, cursor)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useThreadMessages('thread-123');
 * const { data, isLoading, error } = useThreadMessages('thread-123', { limit: 50, beforeMessageId: 'msg-123' });
 */
export const useThreadMessages = (threadId: string | null, params?: GetThreadMessagesParams) => {
  return useQuery<ThreadMessage[], Error>({
    queryKey: [...inboxKeys.threadMessages(threadId || ''), params],
    queryFn: () => {
      if (!threadId) {
        throw new Error('Thread ID is required');
      }
      return getThreadMessages(threadId, params);
    },
    enabled: !!threadId,
    // ✅ Cache ayarları: Mesajlar invalid olana veya silinene kadar cache'te tutulsun
    staleTime: Infinity,  // Veri hiçbir zaman stale olmaz, sadece invalidate edilince güncellenir
    gcTime: Infinity,     // Veri hiçbir zaman garbage collect edilmez, sadece manuel olarak silinince kaldırılır
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Support Requests query hook
 * Kullanıcının birebir destek sohbetlerini getirir ve cache'ler
 *
 * @param params - Query parameters (status, search, limit)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useSupportRequests({ status: 'pending' });
 */
export const useSupportRequests = (params?: GetSupportRequestsParams) => {
  return useQuery<SupportRequest[], Error>({
    queryKey: inboxKeys.supportRequests(params),
    queryFn: () => getSupportRequests(params),
    // Cache ayarları: Veri bir kez gelince invalid olana kadar cache'den kullan
    staleTime: 5 * 60 * 1000,  // 5 dakika - cache invalid olana kadar backend'e istek atma
    gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
    // PERFORMANCE FIX: refetchOnMount kaldırıldı - tab'a geçildiğinde otomatik refetch yapılmıyor
    // Support request'ler socket event'leri ile otomatik güncelleniyor
    // Kullanıcı manuel olarak pull to refresh yapabilir
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Accept Support Request mutation hook
 * Expert, support request'i accept eder ve yeni bir support thread oluşturulur
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const acceptMutation = useAcceptSupportRequest();
 * acceptMutation.mutate('request-123');
 */
export const useAcceptSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<AcceptSupportRequestResponse, Error, string>({
    mutationFn: acceptSupportRequest,
    onSuccess: () => {
      // Support request listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Reject Support Request mutation hook
 * Expert, support request'i reject eder
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const rejectMutation = useRejectSupportRequest();
 * rejectMutation.mutate('request-123');
 */
export const useRejectSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: rejectSupportRequest,
    onSuccess: () => {
      // Support request listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Cancel Support Request mutation hook
 * Destek talebini gönderen kullanıcı, talep kabul edilmeden önce iptal edebilir
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const cancelMutation = useCancelSupportRequest();
 * cancelMutation.mutate('request-123');
 */
export const useCancelSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: cancelSupportRequest,
    onSuccess: () => {
      // Support request listesini invalidate et (socket event'ten sonra güncellenecek)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Close Support Request mutation hook
 * Support request'i rating ile kapatır (completed durumuna geçer)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const closeMutation = useCloseSupportRequest();
 * closeMutation.mutate({ requestId: 'req-123', data: { rating: 5, comment: 'Great!' } });
 */
export const useCloseSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { requestId: string; data: CloseSupportRequestRequest }>({
    mutationFn: ({ requestId, data }) => closeSupportRequest(requestId, data),
    onSuccess: () => {
      // Support request listesini invalidate et
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Report Support Request mutation hook
 * Support request'i raporlar (reported durumuna geçer)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const reportMutation = useReportSupportRequest();
 * reportMutation.mutate({ requestId: 'req-123', data: { reason: 'Spam', description: '...' } });
 */
export const useReportSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { requestId: string; data: ReportSupportRequestRequest }>({
    mutationFn: ({ requestId, data }) => reportSupportRequest(requestId, data),
    onSuccess: () => {
      // Support request listesini invalidate et
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Mark Thread As Read mutation hook
 * Thread'deki tüm mesajları okundu olarak işaretler
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const markReadMutation = useMarkThreadAsRead();
 * markReadMutation.mutate('thread-123');
 */
export const useMarkThreadAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: markThreadAsRead,
    onSuccess: (_, threadId) => {
      // Optimistic update: Local state'te thread'i okundu olarak işaretle
      queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((msg) => 
          msg.id === threadId 
            ? { ...msg, isUnread: false, unreadCount: 0 }
            : msg
        );
      });
      
      // Thread mesajlarını da invalidate et (eğer cache'de varsa)
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
      
      // Mesaj listesini invalidate et (backend'den güncel veri gelsin)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

