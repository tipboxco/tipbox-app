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
} from '../types';

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
  const response = await apiService.getClient().get<UserProfile>(
    `/users/${userId}/profile`
  );
  return response.data;
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
 * Get User Collection Achievements endpoint function
 * Kullanıcının collection achievements'larını getirir (pagination ile)
 * 
 * API Endpoint: GET /users/{id}/collections/achievements
 * - cursor: Pagination cursor (opsiyonel)
 * - limit: Sayfa başına item sayısı (default: 20, min: 1, max: 100)
 * 
 * @param userId - Kullanıcı ID'si
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns UserCollectionAchievementsApiResponse - Achievement items ve pagination bilgisi
 */
export const getUserCollectionAchievements = async (
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<UserCollectionAchievementsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
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
      
      // Zaten doğru formatta
      return responseData as UserCollectionBridgesApiResponse;
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
 * Get Truster List endpoint function
 * Kullanıcının truster listesini getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns TrusterUser[] - Truster listesi
 */
export const getTrusterList = async (
  userId: string,
  searchQuery?: string
): Promise<TrusterUser[]> => {
  const params = searchQuery ? { q: searchQuery } : {};
  const response = await apiService.getClient().get<TrusterUser[]>(
    `/users/${userId}/trusters`,
    { params }
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
