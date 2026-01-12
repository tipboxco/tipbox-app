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
  type UserFeedApiResponse,
  type UpdateProfileRequest,
  type UpdateProfileResponse,
  type ReportUserRequest,
  type ReportUserResponse,
  type ProductExperienceSearchResponse,
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

  // Search query varsa cache'i devre dışı bırak (her zaman fresh data)
  // Search query yoksa normal cache kullan (5 dakika staleTime)
  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  // Search query değiştiğinde önceki query'yi reset et ve cache'i temizle
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
    staleTime: hasSearchQuery ? 0 : 2 * 60 * 60 * 1000, // Search varsa 0 (her zaman fresh), yoksa 2 saat
    gcTime: hasSearchQuery ? 0 : 4 * 60 * 60 * 1000, // Search varsa cache'leme yok, yoksa 4 saat
    refetchOnMount: hasSearchQuery ? 'always' : false, // Search varsa her zaman refetch
    refetchOnWindowFocus: hasSearchQuery, // Search varsa window focus'ta refetch
    // Search query değiştiğinde önceki data'yı gösterme
    placeholderData: undefined,
    // Search query değiştiğinde query'yi yeniden başlat
    retry: hasSearchQuery ? 0 : 1, // Search varsa retry yok (hızlı hata göster)
  });

  // Search query değiştiğinde cache'i temizle ve manuel refetch yap
  useEffect(() => {
    if (previousSearchQueryRef.current !== searchQuery && userId) {
      // Search query değiştiğinde önceki tüm trust list cache'lerini temizle
      queryClient.removeQueries({
        queryKey: profileKeys.trusts(),
        exact: false,
      });
      
      // Search query varsa manuel refetch yap (cache bypass)
      if (hasSearchQuery) {
        queryResult.refetch();
      }
      
      previousSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery, userId, hasSearchQuery, queryClient, queryResult]);

  // Cache kontrolü için log - React Query v5'te onSuccess/onError yok, useEffect kullanıyoruz
  useEffect(() => {
    if (queryResult.isSuccess && queryResult.data && userId) {
      const hasSearch = hasSearchQuery;
      
      // Cache kontrolü için log
      console.log('✅ [React Query Cache] Trust list fetched successfully');
      console.log('📊 [React Query Cache] Data count:', queryResult.data.length);
      console.log('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.log('🚫 [React Query Cache] Cache disabled for search:', hasSearch);
      console.log('🔑 [React Query Cache] Query Key:', profileKeys.trustList(userId, searchQuery));
      
      // Cache'deki veriyi kontrol et (sadece search yoksa)
      if (!hasSearch) {
        const cachedData = queryClient.getQueryData<TrustUser[]>(
          profileKeys.trustList(userId, searchQuery)
        );
        console.log('💾 [React Query Cache] Cached data exists:', !!cachedData);
        console.log('💾 [React Query Cache] Cached data count:', cachedData?.length || 0);
      } else {
        console.log('💾 [React Query Cache] Cache bypassed (search active)');
      }
      
      console.log('🔄 [React Query Cache] Is fetching:', queryResult.isFetching);
      console.log('📦 [React Query Cache] Data from cache:', queryResult.dataUpdatedAt > 0 && !hasSearch ? 'Yes' : 'No (fresh)');
    }
    
    if (queryResult.isError && queryResult.error) {
      console.error('❌ [React Query Cache] Trust list fetch error:', queryResult.error);
      console.error('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.error('🚫 [React Query Cache] Cache disabled for search:', hasSearchQuery);
    }
  }, [queryResult.isSuccess, queryResult.isError, queryResult.data, queryResult.isFetching, queryResult.dataUpdatedAt, queryResult.error, userId, searchQuery, hasSearchQuery, queryClient]);

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
    staleTime: hasSearchQuery ? 0 : 2 * 60 * 60 * 1000,
    gcTime: hasSearchQuery ? 0 : 4 * 60 * 60 * 1000,
    refetchOnMount: hasSearchQuery ? 'always' : false,
    refetchOnWindowFocus: hasSearchQuery,
    placeholderData: undefined,
    retry: hasSearchQuery ? 0 : 1,
  });

  useEffect(() => {
    if (previousSearchQueryRef.current !== searchQuery && userId) {
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

  useEffect(() => {
    if (queryResult.isSuccess && queryResult.data && userId) {
      const hasSearch = hasSearchQuery;

      console.log('✅ [React Query Cache] Truster list fetched successfully');
      console.log('📊 [React Query Cache] Data count:', queryResult.data.length);
      console.log('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.log('🚫 [React Query Cache] Cache disabled for search:', hasSearch);
      console.log('🔑 [React Query Cache] Query Key:', profileKeys.trusterList(userId, searchQuery, sort));

      if (!hasSearch) {
        const cachedData = queryClient.getQueryData<TrusterUser[]>(
          profileKeys.trusterList(userId, searchQuery, sort)
        );
        console.log('💾 [React Query Cache] Cached data exists:', !!cachedData);
        console.log('💾 [React Query Cache] Cached data count:', cachedData?.length || 0);
      } else {
        console.log('💾 [React Query Cache] Cache bypassed (search active)');
      }

      console.log('🔄 [React Query Cache] Is fetching:', queryResult.isFetching);
      console.log(
        '📦 [React Query Cache] Data from cache:',
        queryResult.dataUpdatedAt > 0 && !hasSearch ? 'Yes' : 'No (fresh)'
      );
    }

    if (queryResult.isError && queryResult.error) {
      console.error('❌ [React Query Cache] Truster list fetch error:', queryResult.error);
      console.error('🔍 [React Query Cache] Search query:', searchQuery || '(empty)');
      console.error('🚫 [React Query Cache] Cache disabled for search:', hasSearchQuery);
    }
  }, [
    queryResult.isSuccess,
    queryResult.isError,
    queryResult.data,
    queryResult.isFetching,
    queryResult.dataUpdatedAt,
    queryResult.error,
    userId,
    searchQuery,
    hasSearchQuery,
    queryClient,
  ]);

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
  return useQuery<UserProfile, Error>({
    queryKey: userId ? profileKeys.profile(userId) : ['profile', 'profile', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserProfile(userId);
    },
    enabled: !!userId,
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
    // List-based caching: Liste scroll'unda anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
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
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
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
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
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
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
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
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
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
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
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
      // Eğer hasMore false ise, daha fazla sayfa yok
      if (!lastPage.pagination.hasMore) {
        // Log'u sadece ilk kez bas (re-render'ları azaltmak için)
        return undefined;
      }
      
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini cursor olarak kullan
      const cursor = lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].id : undefined);
      
      // Log'u sadece önemli durumlarda bas (re-render'ları azaltmak için)
      if (cursor) {
        console.log('[useUserCollectionBridges] getNextPageParam: Will fetch next page with cursor:', cursor);
      }
      
      return cursor;
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
    onSuccess: () => {
      // Trust listesini invalidate et - güncel listeyi göster
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusts(),
        });
        // Profil bilgilerini de invalidate et - trust sayısı güncellenecek
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
      }
    },
    onError: (error) => {
      console.error('[useAddToTrustList] Mutation error:', error);
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
    onSuccess: () => {
      // Trust listesini invalidate et - güncel listeyi göster
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.trusts(),
        });
        // Profil bilgilerini de invalidate et - trust sayısı güncellenecek
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
      }
    },
    onError: (error) => {
      console.error('[useRemoveFromTrustList] Mutation error:', error);
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

