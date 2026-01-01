import { apiService } from '../../../services/ApiService';
import type {
  Notification,
  GetNotificationsParams,
  GetNotificationsResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  GetNotificationSettingsResponse,
  UpdateNotificationSettingsResponse,
  RegisterPushTokenRequest,
  RegisterPushTokenResponse,
  DeletePushTokenResponse,
} from './types';

/**
 * Get Notifications endpoint function
 * Kullanıcının bildirimlerini getirir
 * 
 * API Response Mapping:
 * Backend'den gelen response'da `data` field'ı var, bunu `metadata`'ya map ediyoruz
 */
export const getNotifications = async (
  params?: GetNotificationsParams
): Promise<GetNotificationsResponse> => {
  try {
    const response = await apiService.getClient().get<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: {
          senderId?: string;
          threadId?: string;
          navigation?: any;
          senderName?: string;
          messagePreview?: string;
          userAvatar?: string;
          userName?: string;
          [key: string]: any;
        };
        read: boolean;
        readAt?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/notifications', { params });
    
    // API response'u type'a map et
    const mappedData = response.data.data.map((item) => {
      // Backend'den gelen `data` field'ını `metadata`'ya map et
      const metadata = item.data ? {
        userId: item.data.senderId,
        userName: item.data.senderName || item.data.userName,
        userAvatar: item.data.userAvatar,
        threadId: item.data.threadId,
        ...item.data,
      } : undefined;
      
      return {
        id: item.id,
        type: item.type as any,
        title: item.title,
        message: item.message,
        read: item.read,
        readAt: item.readAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        metadata,
        // Backend'den artık navigation objesi gelmiyor, mobil taraf kendi navigation'ını yönetiyor
        // navigation: item.data?.navigation, // Kaldırıldı
      };
    });
    
    return {
      success: response.data.success,
      data: mappedData,
    };
  } catch (error: any) {
    console.error('[getNotifications] API Error:', {
      url: '/notifications',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Unread Count endpoint function
 * Okunmamış bildirim sayısını getirir
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    const response = await apiService.getClient().get<UnreadCountResponse>(
      '/notifications/unread-count'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getUnreadCount] API Error:', {
      url: '/notifications/unread-count',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Mark Notification as Read endpoint function
 * Bildirimi okundu olarak işaretler
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<MarkAsReadResponse> => {
  try {
    const response = await apiService.getClient().put<MarkAsReadResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error: any) {
    console.error('[markNotificationAsRead] API Error:', {
      url: `/notifications/${notificationId}/read`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Mark All Notifications as Read endpoint function
 * Tüm bildirimleri okundu olarak işaretler
 */
export const markAllNotificationsAsRead = async (): Promise<MarkAllAsReadResponse> => {
  try {
    const response = await apiService.getClient().put<MarkAllAsReadResponse>(
      '/notifications/mark-all-read'
    );
    return response.data;
  } catch (error: any) {
    console.error('[markAllNotificationsAsRead] API Error:', {
      url: '/notifications/mark-all-read',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete Notification endpoint function
 * Bildirimi siler
 */
export const deleteNotification = async (
  notificationId: string
): Promise<DeleteNotificationResponse> => {
  try {
    const response = await apiService.getClient().delete<DeleteNotificationResponse>(
      `/notifications/${notificationId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[deleteNotification] API Error:', {
      url: `/notifications/${notificationId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Notification Settings endpoint function
 * Kullanıcının bildirim ayarlarını getirir
 */
export const getNotificationSettings = async (): Promise<GetNotificationSettingsResponse> => {
  try {
    const response = await apiService.getClient().get<GetNotificationSettingsResponse>(
      '/notifications/settings'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getNotificationSettings] API Error:', {
      url: '/notifications/settings',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update Notification Settings endpoint function
 * Kullanıcının bildirim ayarlarını günceller
 */
export const updateNotificationSettings = async (
  data: UpdateNotificationSettingsRequest
): Promise<UpdateNotificationSettingsResponse> => {
  try {
    const response = await apiService.getClient().put<UpdateNotificationSettingsResponse>(
      '/notifications/settings',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[updateNotificationSettings] API Error:', {
      url: '/notifications/settings',
      method: 'PUT',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Register Push Token endpoint function
 * Expo push token'ı backend'e kaydeder
 */
export const registerPushToken = async (
  data: RegisterPushTokenRequest
): Promise<RegisterPushTokenResponse> => {
  try {
    const response = await apiService.getClient().post<RegisterPushTokenResponse>(
      '/notifications/push-token',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[registerPushToken] API Error:', {
      url: '/notifications/push-token',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete Push Token endpoint function
 * Expo push token'ı backend'den siler
 */
export const deletePushToken = async (): Promise<DeletePushTokenResponse> => {
  try {
    const response = await apiService.getClient().delete<DeletePushTokenResponse>(
      '/notifications/push-token'
    );
    return response.data;
  } catch (error: any) {
    console.error('[deletePushToken] API Error:', {
      url: '/notifications/push-token',
      method: 'DELETE',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

