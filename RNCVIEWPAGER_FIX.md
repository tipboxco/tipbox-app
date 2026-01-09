# RNCViewPager Çift Kayıt Hatası Düzeltmesi

## Sorun
```
ERROR [Invariant Violation: Tried to register two views with the same name RNCViewPager]
```

## Neden
`react-native-pager-view` hem doğrudan `package.json`'da hem de `react-native-collapsible-tab-view` bağımlılığı olarak yüklenmiş. Bu, native modülün iki kez kaydedilmesine neden oluyor.

## Yapılan Düzeltmeler

### 1. npm dedupe
Duplicate paketleri temizlemek için çalıştırıldı:
```bash
npm dedupe react-native-pager-view
```

### 2. Native Build Cache Temizlendi
```bash
rm -rf ios android .expo node_modules/.cache
npx expo prebuild --clean
```

### 3. Metro Cache Temizleme
Metro bundler'ı cache ile temizleyerek başlatın:
```bash
npx expo start --clear
```

## Sonraki Adımlar

### iOS için:
```bash
cd ios && pod install && cd ..
npx expo run:ios
```

### Android için:
```bash
npx expo run:android
```

## Alternatif Çözüm (Eğer Sorun Devam Ederse)

Eğer hata devam ederse, `react-native-pager-view`'ı doğrudan kullanan yerlerde `react-native-collapsible-tab-view`'dan import edebilirsiniz:

```typescript
// Eski:
import PagerView from 'react-native-pager-view';

// Yeni (eğer gerekirse):
import { PagerView } from 'react-native-collapsible-tab-view';
```

Ancak bu genellikle gerekli değildir çünkü `react-native-collapsible-tab-view` zaten `react-native-pager-view`'ı peer dependency olarak kullanır.

## Test
Uygulamayı başlattıktan sonra şu ekranları test edin:
- InboxScreen (PagerView kullanıyor)
- ExploreScreen (PagerView kullanıyor)
- EventsScreen (PagerView kullanıyor)

Bu ekranlarda hata olmamalı.
