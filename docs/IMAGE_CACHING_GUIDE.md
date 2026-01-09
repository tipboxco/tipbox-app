# Image Caching Guide

Bu dokümantasyon, Tipbox uygulamasında image caching için `expo-image` kullanımını açıklar.

## 📦 Kurulum

`expo-image` paketi zaten kurulu. Eğer kurulu değilse:

```bash
npx expo install expo-image
```

## 🎯 Kullanım

### CachedImage Component

Projede image gösterimi için `CachedImage` component'ini kullanın:

```tsx
import { CachedImage } from '@/src/components/CachedImage';

// Basit kullanım
<CachedImage 
  source="https://example.com/image.jpg"
  style={{ width: 200, height: 200 }}
  contentFit="cover"
/>

// Placeholder ile
<CachedImage 
  source={user.avatar}
  style={{ width: 100, height: 100 }}
  placeholder={require('@/assets/avatar/default.png')}
  contentFit="cover"
/>

// Priority ile (önemli görseller için)
<CachedImage 
  source={post.image}
  style={{ width: '100%', height: 300 }}
  priority="high"
  cachePolicy="memory-disk"
/>
```

### Özellikler

#### 1. **Otomatik Disk Cache**
- Görseller otomatik olarak disk'e cache'lenir
- Aynı görsel tekrar yüklenirken cache'den okunur
- Default cache policy: `memory-disk` (hem memory hem disk)

#### 2. **URL Normalizasyonu**
- `toImageSource` utility'si ile localhost URL'leri otomatik düzeltilir
- Development ortamında mobil cihazlarda çalışır

#### 3. **Placeholder Support**
- Yükleme sırasında placeholder gösterilebilir
- Hata durumunda fallback görsel gösterilebilir

#### 4. **Cache Policies**

```tsx
// Cache yok (her seferinde yeniden yükler)
cachePolicy="none"

// Sadece memory cache
cachePolicy="memory"

// Sadece disk cache
cachePolicy="disk"

// Hem memory hem disk cache (default, önerilen)
cachePolicy="memory-disk"
```

#### 5. **Priority**

```tsx
// Düşük öncelik (arka planda yüklenir)
priority="low"

// Normal öncelik (default)
priority="normal"

// Yüksek öncelik (öncelikli yüklenir)
priority="high"
```

## 🔧 Cache Yönetimi

### ImageCacheService

Cache'i manuel olarak yönetmek için `ImageCacheService` kullanın:

```tsx
import { ImageCacheService } from '@/src/services/ImageCacheService';

// Memory cache'i temizle
await ImageCacheService.clearMemory();

// Disk cache'i temizle
await ImageCacheService.clearDisk();

// Tüm cache'i temizle
await ImageCacheService.clearAll();
```

### Otomatik Cache Temizleme

Logout işleminde image cache otomatik olarak temizlenir (`appStore.ts`).

## 📝 Migration Guide

### Eski Image Kullanımından CachedImage'e Geçiş

**Önce:**
```tsx
import { Image } from '@gluestack-ui/themed';
import { toImageSource } from '@/src/utils';

<Image 
  source={toImageSource(imageUrl)}
  style={{ width: 200, height: 200 }}
  alt="Description"
/>
```

**Sonra:**
```tsx
import { CachedImage } from '@/src/components/CachedImage';

<CachedImage 
  source={imageUrl} // toImageSource otomatik çağrılır
  style={{ width: 200, height: 200 }}
  alt="Description"
/>
```

### Gluestack UI Image'den CachedImage'e

CachedImage, Gluestack UI Image ile uyumlu props'ları destekler:

```tsx
// resizeMode prop'u otomatik olarak contentFit'e çevrilir
<CachedImage 
  source={imageUrl}
  resizeMode="cover" // Gluestack UI uyumlu
  style={{ width: 200, height: 200 }}
/>
```

## 🎨 Best Practices

1. **Feed'lerde Priority Kullanın**
   ```tsx
   // Feed'deki görseller için normal priority
   <CachedImage priority="normal" />
   
   // Hero image'ler için high priority
   <CachedImage priority="high" />
   ```

2. **Placeholder Kullanın**
   ```tsx
   <CachedImage 
     source={avatar}
     placeholder={require('@/assets/avatar/default.png')}
   />
   ```

3. **RecyclingKey Kullanın (Listelerde)**
   ```tsx
   <FlatList
     data={posts}
     renderItem={({ item }) => (
       <CachedImage 
         source={item.image}
         recyclingKey={item.id} // List scroll performansı için
       />
     )}
   />
   ```

4. **Cache Policy'yi İhtiyaca Göre Ayarlayın**
   - Statik görseller: `memory-disk` (default)
   - Dinamik görseller: `memory` veya `none`

## 🐛 Troubleshooting

### Cache Temizlenmiyor
```tsx
// Manuel temizleme
await ImageCacheService.clearAll();
```

### Görseller Yüklenmiyor
- URL normalizasyonu kontrol edin (`toImageSource`)
- Network bağlantısını kontrol edin
- Cache policy'yi `none` yaparak test edin

### Memory Kullanımı Yüksek
- `cachePolicy="disk"` kullanın (memory cache'i devre dışı bırakır)
- `recyclingKey` kullanın (listelerde)

## 📚 Kaynaklar

- [expo-image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [expo-image GitHub](https://github.com/expo/expo/tree/main/packages/expo-image)











