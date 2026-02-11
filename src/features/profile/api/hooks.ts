import { useQuery, useQueryClient, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  getUserProfile,
  getInventory,
  getUserPosts,
  getUserReviews,
  getUserBenchmarks,
  getUserTipsAndTricks,
  getUserReplies,
  getUserLadderBadges,
  getUserCollectionAchievements,
  getUserCollectionBridges,
  searchProductExperiences,
  getTrustList,
  getTrusterList,
  addToTrustList,
  removeFromTrustList,
  updateProfile,
  reportUser,
  getSuggestedUsers,
  updateInventoryItem,
  deleteInventoryItem,
  addInventoryItem,
  muteUser,
  unmuteUser,
  blockUser,
  unblockUser,
  type UserFeedApiResponse,
  type UpdateProfileRequest,
  type UpdateProfileResponse,
  type ReportUserRequest,
  type ReportUserResponse,
  type ProductExperienceSearchResponse,
  type UpdateInventoryItemRequest,
  type UpdateInventoryItemResponse,
  type DeleteInventoryItemResponse,
  type AddInventoryItemRequest,
  type AddInventoryItemResponse,
} from './profileApi';
import { useAppStore } from '@/src/store/appStore';
import type {
  TrustUser,
  TrusterUser,
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
  SuggestedUser,
  SuggestedUsersApiResponse,
} from '../types';

/**
 * Query Keys - Profile feature için cache key pattern'leri
 */
export const profileKeys = {
  all: ['profile'] as const,
  profile: (userId: string) => [...profileKeys.all, 'profile', userId] as const,
  trusts: () => [...profileKeys.all, 'trusts'] as const,
  trustList: (userId: string, searchQuery?: string) => 
    [...profileKeys.trusts(), userId, ...(searchQuery ? ['search', searchQuery] : [])] as const,
  trusters: () => [...profileKeys.all, 'trusters'] as const,
  trusterList: (userId: string, searchQuery?: string, sort?: string) =>
    [...profileKeys.trusters(), userId, ...(searchQuery ? ['search', searchQuery] : []), ...(sort ? ['sort', sort] : [])] as const,
  suggested: () => [...profileKeys.all, 'suggested'] as const,
  suggestedUsers: (searchQuery?: string) =>
    [...profileKeys.suggested(), ...(searchQuery ? ['search', searchQuery] : [])] as const,
  inventory: () => [...profileKeys.all, 'inventory'] as const,
  posts: () => [...profileKeys.all, 'posts'] as const,
  userPosts: (userId: string) =>
    [...profileKeys.posts(), userId] as const,
  reviews: () => [...profileKeys.all, 'reviews'] as const,
  userReviews: (userId: string) =>
    [...profileKeys.reviews(), userId] as const,
  benchmarks: () => [...profileKeys.all, 'benchmarks'] as const,
  userBenchmarks: (userId: string) =>
    [...profileKeys.benchmarks(), userId] as const,
  tips: () => [...profileKeys.all, 'tips'] as const,
  userTipsAndTricks: (userId: string) =>
    [...profileKeys.tips(), userId] as const,
  replies: () => [...profileKeys.all, 'replies'] as const,
  userReplies: (userId: string) =>
    [...profileKeys.replies(), userId] as const,
  ladders: () => [...profileKeys.all, 'ladders'] as const,
  userLadderBadges: (userId: string) =>
    [...profileKeys.ladders(), userId] as const,
  collections: () => [...profileKeys.all, 'collections'] as const,
  userCollectionAchievements: (userId: string, limit?: number) =>
    [...profileKeys.collections(), 'achievements', userId, ...(limit ? [limit] : [])] as const,
  userCollectionBridges: (userId: string, limit?: number) =>
    [...profileKeys.collections(), 'bridges', userId, ...(limit ? [limit] : [])] as const,
};

/**
 * Get Trust List query hook
 * Kullanıcının trust listesini getirir ve cache'ler
 * 
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useTrustList('user-123', 'john');
 */
export const useTrustList = (
  userId: string | undefined,
  searchQuery?: string
) => {
  const queryClient = useQueryClient();

  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  const previousSearchQueryRef = useRef<string | undefined>(searchQuery);
  
  const queryResult = useQuery<TrustUser[], Error>({
    queryKey: userId 
      ? profileKeys.trustList(userId, searchQuery) 
      : ['profile', 'trusts', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getTrustList(userId, searchQuery);
    },
    enabled: !!userId,
    staleTime: hasSearchQuery ? 0 : 2 * 60 * 60 * 1000, // 2 saat cache (search yoksa)
    gcTime: hasSearchQuery ? 0 : 4 * 60 * 60 * 1000, // 4 saat garbage collection
    refetchOnMount: hasSearchQuery ? 'always' : false, // Search yoksa cache'den al
    refetchOnWindowFocus: hasSearchQuery, // Sadece search varsa window focus'ta refetch
    placeholderData: undefined,
    retry: hasSearchQuery ? 0 : 1,
  });

  useEffect(() => {
    if (previousSearchQueryRef.current !== searchQuery && userId) {
      // Search query değiştiğinde cache'i temizle
      queryClient.removeQueries({
        queryKey: profileKeys.trusts(),
        exact: false,
      });
      
      if (hasSearchQuery) {
        queryResult.refetch();
      }
      
      previousSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, userId, hasSearchQuery, queryClient, queryResult]);

  return queryResult;
};

/**
 * Get Truster List query hook
 * Kullanıcının truster listesini getirir ve cache'ler
 *
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @param sort - Sıralama kriteri (opsiyonel, default: 'date_desc')
 * @returns React Query hook result
 */
export const useTrusterList = (
  userId: string | undefined,
  searchQuery?: string,
  sort?: import('./profileApi').TrusterListSort
) => {
  const queryClient = useQueryClient();

  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  const previousSearchQueryRef = useRef<string | undefined>(searchQuery);

  const queryResult = useQuery<TrusterUser[], Error>({
    queryKey: userId
      ? profileKeys.trusterList(userId, searchQuery, sort)
      : ['profile', 'trusters', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getTrusterList(userId, searchQuery, sort);
    },
    enabled: !!userId,
    staleTime: 0, // 2 saat cache (search yoksa)
    gcTime: 0, // 4 saat garbage collection
    refetchOnMount: hasSearchQuery ? 'always' : false, // Search yoksa cache'den al
    refetchOnWindowFocus: hasSearchQuery, // Sadece search varsa window focus'ta refetch
    placeholderData: undefined,
    retry: hasSearchQuery ? 0 : 1,
  });

  useEffect(() => {
    if (previousSearchQueryRef.current !== searchQuery && userId) {
      // Search query değiştiğinde cache'i temizle
      queryClient.removeQueries({
        queryKey: profileKeys.trusters(),
        exact: false,
      });

      if (hasSearchQuery) {
        queryResult.refetch();
      }

      previousSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, userId, hasSearchQuery, queryClient, queryResult]);

  return queryResult;
};

/**
 * Get User Profile query hook
 * Kullanıcı profil bilgilerini getirir ve cache'ler
 * 
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useUserProfile('user-123');
 */
export const useUserProfile = (userId: string | undefined) => {
  // CRITICAL FIX: userId validasyonu - boş string veya geçersiz değer kontrolü
  const isValidUserId = userId && 
    typeof userId === 'string' && 
    userId.trim().length > 0;
  
  return useQuery<UserProfile, Error>({
    queryKey: isValidUserId ? profileKeys.profile(userId.trim()) : ['profile', 'profile', 'disabled'],
    queryFn: () => {
      if (!isValidUserId) {
        throw new Error('User ID is required and must be a non-empty string');
      }
      return getUserProfile(userId.trim());
    },
    enabled: Boolean(isValidUserId),
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Inventory infinite query hook
 * Kullanıcının envanter ürünlerini infinite scroll ile getirir
 * 
 * List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
 * Token'dan user_id otomatik olarak alınır
 * 
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInventory(20);
 */
export const useInventory = (limit: number = 20) => {
  return useInfiniteQuery<InventoryApiResponse, Error>({
    queryKey: [...profileKeys.inventory(), limit],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getInventory(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      
      // Son item'ın id'sini cursor olarak kullan
      return lastPage.pagination.cursor;
    },
    // CACHE DİSABLED: Her zaman fresh data çek (inventory güncel olmalı)
    staleTime: 0,  // Cache yok - her zaman fresh data
    gcTime: 0,     // Cache'de tutma - hemen temizle
    refetchOnMount: 'always',  // Her mount'ta yeniden fetch
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
    // PERFORMANCE FIX: Sadece data, hasNextPage ve error değişikliklerinde render et
    // isFetchingNextPage değişiklikleri render tetiklemez
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading', 'isPending'],
  });
};

/**
 * Get User Posts infinite query hook
 * Kullanıcının profil feed postlarını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 3)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserPosts('user-123', 3);
 */
export const useUserPosts = (userId: string | undefined, limit: number = 3, options?: { enabled?: boolean }) => {
  return useInfiniteQuery<UserFeedApiResponse, Error>({
    queryKey: userId ? [...profileKeys.userPosts(userId), limit] : ['profile', 'posts', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      // Not: Backend'de cursor parametresi yok, ama infinite scroll için
      // son item'ın id'sini pageParam olarak kullanıyoruz
      // Backend bunu desteklemiyorsa, her zaman aynı veriyi dönecektir
      const cursor = pageParam as string | undefined;
      return getUserPosts(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      
      // Son item'ın id'sini cursor olarak kullan
      // Not: Backend cursor'ı desteklemiyorsa, bu çalışmayabilir
      // Bu durumda backend'in cursor desteği eklenmesi gerekir
      return lastPage.pagination.cursor;
    },
    enabled: options?.enabled !== undefined ? Boolean(options.enabled) : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: (failureCount, error: any) => {
      // Timeout hatalarında retry yap (network sorunları için)
      if (error?.message?.includes('timeout') || error?.code === 'ECONNABORTED') {
        return failureCount < 2; // Timeout için 2 kez daha dene
      }
      // Diğer hatalar için 1 kez dene
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    // isFetchingNextPage değişikliklerini render tetikleyicisinden çıkar
    // Sadece data, hasNextPage ve error değişiklikleri render tetikler
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading', 'isPending'],
  });
};

/**
 * Get User Reviews infinite query hook
 * Kullanıcının profil review postlarını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserReviews('user-123', 5);
 */
export const useUserReviews = (userId: string | undefined, limit: number = 5, options?: { enabled?: boolean }) => {
  return useInfiniteQuery<ProfileReviewsApiResponse, Error>({
    queryKey: userId ? profileKeys.userReviews(userId) : ['profile', 'reviews', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserReviews(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: options?.enabled !== undefined ? Boolean(options.enabled) : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
    // isFetchingNextPage değişikliklerini render tetikleyicisinden çıkar
    // Sadece data, hasNextPage ve error değişiklikleri render tetikler
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading'],
  });
};

/**
 * Get User Benchmarks infinite query hook
 * Kullanıcının profil benchmark postlarını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserBenchmarks('user-123', 5);
 */
export const useUserBenchmarks = (userId: string | undefined, limit: number = 5, options?: { enabled?: boolean }) => {
  return useInfiniteQuery<ProfileBenchmarksApiResponse, Error>({
    queryKey: userId ? profileKeys.userBenchmarks(userId) : ['profile', 'benchmarks', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserBenchmarks(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: options?.enabled !== undefined ? Boolean(options.enabled) : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
    // isFetchingNextPage değişikliklerini render tetikleyicisinden çıkar
    // Sadece data, hasNextPage ve error değişiklikleri render tetikler
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading'],
  });
};

/**
 * Get User Tips & Tricks infinite query hook
 * Kullanıcının profil tips & tricks postlarını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserTipsAndTricks('user-123', 5);
 */
export const useUserTipsAndTricks = (userId: string | undefined, limit: number = 5, options?: { enabled?: boolean }) => {
  return useInfiniteQuery<ProfileTipsAndTricksApiResponse, Error>({
    queryKey: userId ? profileKeys.userTipsAndTricks(userId) : ['profile', 'tips', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserTipsAndTricks(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: options?.enabled !== undefined ? Boolean(options.enabled) : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
    // isFetchingNextPage değişikliklerini render tetikleyicisinden çıkar
    // Sadece data, hasNextPage ve error değişiklikleri render tetikler
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading'],
  });
};

/**
 * Get User Ladder Badges infinite query hook
 * Kullanıcının profil ladder badge'lerini infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserLadderBadges('user-123', 5);
 */
export const useUserLadderBadges = (userId: string | undefined, limit: number = 5) => {
  return useInfiniteQuery<ProfileLadderBadgesApiResponse, Error>({
    queryKey: userId ? profileKeys.userLadderBadges(userId) : ['profile', 'ladders', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserLadderBadges(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: 'always', // Her mount'ta yeniden fetch
    refetchOnWindowFocus: false,
    retry: 1,
    // isFetchingNextPage değişikliklerini render tetikleyicisinden çıkar
    // Sadece data, hasNextPage ve error değişiklikleri render tetikler
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading'],
  });
};

/**
 * Get User Replies / Questions infinite query hook
 * Kullanıcının profil replies/question postlarını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserReplies('user-123', 5);
 */
export const useUserReplies = (userId: string | undefined, limit: number = 5, options?: { enabled?: boolean }) => {
  return useInfiniteQuery<ProfileRepliesApiResponse, Error>({
    queryKey: userId ? profileKeys.userReplies(userId) : ['profile', 'replies', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserReplies(userId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: options?.enabled !== undefined ? Boolean(options.enabled) : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get User Collection Achievements infinite query hook
 * Kullanıcının collection achievements'larını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserCollectionAchievements('user-123', 20);
 */
export const useUserCollectionAchievements = (
  userId: string | undefined, 
  limit: number = 20,
  searchQuery?: string
) => {
  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;
  
  return useInfiniteQuery<UserCollectionAchievementsApiResponse, Error>({
    queryKey: userId ? [...profileKeys.userCollectionAchievements(userId, limit), searchQuery] : ['profile', 'collections', 'achievements', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserCollectionAchievements(userId, cursor, limit, searchQuery);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // Eğer hasMore false ise veya items boşsa, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore || lastPage.items.length === 0) {
        return undefined;
      }
      // Son item'ın id'sini cursor olarak kullan
      return lastPage.pagination.cursor;
    },
    enabled: !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get User Collection Bridges infinite query hook
 * Kullanıcının collection bridges'larını infinite scroll ile getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserCollectionBridges('user-123', 20);
 */
export const useUserCollectionBridges = (
  userId: string | undefined, 
  limit: number = 20,
  searchQuery?: string
) => {
  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;
  
  return useInfiniteQuery<UserCollectionBridgesApiResponse, Error>({
    queryKey: userId ? [...profileKeys.userCollectionBridges(userId, limit), searchQuery] : ['profile', 'collections', 'bridges', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserCollectionBridges(userId, cursor, limit, searchQuery);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.cursor ?? undefined;
    },
    enabled: !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Add to Trust List mutation hook
 * Kullanıcıyı trust listesine ekler
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: trustUser, isPending } = useAddToTrustList();
 * trustUser('target-user-id');
 */
export const useAddToTrustList = () => {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation<void, Error, string>({
    mutationFn: (targetUserId: string) => addToTrustList(targetUserId),
    // Optimistic Update: Sadece isTrusted durumunu güncelle (buton metni için)
    onMutate: async (targetUserId) => {
      // İlgili query'leri iptal et (optimistic update çakışmasını önle)
      if (user?.id) {
        await queryClient.cancelQueries({ queryKey: profileKeys.profile(user.id) });
        await queryClient.cancelQueries({ queryKey: profileKeys.profile(targetUserId) });
        await queryClient.cancelQueries({ queryKey: profileKeys.trusts() });
      }

      // Eski cache'leri kaydet (rollback için)
      const previousUserProfile = user?.id 
        ? queryClient.getQueryData<UserProfile>(profileKeys.profile(user.id))
        : undefined;
      const previousTargetProfile = queryClient.getQueryData<UserProfile>(profileKeys.profile(targetUserId));

      // Optimistic Update: Sadece isTrusted durumunu güncelle (buton metni için)
      // Trust/truster sayılarını güncelleme - backend henüz güncellememiş olabilir
      if (user?.id) {
        queryClient.setQueryData<UserProfile>(profileKeys.profile(user.id), (old) => {
          if (!old) return old;
          return {
            ...old,
            stats: {
              ...old.stats,
              trust: (old.stats?.trust ?? 0) + 1,
            },
          };
        });
      }

      // Target user'ın profilinde sadece isTrusted'ı güncelle
      queryClient.setQueryData<UserProfile>(profileKeys.profile(targetUserId), (old) => {
        if (!old) return old;
        return {
          ...old,
          isTrusted: true, // Buton metni için: "Un Trust" yazacak
          // Truster sayısını güncelleme - backend henüz güncellememiş olabilir
        };
      });

      // Rollback için context döndür
      return { previousUserProfile, previousTargetProfile };
    },
    onError: (error, targetUserId, context) => {
      console.error('[useAddToTrustList] Mutation error:', error);
      
      // Rollback: Eski cache'leri geri yükle
      if (context?.previousUserProfile && user?.id) {
        queryClient.setQueryData(profileKeys.profile(user.id), context.previousUserProfile);
      }
      if (context?.previousTargetProfile) {
        queryClient.setQueryData(profileKeys.profile(targetUserId), context.previousTargetProfile);
      }
    },
    onSuccess: (_, targetUserId) => {
      // Backend başarılı yanıt verdi, cache'leri invalidate et (güncel veriyi çek)
      if (user?.id) {
        // User A'nın trust listesini invalidate et
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusts(),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
      }
      if (targetUserId) {
        // User C'nin profilini ve truster listesini invalidate et
        // CRITICAL FIX: Trust işlemi yapıldığında target user'ın truster listesi de güncellenmeli
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(targetUserId),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusters(),
        });
      }
    },
  });
};

/**
 * Remove from Trust List mutation hook
 * Kullanıcıyı trust listesinden kaldırır (untrust)
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: untrustUser, isPending } = useRemoveFromTrustList();
 * untrustUser('target-user-id');
 */
export const useRemoveFromTrustList = () => {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation<void, Error, string>({
    mutationFn: (targetUserId: string) => removeFromTrustList(targetUserId),
    // Optimistic Update: Sadece isTrusted durumunu güncelle (buton metni için)
    onMutate: async (targetUserId) => {
      // İlgili query'leri iptal et (optimistic update çakışmasını önle)
      if (user?.id) {
        await queryClient.cancelQueries({ queryKey: profileKeys.profile(user.id) });
        await queryClient.cancelQueries({ queryKey: profileKeys.profile(targetUserId) });
        await queryClient.cancelQueries({ queryKey: profileKeys.trusts() });
      }

      // Eski cache'leri kaydet (rollback için)
      const previousUserProfile = user?.id 
        ? queryClient.getQueryData<UserProfile>(profileKeys.profile(user.id))
        : undefined;
      const previousTargetProfile = queryClient.getQueryData<UserProfile>(profileKeys.profile(targetUserId));

      // Optimistic Update: Sadece isTrusted durumunu güncelle (buton metni için)
      // Trust/truster sayılarını güncelleme - backend henüz güncellememiş olabilir
      if (user?.id) {
        queryClient.setQueryData<UserProfile>(profileKeys.profile(user.id), (old) => {
          if (!old) return old;
          return {
            ...old,
            stats: {
              ...old.stats,
              trust: Math.max(0, (old.stats?.trust ?? 0) - 1),
            },
          };
        });
      }

      // Target user'ın profilinde sadece isTrusted'ı güncelle
      queryClient.setQueryData<UserProfile>(profileKeys.profile(targetUserId), (old) => {
        if (!old) return old;
        return {
          ...old,
          isTrusted: false, // Buton metni için: "Trust" yazacak
          // Truster sayısını güncelleme - backend henüz güncellememiş olabilir
        };
      });

      // Rollback için context döndür
      return { previousUserProfile, previousTargetProfile };
    },
    onError: (error, targetUserId, context) => {
      console.error('[useRemoveFromTrustList] Mutation error:', error);
      
      // Rollback: Eski cache'leri geri yükle
      if (context?.previousUserProfile && user?.id) {
        queryClient.setQueryData(profileKeys.profile(user.id), context.previousUserProfile);
      }
      if (context?.previousTargetProfile) {
        queryClient.setQueryData(profileKeys.profile(targetUserId), context.previousTargetProfile);
      }
    },
    onSuccess: (_, targetUserId) => {
      // Backend başarılı yanıt verdi, cache'leri invalidate et (güncel veriyi çek)
      if (user?.id) {
        // User A'nın trust listesini invalidate et
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusts(),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
      }
      if (targetUserId) {
        // User C'nin profilini ve truster listesini invalidate et
        // CRITICAL FIX: Untrust işlemi yapıldığında target user'ın truster listesi de güncellenmeli
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(targetUserId),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusters(),
        });
      }
    },
  });
};

/**
 * Update Profile mutation hook
 * Kullanıcının kendi profil bilgilerini günceller
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: updateUserProfile, isPending } = useUpdateProfile();
 * updateUserProfile({
 *   name: 'Ömer Faruk',
 *   biography: 'Teknoloji meraklısı',
 *   badge: ['badge-456', 'badge-789']
 * });
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAppStore();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Profil query'sini güncelle
      if (user?.id) {
        queryClient.setQueryData(profileKeys.profile(user.id), data.profile);
        // Store'daki user bilgisini de güncelle
        updateUser({
          fullName: data.profile.name,
          avatar: data.profile.avatar || undefined,
        });
        // CRITICAL FIX: Cache'i invalidate et - backend'den güncel veriyi çek
        // Avatar ve banner upload sonrası backend otomatik güncelliyor, cache'i yenile
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
          exact: false,
        });
        console.log('[useUpdateProfile] ✅ Profile cache invalidated after update');
      }
    },
    onError: (error) => {
      console.error('[useUpdateProfile] Mutation error:', error);
    },
  });
};

/**
 * Report User mutation hook
 * Kullanıcıyı raporlar
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: reportUser, isPending } = useReportUser();
 * reportUser({
 *   userId: 'current-user-id',
 *   targetUserId: 'target-user-id',
 *   data: { category: 'SPAM', description: 'Spam mesajlar gönderiyor' }
 * });
 */
export const useReportUser = () => {
  return useMutation<
    ReportUserResponse,
    Error,
    { userId: string; targetUserId: string; data: ReportUserRequest }
  >({
    mutationFn: ({ userId, targetUserId, data }) => reportUser(userId, targetUserId, data),
    onSuccess: () => {
      console.log('[useReportUser] ✅ User reported successfully');
    },
    onError: (error) => {
      console.error('[useReportUser] ❌ Mutation error:', error);
    },
  });
};

/**
 * Mute User mutation hook
 * Kullanıcıyı sessize alır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: muteUser, isPending } = useMuteUser();
 * muteUser({
 *   userId: 'current-user-id',
 *   targetUserId: 'target-user-id'
 * });
 */
export const useMuteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    void,
    Error,
    { userId: string; targetUserId: string }
  >({
    mutationFn: ({ userId, targetUserId }) => muteUser(userId, targetUserId),
    onMutate: async ({ targetUserId }) => {
      // Optimistic update: Cache'i hemen güncelle
      const queryKey = profileKeys.profile(targetUserId);
      await queryClient.cancelQueries({ queryKey });
      
      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
      
      if (__DEV__) {
        console.log('[useMuteUser] onMutate - Previous profile:', {
          targetUserId,
          previousIsMuted: previousProfile?.isMuted,
        });
      }
      
      if (previousProfile) {
        // Optimistic update: isMuted'ı true yap
        queryClient.setQueryData<UserProfile>(queryKey, {
          ...previousProfile,
          isMuted: true,
        });
        
        if (__DEV__) {
          console.log('[useMuteUser] ✅ Optimistic update: isMuted set to true');
        }
      }
      
      return { previousProfile };
    },
    onSuccess: (_, variables) => {
      // Invalidate yapmıyoruz çünkü optimistic update zaten doğru değeri set etti
      // Invalidate yaparsak query refetch edilir ve backend'den gelen veri optimistic update'i ezer
      // Sadece cache'i güncellemek yeterli (optimistic update zaten yaptı)
      console.log('[useMuteUser] ✅ User muted successfully');
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki değeri geri yükle
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(variables.targetUserId),
          context.previousProfile
        );
      }
      console.error('[useMuteUser] ❌ Mutation error:', error);
    },
  });
};

/**
 * Unmute User mutation hook
 * Kullanıcının sessizliğini kaldırır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: unmuteUser, isPending } = useUnmuteUser();
 * unmuteUser({
 *   userId: 'current-user-id',
 *   targetUserId: 'target-user-id'
 * });
 */
export const useUnmuteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    boolean,
    Error,
    { userId: string; targetUserId: string }
  >({
    mutationFn: ({ userId, targetUserId }) => unmuteUser(userId, targetUserId),
    onMutate: async ({ targetUserId }) => {
      // Optimistic update: Cache'i hemen güncelle
      const queryKey = profileKeys.profile(targetUserId);
      await queryClient.cancelQueries({ queryKey });
      
      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
      
      if (__DEV__) {
        console.log('[useUnmuteUser] onMutate - Previous profile:', {
          targetUserId,
          previousIsMuted: previousProfile?.isMuted,
        });
      }
      
      if (previousProfile) {
        // Optimistic update: isMuted'ı false yap
        queryClient.setQueryData<UserProfile>(queryKey, {
          ...previousProfile,
          isMuted: false,
        });
        
        if (__DEV__) {
          console.log('[useUnmuteUser] ✅ Optimistic update: isMuted set to false');
        }
      }
      
      return { previousProfile };
    },
    onSuccess: (result, variables) => {
      // Invalidate yapmıyoruz çünkü optimistic update zaten doğru değeri set etti
      // Invalidate yaparsak query refetch edilir ve backend'den gelen veri optimistic update'i ezer
      if (result) {
        // Başarılı unmute - optimistic update zaten isMuted: false yaptı
        console.log('[useUnmuteUser] ✅ User unmuted successfully');
      } else {
        // 404 durumunda optimistic update'i geri al (kullanıcı zaten mute değildi)
        // FIX: isMuted: false olmalı çünkü kullanıcı zaten mute değil
        const queryKey = profileKeys.profile(variables.targetUserId);
        const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
        if (previousProfile) {
          queryClient.setQueryData<UserProfile>(queryKey, {
            ...previousProfile,
            isMuted: false, // FIX: Kullanıcı zaten mute değilse isMuted: false olmalı
          });
          
          if (__DEV__) {
            console.log('[useUnmuteUser] ⚠️ Reverted optimistic update (user was not muted)');
          }
        }
        console.log('[useUnmuteUser] ⚠️ User was not muted (404)');
      }
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki değeri geri yükle
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(variables.targetUserId),
          context.previousProfile
        );
      }
      console.error('[useUnmuteUser] ❌ Mutation error:', error);
    },
  });
};

/**
 * Block User mutation hook
 * Kullanıcıyı engeller
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: blockUser, isPending } = useBlockUser();
 * blockUser({
 *   userId: 'current-user-id',
 *   targetUserId: 'target-user-id'
 * });
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    void,
    Error,
    { userId: string; targetUserId: string }
  >({
    mutationFn: ({ userId, targetUserId }) => blockUser(userId, targetUserId),
    onMutate: async ({ targetUserId }) => {
      // Optimistic update: Cache'i hemen güncelle
      const queryKey = profileKeys.profile(targetUserId);
      await queryClient.cancelQueries({ queryKey });
      
      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
      
      if (__DEV__) {
        console.log('[useBlockUser] onMutate - Previous profile:', {
          targetUserId,
          previousIsBlocked: previousProfile?.isBlocked,
        });
      }
      
      if (previousProfile) {
        // Optimistic update: isBlocked'ı true yap
        queryClient.setQueryData<UserProfile>(queryKey, {
          ...previousProfile,
          isBlocked: true,
        });
        
        if (__DEV__) {
          console.log('[useBlockUser] ✅ Optimistic update: isBlocked set to true');
        }
      }
      
      return { previousProfile };
    },
    onSuccess: (_, variables) => {
      console.log('[useBlockUser] ✅ User blocked successfully');
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki değeri geri yükle
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(variables.targetUserId),
          context.previousProfile
        );
      }
      console.error('[useBlockUser] ❌ Mutation error:', error);
    },
  });
};

/**
 * Unblock User mutation hook
 * Kullanıcının engelini kaldırır
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: unblockUser, isPending } = useUnblockUser();
 * unblockUser({
 *   userId: 'current-user-id',
 *   targetUserId: 'target-user-id'
 * });
 */
export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    boolean,
    Error,
    { userId: string; targetUserId: string }
  >({
    mutationFn: ({ userId, targetUserId }) => unblockUser(userId, targetUserId),
    onMutate: async ({ targetUserId }) => {
      // Optimistic update: Cache'i hemen güncelle
      const queryKey = profileKeys.profile(targetUserId);
      await queryClient.cancelQueries({ queryKey });
      
      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
      
      if (__DEV__) {
        console.log('[useUnblockUser] onMutate - Previous profile:', {
          targetUserId,
          previousIsBlocked: previousProfile?.isBlocked,
        });
      }
      
      if (previousProfile) {
        // Optimistic update: isBlocked'ı false yap
        queryClient.setQueryData<UserProfile>(queryKey, {
          ...previousProfile,
          isBlocked: false,
        });
        
        if (__DEV__) {
          console.log('[useUnblockUser] ✅ Optimistic update: isBlocked set to false');
        }
      }
      
      return { previousProfile };
    },
    onSuccess: (result, variables) => {
      if (result) {
        // Başarılı unblock - optimistic update zaten isBlocked: false yaptı
        console.log('[useUnblockUser] ✅ User unblocked successfully');
      } else {
        // 404 durumunda optimistic update'i geri al (kullanıcı zaten block değildi)
        const queryKey = profileKeys.profile(variables.targetUserId);
        const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);
        if (previousProfile) {
          queryClient.setQueryData<UserProfile>(queryKey, {
            ...previousProfile,
            isBlocked: false, // Kullanıcı zaten block değilse isBlocked: false olmalı
          });
          
          if (__DEV__) {
            console.log('[useUnblockUser] ⚠️ Reverted optimistic update (user was not blocked)');
          }
        }
        console.log('[useUnblockUser] ⚠️ User was not blocked (404)');
      }
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki değeri geri yükle
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(variables.targetUserId),
          context.previousProfile
        );
      }
      console.error('[useUnblockUser] ❌ Mutation error:', error);
    },
  });
};

/**
 * Update Inventory Item mutation hook
 * Inventory item'ı günceller
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: updateInventory, isPending } = useUpdateInventoryItem();
 * updateInventory({
 *   inventoryId: 'inventory-123',
 *   data: { hasOwned: true, experienceSummary: 'Harika bir ürün' }
 * });
 */
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateInventoryItemResponse,
    Error,
    { inventoryId: string; data: UpdateInventoryItemRequest }
  >({
    mutationFn: ({ inventoryId, data }) => updateInventoryItem(inventoryId, data),
    onSuccess: (data, variables) => {
      // Inventory listesini invalidate et
      queryClient.invalidateQueries({ queryKey: profileKeys.inventory() });
      // Cache'i tamamen temizle
      queryClient.removeQueries({ queryKey: profileKeys.inventory() });
      console.log('[useUpdateInventoryItem] ✅ Inventory item updated successfully', { inventoryId: variables.inventoryId });
    },
    onError: (error) => {
      console.error('[useUpdateInventoryItem] ❌ Mutation error:', error);
    },
  });
};

/**
 * Add Inventory Item mutation hook
 * Inventory'ye yeni ürün ekler
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: addInventory, isPending } = useAddInventoryItem();
 * addInventory({
 *   productId: 'product-123',
 *   selectedDurationId: 'duration-1',
 *   selectedLocationId: 'location-1',
 *   selectedPurposeId: 'purpose-1',
 *   content: 'Ürün deneyimi',
 *   experience: [...],
 *   status: 'own',
 *   images: [...]
 * });
 */
export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AddInventoryItemResponse,
    Error,
    AddInventoryItemRequest
  >({
    mutationFn: (data) => addInventoryItem(data),
    onSuccess: (data, variables) => {
      // Inventory listesini invalidate et
      queryClient.invalidateQueries({ queryKey: profileKeys.inventory() });
      // Cache'i tamamen temizle
      queryClient.removeQueries({ queryKey: profileKeys.inventory() });
      console.log('[useAddInventoryItem] ✅ Inventory item added successfully', { productId: variables.productId });
    },
    onError: (error) => {
      console.error('[useAddInventoryItem] ❌ Mutation error:', error);
    },
  });
};

/**
 * Delete Inventory Item mutation hook
 * Inventory item'ı siler
 *
 * @returns React Query mutation hook result
 *
 * @example
 * const { mutate: deleteInventory, isPending } = useDeleteInventoryItem();
 * deleteInventory('inventory-123');
 */
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteInventoryItemResponse, Error, string>({
    mutationFn: (inventoryId) => deleteInventoryItem(inventoryId),
    onSuccess: (data, inventoryId) => {
      // Inventory listesini invalidate et
      queryClient.invalidateQueries({ queryKey: profileKeys.inventory() });
      // Cache'i tamamen temizle
      queryClient.removeQueries({ queryKey: profileKeys.inventory() });
      console.log('[useDeleteInventoryItem] ✅ Inventory item deleted successfully', { inventoryId });
    },
    onError: (error) => {
      console.error('[useDeleteInventoryItem] ❌ Mutation error:', error);
    },
  });
};

/**
 * Get Suggested Users infinite query hook
 * Önerilen kullanıcıları infinite scroll ile getirir
 *
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSuggestedUsers();
 * const allUsers = data?.pages.flatMap(page => page.items) ?? [];
 */
export const useSuggestedUsers = (searchQuery?: string) => {
  const queryClient = useQueryClient();
  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  return useInfiniteQuery<SuggestedUsersApiResponse, Error>({
    queryKey: profileKeys.suggestedUsers(searchQuery),
    queryFn: ({ pageParam }) => 
      getSuggestedUsers(searchQuery, pageParam as string | undefined, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: true,
    staleTime: hasSearchQuery ? 0 : 5 * 60 * 1000, // Search varsa 0, yoksa 5 dakika
    gcTime: hasSearchQuery ? 0 : 10 * 60 * 1000, // Search varsa 0, yoksa 10 dakika
    refetchOnMount: hasSearchQuery ? 'always' : false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

