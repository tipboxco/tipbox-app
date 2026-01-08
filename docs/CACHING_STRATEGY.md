# Caching Strategy - React Query Optimizasyonu

## 🎯 Amaç

Tüm ekranlarda caching mekanizmasını aktif ederek:
- Tab geçişlerinde anında yüklenmiş ekranlar göster
- Ekran değişimlerinde cache'den veri göster
- Cache invalid olana kadar backend'e istek atma
- Instagram gibi smooth UX sağla

## 📊 Mevcut Durum Analizi

### ❌ Sorunlu Durum (Events Hooks)
```typescript
staleTime: 0,        // Cache yok - veri hemen stale olur
gcTime: 0,           // Cache yok - veri hemen temizlenir
refetchOnMount: true, // Her mount'ta yeniden fetch
refetchOnWindowFocus: true, // Focus'ta yeniden fetch
```

**Sonuç:** Her tab geçişinde ve ekran değişiminde API'ye istek atılıyor.

### ✅ Global Default (QueryProvider)
```typescript
staleTime: 5 * 60 * 1000,  // 5 dakika
gcTime: 10 * 60 * 1000,    // 10 dakika
refetchOnMount: false,      // Cache varsa kullan
refetchOnWindowFocus: false // Focus'ta refetch yapma
```

**Sonuç:** İyi ama events hooks'ları bunu override ediyor.

## 🏗️ Önerilen Caching Stratejisi

### 1. **Tab-Based Data** (Community/Achievement Tabs)
**Kullanım:** Tab'lar arası geçişte anında gösterilmeli

```typescript
staleTime: 2 * 60 * 1000,  // 2 dakika - tab geçişlerinde anında göster
gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
refetchOnMount: false,      // Cache varsa kullan
refetchOnWindowFocus: false // Tab geçişlerinde refetch yapma
```

**Örnekler:**
- `useActiveEvents()` - Community tab
- `useUpcomingEvents()` - Community tab
- `useAchievements()` - Achievement tab
- `useLimitedEvent()` - Achievement tab

### 2. **Screen-Based Data** (Detail Screens)
**Kullanım:** Ekran değişimlerinde anında gösterilmeli

```typescript
staleTime: 5 * 60 * 1000,  // 5 dakika - ekran değişimlerinde anında göster
gcTime: 15 * 60 * 1000,    // 15 dakika - cache'de tut
refetchOnMount: false,      // Cache varsa kullan
refetchOnWindowFocus: false // Ekran değişimlerinde refetch yapma
```

**Örnekler:**
- `useEventDetail()` - Event detail screen
- `usePostDetail()` - Post detail screen
- `useProfile()` - Profile screen

### 3. **List Data** (Feed, Catalog, etc.)
**Kullanım:** Liste ekranlarında scroll sırasında anında gösterilmeli

```typescript
staleTime: 3 * 60 * 1000,  // 3 dakika - liste scroll'unda anında göster
gcTime: 10 * 60 * 1000,    // 10 dakika - cache'de tut
refetchOnMount: false,      // Cache varsa kullan
refetchOnWindowFocus: false // Liste ekranlarında refetch yapma
```

**Örnekler:**
- `useFeed()` - Feed screen
- `useCatalogCategories()` - Catalog screen

### 4. **Static/Reference Data** (Categories, Settings, etc.)
**Kullanım:** Nadiren değişen veriler

```typescript
staleTime: 24 * 60 * 60 * 1000,  // 24 saat - çok nadiren değişir
gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün - cache'de tut
refetchOnMount: false,            // Cache varsa kullan
refetchOnWindowFocus: false       // Static data için refetch yapma
```

**Örnekler:**
- `useCatalogCategories()` - Catalog categories
- `useNotificationSettings()` - Notification settings

## 🔄 Cache Invalidation Stratejisi

### Otomatik Invalidation
- **Mutations sonrası:** İlgili query'leri invalidate et
- **User actions:** Beğeni, yorum, paylaşım sonrası ilgili cache'i invalidate et

### Manuel Invalidation
- **Pull-to-refresh:** Kullanıcı manuel refresh yaptığında
- **Settings değişikliği:** Kullanıcı ayarları değiştirdiğinde

## 📐 Implementation Pattern

### Pattern 1: Tab-Based Caching
```typescript
export const useActiveEvents = (limit: number = 20) => {
  return useInfiniteQuery<EventsApiResponse, Error>({
    queryKey: eventsKeys.active(undefined, limit),
    queryFn: ({ pageParam }) => getActiveEvents(pageParam, limit),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.cursor,
    // Tab-based caching
    staleTime: 2 * 60 * 1000,  // 2 dakika
    gcTime: 10 * 60 * 1000,    // 10 dakika
    refetchOnMount: false,      // Cache varsa kullan
    refetchOnWindowFocus: false, // Tab geçişlerinde refetch yapma
    retry: 1,
  });
};
```

### Pattern 2: Screen-Based Caching
```typescript
export const useEventDetail = (eventId: string) => {
  return useQuery<EventDetailApiResponse, Error>({
    queryKey: eventsKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: !!eventId,
    // Screen-based caching
    staleTime: 5 * 60 * 1000,  // 5 dakika
    gcTime: 15 * 60 * 1000,    // 15 dakika
    refetchOnMount: false,      // Cache varsa kullan
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};
```

## 🎨 UX İyileştirmeleri

### 1. **Instant Tab Switching**
- Community → Achievement: Anında cache'den göster
- Achievement → Community: Anında cache'den göster
- **Sonuç:** Loading spinner yok, anında yüklenmiş ekran

### 2. **Instant Screen Navigation**
- EventsScreen → EventDetailScreen → EventsScreen: Cache'den göster
- FeedScreen → PostDetailScreen → FeedScreen: Cache'den göster
- **Sonuç:** Geri dönüşlerde anında yüklenmiş ekran

### 3. **Background Refresh** (Opsiyonel)
- Cache'den göster, arka planda fresh data fetch et
- Fresh data geldiğinde UI'ı güncelle
- **Sonuç:** Anında göster + Fresh data garantisi

## 📊 Cache Time Değerleri Özeti

| Data Type | staleTime | gcTime | refetchOnMount | refetchOnWindowFocus |
|-----------|-----------|--------|----------------|---------------------|
| Tab-Based | 2 dakika | 10 dakika | false | false |
| Screen-Based | 5 dakika | 15 dakika | false | false |
| List Data | 3 dakika | 10 dakika | false | false |
| Static Data | 24 saat | 7 gün | false | false |

## 🚀 Implementation Plan

1. **Events Hooks Güncelle** (`src/features/events/api/hooks.ts`)
   - `useActiveEvents()` → Tab-based caching
   - `useUpcomingEvents()` → Tab-based caching
   - `useAchievements()` → Tab-based caching
   - `useLimitedEvent()` → Tab-based caching
   - `useEventDetail()` → Screen-based caching
   - `useEventPosts()` → Screen-based caching

2. **Diğer Feature Hooks Güncelle**
   - Feed hooks → List-based caching
   - Profile hooks → Screen-based caching
   - Post hooks → Screen-based caching
   - Catalog hooks → Static data caching (zaten var)

3. **Test Senaryoları**
   - Tab geçişlerinde anında yüklenmiş ekran
   - Ekran değişimlerinde cache'den veri
   - Cache invalid olduğunda fresh data fetch
   - Pull-to-refresh ile manuel refresh

## ✅ Beklenen Sonuçlar

1. **Performance:**
   - %80+ daha az API isteği
   - Anında ekran yükleme
   - Smooth tab geçişleri

2. **UX:**
   - Instagram gibi anında yüklenmiş ekranlar
   - Loading spinner'lar minimum
   - Offline-first yaklaşım

3. **Network:**
   - Daha az bandwidth kullanımı
   - Daha az server load
   - Daha iyi battery life

---

*Son Güncelleme: 2026-01-01*
*Strateji: Tab-based + Screen-based Caching*







