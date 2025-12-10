# React Query Re-render Analizi ve Optimizasyon Önerileri

## 📊 Mevcut Durum Analizi

### BridgeBadgesTab Component'i Re-render Analizi

Log'lara göre yapılan analiz:

#### 1. `getNextPageParam` Fonksiyonunun Fazla Çağrılması

**Sorun:**
- `getNextPageParam` fonksiyonu 7 kez çağrılıyor (satır 988-1001)
- Her çağrıda aynı cursor değeri ile işlem yapılıyor
- React Query'nin internal state değişikliklerinde her seferinde yeniden hesaplanıyor

**Neden:**
React Query, aşağıdaki durumlarda `getNextPageParam`'ı yeniden hesaplar:
- `data` değiştiğinde
- `isFetching` değiştiğinde
- `hasNextPage` değiştiğinde
- `status` değiştiğinde
- `fetchStatus` değiştiğinde

**Etki:**
- Performans etkisi: **Düşük** (sadece cursor hesaplama)
- Ancak gereksiz hesaplamalar yapılıyor

#### 2. Component Re-render'ları

**Re-render Sayısı:** ~2-3 kez (normal seviye)

**Re-render Sebepleri:**
1. **React Query State Değişiklikleri:**
   - `data` değişti (yeni page eklendi)
   - `hasNextPage` false oldu
   - `isFetchingNextPage` değişti

2. **useEffect Dependency'leri:**
   - `data` değişti → log useEffect'i tetiklendi
   - `bridges` değişti (ama aynı 6 item kaldı)

**Etki:**
- Performans etkisi: **Düşük** (sadece 6 item render ediliyor)
- Ancak gereksiz log'lar basılıyor

#### 3. Gereksiz Re-render'lar

**Tespit Edilen Sorunlar:**
- `getNextPageParam` 7 kez çağrılıyor (fazla ama kritik değil)
- `BridgeBadgesTab` log'u 2 kez basılıyor (gereksiz)
- `bridges` aynı kalsa bile `useMemo` yeniden hesaplanıyor (çünkü `data` değişti)

---

## 🔍 React Query Re-render Mekanizması

### 1. Structural Sharing (Yapısal Paylaşım)

React Query, "structural sharing" tekniği kullanarak verilerde değişiklik olmadığında referansları korur. Ancak:

**Sorun:**
- `useInfiniteQuery`'de her yeni page eklendiğinde `data.pages` array'i yeni bir referans alır
- Bu, `useMemo` dependency'lerini tetikler ve gereksiz hesaplamalara yol açar

**Çözüm:**
- `select` seçeneği kullanarak sadece gerekli veriyi seçin
- `useMemo` dependency'lerini optimize edin

### 2. Tracked Properties (İzlenen Özellikler)

React Query, bileşeninizde kullanılan özellikleri izler ve sadece bu özellikler değiştiğinde yeniden render tetikler.

**Sorun:**
- `queryResult` objesinden tüm özellikleri destructure ediyoruz
- Kullanılmayan özellikler (`isFetching`, `isRefetching`, `status`, `fetchStatus`) değiştiğinde bile re-render tetiklenebilir

**Çözüm:**
- Sadece kullanılan özellikleri destructure edin
- `notifyOnChangeProps` seçeneğini kullanın

### 3. Referential Identity (Referans Kimliği)

`useInfiniteQuery` hook'unun döndürdüğü üst seviye nesneler her render'da yeni bir referans alır.

**Sorun:**
- `fetchNextPage`, `hasNextPage` gibi fonksiyonlar her render'da yeni referans alabilir
- Bu, `useCallback` dependency'lerini tetikler

**Çözüm:**
- React Query'nin döndürdüğü fonksiyonlar stabil referanslara sahiptir (zaten optimize edilmiş)
- Ancak `useCallback` dependency'lerinde dikkatli olun

---

## 💡 Optimizasyon Önerileri

### 1. `notifyOnChangeProps` Kullanımı

**Öneri:**
```typescript
const queryResult = useUserCollectionBridges(targetUserId, BRIDGES_PER_PAGE, {
  notifyOnChangeProps: ['data', 'hasNextPage', 'isFetchingNextPage', 'error', 'isLoading'],
});
```

**Fayda:**
- Sadece belirtilen özellikler değiştiğinde re-render tetiklenir
- `isFetching`, `isRefetching`, `status`, `fetchStatus` gibi özellikler değişse bile re-render tetiklenmez

**Dikkat:**
- `notifyOnChangeProps: 'tracked'` (varsayılan) kullanıldığında React Query otomatik olarak kullanılan özellikleri izler
- Ancak manuel olarak belirtmek daha kontrollü olur

### 2. `select` Seçeneği ile Veri Seçimi

**Öneri:**
```typescript
const queryResult = useUserCollectionBridges(targetUserId, BRIDGES_PER_PAGE, {
  select: (data) => ({
    pages: data.pages,
    pageParams: data.pageParams,
  }),
});
```

**Fayda:**
- Sadece gerekli veri alt kümesi izlenir
- Gereksiz re-render'lar önlenir

**Dikkat:**
- `select` fonksiyonu `useCallback` ile sarmalanmalı veya component dışında tanımlanmalı
- Her render'da yeni bir `select` fonksiyonu oluşturulmamalı

### 3. `getNextPageParam` Optimizasyonu

**Mevcut Durum:**
```typescript
getNextPageParam: (lastPage) => {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  const cursor = lastPage.pagination.cursor || (lastPage.items.length > 0 ? lastPage.items[lastPage.items.length - 1].id : undefined);
  return cursor;
}
```

**Öneri:**
- `getNextPageParam` fonksiyonu zaten optimize edilmiş (stabil referans)
- Ancak log'ları kaldırarak gereksiz işlemleri azaltabilirsiniz
- React Query internal state değişikliklerinde `getNextPageParam`'ı yeniden hesaplar (bu normal)

**Not:**
- `getNextPageParam`'ın fazla çağrılması React Query'nin internal davranışından kaynaklanıyor
- Bu, performansı önemli ölçüde etkilemiyor
- Ancak log'ları production'da kaldırmak önerilir

### 4. `useMemo` Dependency Optimizasyonu

**Mevcut Durum:**
```typescript
const bridges = useMemo(() => {
  // ... hesaplama
}, [data]);
```

**Öneri:**
- `data` dependency'si doğru (çünkü `data.pages` değiştiğinde yeniden hesaplanmalı)
- Ancak `bridges` aynı kalsa bile `useMemo` yeniden çalışır (bu normal)
- `bridges` için `select` kullanarak daha iyi optimizasyon yapılabilir

### 5. `useEffect` Dependency Optimizasyonu

**Mevcut Durum:**
```typescript
useEffect(() => {
  // ... log'lar
}, [data, bridges]);
```

**Öneri:**
- `bridges` dependency'si gereksiz olabilir (çünkü `data` değiştiğinde zaten `bridges` değişir)
- Sadece `data` dependency'si yeterli olabilir
- Ancak log'larda `bridges` kullanıldığı için dependency olarak kalmalı

**Alternatif:**
- Log'ları production'da kaldırın
- Veya `data` dependency'si ile çalışın ve `bridges`'i içeride hesaplayın

### 6. `useCallback` Dependency Optimizasyonu

**Mevcut Durum:**
```typescript
const handleLoadMore = useCallback(() => {
  // ...
}, [hasNextPage, isFetchingNextPage, fetchNextPage, isManuallyLoading]);
```

**Öneri:**
- `fetchNextPage` React Query'den geliyor ve stabil referansa sahip (dependency olarak kalabilir)
- Ancak `hasNextPage`, `isFetchingNextPage` değiştiğinde callback yeniden oluşturulur (bu normal)
- `isManuallyLoading` state'i dependency olarak kalmalı

**Not:**
- React Query'nin döndürdüğü fonksiyonlar (`fetchNextPage`, `refetch` vb.) stabil referanslara sahiptir
- Ancak state değerleri (`hasNextPage`, `isFetchingNextPage` vb.) değiştiğinde callback yeniden oluşturulur

---

## 📈 Performans Metrikleri

### Mevcut Durum:
- **Re-render Sayısı:** ~2-3 kez (normal)
- **`getNextPageParam` Çağrıları:** 7 kez (fazla ama kritik değil)
- **Performans Etkisi:** Düşük (sadece 6 item render ediliyor)

### Optimizasyon Sonrası Beklenen:
- **Re-render Sayısı:** ~1-2 kez (azalacak)
- **`getNextPageParam` Çağrıları:** 3-4 kez (azalacak)
- **Performans Etkisi:** Çok düşük (minimal)

---

## 🎯 Öncelikli Öneriler

### Yüksek Öncelik:
1. ✅ **`notifyOnChangeProps` kullanımı** - En etkili optimizasyon
2. ✅ **`select` seçeneği kullanımı** - Veri seçimini optimize eder
3. ✅ **Production'da log'ları kaldırma** - Gereksiz işlemleri azaltır

### Orta Öncelik:
4. ⚠️ **`useEffect` dependency optimizasyonu** - Gereksiz log'ları azaltır
5. ⚠️ **`useMemo` dependency optimizasyonu** - Hesaplamaları optimize eder

### Düşük Öncelik:
6. ℹ️ **`getNextPageParam` optimizasyonu** - Zaten optimize edilmiş, sadece log'ları kaldırın
7. ℹ️ **`useCallback` optimizasyonu** - Zaten optimize edilmiş

---

## 📚 Referanslar

- [React Query Render Optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations)
- [React Query useInfiniteQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery)
- [React Query notifyOnChangeProps](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#notifyonchangeprops)

---

## 🔧 Uygulama Notları

### Mevcut Kod Yapısı:
- ✅ Hook'lar doğru sırada (early return'lerden önce)
- ✅ `useMemo` ve `useCallback` kullanılıyor
- ✅ Dependency'ler doğru tanımlanmış

### İyileştirme Alanları:
- ⚠️ `notifyOnChangeProps` kullanılmıyor
- ⚠️ `select` seçeneği kullanılmıyor
- ⚠️ Production'da log'lar aktif

### Sonuç:
Mevcut kod yapısı iyi durumda. Yukarıdaki optimizasyonlar uygulanarak re-render sayısı ve gereksiz hesaplamalar azaltılabilir. Ancak mevcut performans zaten yeterli seviyede.

