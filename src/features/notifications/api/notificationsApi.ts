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
        data?: {
          senderId?: string;
          threadId?: string;
          navigation?: any;
          senderName?: string;
          messagePreview?: string;
          userAvatar?: string;
          userName?: string;
          postId?: string;
          commentId?: string;
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
    
    console.log('[getNotifications] 📥 Raw API response:', {
      success: response.data.success,
      dataLength: response.data.data?.length || 0,
      firstItem: response.data.data?.[0] ? JSON.stringify(response.data.data[0], null, 2) : 'no items',
    });
    
    // Response data kontrolü
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      console.warn('[getNotifications] ⚠️ Invalid response format:', response.data);
      return {
        success: response.data?.success ?? false,
        data: [],
      };
    }
    
    // API response'u type'a map et
    const mappedData = response.data.data.map((item) => {
      // Backend'den gelen `data` veya `metadata` field'ını `metadata`'ya map et
      const rawMetadata = item.metadata || item.data;
      const metadata = rawMetadata ? {
        userId: rawMetadata.senderId || rawMetadata.userId,
        userName: rawMetadata.senderName || rawMetadata.userName,
        userAvatar: rawMetadata.userAvatar,
        threadId: rawMetadata.threadId,
        postId: rawMetadata.postId,
        commentId: rawMetadata.commentId,
        eventId: rawMetadata.eventId,
        eventName: rawMetadata.eventName,
        rewardAmount: rawMetadata.rewardAmount,
        ...rawMetadata,
      } : undefined;
      
      // read/isRead field'ını normalize et
      const read = item.read ?? item.isRead ?? false;
      
      return {
        id: item.id,
        type: item.type as any,
        title: item.title || '',
        message: item.message || '',
        read,
        readAt: item.readAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        metadata,
        navigation: item.data?.navigation || item.metadata?.navigation,
      };
    });
    
    console.log('[getNotifications] ✅ Mapped data:', {
      count: mappedData.length,
      firstMapped: mappedData[0] ? JSON.stringify(mappedData[0], null, 2) : 'no items',
    });
    
    return {
      success: response.data.success,
      data: mappedData,
    };
  } catch (error: any) {
    console.error('[getNotifications] ❌ API Error:', {
      url: '/notifications',
      params,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
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
    // 500 hatası için daha az detaylı log (backend hatası, log spam'ı azalt)
    const status = error.response?.status;
    if (status >= 500) {
      // Server error için sadece kısa log
      console.error('[getUnreadCount] API Error (500):', {
        status,
        message: error.response?.data?.message || error.message,
      });
    } else {
      // Client error için detaylı log
      console.error('[getUnreadCount] API Error:', {
        url: '/notifications/unread-count',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
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
    // 500 hatası için daha az detaylı log (backend hatası, log spam'ı azalt)
    const status = error.response?.status;
    if (status >= 500) {
      // Server error için sadece kısa log
      console.error('[registerPushToken] API Error (500):', {
        status,
        message: error.response?.data?.message || error.message,
      });
    } else {
      // Client error için detaylı log
      console.error('[registerPushToken] API Error:', {
        url: '/notifications/push-token',
        method: 'POST',
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestData: data,
        responseData: error.response?.data,
        message: error.message,
      });
    }
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

