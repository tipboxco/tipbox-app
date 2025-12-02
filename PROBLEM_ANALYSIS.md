# Problem Analizi ve Çözüm Planı

## Problem 1: SearchModal - Sadece Overlay Görünüyor, Content Görünmüyor

### Problem Açıklaması
SearchModal açıldığında sadece overlay (yarı saydam siyah arka plan) görünüyor, ancak modal içeriği (arama çubuğu, filtreler, sonuçlar) görünmüyor.

### Kök Neden Analizi

#### 1. Z-Index Hiyerarşisi Sorunu
```typescript
// Mevcut yapı:
<Modal>
  <Box style={styles.container}>  // flex: 1
    <RNPressable style={styles.overlay} />  // absoluteFillObject - z-index: otomatik
    <Animated.View>  // position: absolute, top: 0 - z-index belirtilmemiş
      <Box flex={1}>
        {/* Content */}
      </Box>
    </Animated.View>
  </Box>
</Modal>
```

**Sorun**: React Native'de, aynı parent içindeki elementler render sırasına göre z-index alır. `RNPressable` (overlay) `Animated.View`'den sonra render edildiği için veya `absoluteFillObject` kullanımı nedeniyle üstte kalıyor olabilir.

#### 2. Transform Animasyonu Başlangıç Değeri
```typescript
const slideAnim = useRef(new Animated.Value(-modalHeight)).current;
// Başlangıçta modalHeight kadar yukarıda (ekran dışında)
```

**Sorun**: Animasyon başlamadan önce veya animasyon sırasında content ekran dışında olabilir. `useNativeDriver: true` kullanıldığı için layout hesaplamaları gecikebilir.

#### 3. Gluestack Box ve Animated.View Uyumsuzluğu
```typescript
<Animated.View style={{...}}>
  <Box flex={1}>  // Gluestack Box
    <ScrollView>  // Gluestack ScrollView
```

**Sorun**: Gluestack componentleri native View'lere dönüştürülür. `Animated.View` içinde `flex: 1` kullanımı bazen düzgün çalışmayabilir, özellikle `position: absolute` ile birlikte kullanıldığında.

#### 4. Overflow Hidden Sorunu
```typescript
overflow: 'hidden',
```

**Sorun**: `overflow: 'hidden'` içerik render edilmeden önce kesilebilir.

### Çözüm Önerileri

#### Çözüm 1: Z-Index Açıkça Belirtme (Öncelikli)
```typescript
<Animated.View
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: modalHeight,
    zIndex: 10,  // Overlay'den yüksek
    elevation: 10,  // Android için
    // ...
  }}
>
```

#### Çözüm 2: Overlay'i Animated.View'den Önce Render Etme
```typescript
<Box style={styles.container}>
  <Animated.View style={{ zIndex: 10, ... }}>
    {/* Content */}
  </Animated.View>
  <RNPressable style={{ ...styles.overlay, zIndex: 1 }} />
</Box>
```

#### Çözüm 3: Native View Kullanımı
```typescript
// Gluestack Box yerine React Native View kullan
<Animated.View>
  <View style={{ flex: 1 }}>
    {/* Content */}
  </View>
</Animated.View>
```

#### Çözüm 4: Modal Presentation Style Değişikliği
```typescript
<Modal
  presentationStyle="overFullScreen"  // veya "fullScreen"
  // ...
>
```

---

## Problem 2: Sticky Header - En Arkada Kalıyor (Z-Index Sorunu)

### Problem Açıklaması
Scroll ile opacity değerini yükselterek sticky header gösterilmeye çalışılıyor, ancak header en arkada kalıyor ve görünmüyor. Gluestack componentlerinin SafeAreaView veya ScrollView içerisinde üste çıkartılamamasından kaynaklandığı düşünülüyor.

### Kök Neden Analizi

#### 1. React Native Z-Index Sınırlamaları
React Native'de `z-index` sadece **aynı parent container içindeki sibling elementler** arasında çalışır. Farklı parent'lar içindeki elementler arasında z-index çalışmaz.

**Mevcut Yapı:**
```typescript
<SafeAreaView>
  <Box flex={1}>
    <Animated.View style={{ position: 'absolute', zIndex: 9999 }}>
      {/* Sticky Header */}
    </Animated.View>
    <Animated.ScrollView>
      {/* Content - ScrollView içindeki elementler */}
    </Animated.ScrollView>
  </Box>
</SafeAreaView>
```

**Sorun**: `Animated.View` (sticky header) ve `Animated.ScrollView` aynı parent (`Box`) içinde olsa bile, ScrollView içindeki content'ler ScrollView'in kendi stacking context'inde olduğu için sticky header'ın üstüne çıkabilir.

#### 2. ScrollView Stacking Context
ScrollView, kendi içeriği için yeni bir stacking context oluşturur. Bu nedenle ScrollView içindeki elementler, ScrollView dışındaki absolute positioned elementlerin üstüne çıkabilir.

#### 3. Gluestack Box Component Dönüşümü
Gluestack `Box` componentleri native `View`'e dönüştürülür. Ancak bu dönüşüm sırasında bazı style özellikleri (özellikle z-index) düzgün aktarılmayabilir.

#### 4. SafeAreaView ve Z-Index
SafeAreaView, kendi stacking context'ini oluşturabilir. İçindeki absolute positioned elementler bazen beklenmedik şekilde davranabilir.

### Mevcut Implementasyon Örnekleri

#### CatalogScreen.tsx (Çalışıyor gibi görünüyor):
```typescript
<Animated.View
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    width: '100%',
    pointerEvents: 'box-none',
  }}
  collapsable={false}
>
  <Animated.View style={{ opacity: 1, zIndex: 9999 }}>
    <Box bg={...}>
      <Header />
    </Box>
  </Animated.View>
</Animated.View>
```

**Not**: Bu implementasyonda `pointerEvents: 'box-none'` kullanılmış, bu header'ın touch event'lerini geçirmesini sağlıyor.

#### BrandDetailScreen.tsx (Opacity animasyonu ile):
```typescript
const headerOpacity = scrollY.interpolate({
  inputRange: [0, 100, 180],
  outputRange: [0, 0, 1],
  extrapolate: 'clamp',
});

<Animated.View style={{ position: 'absolute', zIndex: 9999, elevation: 10 }}>
  <Animated.View style={{ opacity: headerOpacity, zIndex: 9999 }}>
    <Box>
      <Header />
    </Box>
  </Animated.View>
</Animated.View>
```

### Çözüm Önerileri

#### Çözüm 1: ScrollView'e Padding Top Eklemek (Geçici Çözüm)
```typescript
<Animated.ScrollView
  contentContainerStyle={{ paddingTop: headerHeight }}
>
  {/* Content */}
</Animated.ScrollView>
```

**Avantaj**: Basit ve hızlı
**Dezavantaj**: Header'ın üstüne scroll edilebilir, gerçek sticky değil

#### Çözüm 2: React Native'in StickyHeaderIndices Kullanımı (Önerilen)
```typescript
<ScrollView
  stickyHeaderIndices={[0]}  // İlk child sticky olur
>
  <View>
    <Header />
  </View>
  {/* Diğer content */}
</ScrollView>
```

**Avantaj**: Native destek, performanslı
**Dezavantaj**: Animated opacity ile uyumsuz olabilir

#### Çözüm 3: Portal Kullanımı (En İyi Çözüm)
React Native Portal kullanarak sticky header'ı root level'a taşımak:

```typescript
import { Portal } from '@gorhom/portal';  // veya react-native-portalize

// Screen içinde:
<ScrollView>
  {/* Content */}
</ScrollView>

<Portal>
  <Animated.View style={{ position: 'absolute', zIndex: 9999 }}>
    <Header />
  </Animated.View>
</Portal>
```

**Avantaj**: Z-index sorunları tamamen çözülür
**Dezavantaj**: Ek dependency gerekir

#### Çözüm 4: React Native Reanimated ile Shared Value (Modern Çözüm)
```typescript
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const scrollY = useSharedValue(0);

const headerStyle = useAnimatedStyle(() => ({
  opacity: scrollY.value > 100 ? 1 : 0,
  zIndex: 9999,
}));
```

**Avantaj**: Daha performanslı, native thread'de çalışır
**Dezavantaj**: Mevcut Animated API'den farklı

#### Çözüm 5: Gluestack Box Yerine Native View Kullanımı
```typescript
<Animated.View style={{ position: 'absolute', zIndex: 9999 }}>
  <View style={{ backgroundColor: ... }}>  // Native View
    <Header />
  </View>
</Animated.View>
```

**Avantaj**: Z-index garantili çalışır
**Dezavantaj**: Gluestack styling avantajlarını kaybedersiniz

#### Çözüm 6: Elevation ve Z-Index Kombinasyonu (Android için)
```typescript
<Animated.View
  style={{
    position: 'absolute',
    zIndex: 9999,
    elevation: 10,  // Android için kritik
    // iOS için shadow ekle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }}
>
```

---

## Önerilen Çözüm Planı

### Aşama 1: SearchModal Düzeltmesi (Hızlı Çözüm)
1. Animated.View'e açıkça `zIndex: 10` ekle
2. Overlay'e `zIndex: 1` ekle
3. Render sırasını kontrol et (Animated.View önce, overlay sonra)

### Aşama 2: Sticky Header İyileştirmesi (Orta Vadeli)
1. Mevcut implementasyonları incele (CatalogScreen, BrandDetailScreen)
2. Portal kullanımını değerlendir (uzun vadeli çözüm)
3. Geçici olarak `elevation` ve `shadow` ekle
4. Gluestack Box yerine native View kullanmayı test et

### Aşama 3: Genel Z-Index Yönetimi (Uzun Vadeli)
1. Tüm modals, bottom sheets, sticky headers için tutarlı z-index değerleri belirle
2. Z-index constants dosyası oluştur
3. Portal kullanımını standartlaştır

---

## Z-Index Katmanları (Önerilen)

```
Modal Layer:        zIndex: 10000
Bottom Sheet:        zIndex: 9000
Sticky Header:      zIndex: 8000
Floating Button:    zIndex: 7000
Dropdown/Select:    zIndex: 6000
Tooltip:            zIndex: 5000
```

---

## Test Senaryoları

### SearchModal Test:
1. Modal açıldığında content görünüyor mu?
2. Animasyon düzgün çalışıyor mu?
3. Overlay tıklanabilir mi?
4. Swipe gesture çalışıyor mu?

### Sticky Header Test:
1. Scroll yapıldığında header görünüyor mu?
2. Header diğer content'lerin üstünde mi?
3. Opacity animasyonu düzgün çalışıyor mu?
4. Touch event'ler header'a ulaşıyor mu?

---

## Notlar

- React Native'de z-index çalışma mantığı web'den farklıdır
- `elevation` Android için kritiktir, iOS'ta çalışmaz
- `shadow` properties iOS için kritiktir, Android'de çalışmaz
- Portal kullanımı en güvenilir çözümdür ama ek dependency gerektirir
- Gluestack componentleri bazen native View'lere dönüştürülürken style kaybı yaşanabilir

