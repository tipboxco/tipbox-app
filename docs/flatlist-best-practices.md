# FlatList Best Practices ve Performans Optimizasyonu

Bu dokümantasyon, React Native FlatList kullanımında karşılaşılan yaygın sorunlar, performans optimizasyonları ve best practice'leri içerir.

## İçindekiler

1. [Temel Optimizasyonlar](#temel-optimizasyonlar)
2. [Re-render Sorunları ve Çözümleri](#re-render-sorunları-ve-çözümleri)
3. [Infinite Scroll (Sonsuz Kaydırma)](#infinite-scroll-sonsuz-kaydırma)
4. [Yaygın Hatalar ve Tuzaklar](#yaygın-hatalar-ve-tuzaklar)
5. [Performans İpuçları](#performans-ipuçları)
6. [Kod Örnekleri](#kod-örnekleri)

---

## Temel Optimizasyonlar

### 1. `keyExtractor` Kullanımı

**✅ DOĞRU:**
```typescript
const getItemKey = useCallback((item: MappedPost) => {
  return item.id; // Unique ve stable ID
}, []);

<FlatList
  data={items}
  keyExtractor={getItemKey}
  // ...
/>
```

**❌ YANLIŞ:**
```typescript
<FlatList
  data={items}
  keyExtractor={(item, index) => index.toString()} // Index kullanmak yanlış!
  // ...
/>
```

**Neden?**
- Index kullanmak, item'ların sırası değiştiğinde veya ekleme/çıkarma yapıldığında yanlış key'ler oluşturur
- React, item'ları yanlış eşleştirir ve gereksiz re-render'lar oluşur
- Her zaman unique ve stable (değişmeyen) ID'ler kullanın

---

### 2. `renderItem` Memoization

**✅ DOĞRU:**
```typescript
const renderItem = useCallback(({ item }: { item: MappedPost }) => {
  switch (item.type) {
    case 'post':
      return <PostCard data={item.data} />;
    case 'experience':
      return <ExperiencePostCard data={item.data} />;
    default:
      return null;
  }
}, []); // Dependency array boş - item prop'u zaten FlatList tarafından geçiliyor

<FlatList
  data={items}
  renderItem={renderItem}
  // ...
/>
```

**❌ YANLIŞ:**
```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <PostCard data={item.data} />} // Her render'da yeni fonksiyon
  // ...
/>
```

**Neden?**
- Her render'da yeni fonksiyon oluşturmak, FlatList'in memoization'ını bozar
- `useCallback` ile fonksiyonu memoize edin

---

### 3. `contentContainerStyle` Optimizasyonu

**✅ DOĞRU:**
```typescript
const contentContainerStyle = useMemo(
  () => ({ 
    paddingHorizontal: 16, 
    paddingVertical: 8,
    paddingBottom: bottomPadding,
  }),
  [bottomPadding] // Sadece bottomPadding değiştiğinde yeniden oluştur
);

<FlatList
  data={items}
  contentContainerStyle={contentContainerStyle}
  // ...
/>
```

**❌ YANLIŞ:**
```typescript
<FlatList
  data={items}
  contentContainerStyle={{ 
    paddingHorizontal: 16, 
    paddingVertical: 8,
    paddingBottom: bottomPadding,
  }} // Her render'da yeni obje
  // ...
/>
```

**Neden?**
- Her render'da yeni obje oluşturmak, FlatList'in style karşılaştırmasını bozar
- `useMemo` ile style objesini memoize edin

---

### 4. `extraData` Kullanımı

**✅ DOĞRU:**
```typescript
// Array'in kendisini kullan - referans değişikliğini algılar
const flatListExtraData = useMemo(() => mappedPosts, [mappedPosts]);

<FlatList
  data={mappedPosts}
  extraData={flatListExtraData}
  // ...
/>
```

**❌ YANLIŞ:**
```typescript
// Sadece length kullanmak yeterli değil
const flatListExtraData = useMemo(() => mappedPosts.length, [mappedPosts.length]);

<FlatList
  data={mappedPosts}
  extraData={flatListExtraData} // İçerik değişikliklerini algılamaz
  // ...
/>
```

**Neden?**
- `extraData` prop'u, FlatList'in ne zaman re-render yapacağını belirler
- Sadece length kullanmak, aynı uzunlukta farklı içerik değişikliklerini algılamaz
- Array'in kendisini kullanın veya hash/checksum hesaplayın

---

## Re-render Sorunları ve Çözümleri

### 1. Mapping Fonksiyonları Cache'leme

**Problem:**
- Her render'da mapping fonksiyonları yeni obje oluşturur
- Aynı item için farklı referanslar oluşur
- React.memo ile karşılaştırma yapılsa bile re-render tetiklenir

**✅ ÇÖZÜM:**
```typescript
// Mapping cache - her post ID için mapping sonucunu cache'le
const mappingCacheRef = useRef<Map<string, MappedPost>>(new Map());

const mappedPosts = useMemo(() => {
  const currentPostIds = new Set(posts.map((p) => p.id));
  const newCache = new Map<string, MappedPost>();
  
  const mapped = posts.map((post) => {
    // Cache'den kontrol et
    const cached = mappingCacheRef.current.get(post.id);
    if (cached) {
      newCache.set(post.id, cached);
      return cached; // Aynı referansı döndür
    }
    
    // Cache'de yoksa yeni mapping yap
    const mappedItem = mapPostToCardData(post);
    newCache.set(post.id, mappedItem);
    return mappedItem;
  });
  
  // Cache'i güncelle
  mappingCacheRef.current = newCache;
  
  return mapped;
}, [posts]);
```

**Faydaları:**
- Aynı item için aynı referans döndürülür
- React.memo düzgün çalışır
- Gereksiz re-render'lar önlenir

---

### 2. Hook Değerlerini Stabilize Etme

**Problem:**
- `useBottomOffset`, `useSafeAreaInsets` gibi hook'lar her render'da yeni değer döndürebilir
- Bu değerler dependency olarak kullanıldığında gereksiz re-render'lar oluşur

**✅ ÇÖZÜM:**
```typescript
// Hook değerini memoize et
const bottomPaddingValue = useBottomOffset({ extraPadding: 16 });
const bottomPadding = useMemo(() => bottomPaddingValue, [bottomPaddingValue]);

// Veya direkt useMemo içinde kullan
const bottomPadding = useMemo(() => {
  return useBottomOffset({ extraPadding: 16 });
}, []); // Sadece mount'ta hesapla
```

---

### 3. React Query `notifyOnChangeProps` Optimizasyonu

**Problem:**
- React Query hook'ları, varsayılan olarak tüm state değişikliklerinde re-render tetikler
- `isFetchingNextPage`, `isLoading` gibi değerler sık sık değişir

**✅ ÇÖZÜM:**
```typescript
export const useUserPosts = (userId: string | undefined, limit: number = 3) => {
  return useInfiniteQuery<UserFeedApiResponse, Error>({
    queryKey: userId ? [...profileKeys.userPosts(userId), limit] : ['profile', 'posts', 'disabled'],
    queryFn: ({ pageParam }) => getUserPosts(userId, pageParam, limit),
    // Sadece gerekli değişikliklerde re-render et
    notifyOnChangeProps: ['data', 'hasNextPage', 'error', 'isLoading', 'isPending'],
    // isFetchingNextPage listede yok - gereksiz re-render'ları önler
  });
};
```

---

## Infinite Scroll (Sonsuz Kaydırma)

### 1. `onEndReached` Loop'unu Önleme

**Problem:**
- `onEndReached` callback'i sık sık tetiklenebilir
- Aynı sayfa birden fazla kez fetch edilebilir

**✅ ÇÖZÜM:**
```typescript
const isLoadingMoreRef = useRef(false);
const lastDataPagesRef = useRef(0);

// Yeni sayfa geldiğinde flag'i reset et
useEffect(() => {
  const currentPagesCount = data?.pages?.length || 0;
  if (currentPagesCount > lastDataPagesRef.current) {
    isLoadingMoreRef.current = false;
    lastDataPagesRef.current = currentPagesCount;
  }
}, [data?.pages?.length]);

const handleLoadMore = useCallback(() => {
  // Eğer zaten yükleme yapılıyorsa, tekrar tetikleme
  if (isLoadingMoreRef.current) {
    return;
  }

  // Eğer hasNextPage false ise veya zaten fetch yapılıyorsa, işlem yapma
  if (!hasNextPage || isFetchingNextPage) {
    return;
  }

  // Flag'i set et
  isLoadingMoreRef.current = true;

  fetchNextPage()
    .finally(() => {
      // Kısa bir delay ekle ki onEndReached tekrar tetiklenmesin
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 500);
    });
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

**Önemli Noktalar:**
- `isLoadingMoreRef` ile flag kontrolü yapın
- `data.pages.length` değiştiğinde flag'i reset edin
- `setTimeout` ile kısa bir delay ekleyin

---

### 2. Duplicate Item Filtreleme

**Problem:**
- Backend cursor desteklemiyorsa, aynı item'lar tekrar gelebilir
- Infinite scroll sırasında duplicate item'lar görünebilir

**✅ ÇÖZÜM:**
```typescript
const posts = useMemo(() => {
  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  
  // ID'ye göre unique item'ları filtrele
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex((t) => t.id === item.id)
  );
  
  // Duplicate kontrolü - log
  if (allItems.length !== uniqueItems.length) {
    const duplicateCount = allItems.length - uniqueItems.length;
    console.log('[FeedTab] Duplicate bulundu:', duplicateCount, 'adet');
  }
  
  return uniqueItems;
}, [data]);
```

---

## Yaygın Hatalar ve Tuzaklar

### 1. `nestedScrollEnabled` Kullanımı

**⚠️ DİKKAT:**
```typescript
<FlatList
  nestedScrollEnabled={true} // ScrollView içindeyse gerekli
  scrollEnabled={false} // Parent ScrollView scroll ediyorsa false
  // ...
/>
```

**Ne Zaman Kullanılır?**
- FlatList bir ScrollView içindeyse `nestedScrollEnabled={true}` kullanın
- Parent ScrollView scroll ediyorsa `scrollEnabled={false}` yapın
- Aksi takdirde scroll çakışması olur

---

### 2. `removeClippedSubviews` Performans Etkisi

**✅ DOĞRU:**
```typescript
<FlatList
  removeClippedSubviews={true} // Performans için önemli
  // ...
/>
```

**Ne Zaman Kullanılır?**
- Uzun listelerde performans artışı sağlar
- Görünmeyen item'ları DOM'dan kaldırır
- Ancak bazı animasyon sorunlarına neden olabilir

---

### 3. `getItemLayout` Kullanımı

**✅ DOĞRU (Sabit Height Varsa):**
```typescript
const getItemLayout = useCallback(
  (data: any, index: number) => ({
    length: ITEM_HEIGHT, // Sabit height
    offset: ITEM_HEIGHT * index,
    index,
  }),
  []
);

<FlatList
  data={items}
  getItemLayout={getItemLayout}
  // ...
/>
```

**Ne Zaman Kullanılır?**
- Tüm item'ların height'ı sabitse kullanın
- Performans artışı sağlar
- Dynamic height'larda kullanmayın

---

### 4. `ListFooterComponent` ve `ListHeaderComponent` Memoization

**✅ DOĞRU:**
```typescript
const LoadingFooter = React.memo(({ isFetching, isDark }: { isFetching: boolean; isDark: boolean }) => {
  if (!isFetching) return null;
  return (
    <Box py={20} alignItems="center">
      <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
    </Box>
  );
});

const renderFooter = useCallback(() => {
  return <LoadingFooter isFetching={isFetchingNextPage} isDark={isDark} />;
}, [isFetchingNextPage, isDark]);

<FlatList
  ListFooterComponent={renderFooter}
  // ...
/>
```

**Neden?**
- Footer/Header component'lerini memoize edin
- Gereksiz re-render'ları önler

---

## Performans İpuçları

### 1. Render Optimizasyonları

```typescript
<FlatList
  data={items}
  // Performance optimizations
  initialNumToRender={3}        // İlk render'da kaç item gösterilecek
  maxToRenderPerBatch={3}       // Her batch'te kaç item render edilecek
  windowSize={5}                // Render window size (ekran yüksekliği cinsinden)
  updateCellsBatchingPeriod={50} // Batch update period (ms)
  // ...
/>
```

**Önerilen Değerler:**
- `initialNumToRender`: 3-5 (ilk görünen item sayısı)
- `maxToRenderPerBatch`: 3-5 (batch başına item sayısı)
- `windowSize`: 5-10 (ekran yüksekliği cinsinden)
- `updateCellsBatchingPeriod`: 50-100ms

---

### 2. Item Component Memoization

**✅ DOĞRU:**
```typescript
// PostCard component'i
export const PostCard = React.memo(({ data }: { data: PostCardData }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id &&
         prevProps.data.stats.likes === nextProps.data.stats.likes;
});
```

**Neden?**
- React.memo ile item component'lerini memoize edin
- Custom comparison function ile sadece gerekli değişikliklerde re-render yapın

---

### 3. FlatList Wrapper Memoization

**✅ DOĞRU:**
```typescript
export const FeedTab = React.memo(FeedTabComponent);
```

**Neden?**
- Parent component re-render olduğunda FlatList'in de re-render olmasını önler
- Sadece prop'lar değiştiğinde re-render yapar

---

## Kod Örnekleri

### Tam Optimize Edilmiş FlatList Örneği

```typescript
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { Box } from '@gluestack-ui/themed';

type Item = { id: string; data: any };

const OptimizedFlatList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(/* ... */);
  
  // 1. Mapping cache
  const mappingCacheRef = useRef<Map<string, Item>>(new Map());
  
  // 2. Flatten ve deduplicate
  const items = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? [];
    return allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
  }, [data]);
  
  // 3. Mapping with cache
  const mappedItems = useMemo(() => {
    const newCache = new Map<string, Item>();
    return items.map((item) => {
      const cached = mappingCacheRef.current.get(item.id);
      if (cached) {
        newCache.set(item.id, cached);
        return cached;
      }
      const mapped = mapItem(item);
      newCache.set(item.id, mapped);
      return mapped;
    });
  }, [items]);
  
  // 4. Callbacks
  const getItemKey = useCallback((item: Item) => item.id, []);
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard data={item.data} />
  ), []);
  
  // 5. Infinite scroll
  const isLoadingMoreRef = useRef(false);
  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      setTimeout(() => { isLoadingMoreRef.current = false; }, 500);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // 6. Styles
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingBottom: 100 }),
    []
  );
  
  // 7. Extra data
  const extraData = useMemo(() => mappedItems, [mappedItems]);
  
  return (
    <FlatList
      data={mappedItems}
      keyExtractor={getItemKey}
      renderItem={renderItem}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={contentContainerStyle}
      extraData={extraData}
      removeClippedSubviews={true}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator /> : null
      }
    />
  );
};

export default React.memo(OptimizedFlatList);
```

---

## Checklist

FlatList kullanırken şunları kontrol edin:

- [ ] `keyExtractor` unique ve stable ID kullanıyor mu?
- [ ] `renderItem` `useCallback` ile memoize edilmiş mi?
- [ ] `contentContainerStyle` `useMemo` ile memoize edilmiş mi?
- [ ] `extraData` doğru şekilde kullanılmış mı?
- [ ] Mapping fonksiyonları cache'leniyor mu?
- [ ] `onEndReached` loop'u önlenmiş mi?
- [ ] Duplicate item'lar filtreleniyor mu?
- [ ] Item component'leri `React.memo` ile memoize edilmiş mi?
- [ ] FlatList wrapper `React.memo` ile memoize edilmiş mi?
- [ ] `nestedScrollEnabled` doğru ayarlanmış mı?
- [ ] `removeClippedSubviews` kullanılıyor mu?
- [ ] Performans optimizasyonları (`initialNumToRender`, `windowSize`, vb.) ayarlanmış mı?

---

## Sonuç

FlatList performansı için:
1. **Memoization** her yerde kullanılmalı
2. **Cache** mekanizmaları implement edilmeli
3. **Infinite scroll** düzgün handle edilmeli
4. **Duplicate** item'lar filtrelenmeli
5. **React Query** `notifyOnChangeProps` optimize edilmeli

Bu best practice'leri takip ederek, FlatList performansını önemli ölçüde artırabilirsiniz.

