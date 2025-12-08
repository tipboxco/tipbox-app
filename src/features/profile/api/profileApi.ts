import { apiService } from '../../../services/ApiService';
import type {
  UserProfile,
  InventoryItem,
  ProfilePost,
  ProfileReview,
  ProfileBenchmark,
  ProfileTipsAndTricks,
  ProfileReplies,
  ProfileLadderBadge,
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
  params.append('limit', limit.toString());
  
  // Not: Backend'de cursor parametresi yok (API dokümantasyonunda yok)
  // Bu yüzden cursor'ı query parametresi olarak göndermiyoruz
  // Backend cursor destekliyorsa, ileride eklenebilir

  try {
    const response = await apiService.getClient().get<ProfileFeedItem[]>(
      `/users/${userId}/feed?${params.toString()}`
    );
    
    // Backend'den direkt array geliyor
    const items = response.data || [];
    
    // Pagination bilgisini oluştur
    // Eğer gelen item sayısı limit'e eşit veya fazlaysa, daha fazla item olabilir
    // Eğer limit'ten azsa, tüm item'lar gelmiş demektir
    const hasMore = items.length >= limit;
    
    return {
      items,
      pagination: {
        hasMore,
        limit,
        cursor: items.length > 0 ? items[items.length - 1].id : undefined,
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
 * Kullanıcının review postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileReview[] - Kullanıcının review listesi
 */
export const getUserReviews = async (
  userId: string
): Promise<ProfileReview[]> => {
  const response = await apiService.getClient().get<ProfileReview[]>(
    `/users/${userId}/reviews`
  );
  return response.data;
};

/**
 * Get User Benchmarks endpoint function
 * Kullanıcının benchmark postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileBenchmark[] - Kullanıcının benchmark listesi
 */
export const getUserBenchmarks = async (
  userId: string
): Promise<ProfileBenchmark[]> => {
  const response = await apiService.getClient().get<ProfileBenchmark[]>(
    `/users/${userId}/benchmarks`
  );
  return response.data;
};

/**
 * Get User Tips & Tricks endpoint function
 * Kullanıcının tips & tricks postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileTipsAndTricks[] - Kullanıcının tips & tricks listesi
 */
export const getUserTipsAndTricks = async (
  userId: string
): Promise<ProfileTipsAndTricks[]> => {
  const response = await apiService.getClient().get<ProfileTipsAndTricks[]>(
    `/users/${userId}/tips`
  );
  return response.data;
};

/**
 * Get User Ladder Badges endpoint function
 * Kullanıcının ladder badge'lerini getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileLadderBadge[] - Kullanıcının ladder badge listesi
 */
export const getUserLadderBadges = async (
  userId: string
): Promise<ProfileLadderBadge[]> => {
  const response = await apiService.getClient().get<ProfileLadderBadge[]>(
    `/users/${userId}/ladder/badges`
  );
  return response.data;
};

/**
 * Get User Questions endpoint function
 * Kullanıcının questions postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileReplies[] - Kullanıcının question listesi
 */
export const getUserReplies = async (
  userId: string
): Promise<ProfileReplies[]> => {
  const response = await apiService.getClient().get<ProfileReplies[]>(
    `/users/${userId}/questions`
  );
  return response.data;
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
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
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
    
    // Eğer direkt array döndürüyorsa, pagination objesi oluştur
    if (Array.isArray(responseData)) {
      const items = responseData;
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
