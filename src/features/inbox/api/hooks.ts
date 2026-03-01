import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@/src/features/wallet/api/hooks';
import {
  getMessages,
  sendGift,
  createSupportRequest,
  sendDirectMessage,
  sendSharedPostToDm,
  getThreadMessages,
  getSupportRequests,
  acceptSupportRequest,
  rejectSupportRequest,
  cancelSupportRequest,
  closeSupportRequest,
  finalizeSupportRequest,
  reportSupportRequest,
  markThreadAsRead,
  addReaction,
  removeReaction,
  getMessageReactions,
  getMessageFeed,
  deleteMessage,
  muteThread,
  unmuteThread,
  type GetMessagesParams,
  type AddReactionRequest,
  type MessageFeedItem,
} from './messagesApi';
import type { InboxMessage } from '../types';
import type {
  SendGiftRequest,
  SupportRequestCreate,
  DirectMessageRequest,
  SendSharedPostToDmRequest,
  SendSharedPostToDmResponse,
  ThreadMessage,
  SupportRequest,
  GetSupportRequestsParams,
  AcceptSupportRequestResponse,
  CloseSupportRequestRequest,
  FinalizeSupportRequestRequest,
  ReportSupportRequestRequest,
  GetMessageReactionsResponse,
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
 * @param enabled - Query'yi aktif/pasif yapar (lazy loading için)
 * @param params - Query parameters (search, unreadOnly, threadType, limit)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useMessages(true, { threadType: 'DM', search: 'ahmet' });
 */
export const useMessages = (enabled: boolean = true, params?: GetMessagesParams) => {
  const queryClient = useQueryClient();
  
  return useQuery<InboxMessage[], Error>({
    queryKey: [...inboxKeys.messages(), params],
    queryFn: async () => {
      const result = await getMessages(params);
      return result;
    },
    enabled, // ✅ PERFORMANCE FIX: Lazy loading - inbox'a girilmeden veri çekilmez
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
        const mergedData = data.map((backendMsg) => {
          const cachedMsg = cachedData.find((c) => c.id === backendMsg.id);
          
          if (!cachedMsg) {
            return backendMsg;
          }
          
          const isCachedRead = !cachedMsg.isUnread && (cachedMsg.unreadCount || 0) === 0;
          const isBackendRead = !backendMsg.isUnread && (backendMsg.unreadCount || 0) === 0;
          const isBackendUnread = backendMsg.isUnread || (backendMsg.unreadCount || 0) > 0;
          
          // Cache'de okunmamış mesaj varsa (optimistic update), cache'i koru
          const isCachedUnread = cachedMsg.isUnread || (cachedMsg.unreadCount || 0) > 0;
          if (isCachedUnread) {
            return cachedMsg;
          }
          
          // Backend'den unreadCount === 0 geldiyse (thread okundu), backend verisini kullan
          if (isBackendRead) {
            return backendMsg;
          }
          
          // Cache'de okundu ama backend'de okunmamış görünüyorsa, backend verisini kullan
          if (isCachedRead && isBackendUnread) {
            return backendMsg;
          }
          
          // Her iki tarafta da okundu, backend verisini kullan (daha güncel olabilir)
          if (isCachedRead && !isBackendUnread) {
            return backendMsg;
          }
          
          return backendMsg;
        });
        
        // Cache'de olup backend'de olmayan thread'leri ekle (optimistic update'ler için)
        const cacheOnlyThreads = cachedData.filter(
          (cachedMsg) => !data.find((backendMsg) => backendMsg.id === cachedMsg.id)
        );
        
        if (cacheOnlyThreads.length > 0) {
          return [...mergedData, ...cacheOnlyThreads];
        }
        
        return mergedData;
      }
      
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
      // Wallet balance ve transactions invalidate et - bakiye değişti
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
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
      // Support requests listesini invalidate et - yeni talep listede görünmeli
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      // Wallet balance invalidate et - support request TIPS harcıyor
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
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
 * Send Shared Post to DM mutation hook
 * POST /inbox/share-post – Post'u DM thread'e paylaşır (threadId veya recipientUserId ile).
 *
 * @example
 * const sendShared = useSendSharedPostToDm();
 * sendShared.mutate({
 *   recipientUserId: 'user-456',
 *   messageType: 'shared-post',
 *   sharedPost: { postId: 'post-123', authorName: 'Ahmet', productName: 'iPhone 15' },
 *   message: 'Bunu gördün mü?'
 * });
 */
export const useSendSharedPostToDm = () => {
  const queryClient = useQueryClient();

  return useMutation<SendSharedPostToDmResponse, Error, SendSharedPostToDmRequest>({
    mutationFn: sendSharedPostToDm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
      if (data.threadId) {
        queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(data.threadId) });
      }
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
  const queryClient = useQueryClient();
  
  const query = useQuery<ThreadMessage[], Error>({
    queryKey: [...inboxKeys.threadMessages(threadId || ''), params],
    queryFn: () => {
      if (!threadId) {
        throw new Error('Thread ID is required');
      }
      console.log('[useThreadMessages] 🔄 Query function çalışıyor:', { threadId, params });
      return getThreadMessages(threadId, params);
    },
    enabled: !!threadId,
    // ✅ FIX: Cache ayarları - Thread bazlı veri çekilmesi için refetchOnMount: true
    // Yeni thread açıldığında her zaman backend'den veri çek (cache'deki eski thread verilerini gösterme)
    staleTime: 0,  // Veri her zaman stale olsun, böylece thread değiştiğinde yeni veri çekilsin
    gcTime: 2 * 60 * 1000,     // 2 dakika – 50 thread × 5 dk bellek tüketimini azaltmak için
    refetchOnMount: true,     // ✅ FIX: Thread açıldığında her zaman backend'den veri çek
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  // ✅ FIX: Thread değiştiğinde eski thread'in cache'ini temizle
  useEffect(() => {
    if (!threadId) return;
    
    // Query key'e göre cache'deki veriyi kontrol et
    const queryKey = [...inboxKeys.threadMessages(threadId), params];
    const cachedData = queryClient.getQueryData<ThreadMessage[]>(queryKey);
    
    if (cachedData && cachedData.length > 0) {
      // Cache'deki ilk mesajın thread ID'sini kontrol et
      const firstMessage = cachedData[0];
      const messageThreadId = (firstMessage as any).threadId;
      
      // Eğer cache'deki mesajlar başka bir thread'e aitse, cache'i temizle
      if (messageThreadId && messageThreadId !== threadId) {
        console.log("[useThreadMessages] ⚠️ Cache'deki mesajlar başka thread'e ait, cache temizleniyor:", {
          currentThreadId: threadId,
          cachedThreadId: messageThreadId,
        });
        queryClient.removeQueries({ queryKey });
      }
    }
  }, [threadId, params, queryClient]);

  // DEBUG: Query durumunu logla
  useEffect(() => {
    console.log('[useThreadMessages] 🔍 Query durumu:', {
      threadId,
      enabled: !!threadId,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error?.message,
      dataLength: query.data?.length || 0,
      status: query.status,
      fetchStatus: query.fetchStatus,
    });
  }, [threadId, query.isLoading, query.isFetching, query.isError, query.data?.length, query.status, query.fetchStatus]);

  return query;
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
      // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
      // ✅ CRITICAL FIX: Tüm thread messages cache'lerini invalidate et (support request thread'leri dahil)
      queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
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
      // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
      // ✅ CRITICAL FIX: Tüm thread messages cache'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
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
      // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
      // ✅ CRITICAL FIX: Tüm thread messages cache'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
    },
  });
};

/**
 * Close Support Request mutation hook
 * Support request'i rating ile kapatır (awaiting_completion durumuna geçer)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const closeMutation = useCloseSupportRequest();
 * closeMutation.mutate({ requestId: 'req-123', data: { rating: 5, comment: 'Great!' } });
 */
export const useCloseSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; message: string }, Error, { requestId: string; data: CloseSupportRequestRequest }>({
    mutationFn: ({ requestId, data }) => closeSupportRequest(requestId, data),
    onSuccess: () => {
      // ✅ FIX: Sadece supportRequests'i invalidate et (messages invalidate etme - threadMessages kaybolmasın)
      // SupportMessageDetail.tsx içindeki onSuccess callback'inde zaten kontrol ediliyor
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      // ❌ messages invalidate etme - threadMessages query'si etkilenmesin, mesajlar görünmeye devam etsin
    },
  });
};

/**
 * Finalize Support Request mutation hook
 * Support request'i finalize eder (completed durumuna geçer)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const finalizeMutation = useFinalizeSupportRequest();
 * finalizeMutation.mutate({ requestId: 'req-123', data: { rating: 5, comment: 'Great!' } });
 */
export const useFinalizeSupportRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; message: string }, Error, { requestId: string; data: FinalizeSupportRequestRequest }>({
    mutationFn: ({ requestId, data }) => finalizeSupportRequest(requestId, data),
    onSuccess: () => {
      // ✅ FIX: Sadece supportRequests'i invalidate et (messages invalidate etme - threadMessages kaybolmasın)
      // SupportMessageDetail.tsx içindeki onSuccess callback'inde zaten kontrol ediliyor
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
      // ❌ messages invalidate etme - threadMessages query'si etkilenmesin, mesajlar görünmeye devam etsin
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

/**
 * Add reaction mutation hook
 * Uses setQueryData only for this message's reactions – no full inbox invalidation.
 */
export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      addReaction(messageId, { emoji }),
    onSuccess: (data, variables) => {
      const queryKey = [...inboxKeys.all, 'reactions', variables.messageId];
      queryClient.setQueryData<GetMessageReactionsResponse>(queryKey, (old) => {
        const messageId = variables.messageId;
        const { emoji, userId } = data;
        if (!old) {
          return { messageId, reactions: [{ emoji, count: 1, users: [userId] }] };
        }
        const idx = old.reactions.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          const r = old.reactions[idx];
          return {
            ...old,
            reactions: old.reactions.map((x, i) =>
              i === idx ? { ...x, count: x.count + 1, users: [...x.users, userId] } : x
            ),
          };
        }
        return {
          ...old,
          reactions: [...old.reactions, { emoji, count: 1, users: [userId] }],
        };
      });
    },
  });
};

/**
 * Remove reaction mutation hook
 * Invalidates only this message's reactions query (no full inbox refetch).
 */
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, reactionId }: { messageId: string; reactionId: string }) =>
      removeReaction(messageId, reactionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...inboxKeys.all, 'reactions', variables.messageId],
      });
    },
  });
};

/**
 * Delete message mutation hook
 * 
 * @returns React Query mutation hook result
 * 
 * @example
 * const deleteMutation = useDeleteMessage();
 * deleteMutation.mutate('message-123');
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      // ✅ FIX: Query invalidation kaldırıldı - socket event'leri zaten state'i güncelleyecek
      // Query invalidation gereksiz refetch yapıp performansı düşürüyor
    },
  });
};

/**
 * Get message reactions query hook
 */
export const useMessageReactions = (messageId: string) => {
  return useQuery({
    queryKey: [...inboxKeys.all, 'reactions', messageId],
    queryFn: () => getMessageReactions(messageId),
    enabled: !!messageId,
  });
};

/**
 * Mute Thread mutation hook
 * Thread bildirimlerini sessize alır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const muteMutation = useMuteThread();
 * muteMutation.mutate('thread-123');
 */
export const useMuteThread = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: muteThread,
    onSuccess: (_, threadId) => {
      // Optimistic update: Local state'te thread'i muted olarak işaretle
      queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((msg) => 
          msg.id === threadId 
            ? { ...msg, isMuted: true }
            : msg
        );
      });
      
      // Mesaj listesini invalidate et (backend'den güncel veri gelsin)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Unmute Thread mutation hook
 * Thread bildirimlerini sessizden çıkarır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const unmuteMutation = useUnmuteThread();
 * unmuteMutation.mutate('thread-123');
 */
export const useUnmuteThread = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: unmuteThread,
    onSuccess: (_, threadId) => {
      // Optimistic update: Local state'te thread'i unmuted olarak işaretle
      queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((msg) => 
          msg.id === threadId 
            ? { ...msg, isMuted: false }
            : msg
        );
      });
      
      // Mesaj listesini invalidate et (backend'den güncel veri gelsin)
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    },
  });
};

/**
 * Get Message Feed query hook
 * Mesaj feed'ini getirir (messages, tips, support requests birleşik)
 *
 * @param limit - Maksimum feed item sayısı (default: 50, max: 100)
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useMessageFeed(50);
 */
export const useMessageFeed = (limit: number = 50) => {
  return useQuery<MessageFeedItem[], Error>({
    queryKey: [...inboxKeys.all, 'feed', limit],
    queryFn: () => {
      console.log('[useMessageFeed] 🔄 Fetching message feed:', { limit });
      return getMessageFeed(limit);
    },
    staleTime: 5 * 60 * 1000,  // 5 dakika
    gcTime: 10 * 60 * 1000,    // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
