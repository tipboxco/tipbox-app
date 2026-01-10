import { apiService } from '../../../services/ApiService';
import type {
  UserProfile,
  InventoryItem,
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
} from '../types';

/**
 * Update Profile Request Interface
 */
export interface UpdateProfileRequest {
  name?: string;
  biography?: string;
  banner?: string | null;
  avatar?: string | null;
  cosmetic?: string | null;
  badge?: string[];
}

/**
 * Update Profile Response Interface
 */
export interface UpdateProfileResponse {
  success: boolean;
  profile: UserProfile;
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
  console.log('[getUserProfile] 📤 API Request:', {
    url: `/users/${userId}/profile`,
    userId,
    timestamp: new Date().toISOString(),
  });
  
  const response = await apiService.getClient().get<UserProfile>(
    `/users/${userId}/profile`
  );
  
  // CRITICAL: Profile response'unu detaylıca logla
  console.log('[getUserProfile] 📥 API Response:', {
    url: `/users/${userId}/profile`,
    userId,
    timestamp: new Date().toISOString(),
    responseStatus: response.status,
    responseData: {
      id: response.data?.id,
      name: response.data?.name,
      avatar: response.data?.avatar,
      biography: response.data?.biography,
      bannerUrl: response.data?.bannerUrl,
      titles: response.data?.titles,
      badges: response.data?.badges?.length || 0,
      stats: response.data?.stats,
      isTrusted: response.data?.isTrusted,
    },
    fullResponse: response.data,
  });
  
  // PERFORMANCE: Stats değerlerini özellikle kontrol et
  if (response.data?.stats) {
    console.log('[getUserProfile] 📊 Stats Detay:', {
      posts: response.data.stats.posts,
      trust: response.data.stats.trust,
      truster: response.data.stats.truster,
      statsType: {
        posts: typeof response.data.stats.posts,
        trust: typeof response.data.stats.trust,
        truster: typeof response.data.stats.truster,
      },
    });
  }
  
  return response.data;
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
    
    formData.append('avatar', {
      uri: avatarUri,
      type: mimeType,
      name: `avatar.${fileExtension}`,
    } as any);
    
    const response = await apiService.getClient().post<UploadAvatarResponse>(
      '/users/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[uploadAvatar] API Error:', {
      url: '/users/me/avatar',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
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
    
    formData.append('banner', {
      uri: bannerUri,
      type: mimeType,
      name: `banner.${fileExtension}`,
    } as any);
    
    const response = await apiService.getClient().post<UploadBannerResponse>(
      '/users/me/banner',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[uploadBanner] API Error:', {
      url: '/users/me/banner',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
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
    const response = await apiService.getClient().post<AddInventoryItemResponse>(
      '/inventory',
      data
    );
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
 * Kullanıcının envanter ürünlerini getirir
 * Token'dan user_id otomatik olarak alınır
 * 
 * @returns InventoryItem[] - Envanter ürün listesi
 */
export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await apiService.getClient().get<InventoryItem[]>(
    '/inventory'
  );
  return response.data;
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
    console.error('[getExperienceOptions] API Error:', {
      url: '/inventory/experience/options',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
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
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/feed?${params.toString()}`
    );
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserPosts] API Response Detay:', {
      url: `/users/${userId}/feed?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserPosts] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        console.log('[getUserPosts] Normalized Response (object format):', {
          itemsCount: items.length,
          hasMore,
          cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          itemIds: items.map((item: any) => item?.id).filter(Boolean),
        });
    
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
      console.log('[getUserPosts] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
      return responseData as UserFeedApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserPosts] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
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
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserReviews] API Response Detay:', {
      url: `/users/${userId}/reviews?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserReviews] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
      console.log('[getUserReviews] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
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
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserBenchmarks] API Response Detay:', {
      url: `/users/${userId}/benchmarks?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserBenchmarks] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        console.log('[getUserBenchmarks] Normalized Response (object format):', {
          itemsCount: items.length,
          hasMore,
          cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          itemIds: items.map((item: any) => item?.id).filter(Boolean),
        });
        
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
      console.log('[getUserBenchmarks] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
      return responseData as ProfileBenchmarksApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserBenchmarks] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
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
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserTipsAndTricks] API Response Detay:', {
      url: `/users/${userId}/tips?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserTipsAndTricks] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        console.log('[getUserTipsAndTricks] Normalized Response (object format):', {
          itemsCount: items.length,
          hasMore,
          cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          itemIds: items.map((item: any) => item?.id).filter(Boolean),
        });
        
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
      console.log('[getUserTipsAndTricks] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
      return responseData as ProfileTipsAndTricksApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserTipsAndTricks] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
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
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserLadderBadges] API Response Detay:', {
      url: `/users/${userId}/ladder/badges?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserLadderBadges] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        console.log('[getUserLadderBadges] Normalized Response (object format):', {
          itemsCount: items.length,
          hasMore,
          cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          itemIds: items.map((item: any) => item?.id).filter(Boolean),
        });
        
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
      console.log('[getUserLadderBadges] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
      return responseData as ProfileLadderBadgesApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserLadderBadges] Unexpected response format:', responseData);
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
    
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserReplies] API Response Detay:', {
      url: `/users/${userId}/questions?${params.toString()}`,
      cursor,
      limit,
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
      
      console.log('[getUserReplies] Normalized Response:', {
        itemsCount: items.length,
        hasMore,
        cursor: cursorValue,
        itemIds: items.map((item: any) => item?.id).filter(Boolean),
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
        const items = Array.isArray(responseData.items) ? responseData.items : [];
        const hasMore = items.length >= limit;
        
        console.log('[getUserReplies] Normalized Response (object format):', {
          itemsCount: items.length,
          hasMore,
          cursor: items.length > 0 ? items[items.length - 1].id : undefined,
          itemIds: items.map((item: any) => item?.id).filter(Boolean),
        });
        
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
      console.log('[getUserReplies] Response (already formatted):', {
        itemsCount: responseData.items?.length || 0,
        hasMore: responseData.pagination?.hasMore,
        cursor: responseData.pagination?.cursor,
        itemIds: responseData.items?.map((item: any) => item?.id).filter(Boolean) || [],
      });
      
      return responseData as ProfileRepliesApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserReplies] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
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
    
    // Backend response formatını kontrol et ve normalize et
    const responseData = response.data;
    
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
 * Get User Collection Bridges endpoint function
 * Kullanıcının collection bridges'larını getirir (pagination ile)
 * 
 * API Endpoint: GET /users/{id}/collections/bridges
 * - q: Badge adı veya açıklamasına göre arama (case-insensitive, opsiyonel)
 * - cursor: Pagination cursor (opsiyonel)
 * - limit: Sayfa başına item sayısı (default: 20, min: 1, max: 100)
 * 
 * Backend direkt array döndürüyor, pagination objesi oluşturulacak
 * 
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param searchQuery - Arama sorgusu (opsiyonel)
 * @returns UserCollectionBridgesApiResponse - Bridge items ve pagination bilgisi
 */
export const getUserCollectionBridges = async (
  userId: string,
  cursor?: string,
  limit: number = 20,
  searchQuery?: string
): Promise<UserCollectionBridgesApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  if (searchQuery) {
    params.append('q', searchQuery);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<any>(
      `/users/${userId}/collections/bridges?${params.toString()}`
    );
    
    // Backend response formatını kontrol et ve normalize et
    const responseData = response.data;
    
    // Detaylı log: Backend'den ne geldi?
    console.log('[getUserCollectionBridges] API Request:', {
      url: `/users/${userId}/collections/bridges?${params.toString()}`,
      requestedLimit: limit,
      cursor,
      searchQuery,
    });
    
    console.log('[getUserCollectionBridges] API Response Detay:', {
      url: `/users/${userId}/collections/bridges?${params.toString()}`,
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
      
      console.log('[getUserCollectionBridges] Normalized Response:', {
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
      
      // Zaten doğru formatta - backend'den gelen pagination'ı kullan
      const items = responseData.items || [];
      const pagination = responseData.pagination || {};
      
      // Eğer items boşsa ve hasMore true ise, bu bir sorun demektir - hasMore'u false yap
      // Backend'in cursor pagination'ı düzgün çalışmıyor olabilir
      const correctedHasMore = items.length > 0 ? pagination.hasMore : false;
      
      // Cursor yoksa son item'ın id'sini cursor olarak kullan
      const finalCursor = pagination.cursor || (items.length > 0 ? items[items.length - 1].id : undefined);
      
      console.log('[getUserCollectionBridges] Response (already formatted):', {
        itemsCount: items.length,
        backendHasMore: pagination.hasMore,
        correctedHasMore,
        backendCursor: pagination.cursor,
        fallbackCursor: items.length > 0 ? items[items.length - 1].id : undefined,
        finalCursor,
        itemIds: items.map((item: any) => item?.id).filter(Boolean) || [],
        warning: items.length === 0 && pagination.hasMore ? '⚠️ Backend hasMore=true ama items boş! hasMore false yapıldı.' : null,
      });
      
      // Cursor'ı güncelle ve hasMore'u düzelt
      return {
        items,
        pagination: {
          ...pagination,
          hasMore: correctedHasMore,
          cursor: finalCursor,
        },
      } as UserCollectionBridgesApiResponse;
    }
    
    // Beklenmeyen format
    console.warn('[getUserCollectionBridges] Unexpected response format:', responseData);
    return {
      items: [],
      pagination: {
        hasMore: false,
        limit,
      },
    };
  } catch (error: any) {
    console.error('[getUserCollectionBridges] API Error:', {
      url: `/users/${userId}/collections/bridges?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
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
  const response = await apiService.getClient().get<TrustUser[]>(
    `/users/${userId}/trusts`,
    { params }
  );
  return response.data;
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
  
  const response = await apiService.getClient().get<TrusterUser[]>(
    `/users/${userId}/trusters`,
    { params: Object.keys(params).length > 0 ? params : undefined }
  );
  return response.data;
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
    const response = await apiService.getClient().get<SuggestedUsersApiResponse>(
      `/users/suggested?${params.toString()}`
    );
    
    console.log('[getSuggestedUsers] 📥 API Response:', {
      url: `/users/suggested?${params.toString()}`,
      itemsCount: response.data?.items?.length || 0,
      hasMore: response.data?.pagination?.hasMore,
      nextCursor: response.data?.pagination?.nextCursor,
      firstUser: response.data?.items?.[0]?.name,
      lastUser: response.data?.items?.[response.data.items.length - 1]?.name,
    });
    
    return response.data;
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
