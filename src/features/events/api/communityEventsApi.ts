import { apiService } from '../../../services/ApiService';
import type { EventApiItem, EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse, LimitedEventApiResponse, AchievementsApiResponse } from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

/**
 * Get Active Events endpoint function
 * Aktif eventlerin listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns EventsApiResponse - Events items ve pagination bilgisi
 */
export const getActiveEvents = async (
  cursor?: string,
  limit: number = 20
): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<EventsApiResponse>(
      `/events/active?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Active Events API Error:', {
      url: `/events/active?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Upcoming Events endpoint function
 * Yaklaşan eventlerin listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns UpcomingEventsApiResponse - Events items ve pagination bilgisi (interaction ve participants yok)
 */
export const getUpcomingEvents = async (
  cursor?: string,
  limit: number = 20
): Promise<UpcomingEventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<UpcomingEventsApiResponse>(
      `/events/upcoming?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Upcoming Events API Error:', {
      url: `/events/upcoming?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Event Detail endpoint function
 * Belirli bir event'in detaylı bilgilerini getirir (banner, rewards, isJoined, vb.)
 *
 * @param eventId - Event ID
 * @returns EventDetailApiResponse - Event detay bilgileri
 */
export const getEventDetail = async (
  eventId: string
): Promise<EventDetailApiResponse> => {
  try {
    const response = await apiService.getClient().get<EventDetailApiResponse>(
      `/events/${eventId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Event Detail API Error:', {
      url: `/events/${eventId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Limited Event endpoint function
 * /events/limited endpoint'inden limited event bilgilerini getirir
 *
 * @returns LimitedEventApiResponse - Limited event bilgileri (leaderboard, userScore, vb.)
 */
export const getLimitedEvent = async (): Promise<LimitedEventApiResponse> => {
  try {
    const response = await apiService.getClient().get<LimitedEventApiResponse>(
      '/events/limited'
    );
    return response.data;
  } catch (error: any) {
    console.error('Limited Event API Error:', {
      url: '/events/limited',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Achievements endpoint function
 * /events/achievements endpoint'inden achievement listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns AchievementsApiResponse - Achievement items ve pagination bilgisi
 */
export const getAchievements = async (
  cursor?: string,
  limit: number = 20
): Promise<AchievementsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<AchievementsApiResponse>(
      `/events/achievements?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Achievements API Error:', {
      url: `/events/achievements?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Create Event Post endpoint function
 * Belirli bir event için post oluşturur
 *
 * @param eventId - Event ID
 * @param data - Post creation data
 * @returns CreateEventPostResponse - Created post response
 */
export interface CreateEventPostRequest {
  description: string;
  productId?: string; // Opsiyonel: Eğer product seçildiyse
  images?: string[]; // Array of image URIs
}

export interface CreateEventPostResponse {
  id: string;
  message: string;
}

export const createEventPost = async (
  eventId: string,
  data: CreateEventPostRequest
): Promise<CreateEventPostResponse> => {
  const client = apiService.getClient();
  
  // FormData oluştur (multipart/form-data için)
  const formData = new FormData();
  formData.append('description', data.description);
  
  // Product ID varsa ekle
  if (data.productId) {
    formData.append('productId', data.productId);
  }
  
  // Images varsa ekle
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      // React Native'de FormData için image object formatı
      // iOS'ta URI'ler ph:// veya assets-library:// ile başlayabilir ve uzantı içermeyebilir
      // Bu durumda varsayılan olarak JPEG kullan
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
      // URI'den dosya uzantısını çıkar (eğer varsa)
      const uriLower = imageUri.toLowerCase();
      if (uriLower.includes('.')) {
        const ext = imageUri.split('.').pop()?.toLowerCase();
        if (ext === 'png') {
          fileExtension = 'png';
          mimeType = 'image/png';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          fileExtension = 'jpg';
          mimeType = 'image/jpeg';
        }
      }
      // iOS'ta ph:// veya assets-library:// URI'leri için varsayılan JPEG kullan
      // Expo Image Picker zaten görsel formatlarını destekliyor
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  try {
    const response = await client.post<CreateEventPostResponse>(
      `/events/${eventId}/posts`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Create Event Post API Error:', {
      url: `/events/${eventId}/posts`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Event Posts endpoint function
 * Event'e ait post'ları getirir (pagination ile)
 *
 * @param eventId - Event ID
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Event posts ve pagination bilgisi
 */
export const getEventPosts = async (
  eventId: string,
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', Math.min(limit, 50).toString());

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/events/${eventId}/posts?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventPosts] API Error:', {
      url: `/events/${eventId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Event Badge Response
 */
export interface EventBadge {
  id: string;
  title: string;
  image: string;
  description: string;
}

export interface EventBadgesResponse {
  items: EventBadge[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Get Event Badges endpoint function
 * Event'e ait badge'leri getirir (pagination ile)
 *
 * @param eventId - Event ID
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns EventBadgesResponse - Event badges ve pagination bilgisi
 */
export const getEventBadges = async (
  eventId: string,
  cursor?: string,
  limit: number = 20
): Promise<EventBadgesResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', Math.min(limit, 50).toString());

  try {
    const response = await apiService.getClient().get<EventBadgesResponse>(
      `/events/${eventId}/badges?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventBadges] API Error:', {
      url: `/events/${eventId}/badges?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Event Requirements Response - /events/{eventId}/requirements endpoint'inden dönen response
 */
export interface EventRequirementsResponse {
  eventId: string;
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    type: 'survey' | 'post' | 'share' | 'other';
    completed: boolean;
    progress?: {
      current: number;
      total: number;
    };
  }>;
  overallProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

/**
 * Join Event endpoint function
 * /events/{eventId}/join endpoint'ine POST request göndererek etkinliğe katılır
 *
 * @param eventId - Event ID'si
 * @returns EventDetailApiResponse - Güncellenmiş event detay bilgileri
 */
export const joinEvent = async (
  eventId: string
): Promise<EventDetailApiResponse> => {
  try {
    const response = await apiService.getClient().post<EventDetailApiResponse>(
      `/events/${eventId}/join`
    );
    return response.data;
  } catch (error: any) {
    console.error('[joinEvent] API Error:', {
      url: `/events/${eventId}/join`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Leave Event endpoint function
 * /events/{eventId}/leave endpoint'ine POST request göndererek etkinlikten ayrılır
 *
 * @param eventId - Event ID'si
 * @returns EventDetailApiResponse - Güncellenmiş event detay bilgileri
 */
export const leaveEvent = async (
  eventId: string
): Promise<EventDetailApiResponse> => {
  try {
    const response = await apiService.getClient().post<EventDetailApiResponse>(
      `/events/${eventId}/leave`
    );
    return response.data;
  } catch (error: any) {
    console.error('[leaveEvent] API Error:', {
      url: `/events/${eventId}/leave`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Event Requirements endpoint function
 * /events/{eventId}/requirements endpoint'inden etkinlik gereksinimleri ve ilerleme bilgilerini getirir
 *
 * @param eventId - Event ID'si
 * @returns EventRequirementsResponse - Etkinlik gereksinimleri ve ilerleme bilgisi
 */
export const getEventRequirements = async (
  eventId: string
): Promise<EventRequirementsResponse> => {
  try {
    const response = await apiService.getClient().get<EventRequirementsResponse>(
      `/events/${eventId}/requirements`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventRequirements] API Error:', {
      url: `/events/${eventId}/requirements`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

