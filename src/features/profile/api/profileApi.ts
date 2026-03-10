import { apiService } from '../../../services/ApiService';
import type {
  UserProfile,
  InventoryItem,
  InventoryApiResponse,
  ProfilePost,
  ProfileReview,
  ProfileReviewsApiResponse,
  ProfileBenchmark,
  ProfileBenchmarksApiResponse,
  ProfileTipsAndTricks,
  ProfileTipsAndTricksApiResponse,
  ProfileReplies,
  ProfileRepliesApiResponse,
  ProfileLadderBadge,
  ProfileLadderBadgesApiResponse,
  ProfileFeedItem,
  UserCollectionAchievementsApiResponse,
  UserCollectionBridgesApiResponse,
  TrustUser,
  TrusterUser,
  SuggestedUser,
  SuggestedUsersApiResponse,
  BadgeDetailApiResponse,
  HighlightBadgesApiResponse,
  UpdateHighlightBadgesRequest,
  UpdateHighlightBadgesResponse,
} from '../types';

/**
 * Update Profile Request Interface
 * Avatar ve banner ayrı endpoint'lerle yüklenir (POST /users/me/avatar, POST /users/me/banner)
 * Bu endpoint sadece metin alanlarını günceller
 */
export interface UpdateProfileRequest {
  name?: string;           // Opsiyonel - min 2 karakter
  biography?: string;      // Opsiyonel - max 500 karakter
  cosmetic?: string | null; // Opsiyonel - Cosmetic ID
  badge?: string[];        // Opsiyonel - Badge ID array (max 3)
}

/**
 * Update Profile Response Interface
 */
export interface UpdateProfileResponse {
  success: boolean;
  profile: UserProfile;
}

/**
 * Get User Profile API Response Interface
 * Backend'den gelen response formatı
 */
interface GetUserProfileApiResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    avatarUrl: string;
    bannerUrl: string;
    biography: string;
    titles: string[];
    stats: {
      posts: number;
      trust: number;
      truster: number;
    };
    userName?: string;
    country?: string;
    badges?: Array<{
      id: string;
      title: string;
      image?: string;
    }>;
    isTrusted?: boolean | null;
    isMuted?: boolean;
    isBlocked?: boolean;
  };
}

/**
 * Get User Profile endpoint function
 * Kullanıcı profil bilgilerini getirir
 * 
 * @param userId - Kullanıcı ID'si
 * @returns UserProfile - Kullanıcı profil bilgileri
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile> => {
  // CRITICAL FIX: userId validasyonu - boş string veya geçersiz değer kontrolü
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    console.error('[getUserProfile] Invalid userId:', userId);
    throw new Error('User ID is required and must be a non-empty string');
  }
  
  const userIdTrimmed = userId.trim();
  const response = await apiService.getClient().get<any>(
    `/users/${userIdTrimmed}/profile`
  );
  
  // Backend response formatı: { success: true, data: {...} } veya direkt object
  const responseData = response.data;
  const apiData = (responseData as any)?.data ?? responseData;
  
  // Eğer apiData undefined ise hata fırlat
  if (!apiData || !apiData.id) {
    console.error('[getUserProfile] Invalid response format:', {
      url: `/users/${userId}/profile`,
      responseData,
      apiData,
    });
    throw new Error('Invalid user profile response format');
  }
  
  return {
    id: apiData.id,
    name: apiData.name || '',
    avatar: (() => {
      const v = apiData.avatarUrl ?? apiData.avatar ?? apiData.user?.avatar ?? apiData.user?.avatarUrl ?? '';
      return typeof v === 'string' ? v.trim() : (v ? String(v) : '');
    })(), // Backend avatarUrl/avatar veya user.avatar dönebilir
    bannerUrl: (() => {
      const v = apiData.bannerUrl ?? apiData.banner ?? '';
      return typeof v === 'string' ? v.trim() : (v ? String(v) : '');
    })(), // Backend bannerUrl veya banner dönebilir
    biography: apiData.biography || '',
    titles: apiData.titles || [],
    stats: {
      posts: apiData.stats?.posts ?? 0,
      trust: apiData.stats?.trust ?? 0,
      truster: apiData.stats?.truster ?? 0,
    },
    badges: apiData.badges || [], // Default: boş array
    isTrusted: apiData.isTrusted ?? null, // Default: null
    isMuted: apiData.isMuted ?? false, // Default: false
    isBlocked: apiData.isBlocked ?? false, // Default: false
  };
};

/**
 * Update Profile endpoint function
 * Kullanıcının kendi profil bilgilerini günceller
 * 
 * @param data - Update Profile request data
 * @returns UpdateProfileResponse - Güncellenmiş profil bilgileri
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    // Request body'yi logla
    console.log('[updateProfile] Request data:', JSON.stringify(data, null, 2));
    console.log('[updateProfile] Request URL: PUT /users/me/profile');
    
    const response = await apiService.getClient().put<UpdateProfileResponse>(
      '/users/me/profile',
      data
    );
    
    console.log('[updateProfile] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    // Detaylı hata loglama
    console.error('[updateProfile] ❌ API Error:', {
      url: '/users/me/profile',
      method: 'PUT',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      errorMessage: error.message,
      fullError: error,
    });
    
    // Backend'den gelen hata mesajını throw et
    if (error.response?.data?.message) {
      const backendError = new Error(error.response.data.message);
      (backendError as any).response = error.response;
      throw backendError;
    }
    
    throw error;
  }
};

/**
 * Upload Avatar endpoint function
 * Kullanıcının avatar görselini yükler
 * 
 * @param avatarUri - Avatar görseli URI'si (local file path)
 * @returns Avatar URL response
 */
export interface UploadAvatarResponse {
  success: boolean;
  data: {
    avatarUrl: string;
  };
}

export const uploadAvatar = async (avatarUri: string): Promise<UploadAvatarResponse> => {
  try {
    console.log('[uploadAvatar] Starting upload, URI:', avatarUri);
    
    const formData = new FormData();
    
    // React Native'de FormData için image object formatı
    let fileExtension = 'jpg';
    let mimeType = 'image/jpeg';
    
    const uriLower = avatarUri.toLowerCase();
    if (uriLower.includes('.')) {
      const ext = avatarUri.split('.').pop()?.toLowerCase();
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
    // CRITICAL: React Native FormData formatı - RNFetchBlob örneğine göre
    // Field adı: 'avatar' (küçük harf), format: { uri, type, name }
    const fileObject = {
      uri: avatarUri,
      type: mimeType,
      name: `avatar.${fileExtension}`, // filename olarak kullanılacak
    };
    
    console.log('[uploadAvatar] File object:', {
      uri: avatarUri.substring(0, 50) + '...',
      type: mimeType,
      name: fileObject.name,
      fieldName: 'avatar', // Field adı küçük harf 'avatar' olmalı
    });
    
    // CRITICAL: Field adı 'avatar' (küçük harf) - backend'in beklediği format
    // RNFetchBlob örneğine göre: name: 'avatar', filename: 'avatar.jpg', type: 'image/jpeg'
    formData.append('avatar', fileObject as any);
    
    // CRITICAL: Gönderilen request formatını detaylı logla
    console.log('[uploadAvatar] 📤 Request formatı (RNFetchBlob örneğine göre):', {
      endpoint: 'POST /users/me/avatar',
      contentType: 'multipart/form-data',
      fieldName: 'avatar', // Küçük harf - backend'in beklediği format
      fileObject: {
        uri: avatarUri.substring(0, 50) + '...',
        type: mimeType, // 'image/jpeg' veya 'image/png'
        name: fileObject.name, // 'avatar.jpg' veya 'avatar.png'
      },
      headers: {
        'Content-Type': 'multipart/form-data (Axios otomatik boundary ekler)',
        'Authorization': 'Bearer <token> (Interceptor tarafından eklenir)',
      },
      formDataType: formData.constructor.name,
    });
    
    // React Native'de FormData gönderirken Content-Type header'ını kaldırmalıyız
    // Axios otomatik olarak multipart/form-data boundary'yi ekler
    console.log('[uploadAvatar] Sending request to /users/me/avatar');
    
    const response = await apiService.getClient().post<UploadAvatarResponse>(
      '/users/me/avatar',
      formData,
      {
        timeout: 30000, // 30 saniye timeout (büyük dosyalar için)
        // Content-Type header'ı interceptor'da otomatik olarak kaldırılacak (FormData için)
        // Request formatı: multipart/form-data, field name: 'avatar' (küçük harf)
      }
    );
    
    console.log('[uploadAvatar] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    // 400 Bad Request hatası için backend'den gelen detaylı hata mesajını logla
    const backendError = error.response?.data;
    console.error('[uploadAvatar] ❌ API Error:', {
      url: '/users/me/avatar',
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      // Backend'den gelen hata detayları
      backendError: backendError,
      backendErrorMessage: backendError?.message || backendError?.error || backendError,
      backendErrorDetails: JSON.stringify(backendError, null, 2),
      // Request detayları
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
      // Avatar URI bilgisi
      avatarUri: avatarUri.substring(0, 100),
    });
    throw error;
  }
};

/**
 * Upload Banner endpoint function
 * Kullanıcının banner görselini yükler
 * 
 * @param bannerUri - Banner görseli URI'si (local file path)
 * @returns Banner URL response
 */
export interface UploadBannerResponse {
  success: boolean;
  data: {
    bannerUrl: string;
  };
}

export const uploadBanner = async (bannerUri: string): Promise<UploadBannerResponse> => {
  try {
    console.log('[uploadBanner] Starting upload, URI:', bannerUri);
    
    const formData = new FormData();
    
    // React Native'de FormData için image object formatı
    let fileExtension = 'jpg';
    let mimeType = 'image/jpeg';
    
    const uriLower = bannerUri.toLowerCase();
    if (uriLower.includes('.')) {
      const ext = bannerUri.split('.').pop()?.toLowerCase();
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
    const fileObject = {
      uri: bannerUri,
      type: mimeType,
      name: `banner.${fileExtension}`,
    };
    
    console.log('[uploadBanner] File object:', {
      uri: bannerUri.substring(0, 50) + '...',
      type: mimeType,
      name: fileObject.name,
      fieldName: 'banner', // Field adı küçük harf 'banner' olmalı
    });
    
    // CRITICAL: Field adı 'banner' (küçük harf) - backend'in beklediği format
    formData.append('banner', fileObject as any);
    
    // CRITICAL: Gönderilen request formatını detaylı logla
    console.log('[uploadBanner] 📤 Request formatı (RNFetchBlob örneğine göre):', {
      endpoint: 'POST /users/me/banner',
      contentType: 'multipart/form-data',
      fieldName: 'banner', // Küçük harf - backend'in beklediği format
      fileObject: {
        uri: bannerUri.substring(0, 50) + '...',
        type: mimeType, // 'image/jpeg' veya 'image/png'
        name: fileObject.name, // 'banner.jpg' veya 'banner.png'
      },
      headers: {
        'Content-Type': 'multipart/form-data (Axios otomatik boundary ekler)',
        'Authorization': 'Bearer <token> (Interceptor tarafından eklenir)',
      },
      formDataType: formData.constructor.name,
    });
    
    // React Native'de FormData gönderirken Content-Type header'ını kaldırmalıyız
    // Axios otomatik olarak multipart/form-data boundary'yi ekler
    console.log('[uploadBanner] Sending request to /users/me/banner');
    
    const response = await apiService.getClient().post<UploadBannerResponse>(
      '/users/me/banner',
      formData,
      {
        timeout: 30000, // 30 saniye timeout (büyük dosyalar için)
        // Content-Type header'ı interceptor'da otomatik olarak kaldırılacak (FormData için)
      }
    );
    
    console.log('[uploadBanner] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    // 400 Bad Request hatası için backend'den gelen detaylı hata mesajını logla
    const backendError = error.response?.data;
    console.error('[uploadBanner] ❌ API Error:', {
      url: '/users/me/banner',
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      // Backend'den gelen hata detayları
      backendError: backendError,
      backendErrorMessage: backendError?.message || backendError?.error || backendError,
      backendErrorDetails: JSON.stringify(backendError, null, 2),
      // Request detayları
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
      // Banner URI bilgisi
      bannerUri: bannerUri.substring(0, 100),
    });
    throw error;
  }
};

/**
 * Add Inventory Item endpoint function
 * Inventory'ye ürün ekler
 * 
 * @param data - Inventory item data
 * @returns Created inventory item
 */
export interface AddInventoryItemRequest {
  productId: string;
  selectedDurationId: string;
  selectedLocationId: string;
  selectedPurposeId: string;
  content: string;
  experience: Array<{
    type: 'price_and_shopping' | 'product_and_usage';
    content: string;
    rating: number;
  }>;
  status: 'own' | 'tested';
  /**
   * Opsiyonel. Envanter kartında gösterilecek görsel.
   * Ürünün katalog görseli (tek URL) gönderilmeli; post görselleri gönderilmemeli.
   * Boş/verilmezse backend productId'den ürün görselini alır.
   */
  images?: string[];
}

export interface AddInventoryItemResponse {
  id: string;
  productId: string;
  userId: string;
  status: 'own' | 'tested';
  createdAt: string;
}

export const addInventoryItem = async (
  data: AddInventoryItemRequest
): Promise<AddInventoryItemResponse> => {
  try {
    console.log('[addInventoryItem] 🚨 CRITICAL: Request payload:', JSON.stringify(data, null, 2));
    console.log('[addInventoryItem] 🚨 Experience ratings in API:', {
      priceRating: data.experience.find(e => e.type === 'price_and_shopping')?.rating,
      productRating: data.experience.find(e => e.type === 'product_and_usage')?.rating,
    });

    const response = await apiService.getClient().post<AddInventoryItemResponse>(
      '/inventory',
      data
    );

    console.log('[addInventoryItem] ✅ Success response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[addInventoryItem] API Error:', {
      url: '/inventory',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Get Inventory endpoint function
 * Kullanıcının envanter ürünlerini getirir (pagination ile)
 * Token'dan user_id otomatik olarak alınır
 * 
 * @param cursor - Cursor pagination için son item ID'si (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns InventoryApiResponse - Envanter ürün listesi ve pagination bilgisi
 */
export const getInventory = async (
  cursor?: string,
  limit: number = 20
): Promise<InventoryApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (cursor) {
      params.append('cursor', cursor);
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/inventory?${queryString}` : '/inventory';
    
    const response = await apiService.getClient().get<InventoryItem[] | InventoryApiResponse>(url);
    const responseData = response.data;
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const lastItem = items.length > 0 ? items[items.length - 1] : null;
      
      return {
        items,
        pagination: {
          hasMore,
          cursor: lastItem?.id,
          limit,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      const items = responseData.items || [];
      if (!responseData.pagination) {
        const hasMore = items.length >= limit;
        const lastItem = items.length > 0 ? items[items.length - 1] : null;
        
        return {
          items,
          pagination: {
            hasMore,
            cursor: lastItem?.id,
            limit,
          },
        };
      }
      
      // Zaten doğru formatta - backend'den gelen pagination'ı kullan
      return {
        items,
        pagination: {
          hasMore: responseData.pagination?.hasMore ?? false,
          cursor: responseData.pagination?.cursor,
          limit: responseData.pagination?.limit ?? limit,
        },
      };
    }
    
    // Fallback: Boş response
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // CRITICAL FIX: 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
    if (error.response?.status !== 404) {
      const baseURL = error.config?.baseURL ?? error.request?.config?.baseURL;
      console.error('[getInventory] API Error:', {
        url: '/inventory',
        fullUrl: baseURL ? `${baseURL.replace(/\/$/, '')}/inventory` : undefined,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        errno: error.errno,
      });
      if (__DEV__ && error) {
        console.error('[getInventory] Full error:', error);
      }
    }
    throw error;
  }
};

/**
 * Update Inventory Item endpoint function
 * Inventory item'ı günceller
 * 
 * @param inventoryId - Inventory item ID'si
 * @param data - Update data
 * @returns Updated inventory item
 */
export interface UpdateInventoryItemRequest {
  hasOwned?: boolean;
  experienceSummary?: string;
}

export interface UpdateInventoryItemResponse {
  id: string;
  hasOwned: boolean;
  experienceSummary: string;
  updatedAt: string;
}

export const updateInventoryItem = async (
  inventoryId: string,
  data: UpdateInventoryItemRequest
): Promise<UpdateInventoryItemResponse> => {
  try {
    const response = await apiService.getClient().patch<UpdateInventoryItemResponse>(
      `/inventory/${inventoryId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[updateInventoryItem] API Error:', {
      url: `/inventory/${inventoryId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Delete Inventory Item endpoint function
 * Inventory item'ı siler
 * 
 * @param inventoryId - Inventory item ID'si
 * @returns Success response
 */
export interface DeleteInventoryItemResponse {
  success: boolean;
  message: string;
}

export const deleteInventoryItem = async (
  inventoryId: string
): Promise<DeleteInventoryItemResponse> => {
  try {
    const response = await apiService.getClient().delete<DeleteInventoryItemResponse>(
      `/inventory/${inventoryId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[deleteInventoryItem] API Error:', {
      url: `/inventory/${inventoryId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Experience Options endpoint function
 * Deneyim seçeneklerini getirir (durations, locations, purposes)
 * 
 * @returns Experience options
 */
export interface ExperienceOptions {
  durations: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  purposes: Array<{ id: string; name: string }>;
}

export const getExperienceOptions = async (): Promise<ExperienceOptions> => {
  try {
    const response = await apiService.getClient().get<ExperienceOptions>(
      '/inventory/experience/options'
    );
    return response.data;
  } catch (error: any) {
    const baseURL = error.config?.baseURL ?? error.request?.config?.baseURL;
    console.error('[getExperienceOptions] API Error:', {
      url: '/inventory/experience/options',
      fullUrl: baseURL ? `${baseURL.replace(/\/$/, '')}/inventory/experience/options` : undefined,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      errno: error.errno,
    });
    if (__DEV__ && error) {
      console.error('[getExperienceOptions] Full error:', error);
    }
    throw error;
  }
};

/**
 * Split Experience endpoint function
 * Deneyim metnini AI ile kategorilere ayırır
 * 
 * Note: Bu endpoint postApi.ts'de `/posts/experience/split` olarak var
 * Ancak dokümantasyonda `/inventory/split-experience` olarak geçiyor
 * Backend'de hangisi kullanılıyorsa ona göre güncellenebilir
 * 
 * @param data - Split experience request data
 * @returns Split experience response
 */
export interface SplitExperienceRequest {
  productId: string;
  experienceText: string;
}

export interface SplitExperienceResponse {
  priceAndShopping: {
    content: string;
    rating: number;
  };
  productAndUsage: {
    content: string;
    rating: number;
  };
}

export const splitExperience = async (
  data: SplitExperienceRequest
): Promise<SplitExperienceResponse> => {
  try {
    const response = await apiService.getClient().post<SplitExperienceResponse>(
      '/inventory/split-experience',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[splitExperience] API Error:', {
      url: '/inventory/split-experience',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

/**
 * User Feed API Response - Pagination ile birlikte
 */
export interface UserFeedApiResponse {
  items: ProfileFeedItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Get User Feed endpoint function
 * Kullanıcının profil feed postlarını getirir (pagination ile)
 * 
 * API Endpoint: GET /users/{id}/feed
 * - limit: Döndürülecek maksimum card sayısı (varsayılan tümü, min: 1, max: 100)
 * - types: Virgülle ayrılmış CardType listesi (opsiyonel)
 * 
 * Backend'den direkt array döner, pagination objesi yok.
 * Infinite scroll için: Backend cursor desteklemiyorsa, her istekte limit kadar item alınır.
 * Eğer gelen item sayısı limit'ten azsa, daha fazla item yok demektir.
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (son item'ın id'si, opsiyonel - backend'de cursor parametresi yok)
 * @param limit - Sayfa başına item sayısı (default: 3, min: 1, max: 100)
 * @returns UserFeedApiResponse - Feed items ve pagination bilgisi
 */
export const getUserPosts = async (
  userId: string,
  cursor?: string,
  limit: number = 3
): Promise<UserFeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    // Büyük veri döndüren endpoint için özel timeout (60 saniye)
    const client = apiService.getClient();
    const response = await client.get<any>(
      `/users/${userId}/feed?${params.toString()}`,
      {
        timeout: 60000, // 60 saniye - feed endpoint'i için daha uzun timeout
      }
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;
    
    // TEST: Backend düzeltmesi - Type filtresi kaldırıldı, tüm post tipleri getiriliyor
    // Backend'de düzeltildi: Sadece type: 'FREE' değil, tüm post tipleri getiriliyor
    if (__DEV__) {
      const items = Array.isArray(responseData) ? responseData : (responseData?.items || []);
      const postTypes = items.map((item: any) => item.type || item.data?.type).filter(Boolean);
      const uniqueTypes = [...new Set(postTypes)];
      console.log('[getUserPosts] ✅ Backend düzeltmesi test:', {
        userId,
        itemsCount: items.length,
        postTypes: uniqueTypes,
        hasAllTypes: uniqueTypes.length > 1 || (uniqueTypes.length === 1 && uniqueTypes[0] !== 'FREE'),
        sampleItems: items.slice(0, 3).map((item: any) => ({
          id: item.id || item.data?.id,
          type: item.type || item.data?.type,
        })),
      });
    }
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
    const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
    return {
      items,
      pagination: {
        hasMore,
        limit,
        cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as UserFeedApiResponse;
    }
    
    // Beklenmeyen format
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // Network Error kontrolü - Backend endpoint mevcut değil veya servis çalışmıyor olabilir
    if (error.message === 'Network Error' || !error.response) {
      if (__DEV__) {
        console.warn('[getUserPosts] ⚠️ Network Error - Backend endpoint may not be implemented:', {
          url: `/users/${userId}/feed`,
          message: 'This endpoint may not be available on the backend server. Returning empty response.',
        });
      }

      // Boş response döndür (kullanıcıya hata göstermek yerine boş liste göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }

    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getUserPosts] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/users/${userId}/feed`,
          userId,
          message: 'This endpoint is not available on the backend server. Please contact backend team.',
        });
      }

      // Boş response döndür (kullanıcıya hata göstermek yerine boş liste göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }

    // Diğer hatalar için error log
    console.error('[getUserPosts] API Error:', {
      url: `/users/${userId}/feed`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Reviews endpoint function
 * Kullanıcının review postlarını getirir (pagination ile)
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns ProfileReviewsApiResponse - Kullanıcının review listesi ve pagination bilgisi
 */
export const getUserReviews = async (
  userId: string,
  cursor?: string,
  limit: number = 5
): Promise<ProfileReviewsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/reviews?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as ProfileReviewsApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserReviews] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // Network Error kontrolü - Backend endpoint mevcut değil veya servis çalışmıyor olabilir
    if (error.message === 'Network Error' || !error.response) {
      // Backend endpoint mevcut değilse, boş response döndür (kullanıcıya hata göstermek yerine)
      if (__DEV__) {
        console.warn('[getUserReviews] ⚠️ Network Error - Backend endpoint may not be implemented:', {
          url: `/users/${userId}/reviews`,
          message: 'This endpoint may not be available on the backend server. Returning empty response.',
        });
      }
      
      // Boş response döndür (kullanıcıya hata göstermek yerine boş liste göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getUserReviews] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/users/${userId}/reviews`,
          userId,
          message: 'This endpoint is not available on the backend server. Please contact backend team.',
        });
      }
      
      // Boş response döndür (kullanıcıya hata göstermek yerine boş liste göster)
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    // Diğer hatalar için error log
    console.error('[getUserReviews] API Error:', {
      url: `/users/${userId}/reviews?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Benchmarks endpoint function
 * Kullanıcının benchmark postlarını getirir (pagination ile)
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns ProfileBenchmarksApiResponse - Kullanıcının benchmark listesi ve pagination bilgisi
 */
export const getUserBenchmarks = async (
  userId: string,
  cursor?: string,
  limit: number = 5
): Promise<ProfileBenchmarksApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/benchmarks?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;

    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as ProfileBenchmarksApiResponse;
    }
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // Network Error kontrolü - Backend endpoint mevcut değil veya servis çalışmıyor olabilir
    if (error.message === 'Network Error' || !error.response) {
      if (__DEV__) {
        console.warn('[getUserBenchmarks] ⚠️ Network Error - Backend endpoint may not be implemented:', {
          url: `/users/${userId}/benchmarks`,
          message: 'This endpoint may not be available on the backend server. Returning empty response.',
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getUserBenchmarks] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/users/${userId}/benchmarks`,
          userId,
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    console.error('[getUserBenchmarks] API Error:', {
      url: `/users/${userId}/benchmarks?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Tips & Tricks endpoint function
 * Kullanıcının tips & tricks postlarını getirir (pagination ile)
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns ProfileTipsAndTricksApiResponse - Kullanıcının tips & tricks listesi ve pagination bilgisi
 */
export const getUserTipsAndTricks = async (
  userId: string,
  cursor?: string,
  limit: number = 5
): Promise<ProfileTipsAndTricksApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/tips?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as ProfileTipsAndTricksApiResponse;
    }
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // Network Error kontrolü - Backend endpoint mevcut değil veya servis çalışmıyor olabilir
    if (error.message === 'Network Error' || !error.response) {
      if (__DEV__) {
        console.warn('[getUserTipsAndTricks] ⚠️ Network Error - Backend endpoint may not be implemented:', {
          url: `/users/${userId}/tips`,
          message: 'This endpoint may not be available on the backend server. Returning empty response.',
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getUserTipsAndTricks] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/users/${userId}/tips`,
          userId,
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    console.error('[getUserTipsAndTricks] API Error:', {
      url: `/users/${userId}/tips?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Ladder Badges endpoint function
 * Kullanıcının ladder badge'lerini getirir (pagination ile)
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns ProfileLadderBadgesApiResponse - Kullanıcının ladder badge listesi ve pagination bilgisi
 */
export const getUserLadderBadges = async (
  userId: string,
  cursor?: string,
  limit: number = 5
): Promise<ProfileLadderBadgesApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/ladder/badges?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as ProfileLadderBadgesApiResponse;
    }
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getUserLadderBadges] API Error:', {
      url: `/users/${userId}/ladder/badges?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Questions/Replies endpoint function
 * Kullanıcının questions/replies postlarını getirir (pagination ile)
 *
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns ProfileRepliesApiResponse - Kullanıcının question/replies listesi ve pagination bilgisi
 */
export const getUserReplies = async (
  userId: string,
  cursor?: string,
  limit: number = 5
): Promise<ProfileRepliesApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/questions?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;

    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;

      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as ProfileRepliesApiResponse;
    }
    
    // Beklenmeyen format
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    // Network Error kontrolü - Backend endpoint mevcut değil veya servis çalışmıyor olabilir
    if (error.message === 'Network Error' || !error.response) {
      if (__DEV__) {
        console.warn('[getUserReplies] ⚠️ Network Error - Backend endpoint may not be implemented:', {
          url: `/users/${userId}/questions`,
          message: 'This endpoint may not be available on the backend server. Returning empty response.',
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    // 404 hatası: Endpoint backend'de mevcut değil
    if (error.response?.status === 404) {
      if (__DEV__) {
        console.warn('[getUserReplies] ⚠️ Endpoint not found (404). Backend endpoint may not be implemented yet:', {
          url: `/users/${userId}/questions`,
          userId,
        });
      }
      return {
        items: [],
        pagination: {
          hasMore: false,
          limit,
        },
      };
    }
    
    console.error('[getUserReplies] API Error:', {
      url: `/users/${userId}/questions?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Product Experience Search Response Interface
 * Backend'den dönen experience search response formatı
 */
export interface ProductExperienceSearchResponse {
  items: Array<{
    id: string;
    title: string;
    experienceText: string;
    inventory: {
      id: string;
      product: {
        id: string;
        name: string;
      };
      user: {
        id: string;
      };
    };
    createdAt: string;
  }>;
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Search Product Experiences endpoint function
 * Product experience başlığı veya metninde arama yapar
 *
 * @param q - Arama terimi (required)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns ProductExperienceSearchResponse - Experience listesi ve pagination bilgisi
 */
export const searchProductExperiences = async (
  q: string,
  cursor?: string,
  limit: number = 20
): Promise<ProductExperienceSearchResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('q', q);
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', Math.min(limit, 50).toString());

    const response = await apiService.getClient().get<ProductExperienceSearchResponse>(
      `/inventory/experiences/search?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[searchProductExperiences] API Error:', {
      url: `/inventory/experiences/search?q=${q}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Collection Achievements endpoint function
 * Kullanıcının collection achievements'larını getirir (pagination ile)
 * 
 * API Endpoint: GET /users/{id}/collections/achievements
 * - q veya search: Badge adı veya açıklamasına göre arama (case-insensitive, opsiyonel)
 * - cursor: Pagination cursor (opsiyonel)
 * - limit: Sayfa başına item sayısı (default: 20, min: 1, max: 100)
 * 
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param searchQuery - Arama sorgusu (opsiyonel)
 * @returns UserCollectionAchievementsApiResponse - Achievement items ve pagination bilgisi
 */
export const getUserCollectionAchievements = async (
  userId: string,
  cursor?: string,
  limit: number = 20,
  searchQuery?: string
): Promise<UserCollectionAchievementsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  if (searchQuery) {
    // Backend'de hem 'q' hem de 'search' parametresi destekleniyor
    params.append('q', searchQuery);
    params.append('search', searchQuery);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/collections/achievements?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: [...] } veya direkt array
    const responseData = (response.data as any)?.data ?? response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserCollectionAchievements] API Request:', {
      url: `/users/${userId}/collections/achievements?${params.toString()}`,
      requestedLimit: limit,
      cursor,
    });
    
    console.log('[getUserCollectionAchievements] API Response Detay:', {
      url: `/users/${userId}/collections/achievements?${params.toString()}`,
      cursor,
      requestedLimit: limit,
      responseType: Array.isArray(responseData) ? 'array' : typeof responseData,
      rawItemsCount: Array.isArray(responseData) ? responseData.length : (responseData?.items?.length || 0),
      firstItemId: Array.isArray(responseData) ? responseData[0]?.id : responseData?.items?.[0]?.id,
      lastItemId: Array.isArray(responseData) ? responseData[responseData.length - 1]?.id : responseData?.items?.[responseData?.items?.length - 1]?.id,
      allItemIds: Array.isArray(responseData) 
        ? responseData.map((item: any) => item?.id).filter(Boolean)
        : (responseData?.items?.map((item: any) => item?.id).filter(Boolean) || []),
    });
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
      const hasMore = items.length >= limit;
      const cursorValue = items.length > 0 ? items[items.length - 1].id : undefined;
      
      console.log('[getUserCollectionAchievements] Normalized Response:', {
        requestedLimit: limit,
        actualItemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
        warning: items.length !== limit ? `⚠️ Backend ${limit} yerine ${items.length} item döndürdü!` : '✅ Limit doğru',
      });
      
      return {
        items,
        pagination: {
          hasMore,
          limit,
          cursor: cursorValue,
        },
      };
    }
    
    // Eğer zaten doğru formatta döndürüyorsa (items ve pagination ile)
    if (responseData && typeof responseData === 'object' && 'items' in responseData) {
      // Pagination objesi eksikse oluştur
      if (!responseData.pagination) {
        const items = responseData.items || [];
        const hasMore = items.length >= limit;
        
        return {
          items,
          pagination: {
            hasMore,
            limit,
            cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          },
        };
      }
      
      // Zaten doğru formatta
      return responseData as UserCollectionAchievementsApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserCollectionAchievements] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getUserCollectionAchievements] API Error:', {
      url: `/users/${userId}/collections/achievements?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * GET /users/:id/collections/bridges
 * Tek response: brand (Bridge Badges) + achievement (Achievement Badges), ortak pagination.
 * Query: q veya search (opsiyonel), cursor (opsiyonel), limit (1–50, varsayılan: 20)
 */
export const getUserCollectionBridges = async (
  userId: string,
  cursor?: string,
  limit: number = 20,
  searchQuery?: string
): Promise<UserCollectionBridgesApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (searchQuery?.trim()) params.append('q', searchQuery.trim());
  const clampedLimit = Math.min(50, Math.max(1, limit));
  params.append('limit', clampedLimit.toString());

  const url = `/users/${userId}/collections/bridges?${params.toString()}`;

  try {
    const response = await apiService.getClient().get<unknown>(url);
    const raw = (response.data as { data?: unknown })?.data ?? response.data;

    if (
      raw &&
      typeof raw === 'object' &&
      'brand' in raw &&
      'achievement' in raw &&
      'pagination' in raw
    ) {
      const data = raw as UserCollectionBridgesApiResponse;
      return {
        brand: {
          items: Array.isArray(data.brand?.items) ? data.brand.items : [],
        },
        achievement: {
          items: Array.isArray(data.achievement?.items) ? data.achievement.items : [],
        },
        pagination: {
          cursor: data.pagination?.cursor ?? null,
          hasMore: Boolean(data.pagination?.hasMore),
          limit: Number(data.pagination?.limit) || clampedLimit,
        },
      };
    }

    return {
      brand: { items: [] },
      achievement: { items: [] },
      pagination: { cursor: null, hasMore: false, limit: clampedLimit },
    };
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Get Trust List endpoint function
 * Kullanıcının trust listesini getirir
 * 
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns TrustUser[] - Trust listesi
 */
export const getTrustList = async (
  userId: string,
  searchQuery?: string
): Promise<TrustUser[]> => {
  const params = searchQuery ? { q: searchQuery } : {};
  const response = await apiService.getClient().get<any>(
    `/users/${userId}/trusts`,
    { params }
  );
  // Backend response formatı: { success: true, data: [...] } veya direkt array
  return (response.data as any)?.data ?? response.data;
};

/**
 * Truster List Sort Options
 */
export type TrusterListSort = 
  | 'name_asc'      // İsme göre A-Z
  | 'name_desc'     // İsme göre Z-A
  | 'date_asc'      // Trust tarihine göre eski-yeni
  | 'date_desc'     // Trust tarihine göre yeni-eski (default)
  | 'trusted_first'; // Önce trust edilenler (mutual trust)

/**
 * Get Truster List endpoint function
 * Kullanıcının truster listesini getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @param sort - Sıralama kriteri (default: 'date_desc')
 * @returns TrusterUser[] - Truster listesi
 */
export const getTrusterList = async (
  userId: string,
  searchQuery?: string,
  sort?: TrusterListSort
): Promise<TrusterUser[]> => {
  const params: Record<string, string> = {};
  if (searchQuery) {
    params.q = searchQuery;
  }
  if (sort) {
    params.sort = sort;
  }
  
  const response = await apiService.getClient().get<any>(
    `/users/${userId}/trusters`,
    { params: Object.keys(params).length > 0 ? params : undefined }
  );
  
  // Backend response formatı: { success: true, data: [...] } veya direkt array
  const trusterList = (response.data as any)?.data ?? response.data;
  
  return trusterList;
};

/**
 * Add to Trust List endpoint function
 * Kullanıcıyı trust listesine ekler
 * 
 * API Endpoint: POST /users/trust
 * Kullanıcının kendi ID'si token üzerinden backend'e iletilir
 * 
 * @param targetUserId - Trust listesine eklenecek kullanıcının ID'si
 * @returns void - Başarılı durumda 201 Created döner
 */
export const addToTrustList = async (
  targetUserId: string
): Promise<void> => {
  try {
    await apiService.getClient().post(
      '/users/trust',
      { targetUserId }
    );
  } catch (error: any) {
    console.error('[addToTrustList] API Error:', {
      url: '/users/trust',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Remove from Trust List endpoint function
 * Kullanıcıyı trust listesinden kaldırır (untrust)
 * 
 * API Endpoint: DELETE /users/trusts/{targetUserId}
 * Kullanıcının kendi ID'si token üzerinden backend'e iletilir
 * 
 * @param targetUserId - Trust listesinden kaldırılacak kullanıcının ID'si
 * @returns void - Başarılı durumda 204 No Content döner
 */
export const removeFromTrustList = async (
  targetUserId: string
): Promise<void> => {
  try {
    await apiService.getClient().delete(
      `/users/trusts/${targetUserId}`
    );
  } catch (error: any) {
    console.error('[removeFromTrustList] API Error:', {
      url: `/users/trusts/${targetUserId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * User Report Category Types
 */
export type UserReportCategory = 
  | 'SPAM'
  | 'HARASSMENT'
  | 'SCAM'
  | 'INAPPROPRIATE_CONTENT'
  | 'FAKE_ACCOUNT'
  | 'OTHER';

/**
 * Report User Request
 */
export interface ReportUserRequest {
  category: UserReportCategory;
  description?: string; // Opsiyonel, maksimum 500 karakter
}

/**
 * Report User Response
 */
export interface ReportUserResponse {
  message: string;
}

/**
 * Report User endpoint function
 * Kullanıcıyı raporlar
 * 
 * API Endpoint: POST /users/:id/report/:targetUserId
 * 
 * @param userId - Raporlayan kullanıcı ID'si (JWT token'daki userId ile eşleşmeli)
 * @param targetUserId - Raporlanacak kullanıcı ID'si
 * @param data - Rapor kategorisi ve açıklama
 * @returns ReportUserResponse - Başarı mesajı
 */
export const reportUser = async (
  userId: string,
  targetUserId: string,
  data: ReportUserRequest
): Promise<ReportUserResponse> => {
  try {
    const response = await apiService.getClient().post<ReportUserResponse>(
      `/users/${userId}/report/${targetUserId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[reportUser] API Error:', {
      url: `/users/${userId}/report/${targetUserId}`,
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
 * Mute User endpoint function
 * Kullanıcıyı sessize alır
 * 
 * API Endpoint: POST /users/{id}/mute/{targetUserId}
 * 
 * @param userId - Sessize alan kullanıcı ID'si (JWT token'daki userId ile eşleşmeli)
 * @param targetUserId - Sessize alınacak kullanıcı ID'si
 * @returns void - Başarılı durumda 201 Created döner
 */
export const muteUser = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  try {
    const response = await apiService.getClient().post(`/users/${userId}/mute/${targetUserId}`);
    
    if (__DEV__) {
      console.log('[muteUser] ✅ Success:', {
        url: `/users/${userId}/mute/${targetUserId}`,
        status: response.status,
        targetUserId,
      });
    }
  } catch (error: any) {
    console.error('[muteUser] API Error:', {
      url: `/users/${userId}/mute/${targetUserId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      userId,
      targetUserId,
    });
    throw error;
  }
};

/**
 * Unmute User endpoint function
 * Kullanıcının sessizliğini kaldırır
 * 
 * API Endpoint: DELETE /users/{id}/mute/{targetUserId}
 * 
 * @param userId - Sessizliği kaldıran kullanıcı ID'si (JWT token'daki userId ile eşleşmeli)
 * @param targetUserId - Sessizliği kaldırılacak kullanıcı ID'si
 * @returns boolean - Başarılı ise true, kayıt yoksa false döner
 */
export const unmuteUser = async (
  userId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    const response = await apiService.getClient().delete(`/users/${userId}/mute/${targetUserId}`);
    
    if (__DEV__) {
      console.log('[unmuteUser] ✅ Success:', {
        url: `/users/${userId}/mute/${targetUserId}`,
        status: response.status,
        targetUserId,
      });
    }
    
    // 204 No Content veya 200 OK başarılı kabul edilir
    return true;
  } catch (error: any) {
    // 404 hatası: Kullanıcı zaten sessize alınmamış olabilir
    if (error?.response?.status === 404) {
      if (__DEV__) {
        console.warn('[unmuteUser] User is not muted (404):', {
          url: `/users/${userId}/mute/${targetUserId}`,
          message: 'User may not be muted',
          userId,
          targetUserId,
        });
      }
      // 404'ü sessizce yut (idempotent işlem) ve false döndür
      return false;
    }
    console.error('[unmuteUser] API Error:', {
      url: `/users/${userId}/mute/${targetUserId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      userId,
      targetUserId,
    });
    throw error;
  }
};

/**
 * Block User endpoint function
 * Kullanıcıyı engeller
 * 
 * API Endpoint: POST /users/{id}/block/{targetUserId}
 * 
 * @param userId - Engelleyen kullanıcı ID'si (JWT token'daki userId ile eşleşmeli)
 * @param targetUserId - Engellenecek kullanıcı ID'si
 * @returns void - Başarılı durumda 201 Created döner
 */
export const blockUser = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  try {
    const response = await apiService.getClient().post(`/users/${userId}/block/${targetUserId}`);
    
    if (__DEV__) {
      console.log('[blockUser] ✅ Success:', {
        url: `/users/${userId}/block/${targetUserId}`,
        status: response.status,
        targetUserId,
      });
    }
  } catch (error: any) {
    console.error('[blockUser] API Error:', {
      url: `/users/${userId}/block/${targetUserId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      userId,
      targetUserId,
    });
    throw error;
  }
};

/**
 * Unblock User endpoint function
 * Kullanıcının engelini kaldırır
 * 
 * API Endpoint: DELETE /users/{id}/block/{targetUserId}
 * 
 * @param userId - Engeli kaldıran kullanıcı ID'si (JWT token'daki userId ile eşleşmeli)
 * @param targetUserId - Engeli kaldırılacak kullanıcı ID'si
 * @returns boolean - Başarılı ise true, kayıt yoksa false döner
 */
export const unblockUser = async (
  userId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    const response = await apiService.getClient().delete(`/users/${userId}/block/${targetUserId}`);
    
    if (__DEV__) {
      console.log('[unblockUser] ✅ Success:', {
        url: `/users/${userId}/block/${targetUserId}`,
        status: response.status,
        targetUserId,
      });
    }
    
    // 204 No Content veya 200 OK başarılı kabul edilir
    return true;
  } catch (error: any) {
    // 404 hatası: Kullanıcı zaten engellenmemiş olabilir
    if (error?.response?.status === 404) {
      if (__DEV__) {
        console.warn('[unblockUser] User is not blocked (404):', {
          url: `/users/${userId}/block/${targetUserId}`,
          message: 'User may not be blocked',
          userId,
          targetUserId,
        });
      }
      // 404'ü sessizce yut (idempotent işlem) ve false döndür
      return false;
    }
    console.error('[unblockUser] API Error:', {
      url: `/users/${userId}/block/${targetUserId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      userId,
      targetUserId,
    });
    throw error;
  }
};

/**
 * Get Suggested Users endpoint function
 * Kullanıcıya önerilen kullanıcıları getirir
 * 
 * API Endpoint: GET /users/suggested
 * 
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns SuggestedUsersApiResponse - Önerilen kullanıcılar ve pagination bilgisi
 */
export const getSuggestedUsers = async (
  searchQuery?: string,
  cursor?: string,
  limit: number = 20
): Promise<SuggestedUsersApiResponse> => {
  const params = new URLSearchParams();
  
  if (searchQuery) {
    params.append('q', searchQuery);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/suggested?${params.toString()}`
    );
    
    // Backend response formatı: { success: true, data: {...} } veya direkt object
    const responseData = (response.data as any)?.data ?? response.data;
    
    console.log('[getSuggestedUsers] 📥 API Response:', {
      url: `/users/suggested?${params.toString()}`,
      itemsCount: responseData?.items?.length || 0,
      hasMore: responseData?.pagination?.hasMore,
      nextCursor: responseData?.pagination?.nextCursor,
      firstUser: responseData?.items?.[0]?.name,
      lastUser: responseData?.items?.[responseData.items.length - 1]?.name,
    });
    
    return responseData as SuggestedUsersApiResponse;
  } catch (error: any) {
    console.error('[getSuggestedUsers] ❌ API Error:', {
      url: `/users/suggested?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * GET /users/:id/collections/bridges/:badgeId
 * Badge detay bilgisini getirir (description dahil)
 */
export const getBadgeDetail = async (
  userId: string,
  badgeId: string
): Promise<BadgeDetailApiResponse> => {
  const response = await apiService.getClient().get<unknown>(
    `/users/${userId}/collections/bridges/${badgeId}`
  );
  const raw = (response.data as { data?: unknown })?.data ?? response.data;
  return raw as BadgeDetailApiResponse;
};

/**
 * GET /users/me/highlight-badges
 * Kullanıcının profil kartında gösterilen 4 seçili badge'i getirir
 */
export const getHighlightBadges = async (): Promise<HighlightBadgesApiResponse> => {
  const response = await apiService.getClient().get<unknown>('/users/me/highlight-badges');
  const raw = (response.data as { data?: unknown })?.data ?? response.data;
  return raw as HighlightBadgesApiResponse;
};

/**
 * PUT /users/me/highlight-badges
 * Kullanıcının profil kartında gösterilen 4 seçili badge'i günceller
 * Not: badgeIds içindeki badge'lerin isClaimed: true olması gerekir
 */
export const updateHighlightBadges = async (
  data: UpdateHighlightBadgesRequest
): Promise<UpdateHighlightBadgesResponse> => {
  const response = await apiService.getClient().put<UpdateHighlightBadgesResponse>(
    '/users/me/highlight-badges',
    data
  );
  return response.data;
};
