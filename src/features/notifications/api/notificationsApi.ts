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
        userId?: string;
        type: string;
        title: string;
        message: string;
        avatar?: string | null; // CRITICAL FIX: avatarUrl → avatar (backend format)
        imageUrl?: string | null;
        data?: {
          senderId?: string;
          threadId?: string;
          navigation?: any;
          senderName?: string;
          messagePreview?: string;
          userAvatar?: string;
          userName?: string;
          likerId?: string;
          likerName?: string;
          commenterId?: string;
          commenterName?: string;
          postId?: string;
          commentId?: string;
          eventId?: string;
          eventName?: string;
          amount?: number;
          rewardAmount?: number;
          [key: string]: any;
        };
        metadata?: {
          userId?: string;
          userName?: string;
          userAvatar?: string;
          postId?: string;
          commentId?: string;
          threadId?: string;
          [key: string]: any;
        };
        read?: boolean;
        isRead?: boolean; // Backend'den isRead de gelebilir
        readAt?: string;
        createdAt: string;
        updatedAt?: string;
      }>;
    }>('/notifications', { params });
    
    // Response data kontrolü - Backend formatı: { success: boolean, data: Array<...>, pagination: {...} }
    let notificationsArray: any[] = [];
    let pagination: any = null;
    
    if (response.data) {
      // Backend formatı: { success, data: [...], pagination: {...} }
      if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        notificationsArray = (response.data as any).data;
        pagination = (response.data as any).pagination;
      }
      // Format 2: Backend direkt array döndürüyor (fallback)
      else if (Array.isArray(response.data)) {
        notificationsArray = response.data;
      }
      // Format 3: Response.data zaten array (nested - fallback)
      else if (Array.isArray((response.data as any))) {
        notificationsArray = response.data as any;
      }
    }
    
    if (notificationsArray.length === 0) {
      return {
        success: (response.data as any)?.success ?? false,
        data: [],
      };
    }
    
    // API response'u type'a map et
    const mappedData = notificationsArray.map((item) => {
      // Backend'den gelen `data` objesi (yeni format) veya `metadata` (eski format - backward compatibility)
      const notificationData = item.data || item.metadata;
      
      // read/isRead field'ını normalize et
      const read = item.read ?? item.isRead ?? false;
      
      return {
        id: item.id,
        userId: item.userId,
        type: item.type as any,
        title: item.title || '',
        message: item.message || '',
        avatar: item.avatar || item.avatarUrl || null, // CRITICAL FIX: avatarUrl → avatar (backend format), backward compatibility için avatarUrl de kontrol ediliyor
        imageUrl: item.imageUrl || null,
        read,
        readAt: item.readAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        data: notificationData, // Backend'den gelen data objesini direkt kullan
        metadata: notificationData, // Backward compatibility için metadata'ya da kopyala
        navigation: notificationData?.navigation,
      };
    });
    
    const result: GetNotificationsResponse = {
      success: (response.data as any)?.success ?? true,
      data: mappedData,
      pagination: pagination || undefined,
    };
    
    return result;
  } catch (error: any) {
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
    // Silent fail - error will be thrown
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
    const status = error.response?.status;
    
    // 401 (Unauthorized) hatası - login olmadan token kaydetmeye çalışıyoruz
    // Bu normal bir durum, log gösterme (login ekranında hata göstermemek için)
    if (status === 401) {
      // Sessizce hata fırlat (caller'da handle edilecek)
      throw error;
    }
    
    // Silent fail - error will be thrown
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

