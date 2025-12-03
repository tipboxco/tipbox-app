import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getActiveEvents, getUpcomingEvents, getEventDetail, getEventPosts } from './communityEventsApi';
import type { EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse } from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

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
};

/**
 * Get Active Events infinite query hook
 * Aktif eventlerin listesini infinite scroll ile getirir
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useActiveEvents();
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
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: true, // Her mount'ta yeniden fetch
    refetchOnWindowFocus: true, // Focus'ta yeniden fetch
    retry: 1,
  });
};

/**
 * Get Upcoming Events infinite query hook
 * Yaklaşan eventlerin listesini infinite scroll ile getirir
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUpcomingEvents();
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
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: true, // Her mount'ta yeniden fetch
    refetchOnWindowFocus: true, // Focus'ta yeniden fetch
    retry: 1,
  });
};

/**
 * Get Event Detail query hook
 * Belirli bir event'in detaylı bilgilerini getirir
 *
 * @param eventId - Event ID
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useEventDetail('eventId123');
 */
export const useEventDetail = (eventId: string) => {
  return useQuery<EventDetailApiResponse, Error>({
    queryKey: eventsKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: !!eventId, // eventId varsa query çalışır
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: true, // Her mount'ta yeniden fetch
    refetchOnWindowFocus: true, // Focus'ta yeniden fetch
    retry: 1,
  });
};

/**
 * Get Event Posts infinite query hook
 * Belirli bir event'in postlarını infinite scroll ile getirir
 *
 * @param eventId - Event ID
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useEventPosts('eventId123');
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
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: true, // Her mount'ta yeniden fetch
    refetchOnWindowFocus: true, // Focus'ta yeniden fetch
    retry: 1,
  });
};

