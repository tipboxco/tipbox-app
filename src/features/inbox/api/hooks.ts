import { useQuery } from '@tanstack/react-query';
import { getMessages } from './messagesApi';
import type { InboxMessage } from '../types';

/**
 * Query Keys - Inbox feature için cache key pattern'leri
 */
export const inboxKeys = {
  all: ['inbox'] as const,
  messages: () => [...inboxKeys.all, 'messages'] as const,
};

/**
 * Get Messages query hook
 * Kullanıcının mesaj listesini getirir ve cache'ler
 *
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useMessages();
 */
export const useMessages = () => {
  return useQuery<InboxMessage[], Error>({
    queryKey: inboxKeys.messages(),
    queryFn: () => getMessages(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};


