import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  registerPushToken,
  deletePushToken,
} from './notificationsApi';
import type {
  GetNotificationsParams,
  UpdateNotificationSettingsRequest,
  RegisterPushTokenRequest,
} from './types';

/**
 * Query Keys - Notification feature için cache key pattern'leri
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: GetNotificationsParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
};

/**
 * Get Notifications Query Hook
 * Pagination ile tüm bildirimleri çeker
 * 
 * @param enabled - Query'nin aktif olup olmayacağını kontrol eder (default: true)
 *                  Authenticated değilse false olmalı
 */
export const useNotifications = (params?: GetNotificationsParams, enabled: boolean = true) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getNotifications({
        ...params,
        limit: params?.limit || 20,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      // Güvenli kontrol: lastPage undefined veya null olabilir
      if (!lastPage) {
        return undefined;
      }
      
      // Pagination varsa ve hasMore true ise bir sonraki offset'i döndür
      if (lastPage.pagination?.hasMore) {
        return (lastPage.pagination.offset || 0) + (lastPage.pagination.limit || 20);
      }
      return undefined; // Daha fazla sayfa yok
    },
    initialPageParam: 0,
    enabled, // Authenticated kontrolü için
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 30 * 1000,  // 30 saniye - cache invalid olana kadar backend'e istek atma (daha kısa süre)
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // CRITICAL FIX: Cache varsa kullan, yoksa fetch et (sonsuz döngü önleme)
    refetchOnWindowFocus: false, // CRITICAL FIX: Cache varsa kullan, yoksa fetch et (sonsuz döngü önleme)
    retry: (failureCount, error: any) => {
      // 500 hatası için retry yapma (backend sorunu)
      if (error?.response?.status === 500) {
        console.warn('[useNotifications] Server error (500), skipping retry');
        return false;
      }
      // 401 hatası için retry yapma (authentication sorunu)
      if (error?.response?.status === 401) {
        console.warn('[useNotifications] Authentication error (401), skipping retry');
        return false;
      }
      // Diğer hatalar için 1 kez retry yap
      return failureCount < 1;
    },
  });
};

/**
 * Get Unread Count Query Hook
 *
 * Real-time: NotificationProvider'da Socket.IO listener var; socket event geldiğinde
 * store + invalidate ile badge güncellenir. refetchInterval burada fallback (socket
 * bağlı değilse veya event kaçarsa ~30s gecikme olur).
 * Recommendation: WebSocket/Socket.IO dinleyicisinin her zaman aktif olduğundan ve
 * unread_count event'inde queryClient.invalidateQueries(notificationKeys.unreadCount())
 * yapıldığından emin olun; böylece polling süresi kısaltılabilir veya kaldırılabilir.
 *
 * @param enabled - Query'nin aktif olup olmayacağını kontrol eder (default: true)
 *                  Authenticated değilse false olmalı
 */
export const useUnreadCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadCount(),
    enabled, // Authenticated kontrolü için
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma (refetchInterval ile güncellenir)
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchInterval: enabled ? 30 * 1000 : false, // Fallback: 30s polling (WebSocket ile anlık güncelleme tercih edilmeli)
    refetchOnWindowFocus: false, // Cache varsa kullan, yoksa fetch et
    retry: (failureCount, error: any) => {
      // 500 hatası için retry yapma (backend sorunu)
      if (error?.response?.status === 500) {
        console.warn('[useUnreadCount] Server error (500), skipping retry');
        return false;
      }
      // 401 hatası için retry yapma (authentication sorunu)
      if (error?.response?.status === 401) {
        console.warn('[useUnreadCount] Authentication error (401), skipping retry');
        return false;
      }
      // Diğer hatalar için 1 kez retry yap
      return failureCount < 1;
    },
  });
};

/**
 * Get Notification Settings Query Hook
 */
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => getNotificationSettings(),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
  });
};

/**
 * Mark Notification as Read Mutation Hook
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Notification listesini ve unread count'u invalidate et
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Mark All Notifications as Read Mutation Hook
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Notification listesini ve unread count'u invalidate et
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Delete Notification Mutation Hook
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Notification listesini ve unread count'u invalidate et
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Update Notification Settings Mutation Hook
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsRequest) => updateNotificationSettings(data),
    onSuccess: () => {
      // Settings query'sini invalidate et
      queryClient.invalidateQueries({ queryKey: notificationKeys.settings() });
    },
  });
};

/**
 * Register Push Token Mutation Hook
 */
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (data: RegisterPushTokenRequest) => registerPushToken(data),
  });
};

/**
 * Delete Push Token Mutation Hook
 */
export const useDeletePushToken = () => {
  return useMutation({
    mutationFn: () => deletePushToken(),
  });
};





