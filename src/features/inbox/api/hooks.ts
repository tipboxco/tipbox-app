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
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useMessages();
 */
export const useMessages = () => {
  return useQuery<InboxMessage[], Error>({
    queryKey: inboxKeys.messages(),
    queryFn: () => getMessages(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useThreadMessages('thread-123');
 */
export const useThreadMessages = (threadId: string | null) => {
  return useQuery<ThreadMessage[], Error>({
    queryKey: inboxKeys.threadMessages(threadId || ''),
    queryFn: () => {
      if (!threadId) {
        throw new Error('Thread ID is required');
      }
      return getThreadMessages(threadId);
    },
    enabled: !!threadId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
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

