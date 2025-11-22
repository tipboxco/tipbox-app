# React Query Hook Pattern - Feature-Based Yapı

## 🎯 Cevap: Her Feature Kendi Hook'larını Oluşturmalı

**✅ EVET**, her feature kendi React Query hook'larını oluşturmalı. Bu yaklaşım:
- Feature isolation sağlar
- Bakımı kolaylaştırır
- Code splitting için uygun
- Her feature kendi cache key'lerini yönetir
- Type safety sağlar

## 📁 Önerilen Yapı

```
src/
├── features/
│   ├── events/
│   │   └── api/
│   │       ├── index.ts              # Export all
│   │       ├── eventsApi.ts          # Endpoint functions
│   │       └── hooks.ts              # React Query hooks
│   ├── profile/
│   │   └── api/
│   │       ├── index.ts
│   │       ├── profileApi.ts
│   │       └── hooks.ts
│   └── feed/
│       └── api/
│           ├── index.ts
│           ├── feedApi.ts
│           └── hooks.ts
```

## 💡 Örnekler

### 1. Events Feature

```typescript
// src/features/events/api/eventsApi.ts
import { apiService } from '../../../services/ApiService';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  category?: string;
}

export interface GetEventsResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
}

// Endpoint fonksiyonları
export const getEvents = async (
  params?: GetEventsParams
): Promise<GetEventsResponse> => {
  const response = await apiService.getClient().get('/events', { params });
  return response.data;
};

export const getEventById = async (id: string): Promise<Event> => {
  const response = await apiService.getClient().get(`/events/${id}`);
  return response.data.data;
};

export const createEvent = async (data: Partial<Event>): Promise<Event> => {
  const response = await apiService.getClient().post('/events', data);
  return response.data.data;
};

export const updateEvent = async (
  id: string,
  data: Partial<Event>
): Promise<Event> => {
  const response = await apiService.getClient().put(`/events/${id}`, data);
  return response.data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiService.getClient().delete(`/events/${id}`);
};
```

```typescript
// src/features/events/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  Event,
  GetEventsParams,
} from './eventsApi';

// Query Keys - Her feature kendi key pattern'ini tanımlar
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params?: GetEventsParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Queries
export const useEvents = (params?: GetEventsParams) => {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getEvents(params),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
};

export const useEvent = (id: string, enabled = true) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEventById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      // Event listesini invalidate et
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      updateEvent(id, data),
    onSuccess: (data, variables) => {
      // Hem listeyi hem de detail'i güncelle
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.setQueryData(eventKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: (_, deletedId) => {
      // Listeyi invalidate et ve detail'i kaldır
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.removeQueries({ queryKey: eventKeys.detail(deletedId) });
    },
  });
};
```

### 2. Profile Feature

```typescript
// src/features/profile/api/profileApi.ts
import { apiService } from '../../../services/ApiService';
import { ENDPOINTS } from '../../../config/api.config';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export const getProfile = async (id: string): Promise<Profile> => {
  const response = await apiService.getClient().get(
    ENDPOINTS.USERS.BY_ID(id)
  );
  return response.data.data;
};

export const getCurrentProfile = async (): Promise<Profile> => {
  const response = await apiService.getClient().get(ENDPOINTS.AUTH.ME);
  return response.data.data;
};

export const updateProfile = async (
  id: string,
  data: Partial<Profile>
): Promise<Profile> => {
  const response = await apiService.getClient().put(
    ENDPOINTS.USERS.BY_ID(id),
    data
  );
  return response.data.data;
};
```

```typescript
// src/features/profile/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getCurrentProfile, updateProfile, Profile } from './profileApi';

// Query Keys
export const profileKeys = {
  all: ['profile'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  current: () => [...profileKeys.all, 'current'] as const,
};

// Queries
export const useProfile = (id: string) => {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => getProfile(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 dakika
  });
};

export const useCurrentProfile = () => {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getCurrentProfile,
    staleTime: 10 * 60 * 1000,
  });
};

// Mutations
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) =>
      updateProfile(id, data),
    onSuccess: (data, variables) => {
      // Profile detail'i güncelle
      queryClient.setQueryData(profileKeys.detail(variables.id), data);
      // Eğer current profile ise onu da güncelle
      queryClient.setQueryData(profileKeys.current(), (old: Profile | undefined) => {
        if (old?.id === variables.id) {
          return { ...old, ...data };
        }
        return old;
      });
    },
  });
};
```

### 3. Feed Feature

```typescript
// src/features/feed/api/feedApi.ts
import { apiService } from '../../../services/ApiService';

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface GetFeedParams {
  page?: number;
  limit?: number;
  category?: string;
}

export const getFeed = async (params?: GetFeedParams): Promise<Post[]> => {
  const response = await apiService.getClient().get('/feed', { params });
  return response.data.data;
};
```

```typescript
// src/features/feed/api/hooks.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getFeed, GetFeedParams } from './feedApi';

export const feedKeys = {
  all: ['feed'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (params?: GetFeedParams) => [...feedKeys.lists(), params] as const,
};

// Normal query
export const useFeed = (params?: GetFeedParams) => {
  return useQuery({
    queryKey: feedKeys.list(params),
    queryFn: () => getFeed(params),
    staleTime: 2 * 60 * 1000, // 2 dakika (feed daha sık güncellenir)
  });
};

// Infinite query (pagination için)
export const useInfiniteFeed = (params?: Omit<GetFeedParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: feedKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getFeed({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      // Eğer son sayfa boşsa veya limit'ten az ise, daha fazla sayfa yok
      if (!lastPage || lastPage.length < (params?.limit || 10)) {
        return undefined;
      }
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
};
```

## 🔄 Ortak Pattern'ler (Opsiyonel)

Eğer birçok feature'da benzer pattern'ler varsa, ortak helper'lar oluşturabilirsiniz:

```typescript
// src/utils/reactQueryHelpers.ts
import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// Ortak query options
export const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
  retry: 1,
};

// Ortak mutation options
export const defaultMutationOptions = {
  retry: 1,
};

// Helper function
export function createQueryOptions<TData, TError = Error>(
  options: Partial<UseQueryOptions<TData, TError>>
): UseQueryOptions<TData, TError> {
  return {
    ...defaultQueryOptions,
    ...options,
  };
}
```

## 📝 Kullanım Örnekleri

### Screen'de Kullanım

```typescript
// src/features/events/screens/EventsScreen.tsx
import { useEvents, useDeleteEvent } from '../api/hooks';

export const EventsScreen = () => {
  const { data: events, isLoading, error } = useEvents({ page: 1, limit: 10 });
  const deleteEvent = useDeleteEvent();

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      // Toast göster
    } catch (error) {
      // Error handling
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <FlatList
      data={events?.data}
      renderItem={({ item }) => (
        <EventCard event={item} onDelete={() => handleDelete(item.id)} />
      )}
    />
  );
};
```

## ✅ Avantajlar

1. **Feature Isolation**: Her feature kendi hook'larını yönetir
2. **Type Safety**: Her feature kendi type'larını tanımlar
3. **Cache Management**: Her feature kendi cache key pattern'ini kullanır
4. **Maintainability**: Değişiklikler sadece ilgili feature'ı etkiler
5. **Code Splitting**: Her feature bağımsız bundle edilebilir
6. **Reusability**: Feature içinde hook'lar tekrar kullanılabilir

## 🎯 Sonuç

**Her feature kendi React Query hook'larını oluşturmalı!**

Bu yaklaşım:
- ✅ Feature-based mimariye uygun
- ✅ Bakımı kolay
- ✅ Ölçeklenebilir
- ✅ Type-safe
- ✅ Test edilebilir

