import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveEvents,
  getUpcomingEvents,
  getEventDetail,
  getEventPosts,
  getEventBadges,
  getEventBadgeDetail,
  getLimitedEvent,
  getCollections,
  getCollectionCategories,
  getCollectionDetail,
  getAchievements,
  createEventPost,
  joinEvent,
  leaveEvent,
  getEventRequirements,
  createEventPostNew,
  createEventFreePost,
  getEventPostDetail,
  deleteEventPost,
  toggleEventPostLike,
  addEventPostComment,
  getEventPostComments,
  deleteEventPostComment,
  createEventPostWithContext,
  type CommunityEventsFilter,
  type CreateEventPostRequest,
  type CreateEventPostResponse,
  type EventBadgesResponse,
  type EventRequirementsResponse,
  type CreateEventPostRequestNew,
  type CreateEventPostResponseNew,
  type CreateEventFreePostRequest,
  type EventPostDetail,
  type ToggleLikeResponse,
  type CommentResponse,
  type CommentsResponse,
  type CreateEventPostWithContextRequestV2 as CreateEventPostWithContextRequest,
  type CreateEventPostWithContextResponse,
} from './communityEventsApi';
import { getSurveyQuestions, submitSurveyQuestionAnswer, completeSurvey } from './surveyApi';
import { getMainCategories, getSubCategories, getCategoryById } from './medusaApi';
import type { MedusaCategory } from '../types/medusa.types';
import type { EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse, LimitedEventApiResponse, AchievementsApiResponse, EventBadgeDetailResponse } from '../types';
import type {
  CollectionDetailResponse,
  CollectionsListParams,
  CollectionsListResponse,
  CollectionCategoriesResponse,
} from '../types/collection.types';
import type { SurveyQuestionsApiResponse, SurveyCompleteApiResponse } from '../types/survey.types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';
import { feedKeys } from '@/src/features/feed/api/hooks';

/**
 * Query Keys - Events feature için cache key pattern'leri
 */
export const eventsKeys = {
  all: ['events'] as const,
  active: (cursor?: string, limit?: number, search?: string, filters?: CommunityEventsFilter) =>
    [...eventsKeys.all, 'active', cursor, limit, search, filters ?? null] as const,
  upcoming: (cursor?: string, limit?: number, search?: string, filters?: CommunityEventsFilter) =>
    [...eventsKeys.all, 'upcoming', cursor, limit, search, filters ?? null] as const,
  detail: (eventId: string) => [...eventsKeys.all, 'detail', eventId] as const,
  posts: (eventId: string, cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'posts', eventId, cursor, limit] as const,
  // YENİ: event-post detail için key (Section 4.2)
  eventPostDetail: (eventId: string, postId: string) =>
    [...eventsKeys.all, 'posts', 'detail', eventId, postId] as const,
  // YENİ: event-post comments için key (Section 4.6)
  eventPostComments: (eventId: string, postId: string, cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'posts', 'comments', eventId, postId, cursor, limit] as const,
  badges: (eventId: string, cursor?: string, limit?: number) =>
    [...eventsKeys.all, 'badges', eventId, cursor, limit] as const,
  // YENİ: Badge detail için key
  badgeDetail: (eventId: string, badgeId: string) =>
    [...eventsKeys.all, 'badges', 'detail', eventId, badgeId] as const,
  limited: () => [...eventsKeys.all, 'limited'] as const,
  collectionsList: (params?: Omit<CollectionsListParams, 'cursor' | 'limit'>) =>
    [...eventsKeys.all, 'collections', 'list', params ?? null] as const,
  collectionCategories: () => [...eventsKeys.all, 'collections', 'categories'] as const,
  collectionDetail: (collectionId: string, badgeSearch?: string) =>
    [...eventsKeys.all, 'collections', 'detail', collectionId, badgeSearch ?? ''] as const,
  surveyQuestions: (surveyId: string) =>
    [...eventsKeys.all, 'surveys', 'questions', surveyId] as const,
  achievements: (cursor?: string, limit?: number, search?: string) =>
    [...eventsKeys.all, 'achievements', cursor, limit, search] as const,
  requirements: (eventId: string) => [...eventsKeys.all, 'requirements', eventId] as const,
  // Medusa Categories
  mainCategories: () => [...eventsKeys.all, 'categories', 'main'] as const,
  subCategories: (parentId: string) =>
    [...eventsKeys.all, 'categories', 'sub', parentId] as const,
  categoryDetail: (categoryId: string) =>
    [...eventsKeys.all, 'categories', 'detail', categoryId] as const,
};

/**
 * Get Active Events infinite query hook
 * Aktif eventlerin listesini infinite scroll ile getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param search - Event başlığı veya açıklamasında arama (opsiyonel)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useActiveEvents(20, 'iphone');
 */
export const useActiveEvents = (
  limit: number = 20,
  search?: string,
  filters?: CommunityEventsFilter
) => {
  return useInfiniteQuery<EventsApiResponse, Error>({
    queryKey: eventsKeys.active(undefined, limit, search, filters),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getActiveEvents(cursor, limit, search, filters);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,     // 4 saat - cache'de tut
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
 * @param search - Event başlığı veya açıklamasında arama (opsiyonel)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useUpcomingEvents(20, 'survey');
 */
export const useUpcomingEvents = (
  limit: number = 20,
  search?: string,
  filters?: CommunityEventsFilter
) => {
  return useInfiniteQuery<UpcomingEventsApiResponse, Error>({
    queryKey: eventsKeys.upcoming(undefined, limit, search, filters),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getUpcomingEvents(cursor, limit, search, filters);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,     // 4 saat - cache'de tut
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
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
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
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Event Badges infinite query hook
 * Belirli bir event'in badge'lerini infinite scroll ile getirir
 * 
 * Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
 *
 * @param eventId - Event ID
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useEventBadges('eventId123');
 */
export const useEventBadges = (eventId: string, limit: number = 20) => {
  return useInfiniteQuery<EventBadgesApiResponse, Error>({
    queryKey: eventsKeys.badges(eventId, undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getEventBadges(eventId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    enabled: !!eventId, // eventId varsa query çalışır
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Event Badge Detail query hook
 * Belirli bir event badge'inin detaylarını ve kullanıcının o badge'deki ilerlemesini getirir
 * 
 * Screen-based caching: Badge detail modal açılışında anında veri göster
 *
 * @param eventId - Event ID
 * @param badgeId - Badge ID
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useEventBadgeDetail('eventId123', 'badgeId456');
 */
export const useEventBadgeDetail = (eventId: string, badgeId: string) => {
  return useQuery<EventBadgeDetailResponse, Error>({
    queryKey: eventsKeys.badgeDetail(eventId, badgeId),
    queryFn: () => getEventBadgeDetail(eventId, badgeId),
    enabled: !!eventId && !!badgeId, // Her iki ID de varsa query çalışır
    // Screen-based caching: Badge detail modal açılışında anında veri göster
    staleTime: 5 * 60 * 1000,  // 5 dakika - Badge progress güncel olmalı
    gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan
    refetchOnWindowFocus: false, // Modal açılışında refetch yapma
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
    staleTime: 30 * 60 * 1000,  // 30 dakika - cache invalid olana kadar backend'e istek atma
    gcTime: 60 * 60 * 1000,     // 1 saat - cache'de tut
    refetchOnMount: false,      // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};

/**
 * EP-01: Get Collections infinite scroll hook
 * Collections listesini infinite scroll ile getirir.
 * Filtre veya search değiştiğinde otomatik olarak başa döner.
 */
export const useCollections = (
  params: Omit<CollectionsListParams, 'cursor' | 'limit'>
) => {
  return useInfiniteQuery<CollectionsListResponse, Error>({
    queryKey: eventsKeys.collectionsList(params),
    queryFn: ({ pageParam }) =>
      getCollections({ ...params, cursor: pageParam as string | undefined, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
    staleTime: 5 * 60 * 1000,   // 5 dakika
    gcTime: 10 * 60 * 1000,     // 10 dakika
    retry: 1,
  });
};

/**
 * EP-02: Get Collection Categories hook
 * CollectionsTab chip filtrelerinde gösterilecek kategorileri getirir.
 * "All" chip'i frontend tarafında eklenir.
 */
export const useCollectionCategories = () => {
  return useQuery<CollectionCategoriesResponse, Error>({
    queryKey: eventsKeys.collectionCategories(),
    queryFn: getCollectionCategories,
    staleTime: 24 * 60 * 60 * 1000,  // 24 saat - kategoriler nadir değişir
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Get Collection Detail query hook
 * Backend'den collection detayı ve badge listesini getirir (404/error'da mock fallback ekran tarafında).
 * badgeSearch verilirse GET /api/collections/:id?search=... ile sadece eşleşen badge'ler döner.
 *
 * @param collectionId - Collection ID
 * @param badgeSearch - Badge name/description'da aranacak metin (opsiyonel)
 * @returns React Query hook result
 */
export const useCollectionDetail = (collectionId: string, badgeSearch?: string) => {
  return useQuery<CollectionDetailResponse, Error>({
    queryKey: eventsKeys.collectionDetail(collectionId, badgeSearch),
    queryFn: () => getCollectionDetail(collectionId, { badgeSearch: badgeSearch?.trim() || undefined }),
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,  // 5 dakika
    gcTime: 10 * 60 * 1000,    // 10 dakika
    retry: 1,
  });
};

/**
 * Get Survey Questions query hook
 * GET /surveys/{surveyId}/questions – event'ten gelen anketin soruları
 */
export const useSurveyQuestions = (surveyId: string) => {
  return useQuery<SurveyQuestionsApiResponse, Error>({
    queryKey: eventsKeys.surveyQuestions(surveyId),
    queryFn: () => getSurveyQuestions(surveyId),
    enabled: !!surveyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Submit Survey Question Answer mutation hook
 * POST /surveys/{surveyId}/questions/{questionId}/answer – tek soruya cevap (isCompleted döner)
 */
export const useSubmitSurveyQuestionAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      surveyId,
      questionId,
      answerId,
    }: {
      surveyId: string;
      questionId: string;
      answerId: string;
    }) => submitSurveyQuestionAnswer(surveyId, questionId, answerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.surveyQuestions(variables.surveyId) });
    },
  });
};

/**
 * Complete Survey mutation hook
 * POST /surveys/{surveyId}/complete – tüm sorular cevaplandıktan sonra; pointsAwarded, badgesEarned döner
 */
export const useCompleteSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation<SurveyCompleteApiResponse, Error, string>({
    mutationFn: (surveyId: string) => completeSurvey(surveyId),
    onSuccess: (_, surveyId) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.surveyQuestions(surveyId) });
      queryClient.invalidateQueries({ queryKey: eventsKeys.all });
    },
  });
};

/**
 * Get Achievements infinite query hook
 * /events/achievements endpoint'inden achievement listesini infinite scroll ile getirir
 * 
 * Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
 *
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param search - Achievement başlığı veya açıklamasında arama (opsiyonel)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useAchievements(20, 'badge');
 */
export const useAchievements = (limit: number = 20, search?: string) => {
  return useInfiniteQuery<AchievementsApiResponse, Error>({
    queryKey: eventsKeys.achievements(undefined, limit, search),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getAchievements(cursor, limit, search);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    // Tab-based caching: Tab geçişlerinde anında yüklenmiş ekran göster
    staleTime: 30 * 60 * 1000,  // 30 dakika - cache invalid olana kadar backend'e istek atma
    gcTime: 60 * 60 * 1000,      // 1 saat - cache'de tut
    refetchOnMount: false,       // Cache varsa kullan, yoksa fetch et
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
      // CRITICAL: refetchType: 'all' kullanıyoruz ki hem aktif hem inactive query'ler refetch edilsin
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'posts', eventId],
        refetchType: 'all',
      });
      // 2. Event detail'i invalidate et (post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.detail(eventId),
        refetchType: 'all',
      });
      // 3. Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.all,
        refetchType: 'all',
      });
      // 4. Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ 
        queryKey: ['profile'],
        refetchType: 'all',
      });
      // 5. Active events listesini invalidate et (event post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.active(),
        refetchType: 'all',
      });
    },
  });
};

/**
 * Join Event mutation hook
 * Etkinliğe katılır
 *
 * @returns React Query mutation hook
 *
 * @example
 * const joinEventMutation = useJoinEvent();
 * joinEventMutation.mutate('event-123');
 */
export const useJoinEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<EventDetailApiResponse, Error, string>({
    mutationFn: joinEvent,
    onSuccess: (data, eventId) => {
      // Event detail query'sini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) });
      // Active ve upcoming events query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.active() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.upcoming() });
    },
  });
};

/**
 * Leave Event mutation hook
 * Etkinlikten ayrılır
 *
 * @returns React Query mutation hook
 *
 * @example
 * const leaveEventMutation = useLeaveEvent();
 * leaveEventMutation.mutate('event-123');
 */
export const useLeaveEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<EventDetailApiResponse, Error, string>({
    mutationFn: leaveEvent,
    onSuccess: (data, eventId) => {
      // Event detail query'sini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) });
      // Active ve upcoming events query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.active() });
      queryClient.invalidateQueries({ queryKey: eventsKeys.upcoming() });
    },
  });
};

/**
 * Get Event Requirements query hook
 * Etkinlik gereksinimleri ve ilerleme bilgilerini getirir
 *
 * @param eventId - Event ID
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useEventRequirements('event-123');
 */
export const useEventRequirements = (eventId: string | undefined) => {
  return useQuery<EventRequirementsResponse, Error>({
    queryKey: eventId ? eventsKeys.requirements(eventId) : ['events', 'requirements', 'disabled'],
    queryFn: () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      return getEventRequirements(eventId);
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ========================================
// YENİ HOOKS - EVENT POST İŞLEMLERİ
// ========================================

/**
 * Create EventPost mutation hook (YENİ - Section 3.1)
 * /events/{eventId}/posts endpoint'ine POST request göndererek event post oluşturur
 * NOT: Artık /posts/free yerine /events/{eventId}/posts kullanılıyor!
 *
 * @param eventId - Event ID
 * @returns React Query mutation hook result
 *
 * @example
 * const createPost = useCreateEventPostNew('event-123');
 * createPost.mutate({ title: 'Title', body: 'Body', productId: 'prod-123' });
 */
export const useCreateEventPostNew = (eventId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateEventPostResponseNew, Error, CreateEventPostRequestNew>({
    mutationFn: (data) => createEventPostNew(eventId, data),
    onSuccess: () => {
      // 1. Event posts'u invalidate et - yeni post eklendiğinde listeyi güncelle
      // CRITICAL: refetchType: 'all' kullanıyoruz ki hem aktif hem inactive query'ler refetch edilsin
      queryClient.invalidateQueries({ 
        queryKey: ['events', 'posts', eventId],
        refetchType: 'all',
      });
      // 2. Event detail'i invalidate et (post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.detail(eventId),
        refetchType: 'all',
      });
      // 3. Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.all,
        refetchType: 'all',
      });
      // 4. Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ 
        queryKey: ['profile'],
        refetchType: 'all',
      });
      // 5. Active events listesini invalidate et (event post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.active(),
        refetchType: 'all',
      });
    },
  });
};

/**
 * Get EventPost Detail query hook (YENİ - Section 4.2)
 * /events/{eventId}/posts/{postId} endpoint'inden event post detayını getirir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading } = useEventPostDetail('event-123', 'post-456');
 */
export const useEventPostDetail = (eventId: string, postId: string) => {
  return useQuery<EventPostDetail, Error>({
    queryKey: eventsKeys.eventPostDetail(eventId, postId),
    queryFn: () => getEventPostDetail(eventId, postId),
    enabled: !!eventId && !!postId,
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Delete EventPost mutation hook (YENİ - Section 4.3)
 * /events/{eventId}/posts/{postId} endpoint'ine DELETE request göndererek post siler
 * NOT: Sadece post sahibi silebilir
 *
 * @returns React Query mutation hook
 *
 * @example
 * const deletePost = useDeleteEventPost();
 * deletePost.mutate({ eventId: 'event-123', postId: 'post-456' });
 */
export const useDeleteEventPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { eventId: string; postId: string }>({
    mutationFn: ({ eventId, postId }) => deleteEventPost(eventId, postId),
    onSuccess: (_, { eventId }) => {
      // Event posts listesini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.posts(eventId) });
      // Event detail'i invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) });
      // Ana feed'i invalidate et
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
};

/**
 * Toggle EventPost Like mutation hook (YENİ - Section 4.4)
 * /events/{eventId}/posts/{postId}/like endpoint'ine POST request göndererek like toggle yapar
 * NOT: Optimistic update ile anında UI güncellenir
 *
 * @returns React Query mutation hook
 *
 * @example
 * const toggleLike = useToggleEventPostLike();
 * toggleLike.mutate({ eventId: 'event-123', postId: 'post-456' });
 */
export const useToggleEventPostLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ToggleLikeResponse, 
    Error, 
    { eventId: string; postId: string },
    { previousPosts: any }
  >({
    mutationFn: ({ eventId, postId }) => toggleEventPostLike(eventId, postId),
    onMutate: async ({ eventId, postId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: eventsKeys.posts(eventId) });
      
      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(eventsKeys.posts(eventId));
      
      // Optimistic update
      queryClient.setQueryData(
        eventsKeys.posts(eventId),
        (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) =>
                item.data.id === postId
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        stats: {
                          ...item.data.stats,
                          likes: item.data.stats?.isLiked
                            ? item.data.stats.likes - 1
                            : item.data.stats.likes + 1,
                          isLiked: !item.data.stats?.isLiked,
                        },
                      },
                    }
                  : item
              ),
            })),
          };
        }
      );
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(
          eventsKeys.posts(variables.eventId),
          context.previousPosts
        );
      }
    },
    onSuccess: (data, { eventId, postId }) => {
      // Update with server response
      queryClient.setQueryData(
        eventsKeys.posts(eventId),
        (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) =>
                item.data.id === postId
                  ? {
                      ...item,
                      data: {
                        ...item.data,
                        stats: {
                          ...item.data.stats,
                          isLiked: data.liked,
                        },
                      },
                    }
                  : item
              ),
            })),
          };
        }
      );
    },
  });
};

/**
 * Add EventPost Comment mutation hook (YENİ - Section 4.5)
 * /events/{eventId}/posts/{postId}/comments endpoint'ine POST request göndererek yorum ekler
 *
 * @returns React Query mutation hook
 *
 * @example
 * const addComment = useAddEventPostComment();
 * addComment.mutate({ eventId: 'event-123', postId: 'post-456', comment: 'Great!' });
 */
export const useAddEventPostComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CommentResponse, Error, { eventId: string; postId: string; comment: string }>({
    mutationFn: ({ eventId, postId, comment }) => addEventPostComment(eventId, postId, comment),
    onSuccess: (_, { eventId, postId }) => {
      // Comments listesini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.eventPostComments(eventId, postId) });
      // Event posts listesini invalidate et (comment count değişir)
      queryClient.invalidateQueries({ queryKey: eventsKeys.posts(eventId) });
    },
  });
};

/**
 * Get EventPost Comments infinite query hook (YENİ - Section 4.6)
 * /events/{eventId}/posts/{postId}/comments endpoint'inden yorumları infinite scroll ile getirir
 *
 * @param eventId - Event ID
 * @param postId - Post ID
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useEventPostComments('event-123', 'post-456');
 */
export const useEventPostComments = (eventId: string, postId: string, limit: number = 20) => {
  return useInfiniteQuery<CommentsResponse, Error>({
    queryKey: eventsKeys.eventPostComments(eventId, postId, undefined, limit),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getEventPostComments(eventId, postId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      return lastPage.pagination.cursor;
    },
    enabled: !!eventId && !!postId,
    staleTime: 2 * 60 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Delete EventPost Comment mutation hook (YENİ - Section 4.7)
 * /events/{eventId}/posts/{postId}/comments/{commentId} endpoint'ine DELETE request göndererek yorum siler
 * NOT: Sadece yorum sahibi silebilir
 *
 * @returns React Query mutation hook
 *
 * @example
 * const deleteComment = useDeleteEventPostComment();
 * deleteComment.mutate({ eventId: 'event-123', postId: 'post-456', commentId: 'comment-789' });
 */
export const useDeleteEventPostComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { eventId: string; postId: string; commentId: string }>({
    mutationFn: ({ eventId, postId, commentId }) => deleteEventPostComment(eventId, postId, commentId),
    onSuccess: (_, { eventId, postId }) => {
      // Comments listesini invalidate et
      queryClient.invalidateQueries({ queryKey: eventsKeys.eventPostComments(eventId, postId) });
      // Event posts listesini invalidate et (comment count değişir)
      queryClient.invalidateQueries({ queryKey: eventsKeys.posts(eventId) });
    },
  });
};

/**
 * Create Event Post with Context mutation hook (YENİ)
 * /posts/{eventId}/post endpoint'ine POST request göndererek event post oluşturur
 * Bu hook contextType ve contextId ile post oluşturur (multipart/form-data)
 *
 * @returns React Query mutation hook
 *
 * @example
 * const createPost = useCreateEventPostWithContext();
 * createPost.mutate({ 
 *   eventId: 'event-123', 
 *   body: 'Content', 
 *   contextType: 'product', 
 *   contextId: 'prod-456',
 *   images: ['uri1', 'uri2']
 * });
 */
export const useCreateEventPostWithContext = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CreateEventPostWithContextResponse, 
    Error, 
    { eventId: string } & CreateEventPostWithContextRequest
  >({
    mutationFn: ({ eventId, ...data }) => createEventPostWithContext(eventId, data),
    onSuccess: (_, { eventId }) => {
      // 1. Event posts'u invalidate et - yeni post eklendiğinde listeyi güncelle
      // NOTE: eventsKeys.posts(eventId) -> ['events','posts',eventId, undefined, undefined] olduğu için
      // useEventPosts'in key'i (limit içerdiğinden) ile eşleşmeyip invalidate kaçabiliyor.
      // Bu yüzden prefix ile invalidate/refetch yapıyoruz.
      // CRITICAL: refetchType: 'all' kullanıyoruz ki hem aktif hem inactive query'ler refetch edilsin
      // EventDetailScreen unmount edilmiş olsa bile, bir sonraki mount'ta fresh data çekilsin
      queryClient.invalidateQueries({
        queryKey: ['events', 'posts', eventId],
        refetchType: 'all',
      });
      // 2. Event detail'i invalidate et (post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.detail(eventId),
        refetchType: 'all',
      });
      // 3. Ana feed'i invalidate et ki yeni post görünsün
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.all,
        refetchType: 'all',
      });
      // 4. Profil feed'lerini invalidate et (kullanıcı kendi gönderisini görebilsin)
      queryClient.invalidateQueries({ 
        queryKey: ['profile'],
        refetchType: 'all',
      });
      // 5. Active events listesini invalidate et (event post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.active(),
        refetchType: 'all',
      });
    },
  });
};


// ============================================================================
// MEDUSA CATEGORY HOOKS
// ============================================================================

/**
 * Get Main Categories (parent_category_id === null)
 * Ana kategorileri getiren hook
 * 
 * @returns React Query query hook result
 * 
 * @example
 * const { data: mainCategories, isLoading } = useMainCategories();
 */
export const useMainCategories = () => {
  return useQuery<MedusaCategory[], Error>({
    queryKey: eventsKeys.mainCategories(),
    queryFn: getMainCategories,
    staleTime: 0, // DEBUG: Cache'i devre dışı bırak, her seferinde fresh data çek
    gcTime: 0, // DEBUG: Cache'i sakla
    refetchOnMount: true, // Her mount'ta yeniden fetch et
    retry: 2, // Hata durumunda 2 kez tekrar dene
  });
};

/**
 * Get Sub Categories by parent category ID
 * Belirli bir kategorinin alt kategorilerini getiren hook
 * 
 * @param parentCategoryId - Ana kategori ID'si
 * @param enabled - Query'nin çalışıp çalışmayacağı (default: true)
 * @returns React Query query hook result
 * 
 * @example
 * const { data: subCategories, isLoading } = useSubCategories('cat-electronics', true);
 */
export const useSubCategories = (parentCategoryId: string, enabled: boolean = true) => {
  return useQuery<MedusaCategory[], Error>({
    queryKey: eventsKeys.subCategories(parentCategoryId),
    queryFn: () => getSubCategories(parentCategoryId),
    enabled: enabled && !!parentCategoryId,
    staleTime: 24 * 60 * 60 * 1000, // 24 saat
    gcTime: 48 * 60 * 60 * 1000, // 48 saat
  });
};

/**
 * Get Category by ID
 * Belirli bir kategoriyi ID ile getiren hook
 * 
 * @param categoryId - Kategori ID'si
 * @param enabled - Query'nin çalışıp çalışmayacağı (default: true)
 * @returns React Query query hook result
 * 
 * @example
 * const { data: category, isLoading } = useCategoryById('cat-electronics', true);
 */
export const useCategoryById = (categoryId: string, enabled: boolean = true) => {
  return useQuery<MedusaCategory, Error>({
    queryKey: eventsKeys.categoryDetail(categoryId),
    queryFn: () => getCategoryById(categoryId),
    enabled: enabled && !!categoryId,
    staleTime: 24 * 60 * 60 * 1000, // 24 saat
    gcTime: 48 * 60 * 60 * 1000, // 48 saat
  });
};
