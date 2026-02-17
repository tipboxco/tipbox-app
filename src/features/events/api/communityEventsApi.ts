import { apiService } from '../../../services/ApiService';
import type { EventApiItem, EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse, LimitedEventApiResponse, AchievementsApiResponse, EventBadgesApiResponse, EventBadgeDetailResponse } from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import type { CollectionDetailResponse } from '../types/collection.types';

/** Community events filter - FilterBottomSheet ile uyumlu */
export type CommunityEventsFilter = {
  mainCategory?: string;
  subCategory?: string;
  productGroup?: string;
};

/**
 * Get Active Events endpoint function
 * Aktif eventlerin listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param search - Event başlığı veya açıklamasında arama (opsiyonel)
 * @param filters - Kategori filtreleri (mainCategory, subCategory, productGroup) - backend destekliyorsa uygulanır
 * @returns EventsApiResponse - Events items ve pagination bilgisi
 */
export const getActiveEvents = async (
  cursor?: string,
  limit: number = 20,
  search?: string,
  filters?: CommunityEventsFilter
): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }
  if (filters?.mainCategory && filters.mainCategory !== 'all') {
    params.append('mainCategory', filters.mainCategory);
  }
  if (filters?.subCategory && filters.subCategory !== 'all') {
    params.append('subCategory', filters.subCategory);
  }
  if (filters?.productGroup && filters.productGroup !== 'all') {
    params.append('productGroup', filters.productGroup);
  }

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
 * @param search - Event başlığı veya açıklamasında arama (opsiyonel)
 * @param filters - Kategori filtreleri - backend destekliyorsa uygulanır
 * @returns UpcomingEventsApiResponse - Events items ve pagination bilgisi (interaction ve participants yok)
 */
export const getUpcomingEvents = async (
  cursor?: string,
  limit: number = 20,
  search?: string,
  filters?: CommunityEventsFilter
): Promise<UpcomingEventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }
  if (filters?.mainCategory && filters.mainCategory !== 'all') {
    params.append('mainCategory', filters.mainCategory);
  }
  if (filters?.subCategory && filters.subCategory !== 'all') {
    params.append('subCategory', filters.subCategory);
  }
  if (filters?.productGroup && filters.productGroup !== 'all') {
    params.append('productGroup', filters.productGroup);
  }

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
 * Get Collection Detail endpoint function
 * Belirli bir collection'ın detayını ve badge listesini getirir
 *
 * @param collectionId - Collection ID
 * @returns CollectionDetailResponse - Collection detay + badges
 */
export const getCollectionDetail = async (
  collectionId: string
): Promise<CollectionDetailResponse> => {
  try {
    const response = await apiService.getClient().get<CollectionDetailResponse>(
      `/events/collections/${collectionId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Collection Detail API Error:', {
      url: `/events/collections/${collectionId}`,
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
 * @param search - Achievement başlığı veya açıklamasında arama (opsiyonel)
 * @returns AchievementsApiResponse - Achievement items ve pagination bilgisi
 */
export const getAchievements = async (
  cursor?: string,
  limit: number = 20,
  search?: string
): Promise<AchievementsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }

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
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
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
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  
  userProgress: {
    current: number;
    target: number;
    isCompleted: boolean;
    completedAt?: string;
    progressPercentage: number;
  };
  
  eventId: string;
  createdAt: string;
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


/**
 * Create EventPost endpoint function (YENİ - EVENT_GUIDE.MD Section 3.1)
 * /events/{eventId}/posts endpoint'ine POST request göndererek event post oluşturur
 * NOT: Artık /posts/free yerine /events/{eventId}/posts kullanılıyor!
 *
 * @param eventId - Event ID
 * @param data - { title, body, productId? }
 * @returns CreateEventPostResponse
 */
export interface CreateEventPostRequestNew {
  title: string; // Max 200 char - ZORUNLU
  body: string; // Max 2000 char - ZORUNLU (content olarak da kullanılabilir)
  productId?: string; // Opsiyonel
}

/**
 * Event içerisinde free post oluşturmak için yeni request interface
 * POST /events/{eventId}/posts endpoint'i için
 */
export interface CreateEventFreePostRequest {
  productId: string; // ZORUNLU - Product ID
  title: string; // ZORUNLU - Post başlığı
  content: string; // ZORUNLU - Post içeriği
  isOwned?: boolean; // Opsiyonel - Ürün sahibi mi?
  iTried?: boolean; // Opsiyonel - Denendi mi?
}

export interface CreateEventPostResponseNew {
  id: string;
  eventId: string;
  title: string;
  body: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  product: {
    id: string;
    name: string;
    brand: string;
    image: string | null;
  } | null;
}

export const createEventPostNew = async (
  eventId: string,
  data: CreateEventPostRequestNew
): Promise<CreateEventPostResponseNew> => {
  // Validate eventId before making API call
  if (!eventId || eventId.trim() === '') {
    const error = new Error('Event ID is required');
    console.error('[createEventPostNew] Validation Error:', {
      eventId: eventId || 'undefined',
      error: error.message,
    });
    throw error;
  }
  
  try {
    const response = await apiService.getClient().post<CreateEventPostResponseNew>(
      `/events/${eventId}/posts`,
      {
        title: data.title,
        body: data.body,
        productId: data.productId,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('[createEventPostNew] API Error:', {
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
 * Event içerisinde free post oluşturma endpoint fonksiyonu
 * POST /events/{eventId}/posts endpoint'ine istek gönderir
 * 
 * @param eventId - Event ID (URL'de)
 * @param data - CreateEventFreePostRequest - Post oluşturma verisi
 * @returns CreateEventPostResponseNew - Oluşturulan post response'u
 * 
 * Payload yapısı:
 * {
 *   productId: string,      // ZORUNLU
 *   title: string,           // ZORUNLU
 *   content: string,         // ZORUNLU
 *   isOwned?: boolean,        // Opsiyonel
 *   iTried?: boolean          // Opsiyonel
 * }
 */
export const createEventFreePost = async (
  eventId: string,
  data: CreateEventFreePostRequest
): Promise<CreateEventPostResponseNew> => {
  // Validate eventId before making API call
  if (!eventId || eventId.trim() === '') {
    const error = new Error('Event ID is required');
    console.error('[createEventFreePost] Validation Error:', {
      eventId: eventId || 'undefined',
      error: error.message,
    });
    throw error;
  }

  // Validate required fields
  if (!data.productId || data.productId.trim() === '') {
    const error = new Error('Product ID is required');
    console.error('[createEventFreePost] Validation Error:', {
      productId: data.productId || 'undefined',
      error: error.message,
    });
    throw error;
  }

  if (!data.title || data.title.trim() === '') {
    const error = new Error('Title is required');
    console.error('[createEventFreePost] Validation Error:', {
      title: data.title || 'undefined',
      error: error.message,
    });
    throw error;
  }

  if (!data.content || data.content.trim() === '') {
    const error = new Error('Content is required');
    console.error('[createEventFreePost] Validation Error:', {
      content: data.content || 'undefined',
      error: error.message,
    });
    throw error;
  }
  
  try {
    // Payload yapısı: 6 parametre (eventId URL'de, diğerleri body'de)
    const payload: {
      productId: string;
      title: string;
      content: string;
      isOwned?: boolean;
      iTried?: boolean;
    } = {
      productId: data.productId,
      title: data.title,
      content: data.content,
    };

    // Opsiyonel parametreleri ekle (sadece tanımlıysa)
    if (data.isOwned !== undefined) {
      payload.isOwned = data.isOwned;
    }

    if (data.iTried !== undefined) {
      payload.iTried = data.iTried;
    }

    const response = await apiService.getClient().post<CreateEventPostResponseNew>(
      `/events/${eventId}/posts`,
      payload
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[createEventFreePost] API Error:', {
      url: `/events/${eventId}/posts`,
      payload: {
        productId: data.productId,
        title: data.title,
        content: data.content,
        isOwned: data.isOwned,
        iTried: data.iTried,
      },
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get EventPost Detail endpoint function (YENİ - EVENT_GUIDE.MD Section 4.2)
 * /events/{eventId}/posts/{postId} endpoint'inden event post detayını getirir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @returns EventPost objesi + event bilgisi
 */
export interface EventPostDetail extends CreateEventPostResponseNew {
  event: {
    id: string;
    title: string;
  };
}

export const getEventPostDetail = async (
  eventId: string,
  postId: string
): Promise<EventPostDetail> => {
  try {
    const response = await apiService.getClient().get<EventPostDetail>(
      `/events/${eventId}/posts/${postId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventPostDetail] API Error:', {
      url: `/events/${eventId}/posts/${postId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete EventPost endpoint function (YENİ - EVENT_GUIDE.MD Section 4.3)
 * /events/{eventId}/posts/{postId} endpoint'ine DELETE request göndererek post siler
 * NOT: Sadece post sahibi silebilir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @returns void (204 No Content)
 */
export const deleteEventPost = async (
  eventId: string,
  postId: string
): Promise<void> => {
  try {
    await apiService.getClient().delete(`/events/${eventId}/posts/${postId}`);
  } catch (error: any) {
    console.error('[deleteEventPost] API Error:', {
      url: `/events/${eventId}/posts/${postId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Toggle EventPost Like endpoint function (YENİ - EVENT_GUIDE.MD Section 4.4)
 * /events/{eventId}/posts/{postId}/like endpoint'ine POST request göndererek like toggle yapar
 * NOT: Beğenilmişse kaldırır, beğenilmemişse ekler
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @returns { liked: boolean }
 */
export interface ToggleLikeResponse {
  liked: boolean;
}

export const toggleEventPostLike = async (
  eventId: string,
  postId: string
): Promise<ToggleLikeResponse> => {
  try {
    const response = await apiService.getClient().post<ToggleLikeResponse>(
      `/events/${eventId}/posts/${postId}/like`
    );
    return response.data;
  } catch (error: any) {
    console.error('[toggleEventPostLike] API Error:', {
      url: `/events/${eventId}/posts/${postId}/like`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Add EventPost Comment endpoint function (YENİ - EVENT_GUIDE.MD Section 4.5)
 * /events/{eventId}/posts/{postId}/comments endpoint'ine POST request göndererek yorum ekler
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @param comment - Yorum metni (max 500 char)
 * @returns Comment objesi
 */
export interface AddCommentRequest {
  comment: string; // Max 500 char
}

export interface CommentResponse {
  id: string;
  postId: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export const addEventPostComment = async (
  eventId: string,
  postId: string,
  comment: string
): Promise<CommentResponse> => {
  try {
    const response = await apiService.getClient().post<CommentResponse>(
      `/events/${eventId}/posts/${postId}/comments`,
      { comment }
    );
    return response.data;
  } catch (error: any) {
    console.error('[addEventPostComment] API Error:', {
      url: `/events/${eventId}/posts/${postId}/comments`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get EventPost Comments endpoint function (YENİ - EVENT_GUIDE.MD Section 4.6)
 * /events/{eventId}/posts/{postId}/comments endpoint'inden yorumları getirir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns Comments ve pagination bilgisi
 */
export interface CommentsResponse {
  items: CommentResponse[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export const getEventPostComments = async (
  eventId: string,
  postId: string,
  cursor?: string,
  limit: number = 20
): Promise<CommentsResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', Math.min(limit, 50).toString());

  try {
    const response = await apiService.getClient().get<CommentsResponse>(
      `/events/${eventId}/posts/${postId}/comments?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventPostComments] API Error:', {
      url: `/events/${eventId}/posts/${postId}/comments?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Delete EventPost Comment endpoint function (YENİ - EVENT_GUIDE.MD Section 4.7)
 * /events/{eventId}/posts/{postId}/comments/{commentId} endpoint'ine DELETE request göndererek yorum siler
 * NOT: Sadece yorum sahibi silebilir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @param commentId - Comment ID
 * @returns void (204 No Content)
 */
export const deleteEventPostComment = async (
  eventId: string,
  postId: string,
  commentId: string
): Promise<void> => {
  try {
    await apiService.getClient().delete(
      `/events/${eventId}/posts/${postId}/comments/${commentId}`
    );
  } catch (error: any) {
    console.error('[deleteEventPostComment] API Error:', {
      url: `/events/${eventId}/posts/${postId}/comments/${commentId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Event Badges endpoint function
 * Bir event'a ait badge'lerin listesini getirir (pagination ile)
 *
 * @param eventId - Event ID
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns EventBadgesApiResponse - Badge items ve pagination bilgisi
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
  params.append('limit', limit.toString());

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
 * Get Event Badge Detail endpoint function
 * Belirli bir event badge'inin detaylarını ve kullanıcının o badge'deki ilerlemesini getirir
 *
 * @param eventId - Event ID
 * @param badgeId - Badge ID
 * @returns EventBadgeDetailResponse - Badge detay ve ilerleme bilgisi
 */
export const getEventBadgeDetail = async (
  eventId: string,
  badgeId: string
): Promise<EventBadgeDetailResponse> => {
  try {
    const response = await apiService.getClient().get<EventBadgeDetailResponse>(
      `/events/${eventId}/badges/${badgeId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getEventBadgeDetail] API Error:', {
      url: `/events/${eventId}/badges/${badgeId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Create Event Post with Context (YENİ)
 * /posts/{eventId}/post endpoint'ine POST request göndererek event post oluşturur
 * Bu endpoint multipart/form-data kullanır ve contextType/contextId ile post oluşturur
 *
 * @param eventId - Event ID
 * @param data - { body, contextType, contextId, images? }
 * @returns CreateEventPostWithContextResponse
 */
export interface CreateEventPostWithContextRequest {
  body: string; // Content (max 2000 char)
  contextType: string; // Backend requires (e.g. 'product', 'sub_category')
  contextId: string; // Backend requires
  images?: string[]; // Opsiyonel: Array of image URIs
}

export type EventPostProductStatus = 'own' | 'tried';

export type CreateEventPostWithContextRequestV2 =
  | (CreateEventPostWithContextRequest & {
      inventoryId: string; // ✅ Envanterden seçildi - Backend inventoryId'den productId bulur
    })
  | (CreateEventPostWithContextRequest & {
      productId: string; // Katalogdan veya Roast gibi senaryolarda doğrudan productId
      productStatus?: EventPostProductStatus; // Roast için zorunlu: own | tried
    });

export interface CreateEventPostWithContextResponse {
  id: string;
  message: string;
}

export const createEventPostWithContext = async (
  eventId: string,
  data: CreateEventPostWithContextRequestV2
): Promise<CreateEventPostWithContextResponse> => {
  const client = apiService.getClient();
  
  // FormData oluştur (multipart/form-data için)
  const formData = new FormData();
  formData.append('body', data.body);
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  
  if ('inventoryId' in data) {
    formData.append('inventoryId', data.inventoryId);
  } else {
    formData.append('productId', data.productId);
    if (data.productStatus) {
      formData.append('productStatus', data.productStatus);
    }
  }
  
  // Request bilgilerini JSON formatında log'la
  const requestJson = {
    endpoint: `/posts/${eventId}/post`,
    method: 'POST',
    contentType: 'multipart/form-data',
    fields: {
      body: data.body,
      contextType: data.contextType,
      contextId: data.contextId,
      ...(('inventoryId' in data)
        ? { inventoryId: data.inventoryId }
        : { 
            productId: data.productId,
            ...(data.productStatus && { productStatus: data.productStatus })
          }),
    },
    imageCount: data.images?.length || 0,
    images: data.images?.map((uri, index) => ({
      index,
      uri: uri.substring(0, 80) + '...',
    })) || [],
  };
  
  console.log('📤 [createEventPostWithContext] Request JSON:', JSON.stringify(requestJson, null, 2));
  
  // Images varsa ekle
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      // React Native'de FormData için image object formatı
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
        } else if (ext === 'gif') {
          fileExtension = 'gif';
          mimeType = 'image/gif';
        } else if (ext === 'webp') {
          fileExtension = 'webp';
          mimeType = 'image/webp';
        }
      }
      
      // React Native FormData image format
      // Platform'a göre URI format değişebilir:
      // - iOS: ph://... veya file://...
      // - Android: file://... veya content://...
      const imageFile = {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      };
      
      formData.append('images', imageFile as any);
    });
  }
  
  try {
    const response = await client.post<CreateEventPostWithContextResponse>(
      `/posts/${eventId}/post`,
      formData,
      {
        // React Native için timeout'u artır (image upload uzun sürebilir)
        timeout: 30000, // 30 saniye
      }
    );
    
    console.log('✅ [createEventPostWithContext] Success Response (JSON):', JSON.stringify({
      postId: response.data.id,
      message: response.data.message,
      fullResponse: response.data,
    }, null, 2));
    
    return response.data;
  } catch (error: any) {
    const errorJson = {
      endpoint: `/posts/${eventId}/post`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorData: error.response?.data,
      errorMessage: error.message,
      requestData: {
        body: data.body?.substring(0, 50) + '...',
        contextType: data.contextType,
        contextId: data.contextId,
        ...(('inventoryId' in data)
          ? { inventoryId: data.inventoryId }
          : { productId: data.productId, productStatus: data.productStatus }),
        imageCount: data.images?.length || 0,
      },
    };
    
    console.error('❌ [createEventPostWithContext] Error Response (JSON):', JSON.stringify(errorJson, null, 2));
    throw error;
  }
};

