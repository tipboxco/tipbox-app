import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveEvents, getUpcomingEvents, getEventDetail, getEventPosts, getLimitedEvent, getAchievements, createEventPost, type CreateEventPostRequest, type CreateEventPostResponse } from './communityEventsApi';
import type { EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse, LimitedEventApiResponse, AchievementsApiResponse } from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import { feedKeys } from '@/src/features/feed/api/hooks';

/**
 * Query Keys - Events feature için cache key pattern'leri
 */
export const eventsKeys = {
  all: ['events'] as const,
  active: (cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'active', cursor, limit] as const,
  upcoming: (cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'upcoming', cursor, limit] as const,
  detail: (eventId: string) => [...eventsKeys.all, 'detail', eventId] as const,
  posts: (eventId: string, cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'posts', eventId, cursor, limit] as const,
  limited: () => [...eventsKeys.all, 'limited'] as const,
  achievements: (cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'achievements', cursor, limit] as const,
};

/**
 * Get Active Events infinite query hook
 * Aktif eventlerin listesini infinite scroll ile getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useActiveEvents();
 */
export const useActiveEvents = (limit: number = 20) => {
  return useInfiniteQuery<EventsApiResponse, Error>({
    queryKey: eventsKeys.active(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getActiveEvents(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 1000,  // 2 dakika - tab geçişlerinde anında göster
    gcTime: 10 * 60 * 1000,     // 10 dakika - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Upcoming Events infinite query hook
 * Yaklaşan eventlerin listesini infinite scroll ile getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useUpcomingEvents();
 */
export const useUpcomingEvents = (limit: number = 20) => {
  return useInfiniteQuery<UpcomingEventsApiResponse, Error>({
    queryKey: eventsKeys.upcoming(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getUpcomingEvents(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 1000,  // 2 dakika - tab geçişlerinde anında göster
    gcTime: 10 * 60 * 1000,     // 10 dakika - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Event Detail query hook
 * Belirli bir event'in detaylı bilgilerini getirir
 * 
 * Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
 *
 * @param eventId - Event ID
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error, refetch } = useEventDetail('eventId123');
 */
export const useEventDetail = (eventId: string) => {
  return useQuery<EventDetailApiResponse, Error>({
    queryKey: eventsKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: !!eventId, // eventId varsa query çalışır
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 5 * 60 * 1000,  // 5 dakika - ekran değişimlerinde anında göster
    gcTime: 15 * 60 * 1000,    // 15 dakika - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Event Posts infinite query hook
 * Belirli bir event'in postlarını infinite scroll ile getirir
 * 
 * Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
 *
 * @param eventId - Event ID
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useEventPosts('eventId123');
 */
export const useEventPosts = (eventId: string, limit: number = 20) => {
  return useInfiniteQuery<FeedApiResponse, Error>({
    queryKey: eventsKeys.posts(eventId, undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getEventPosts(eventId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      // Backend'den cursor geliyorsa onu kullan, yoksa son item'ın id'sini kullan
      return lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].data.id : undefined);
    },
    enabled: !!eventId, // eventId varsa query çalışır
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 5 * 60 * 1000,  // 5 dakika - ekran değişimlerinde anında göster
    gcTime: 15 * 60 * 1000,    // 15 dakika - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Limited Event query hook
 * /events/limited endpoint'inden limited event bilgilerini getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error, refetch } = useLimitedEvent();
 */
export const useLimitedEvent = () => {
  return useQuery<LimitedEventApiResponse, Error>({
    queryKey: eventsKeys.limited(),
    queryFn: () => getLimitedEvent(),
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 1000,  // 2 dakika - tab geçişlerinde anında göster
    gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Achievements infinite query hook
 * /events/achievements endpoint'inden achievement listesini infinite scroll ile getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useAchievements();
 */
export const useAchievements = (limit: number = 20) => {
  return useInfiniteQuery<AchievementsApiResponse, Error>({
    queryKey: eventsKeys.achievements(undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getAchievements(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 1000,  // 2 dakika - tab geçişlerinde anında göster
    gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Create Event Post mutation hook
 * Belirli bir event için post oluşturur
 * 
 * Cache Invalidation: Mutation sonrası ilgili cache'leri invalidate et
 *
 * @param eventId - Event ID
 * @returns React Query mutation hook result
 *
 * @example
 * const createPost = useCreateEventPost('eventId123');
 * createPost.mutate({
 *   description: 'Post description',
 *   productId: 'productId123',
 *   images: ['imageUri1', 'imageUri2']
 * });
 */
export const useCreateEventPost = (eventId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateEventPostResponse, Error, CreateEventPostRequest>({
    mutationFn: (data) => createEventPost(eventId, data),
    onSuccess: () => {
      // 1. Event posts'u invalidate et - yeni post eklendiğinde listeyi güncelle
      queryClient.invalidateQueries({ queryKey: eventsKeys.posts(eventId) });
      // 2. Event detail'i invalidate et (post sayısı değişebilir)
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) });
      // 3. Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      // 4. Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // 5. Active events listesini invalidate et (event post sayısı değişebilir)
      queryClient.invalidateQueries({ queryKey: eventsKeys.active() });
    },
  });
};

