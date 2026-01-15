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
    
    // DEBUG: API response formatını logla
    console.log('[getNotifications] 📦 Raw API Response:', {
      hasResponse: !!response,
      hasData: !!response?.data,
      responseDataType: typeof response?.data,
      isResponseDataArray: Array.isArray(response?.data),
      hasResponseDataData: !!(response?.data as any)?.data,
      isResponseDataDataArray: Array.isArray((response?.data as any)?.data),
      responseDataKeys: response?.data ? Object.keys(response.data) : [],
      params,
    });
    
    // Response data kontrolü - Backend farklı formatlar döndürebilir
    // Format 1: { success: boolean, data: Array<...> }
    // Format 2: Backend direkt array döndürebilir
    let notificationsArray: any[] = [];
    
    if (response.data) {
      // Format 1: { success, data: [...] }
      if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        notificationsArray = (response.data as any).data;
      }
      // Format 2: Backend direkt array döndürüyor
      else if (Array.isArray(response.data)) {
        console.warn('[getNotifications] ⚠️ Backend returned array directly, using it');
        notificationsArray = response.data;
      }
      // Format 3: Response.data zaten array (nested)
      else if (Array.isArray((response.data as any))) {
        notificationsArray = response.data as any;
      }
    }
    
    if (notificationsArray.length === 0) {
      console.warn('[getNotifications] ⚠️ No notifications found in response:', {
        responseData: response.data,
        params,
      });
      return {
        success: (response.data as any)?.success ?? false,
        data: [],
      };
    }
    
    // API response'u type'a map et
    const mappedData = notificationsArray.map((item) => {
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
    
    const result = {
      success: (response.data as any)?.success ?? true,
      data: mappedData,
    };
    
    // DEBUG: Mapped data'yı logla
    console.log('[getNotifications] ✅ Mapped result:', {
      success: result.success,
      dataLength: result.data.length,
      firstItem: result.data[0] ? {
        id: result.data[0].id,
        type: result.data[0].type,
        message: result.data[0].message,
        read: result.data[0].read,
      } : null,
    });
    
    return result;
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

