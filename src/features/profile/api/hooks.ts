import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getTrustList, getTrusterList } from './trustApi';
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
  type UserFeedApiResponse,
} from './profileApi';
import type {
  TrustUser,
  TrusterUser,
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
  trusterList: (userId: string, searchQuery?: string) =>
    [...profileKeys.trusters(), userId, ...(searchQuery ? ['search', searchQuery] : [])] as const,
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
    staleTime: hasSearchQuery ? 0 : 5 * 60 * 1000, // Search varsa 0 (her zaman fresh), yoksa 5 dakika
    gcTime: hasSearchQuery ? 0 : 10 * 60 * 1000, // Search varsa cache'leme yok, yoksa 10 dakika
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
 * @returns React Query hook result
 */
export const useTrusterList = (
  userId: string | undefined,
  searchQuery?: string
) => {
  const queryClient = useQueryClient();

  const hasSearchQuery = !!searchQuery && searchQuery.trim().length > 0;

  const previousSearchQueryRef = useRef<string | undefined>(searchQuery);

  const queryResult = useQuery<TrusterUser[], Error>({
    queryKey: userId
      ? profileKeys.trusterList(userId, searchQuery)
      : ['profile', 'trusters', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getTrusterList(userId, searchQuery);
    },
    enabled: !!userId,
    staleTime: hasSearchQuery ? 0 : 5 * 60 * 1000,
    gcTime: hasSearchQuery ? 0 : 10 * 60 * 1000,
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
      console.log('🔑 [React Query Cache] Query Key:', profileKeys.trusterList(userId, searchQuery));

      if (!hasSearch) {
        const cachedData = queryClient.getQueryData<TrusterUser[]>(
          profileKeys.trusterList(userId, searchQuery)
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
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Inventory query hook
 * Kullanıcının envanter ürünlerini getirir (cache olmadan)
 * Token'dan user_id otomatik olarak alınır
 * 
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useInventory();
 */
export const useInventory = () => {
  return useQuery<InventoryItem[], Error>({
    queryKey: profileKeys.inventory(),
    queryFn: () => getInventory(),
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
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
export const useUserPosts = (userId: string | undefined, limit: number = 3) => {
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
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: true, // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Reviews query hook
 * Kullanıcının profil review postlarını getirir (cache olmadan)
 *
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserReviews('user-123');
 */
export const useUserReviews = (userId: string | undefined) => {
  return useQuery<ProfileReview[], Error>({
    queryKey: userId ? profileKeys.userReviews(userId) : ['profile', 'reviews', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserReviews(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Benchmarks query hook
 * Kullanıcının profil benchmark postlarını getirir (cache olmadan)
 *
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserBenchmarks('user-123');
 */
export const useUserBenchmarks = (userId: string | undefined) => {
  return useQuery<ProfileBenchmark[], Error>({
    queryKey: userId ? profileKeys.userBenchmarks(userId) : ['profile', 'benchmarks', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserBenchmarks(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Tips & Tricks query hook
 * Kullanıcının profil tips & tricks postlarını getirir (cache olmadan)
 *
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserTipsAndTricks('user-123');
 */
export const useUserTipsAndTricks = (userId: string | undefined) => {
  return useQuery<ProfileTipsAndTricks[], Error>({
    queryKey: userId ? profileKeys.userTipsAndTricks(userId) : ['profile', 'tips', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserTipsAndTricks(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Ladder Badges query hook
 * Kullanıcının profil ladder badge'lerini getirir (cache olmadan)
 *
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserLadderBadges('user-123');
 */
export const useUserLadderBadges = (userId: string | undefined) => {
  return useQuery<ProfileLadderBadge[], Error>({
    queryKey: userId ? profileKeys.userLadderBadges(userId) : ['profile', 'ladders', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserLadderBadges(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get User Replies / Questions query hook
 * Kullanıcının profil replies/question postlarını getirir (cache olmadan)
 *
 * @param userId - Kullanıcı ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useUserReplies('user-123');
 */
export const useUserReplies = (userId: string | undefined) => {
  return useQuery<ProfileReplies[], Error>({
    queryKey: userId ? profileKeys.userReplies(userId) : ['profile', 'replies', 'disabled'],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserReplies(userId);
    },
    enabled: !!userId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always', // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
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
export const useUserCollectionAchievements = (userId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<UserCollectionAchievementsApiResponse, Error>({
    queryKey: userId ? profileKeys.userCollectionAchievements(userId, limit) : ['profile', 'collections', 'achievements', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserCollectionAchievements(userId, cursor, limit);
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
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: true, // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
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
export const useUserCollectionBridges = (userId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<UserCollectionBridgesApiResponse, Error>({
    queryKey: userId ? profileKeys.userCollectionBridges(userId, limit) : ['profile', 'collections', 'bridges', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getUserCollectionBridges(userId, cursor, limit);
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
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: true, // Her mount'ta yeniden fetch et
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

