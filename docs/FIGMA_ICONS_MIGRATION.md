# Figma Icons to Heroicons Migration Guide

Bu dokümantasyon, Figma'dan çıkarılan icon isimlerinin heroicons kütüphanesine nasıl map edildiğini açıklar.

## 📋 Icon Listesi

Toplam **78 icon** Figma'dan çıkarıldı ve heroicons ile eşleştirildi.

## 🎯 Kullanım

### Import Örneği

```typescript
// Outline (varsayılan) iconlar
import {
  HomeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  CalendarIcon,
  BellIcon,
  EnvelopeIcon,
} from 'react-native-heroicons/outline';

// Solid (dolu) iconlar
import {
  HomeIcon as HomeIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
```

### Mapping Dosyası Kullanımı

```typescript
import { getHeroiconName } from '@/src/config/figma-icons-mapping';

// Figma icon isminden heroicon ismine çevir
const heroiconName = getHeroiconName('home'); // 'HomeIcon' döner
```

## 📊 Icon Kategorileri

### Tab Navigation Icons
- `home` → `HomeIcon`
- `magnifying-glass` → `MagnifyingGlassIcon`
- `rectangle-stack` → `Squares2X2Icon`
- `events` → `CalendarIcon`
- `bell` → `BellIcon`
- `envelope` → `EnvelopeIcon`

### User & Account
- `user-circle` → `UserCircleIcon`
- `user-plus` → `UserPlusIcon`
- `users` → `UsersIcon`

### Actions
- `heart` → `HeartIcon`
- `bookmark` → `BookmarkIcon`
- `chat-bubble-left` → `ChatBubbleLeftIcon`
- `paper-airplane` → `PaperAirplaneIcon`
- `share` / `arrow-top-right-on-square` → `ArrowTopRightOnSquareIcon`
- `flag` → `FlagIcon`
- `trash` → `TrashIcon`
- `plus` → `PlusIcon`

### Shopping & Marketplace
- `shopping-cart` → `ShoppingCartIcon` (⚠️ Heroicons'da yok, alternatif: `ShoppingBagIcon`)
- `shopping-bag` → `ShoppingBagIcon`

### Settings & Security
- `cog-6-tooth` → `Cog6ToothIcon`
- `key` → `KeyIcon`
- `lock-closed` → `LockClosedIcon`
- `shield-check` → `ShieldCheckIcon`

## ⚠️ Heroicons'da Olmayan Iconlar

Aşağıdaki iconlar heroicons kütüphanesinde bulunmuyor. Alternatif iconlar önerilmiştir:

1. **wallet** → Alternatif: `CurrencyDollarIcon` veya custom icon
2. **shopping-cart** → Alternatif: `ShoppingBagIcon`
3. **bars-arrow** → Custom icon gerekli
4. **circle-stack** → Custom icon gerekli

## 🔄 Migration Stratejisi

1. **Mevcut icon kullanımlarını bul:**
   ```bash
   grep -r "@expo/vector-icons\|react-native-heroicons" src/
   ```

2. **Figma icon isimlerini heroicons ile değiştir:**
   - `figma-icons-mapping.ts` dosyasındaki mapping'i kullan
   - Outline ve Solid versiyonları doğru import et

3. **Test et:**
   - Her icon'un doğru render edildiğini kontrol et
   - Outline/Solid geçişlerini test et

## 📝 Notlar

- Heroicons'da tüm iconlar hem `outline` hem de `solid` versiyonlarda mevcuttur
- Bazı iconlar heroicons'da farklı isimlerle bulunabilir (örn: `chevron` → `ChevronRightIcon`)
- Eksik iconlar için custom SVG iconlar kullanılabilir veya alternatif iconlar seçilebilir
