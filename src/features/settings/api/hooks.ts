import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword } from './changePasswordApi';
import { getNotificationSettings, updateNotificationSettings } from './notificationsApi';
import { getPrivacySettings, updatePrivacySettings } from './privacyApi';
import { getSupportSessionPrice, updateSupportSessionPrice } from './supportSessionPriceApi';
import { getDevices, deleteDevice } from './devicesApi';
import {
  getPaymentDashboard,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getInvoices,
  type AddPaymentMethodRequest,
  type GetInvoicesParams,
  type UpdatePaymentMethodRequest,
} from './paymentApi';
import { getSubscriptionPlans } from './subscriptionApi';
import { useAppStore } from '../../../store/appStore';
import type { ChangePasswordRequest, ChangePasswordResponse } from '../types';
import type {
  NotificationSetting,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
} from '../types';
import type {
  PrivacySetting,
  UpdatePrivacySettingsRequest,
  UpdatePrivacySettingsResponse,
} from '../types';
import type {
  SupportSessionPriceResponse,
  UpdateSupportSessionPriceRequest,
  UpdateSupportSessionPriceResponse,
} from '../types';
import type { Device, DeleteDeviceResponse } from '../types';
import type { SubscriptionPlan } from './paymentApi';

/**
 * Query Keys - Settings feature için cache key pattern'leri
 */
export const settingsKeys = {
  all: ['settings'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  privacy: () => [...settingsKeys.all, 'privacy'] as const,
  supportSessionPrice: () => [...settingsKeys.all, 'supportSessionPrice'] as const,
  devices: () => [...settingsKeys.all, 'devices'] as const,
  paymentDashboard: () => [...settingsKeys.all, 'paymentDashboard'] as const,
  invoices: (params?: GetInvoicesParams) =>
    [...settingsKeys.all, 'invoices', params ?? {}] as const,
  subscriptionPlans: () => [...settingsKeys.all, 'subscriptionPlans'] as const,
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
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 saniye - settings nadiren değişir
    gcTime: 5 * 60 * 1000, // 5 dakika cache'de tut
    refetchOnMount: false, // Sadece stale ise refetch et
    refetchOnWindowFocus: false, // Window focus'ta refetch etme
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
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 saniye - settings nadiren değişir
    gcTime: 5 * 60 * 1000, // 5 dakika cache'de tut
    refetchOnMount: false, // Sadece stale ise refetch et
    refetchOnWindowFocus: false, // Window focus'ta refetch etme
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

/**
 * Get Payment Dashboard query hook
 * Ödeme özeti: kayıtlı kartlar, aktif abonelik, son faturalar (tek istek)
 *
 * @example
 * const { data, isLoading, error } = usePaymentDashboard();
 */
export const usePaymentDashboard = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: settingsKeys.paymentDashboard(),
    queryFn: getPaymentDashboard,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    retry: 1,
  });
};

/**
 * Get Invoices query hook
 * Fatura geçmişi (sayfalı)
 *
 * @example
 * const { data } = useInvoices({ sort_by: 'date_desc', limit: 20, offset: 0 });
 */
export const useInvoices = (params: GetInvoicesParams = {}) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: settingsKeys.invoices(params),
    queryFn: () => getInvoices(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Add Payment Method mutation hook
 * Yeni kart ekleme (payment_token sağlayıcıdan alınır)
 */
export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddPaymentMethodRequest) => addPaymentMethod(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.paymentDashboard() });
    },
  });
};

/**
 * Update Payment Method mutation hook
 * Kart ismini güncelleme
 */
export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePaymentMethodRequest }) =>
      updatePaymentMethod(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.paymentDashboard() });
    },
  });
};

/**
 * Delete Payment Method mutation hook
 * Kart silme (aktif abonelikte kullanılıyorsa 409 döner)
 */
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.paymentDashboard() });
    },
  });
};

/**
 * Get Subscription Plans query hook
 * Abonelik planları kataloğu (fiyat sayfası / plan seçimi)
 *
 * @example
 * const { data, isLoading, error } = useSubscriptionPlans();
 */
export const useSubscriptionPlans = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: settingsKeys.subscriptionPlans(),
    queryFn: getSubscriptionPlans,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    retry: 1,
  });
};

