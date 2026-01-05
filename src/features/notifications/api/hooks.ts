import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * Sadece kullanıcı authenticated olduğunda çalışır
 */
export const useNotifications = (params?: GetNotificationsParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
    enabled, // Sadece enabled=true olduğunda çalışır
    staleTime: 30 * 1000, // 30 saniye
    refetchOnWindowFocus: enabled, // Sadece enabled olduğunda window focus'ta refetch
  });
};

/**
 * Get Unread Count Query Hook
 * Sadece kullanıcı authenticated olduğunda çalışır
 */
export const useUnreadCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadCount(),
    enabled, // Sadece enabled=true olduğunda çalışır
    staleTime: 10 * 1000, // 10 saniye
    refetchInterval: enabled ? 30 * 1000 : false, // Sadece enabled olduğunda otomatik refetch
    refetchOnWindowFocus: enabled, // Sadece enabled olduğunda window focus'ta refetch
  });
};

/**
 * Get Notification Settings Query Hook
 */
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => getNotificationSettings(),
    staleTime: 5 * 60 * 1000, // 5 dakika
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





