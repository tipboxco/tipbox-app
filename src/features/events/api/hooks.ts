import { useInfiniteQuery } from '@tanstack/react-query';
import { getActiveEvents, getUpcomingEvents } from './communityEventsApi';
import type { EventsApiResponse } from '@/src/types/EventCard';

/**
 * Query Keys - Events feature için cache key pattern'leri
 */
export const eventsKeys = {
  all: ['events'] as const,
  active: (cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'active', cursor, limit] as const,
  upcoming: (cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'upcoming', cursor, limit] as const,
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
  return useInfiniteQuery<EventsApiResponse, Error>({
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

