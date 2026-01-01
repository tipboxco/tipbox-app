# Cache Invalidation & Smart Refresh Strategy

## 🎯 Amaç

Cache mekanizması ile birlikte akıllı invalidation ve refresh stratejisi:
- **Öncelik:** Cache'den anında göster (UX)
- **Arka Plan:** Fresh data fetch et (Data freshness)
- **Pull-to-Refresh:** Cache'den göster + arka planda fresh data
- **Mutation Sonrası:** İlgili cache'leri invalidate et

## 🏗️ Smart Refresh Pattern

### Pattern 1: Pull-to-Refresh (Optimistic + Background Refresh)

```typescript
// CommunityTab.tsx
const {
  data: activeEventsData,
  refetch: refetchActiveEvents, // Manuel refetch fonksiyonu
  isRefetching, // Refetch durumu (loading spinner için)
} = useActiveEvents(20);

// Pull-to-Refresh handler
const handleRefresh = useCallback(async () => {
  // 1. Cache'den göster (anında - zaten gösteriliyor)
  // 2. Arka planda fresh data fetch et
  await Promise.all([
    refetchActiveEvents(),    // Active events refresh
    refetchUpcomingEvents(),  // Upcoming events refresh
  ]);
  // 3. Fresh data geldiğinde React Query otomatik UI'ı günceller
}, [refetchActiveEvents, refetchUpcomingEvents]);

// FlatList'te kullanım
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isRefetching} // Sadece refresh durumunda spinner göster
      onRefresh={handleRefresh}
    />
  }
/>
```

**Davranış:**
1. Kullanıcı pull-to-refresh yapar
2. Cache'den veri gösterilmeye devam eder (anında)
3. Arka planda fresh data fetch edilir
4. Fresh data geldiğinde UI otomatik güncellenir
5. `isRefetching: true` olduğunda spinner gösterilir

### Pattern 2: Mutation Sonrası Invalidation

```typescript
// Event post oluşturulduğunda
export const useCreateEventPost = (eventId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => createEventPost(eventId, data),
    onSuccess: () => {
      // 1. İlgili cache'leri invalidate et
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.posts(eventId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.detail(eventId) 
      });
      
      // 2. Ana feed'i invalidate et (yeni post görünsün)
      queryClient.invalidateQueries({ 
        queryKey: feedKeys.all 
      });
      
      // 3. Events listesini invalidate et (event post sayısı değişebilir)
      queryClient.invalidateQueries({ 
        queryKey: eventsKeys.active() 
      });
    },
  });
};
```

**Davranış:**
1. Mutation başarılı olur
2. İlgili cache'ler invalidate edilir
3. İlgili ekranlar otomatik refetch edilir
4. Fresh data gösterilir

### Pattern 3: Background Refresh (Otomatik)

```typescript
// useActiveEvents hook'u
export const useActiveEvents = (limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: eventsKeys.active(undefined, limit),
    queryFn: ({ pageParam }) => getActiveEvents(pageParam, limit),
    // Cache ayarları
    staleTime: 2 * 60 * 1000,  // 2 dakika fresh
    gcTime: 10 * 60 * 1000,     // 10 dakika cache'de
    refetchOnMount: false,      // Cache varsa kullan
    refetchOnWindowFocus: false, // Focus'ta refetch yapma
    
    // Background refresh (opsiyonel - kullanıcı isterse)
    // refetchInterval: 5 * 60 * 1000, // 5 dakikada bir arka planda refresh
  });
};
```

**Davranış:**
1. Cache'den veri gösterilir (anında)
2. `staleTime` geçtiyse, arka planda fresh data fetch edilir
3. Fresh data geldiğinde UI güncellenir
4. Kullanıcı hiçbir şey fark etmez (smooth UX)

## 🔄 Invalidation Senaryoları

### Senaryo 1: Yeni Event Oluşturuldu
```typescript
// Event oluşturulduğunda
onSuccess: () => {
  // Active events listesini invalidate et
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.active() 
  });
  // Upcoming events listesini invalidate et
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.upcoming() 
  });
}
```

### Senaryo 2: Event'e Post Eklendi
```typescript
// Event post oluşturulduğunda
onSuccess: () => {
  // Event posts'u invalidate et
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.posts(eventId) 
  });
  // Event detail'i invalidate et (post sayısı değişti)
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.detail(eventId) 
  });
}
```

### Senaryo 3: Event'e Katılım Yapıldı
```typescript
// Event'e join edildiğinde
onSuccess: () => {
  // Event detail'i invalidate et (participants değişti)
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.detail(eventId) 
  });
  // Active events listesini invalidate et (interaction değişti)
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.active() 
  });
}
```

### Senaryo 4: Achievement Unlocked
```typescript
// Achievement kazanıldığında
onSuccess: () => {
  // Achievements listesini invalidate et
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.achievements() 
  });
  // Limited event'i invalidate et (userScore değişti)
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.limited() 
  });
}
```

## 📐 Implementation Pattern

### Pattern 1: Pull-to-Refresh Hook

```typescript
// hooks/useRefreshControl.ts
import { useCallback } from 'react';
import { RefreshControl } from 'react-native';

export const useRefreshControl = (
  refetchFunctions: Array<() => Promise<any>>,
  isRefetching: boolean
) => {
  const handleRefresh = useCallback(async () => {
    // Tüm refetch fonksiyonlarını paralel çalıştır
    await Promise.all(refetchFunctions.map(fn => fn()));
  }, [refetchFunctions]);

  return (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
    />
  );
};
```

### Pattern 2: Smart Invalidation Helper

```typescript
// utils/cacheInvalidation.ts
import { QueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/src/features/events/api/hooks';
import { feedKeys } from '@/src/features/feed/api/hooks';

export const invalidateEventCaches = (
  queryClient: QueryClient,
  eventId?: string
) => {
  // Event-specific caches
  if (eventId) {
    queryClient.invalidateQueries({ 
      queryKey: eventsKeys.detail(eventId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: eventsKeys.posts(eventId) 
    });
  }
  
  // Global event caches
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.active() 
  });
  queryClient.invalidateQueries({ 
    queryKey: eventsKeys.upcoming() 
  });
  
  // Feed cache (yeni post görünsün)
  queryClient.invalidateQueries({ 
    queryKey: feedKeys.all 
  });
};
```

## 🎨 UX İyileştirmeleri

### 1. **Optimistic Pull-to-Refresh**
- Cache'den göster (anında)
- Arka planda fresh data fetch
- Fresh data geldiğinde smooth update
- **Sonuç:** Loading spinner minimum, anında göster

### 2. **Smart Loading States**
```typescript
const {
  data,
  isLoading,        // İlk yükleme (cache yok)
  isRefetching,    // Refresh durumu (cache var, fresh data geliyor)
  isFetching,      // Herhangi bir fetch durumu
} = useActiveEvents();

// UI'da kullanım
{isLoading ? (
  <LoadingSpinner /> // İlk yükleme
) : (
  <FlatList
    data={data}
    refreshControl={
      <RefreshControl refreshing={isRefetching} /> // Refresh durumu
    }
  />
)}
```

### 3. **Background Refresh Indicator** (Opsiyonel)
```typescript
// Arka planda fresh data geliyorsa küçük bir indicator göster
{isRefetching && !isLoading && (
  <Box position="absolute" top={10} right={10}>
    <ActivityIndicator size="small" />
  </Box>
)}
```

## 📊 Refresh Stratejisi Özeti

| Senaryo | Cache Davranışı | Refresh Davranışı | UX |
|---------|----------------|-------------------|-----|
| **İlk Yükleme** | Cache yok → API'den fetch | Loading spinner | Normal |
| **Tab Geçişi** | Cache'den göster | Arka planda refresh (stale ise) | Anında |
| **Pull-to-Refresh** | Cache'den göster | Arka planda fresh fetch | Anında + Fresh |
| **Mutation Sonrası** | Cache invalidate | Otomatik refetch | Fresh |
| **Ekran Değişimi** | Cache'den göster | Arka planda refresh (stale ise) | Anında |

## 🚀 Implementation Plan

### 1. **Events Hooks Güncelle**
- `useActiveEvents()` → Cache + refetch export
- `useUpcomingEvents()` → Cache + refetch export
- `useAchievements()` → Cache + refetch export
- `useLimitedEvent()` → Cache + refetch export

### 2. **Pull-to-Refresh Entegrasyonu**
- `CommunityTab.tsx` → RefreshControl ekle
- `AchievementTab.tsx` → RefreshControl ekle
- Smart refresh handler'ları ekle

### 3. **Mutation Invalidation**
- `useCreateEventPost()` → Invalidation ekle
- Event join/leave → Invalidation ekle
- Achievement unlock → Invalidation ekle

### 4. **Helper Functions**
- `useRefreshControl()` hook oluştur
- `invalidateEventCaches()` helper oluştur

## ✅ Beklenen Sonuçlar

1. **Pull-to-Refresh:**
   - Cache'den anında göster
   - Arka planda fresh data fetch
   - Smooth UI update

2. **Mutation Sonrası:**
   - İlgili cache'ler invalidate
   - Otomatik fresh data göster
   - Kullanıcı action'ı hemen görür

3. **Background Refresh:**
   - Cache'den göster (anında)
   - Stale data ise arka planda refresh
   - Kullanıcı hiçbir şey fark etmez

---

*Son Güncelleme: 2026-01-01*
*Strateji: Smart Cache Invalidation + Optimistic Refresh*

