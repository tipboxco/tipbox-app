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
  OptimizedNotificationsResponse,
  NotificationDateGroup,
  ActivityGroup,
  OptimizedNotification,
} from './types';

/**
 * ✅ OPTIMIZE: Optimize format'tan flat array'e çevir (backward compatibility için)
 * Eğer frontend optimize format'ı direkt kullanmak isterse, bu fonksiyon kullanılmayabilir
 */
export const convertOptimizedNotificationsToFlat = (
  dateGroups: NotificationDateGroup[],
  participants: { [userId: string]: { id: string; username?: string; avatar?: string | null; title?: string } }
): Notification[] => {
  const allNotifications: Notification[] = [];
  
  const getUserInfo = (userId?: string) => {
    if (!userId || !participants || !participants[userId]) {
      return null;
    }
    return {
      id: participants[userId].id,
      username: participants[userId].username,
      avatar: participants[userId].avatar,
      title: participants[userId].title,
    };
  };
  
  dateGroups.forEach((dateGroup) => {
    // Activity groups (gruplandırılmış bildirimler)
    dateGroup.activityGroups.forEach((activityGroup) => {
      const primaryUserInfo = getUserInfo(activityGroup.primaryUser.id);
      
      // Gruplandırılmış bildirim oluştur
      const groupedNotification: Notification = {
        id: activityGroup.groupId,
        userId: activityGroup.primaryUser.id,
        type: activityGroup.type,
        username: primaryUserInfo?.username,
        avatar: primaryUserInfo?.avatar || activityGroup.primaryUser.avatar || null,
        read: activityGroup.read,
        createdAt: activityGroup.createdAt,
        isGrouped: true,
        count: activityGroup.count,
        primaryUser: {
          id: activityGroup.primaryUser.id,
          username: activityGroup.primaryUser.username,
          avatar: activityGroup.primaryUser.avatar,
        },
        otherUsers: activityGroup.otherUsers.map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
        })),
        data: {
          postId: activityGroup.targetId,
          // Diğer content bilgileri notifications array'inden alınabilir
        },
      };
      
      allNotifications.push(groupedNotification);
    });
    
    // Ungrouped notifications (gruplandırılmamış bildirimler)
    dateGroup.ungroupedNotifications.forEach((optimizedNotif) => {
      const userInfo = getUserInfo(optimizedNotif.userId);
      
      const notification: Notification = {
        id: optimizedNotif.id,
        userId: optimizedNotif.userId,
        type: optimizedNotif.type,
        username: userInfo?.username,
        avatar: userInfo?.avatar || null,
        read: optimizedNotif.read,
        readAt: optimizedNotif.readAt,
        createdAt: optimizedNotif.createdAt,
        data: optimizedNotif.content,
      };
      
      allNotifications.push(notification);
    });
  });
  
  return allNotifications;
};

/**
 * Get Notifications endpoint function
 * Kullanıcının bildirimlerini getirir
 * 
 * API Response Mapping:
 * Backend'den gelen response'da `data` field'ı var, bunu `metadata`'ya map ediyoruz
 * 
 * ✅ YENİ: Optimize format desteği (backward compatibility için eski format da destekleniyor)
 */
export const getNotifications = async (
  params?: GetNotificationsParams
): Promise<GetNotificationsResponse> => {
  try {
    // CRITICAL FIX: Log'ları kaldırdık - sürekli istek sorununu önlemek için
    // Sadece hata durumunda log basılacak
    const response = await apiService.getClient().get<{
      success?: boolean;
      data?: Array<any>;
      participants?: { [userId: string]: { id: string; username?: string; avatar?: string | null; title?: string } };
      dateGroups?: NotificationDateGroup[];
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
        nextCursor?: string;
        totalCount?: number;
      };
    }>('/notifications', { params });
    
    // ✅ YENİ: Optimize format kontrolü (dateGroups varsa optimize format kullan)
    if (response.data?.dateGroups && response.data.dateGroups.length > 0) {
      console.log('[getNotifications] ✅ Optimize format kullanılıyor (dateGroups)');
      
      // Participants bilgisini al (yeni format)
      const participants = response.data.participants;
      
      if (!participants) {
        console.warn('[getNotifications] ⚠️ Participants bilgisi yok, optimize format kullanılamıyor');
        // Fallback to old format
      } else {
        // Optimize format'tan flat array'e çevir
        const allNotifications = convertOptimizedNotificationsToFlat(
          response.data.dateGroups,
          participants
        );
        
        console.log('[getNotifications] ✅ Optimize format\'tan normalize edildi:', allNotifications.length, 'bildirim');
        
        return {
          success: response.data.success ?? true,
          data: allNotifications,
          pagination: response.data.pagination,
          participants: participants,
          dateGroups: response.data.dateGroups, // Optimize format'ı da döndür (ileride direkt kullanılabilir)
        };
      }
    }
    
    // ✅ Eski format (backward compatibility)
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
        pagination: pagination,
      };
    }
    
    // API response'u type'a map et
    // Dokümana göre: message field'ı yok, tüm bilgiler data objesi içinde
    const mappedData = notificationsArray.map((item) => {
      // Backend'den gelen `data` objesi (yeni format) veya `metadata` (eski format - backward compatibility)
      const notificationData = item.data || item.metadata || {};
      
      // CRITICAL FIX: Root seviyedeki postId ve imageUrl'i data'ya taşı (eğer data'da yoksa)
      // Backend'den root seviyede gelmişse data'ya kopyala, sonra root seviyeden kaldır
      if (item.postId && !notificationData.postId) {
        notificationData.postId = item.postId;
      }
      if (item.imageUrl && !notificationData.imageUrl) {
        notificationData.imageUrl = item.imageUrl;
      }
      
      // read/isRead field'ını normalize et
      const read = item.read ?? item.isRead ?? false;
      
      // CRITICAL FIX: primaryUser veya otherUsers varsa otomatik olarak isGrouped: true yap
      // Backend'den isGrouped field'ı gelmeyebilir ama primaryUser/otherUsers varsa gruplandırılmış bildirimdir
      const hasPrimaryUser = item.primaryUser && item.primaryUser.id;
      const hasOtherUsers = Array.isArray(item.otherUsers) && item.otherUsers.length > 0;
      const isGrouped = item.isGrouped === true || hasPrimaryUser || hasOtherUsers;
      
      // Count hesapla: backend'den geliyorsa kullan, yoksa primaryUser + otherUsers sayısından hesapla
      let count = item.count || 0;
      if (isGrouped && !item.count && hasPrimaryUser) {
        count = (item.otherUsers?.length || 0) + 1; // primaryUser + otherUsers
      }
      
      return {
        id: item.id,
        userId: item.userId,
        type: item.type as any,
        username: item.username || undefined, // Backend'den gelen username alanı
        title: item.title || '', // Dokümana göre: title field'ı yok, boş bırak (backward compatibility)
        message: '', // Dokümana göre: message field'ı yok, frontend'de type ve data'ya göre oluşturulacak (backward compatibility)
        avatar: item.avatar || item.avatarUrl || null, // Dokümana göre: avatar root seviyede
        // CRITICAL FIX: imageUrl root seviyede kaldırıldı, sadece data içinde olacak
        // imageUrl property'si kaldırıldı - sadece data.imageUrl kullanılacak
        read,
        readAt: item.readAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        data: notificationData, // Backend'den gelen data objesini direkt kullan (postId, imageUrl, description, vb. içerir)
        metadata: notificationData, // Backward compatibility için metadata'ya da kopyala
        navigation: notificationData?.navigation,
        // CRITICAL FIX: primaryUser veya otherUsers varsa otomatik olarak isGrouped: true
        isGrouped: isGrouped,
        count: count,
        primaryUser: item.primaryUser || undefined, // Backend'den geliyorsa kullan
        otherUsers: Array.isArray(item.otherUsers) ? item.otherUsers : [], // Backend'den geliyorsa kullan
      };
    });
    
    const result: GetNotificationsResponse = {
      success: (response.data as any)?.success ?? true,
      data: mappedData,
      pagination: pagination || undefined,
    };
    
    // CRITICAL FIX: Log'ları kaldırdık - sürekli istek sorununu önlemek için
    
    return result;
  } catch (error: any) {
    // CRITICAL FIX: Hata durumunu logla
    console.error('[getNotifications] ❌ Backend isteği başarısız:', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      params: {
        limit: params?.limit || 20,
        offset: params?.offset || 0,
        unreadOnly: params?.unreadOnly,
        type: params?.type,
        search: params?.search,
      },
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

