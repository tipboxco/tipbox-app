import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@/src/features/wallet/api/hooks';
import {
  getExpertBalance,
  getExpertRequests,
  getExpertRequestDetail,
  createExpertRequest,
  answerExpertRequest,
} from './expertApi';
import type {
  ExpertBalance,
  ExpertRequest,
  ExpertRequestsResponse,
  CreateExpertRequestRequest,
  AnswerExpertRequestRequest,
  AnswerExpertRequestResponse,
} from './expertApi';

/**
 * Query Keys - Expert feature için cache key pattern'leri
 */
export const expertKeys = {
  all: ['expert'] as const,
  balance: () => [...expertKeys.all, 'balance'] as const,
  requests: (status?: string) => [...expertKeys.all, 'requests', status] as const,
  requestDetail: (requestId: string) => [...expertKeys.all, 'request', requestId] as const,
};

/**
 * Get Expert Balance query hook
 * Expert TIPS balance'ını getirir
 *
 * @returns React Query hook result
 */
export const useExpertBalance = () => {
  return useQuery<ExpertBalance, Error>({
    queryKey: expertKeys.balance(),
    queryFn: () => getExpertBalance(),
    staleTime: 30 * 1000, // 30 saniye - balance sık değişebilir
    gcTime: 5 * 60 * 1000, // 5 dakika - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Expert Requests infinite query hook
 * Expert request'leri infinite scroll ile getirir
 *
 * @param status - Filtreleme için durum (PENDING, ANSWERED, CLOSED)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 */
export const useExpertRequests = (
  status?: 'PENDING' | 'ANSWERED' | 'CLOSED',
  limit: number = 20
) => {
  return useInfiniteQuery<ExpertRequestsResponse, Error>({
    queryKey: expertKeys.requests(status),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getExpertRequests(status, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
};

/**
 * Get Expert Request Detail query hook
 * Expert request detayını getirir
 *
 * @param requestId - Expert request ID'si
 * @returns React Query hook result
 */
export const useExpertRequestDetail = (requestId: string | undefined) => {
  return useQuery<ExpertRequest, Error>({
    queryKey: requestId ? expertKeys.requestDetail(requestId) : ['expert', 'request', 'disabled'],
    queryFn: () => {
      if (!requestId) {
        throw new Error('Request ID is required');
      }
      return getExpertRequestDetail(requestId);
    },
    enabled: !!requestId,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
};

/**
 * Create Expert Request mutation hook
 * Expert request oluşturur
 *
 * @returns React Query mutation hook
 */
export const useCreateExpertRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<ExpertRequest, Error, CreateExpertRequestRequest>({
    mutationFn: createExpertRequest,
    onSuccess: () => {
      // Expert requests listesini invalidate et
      queryClient.invalidateQueries({ queryKey: expertKeys.requests() });
      // Wallet balance invalidate et - expert request TIPS harcıyor
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
  });
};

/**
 * Answer Expert Request mutation hook
 * Expert request'e cevap verir
 *
 * @returns React Query mutation hook
 */
export const useAnswerExpertRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<AnswerExpertRequestResponse, Error, { requestId: string; data: AnswerExpertRequestRequest }>({
    mutationFn: ({ requestId, data }) => answerExpertRequest(requestId, data),
    onSuccess: (_, variables) => {
      // Request detail'ı invalidate et
      queryClient.invalidateQueries({ queryKey: expertKeys.requestDetail(variables.requestId) });
      // Requests listesini invalidate et
      queryClient.invalidateQueries({ queryKey: expertKeys.requests() });
      // Expert balance invalidate et - cevap sonrası TIPS kazanılıyor
      queryClient.invalidateQueries({ queryKey: expertKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
  });
};

