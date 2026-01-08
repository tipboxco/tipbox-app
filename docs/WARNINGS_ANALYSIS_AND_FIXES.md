# Terminal Uyarıları Analizi ve Düzeltmeleri

Bu dokümantasyon, terminal'de görünen uyarıların analizini ve yapılan düzeltmeleri içerir.

## Uyarılar ve Düzeltmeler

### 1. ✅ Circular Dependency: `appStore.ts` ↔ `interceptors.ts`

**Uyarı:**
```
WARN  Require cycle: src/store/appStore.ts -> src/services/ApiService/interceptors.ts -> src/store/appStore.ts
```

**Sorun:**
- `appStore.ts` → `interceptors.ts` (updateTokenCache, clearTokenCache import ediyor)
- `interceptors.ts` → `appStore.ts` (useAppStore import ediyor)

**Çözüm:**
- `interceptors.ts` içinde `useAppStore`'u lazy import (require) ile runtime'da yüklenmesi sağlandı
- Bu sayede circular dependency kırıldı

**Değişiklikler:**
- `src/services/ApiService/interceptors.ts`: `useAppStore` import'u kaldırıldı, lazy import eklendi

---

### 2. ✅ Circular Dependency: `GlobalBottomSheetProvider.tsx` ↔ `GlobalBottomSheet/index.tsx`

**Uyarı:**
```
WARN  Require cycle: src/providers/GlobalBottomSheetProvider.tsx -> src/components/GlobalBottomSheet/index.tsx -> src/providers/GlobalBottomSheetProvider.tsx
```

**Sorun:**
- `GlobalBottomSheetProvider.tsx` → `GlobalBottomSheet/index.tsx` (GlobalBottomSheet component import ediyor)
- `GlobalBottomSheet/index.tsx` → `GlobalBottomSheetProvider.tsx` (GlobalBottomSheetContext import ediyor)

**Çözüm:**
- `GlobalBottomSheetContext` ayrı bir dosyaya (`context.ts`) taşındı
- Her iki dosya da context'i `context.ts`'den import ediyor

**Değişiklikler:**
- `src/components/GlobalBottomSheet/context.ts`: Yeni dosya oluşturuldu
- `src/providers/GlobalBottomSheetProvider.tsx`: Context import'u güncellendi
- `src/components/GlobalBottomSheet/index.tsx`: Context import'u güncellendi
- `src/hooks/useGlobalBottomSheet.ts`: Context import'u güncellendi

---

### 3. ✅ Axios XHR Adapter Uyarısı

**Uyarı:**
```
WARN  Attempted to import the module "D:\tipbox-app\node_modules\axios\lib\adapters\xhr" which is not listed in the "exports" of "D:\tipbox-app\node_modules\axios" under the requested subpath "./lib/adapters/xhr". Falling back to file-based resolution.
```

**Sorun:**
- `src/services/ApiService/index.ts` içinde gereksiz `require('axios/lib/adapters/xhr')` çağrısı vardı
- Bu çağrı kullanılmıyordu ve axios'un internal API'sine erişmeye çalışıyordu

**Çözüm:**
- Gereksiz require() çağrısı kaldırıldı
- React Native'de axios otomatik olarak doğru adapter'ı (fetch adapter) seçer

**Değişiklikler:**
- `src/services/ApiService/index.ts`: Gereksiz require() çağrısı kaldırıldı

---

### 4. ℹ️ Baseline Browser Mapping (Bilgilendirme)

**Uyarı:**
```
[baseline-browser-mapping] The data in this module is over two months old. To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
```

**Durum:**
- Bu bir dev dependency uyarısıdır
- Kritik değildir, ancak güncellenebilir
- Web platformu için browser compatibility verilerini içerir

**Öneri:**
```bash
npm i baseline-browser-mapping@latest -D
```

---

### 5. ℹ️ SafeAreaView Deprecated (Bilgilendirme)

**Uyarı:**
```
WARN  SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.
```

**Durum:**
- Projede zaten `react-native-safe-area-context` kullanılıyor
- Bu uyarı muhtemelen başka bir dependency'den geliyor
- Kod tabanında `react-native`'den `SafeAreaView` import'u bulunamadı

**Not:**
- Proje zaten doğru kütüphaneyi kullanıyor
- Uyarı muhtemelen bir third-party dependency'den kaynaklanıyor

---

### 6. ℹ️ Expo Notifications Expo Go Limitation (Bilgilendirme)

**Uyarı:**
```
WARN  expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go.
```

**Durum:**
- Bu bir bilgilendirme uyarısıdır
- Expo Go'da push notification'lar tam desteklenmiyor
- Development build kullanılması öneriliyor

**Not:**
- Proje zaten `expo-dev-client` kullanıyor (`package.json`'da mevcut)
- Bu uyarı sadece Expo Go kullanıldığında geçerlidir

---

## Özet

### Düzeltilen Uyarılar ✅
1. ✅ Circular Dependency: `appStore.ts` ↔ `interceptors.ts` (Lazy import ile çözüldü)
2. ✅ Circular Dependency: `GlobalBottomSheetProvider.tsx` ↔ `GlobalBottomSheet/index.tsx` (Context ayrı dosyaya taşındı)
3. ✅ Axios XHR Adapter uyarısı (Gereksiz require() kaldırıldı)

### Bilgilendirme Uyarıları ℹ️
1. ℹ️ Baseline Browser Mapping (Opsiyonel güncelleme)
2. ℹ️ SafeAreaView Deprecated (Proje zaten doğru kütüphaneyi kullanıyor)
3. ℹ️ Expo Notifications Expo Go Limitation (Development build kullanılıyor)

---

## Mimari İyileştirmeler

### Circular Dependency Çözüm Stratejileri

1. **Lazy Import Pattern:**
   - Runtime'da gerektiğinde yükleme
   - `require()` kullanarak circular dependency'yi kırma
   - Örnek: `interceptors.ts` → `appStore.ts`

2. **Context Extraction Pattern:**
   - Context'i ayrı bir dosyaya taşıma
   - Provider ve Consumer'ın aynı context'i import etmesi
   - Örnek: `GlobalBottomSheetContext` → `context.ts`

### Best Practices

1. **Import Sırası:**
   - Service layer → Store layer (tek yönlü)
   - Context → Ayrı dosya (shared)
   - Component → Context (shared)

2. **Dependency Graph:**
   - Circular dependency'lerden kaçınma
   - Tek yönlü dependency akışı tercih etme
   - Shared utilities'i ayrı dosyalara taşıma

---

## Test Edilmesi Gerekenler

1. ✅ Token refresh flow (interceptors.ts lazy import)
2. ✅ GlobalBottomSheet açma/kapama (context extraction)
3. ✅ API istekleri (axios adapter)

---

## Sonuç

Tüm kritik circular dependency'ler çözüldü. Proje artık daha temiz bir dependency graph'a sahip ve uyarılar minimize edildi.




