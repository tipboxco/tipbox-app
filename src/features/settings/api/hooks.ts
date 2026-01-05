import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword } from './changePasswordApi';
import { getNotificationSettings, updateNotificationSettings } from './notificationsApi';
import { getPrivacySettings, updatePrivacySettings } from './privacyApi';
import { getSupportSessionPrice, updateSupportSessionPrice } from './supportSessionPriceApi';
import { getDevices, deleteDevice } from './devicesApi';
import { useAppStore } from '@/src/store/appStore';
import type { ChangePasswordRequest, ChangePasswordResponse } from '../types';
import type { 
  NotificationSetting, 
  UpdateNotificationSettingsRequest, 
  UpdateNotificationSettingsResponse 
} from '../types';
import type { 
  PrivacySetting, 
  UpdatePrivacySettingsRequest, 
  UpdatePrivacySettingsResponse 
} from '../types';
import type { 
  SupportSessionPriceResponse, 
  UpdateSupportSessionPriceRequest, 
  UpdateSupportSessionPriceResponse 
} from '../types';
import type { Device, DeleteDeviceResponse } from '../types';

/**
 * Query Keys - Settings feature için cache key pattern'leri
 */
export const settingsKeys = {
  all: ['settings'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  privacy: () => [...settingsKeys.all, 'privacy'] as const,
  supportSessionPrice: () => [...settingsKeys.all, 'supportSessionPrice'] as const,
  devices: () => [...settingsKeys.all, 'devices'] as const,
};

/**
 * Change Password mutation hook
 * Kullanıcı şifre değiştirme işlemi için React Query mutation hook'u
 * 
 * @example
 * const changePasswordMutation = useChangePassword();
 * changePasswordMutation.mutate({ currentPassword, newPassword });
 */
export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: changePassword,
    onSuccess: (data) => {
      // Başarılı şifre değiştirme sonrası işlemler burada yapılabilir
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Password change error:', error);
    },
  });
};

/**
 * Get Notification Settings query hook
 * Kullanıcının bildirim ayarlarını getirir
 * 
 * @example
 * const { data, isLoading, error } = useNotificationSettings();
 */
export const useNotificationSettings = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  return useQuery<NotificationSetting[], Error>({
    queryKey: settingsKeys.notifications(),
    queryFn: getNotificationSettings,
    enabled: isAuthenticated, // Sadece login olunduğunda çalış
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};

/**
 * Update Notification Settings mutation hook
 * Kullanıcının bildirim ayarlarını günceller
 * 
 * @example
 * const updateMutation = useUpdateNotificationSettings();
 * updateMutation.mutate({ settings: [{ notificationCode: 0, value: true }] });
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateNotificationSettingsResponse, Error, UpdateNotificationSettingsRequest>({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      // Bildirim ayarları güncellendiğinde cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
    },
  });
};

/**
 * Get Privacy Settings query hook
 * Kullanıcının gizlilik ayarlarını getirir
 * 
 * @example
 * const { data, isLoading, error } = usePrivacySettings();
 */
export const usePrivacySettings = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  return useQuery<PrivacySetting[], Error>({
    queryKey: settingsKeys.privacy(),
    queryFn: getPrivacySettings,
    enabled: isAuthenticated, // Sadece login olunduğunda çalış
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};

/**
 * Update Privacy Settings mutation hook
 * Kullanıcının gizlilik ayarlarını günceller
 * 
 * @example
 * const updateMutation = useUpdatePrivacySettings();
 * updateMutation.mutate({ settings: [{ privacyCode: 0, selectedValue: 'trust-only' }] });
 */
export const useUpdatePrivacySettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdatePrivacySettingsResponse, Error, UpdatePrivacySettingsRequest>({
    mutationFn: updatePrivacySettings,
    onSuccess: () => {
      // Gizlilik ayarları güncellendiğinde cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: settingsKeys.privacy() });
    },
  });
};

/**
 * Get Support Session Price query hook
 * Kullanıcının destek oturumu fiyatını getirir
 * 
 * @example
 * const { data, isLoading, error } = useSupportSessionPrice();
 */
export const useSupportSessionPrice = () => {
  return useQuery<SupportSessionPriceResponse, Error>({
    queryKey: settingsKeys.supportSessionPrice(),
    queryFn: getSupportSessionPrice,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};

/**
 * Update Support Session Price mutation hook
 * Kullanıcının destek oturumu fiyatını günceller
 * 
 * @example
 * const updateMutation = useUpdateSupportSessionPrice();
 * updateMutation.mutate({ price: 100 });
 */
export const useUpdateSupportSessionPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateSupportSessionPriceResponse, Error, UpdateSupportSessionPriceRequest>({
    mutationFn: updateSupportSessionPrice,
    onSuccess: () => {
      // Destek oturumu fiyatı güncellendiğinde cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: settingsKeys.supportSessionPrice() });
    },
  });
};

/**
 * Get Devices query hook
 * Kullanıcının bağlı cihazlarını getirir
 * 
 * @example
 * const { data, isLoading, error } = useDevices();
 */
export const useDevices = () => {
  return useQuery<Device[], Error>({
    queryKey: settingsKeys.devices(),
    queryFn: getDevices,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};

/**
 * Delete Device mutation hook
 * Bağlı cihazı listeden kaldırır
 * 
 * @example
 * const deleteMutation = useDeleteDevice();
 * deleteMutation.mutate('device-id-123');
 */
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DeleteDeviceResponse, Error, string>({
    mutationFn: deleteDevice,
    onSuccess: () => {
      // Cihaz silindiğinde cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: settingsKeys.devices() });
    },
  });
};

