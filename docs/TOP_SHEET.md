# Top Sheet Implementation Guide

Bu dokümantasyon, React Native'de yukarıdan aşağıya açılan top sheet yapısının nasıl implement edildiğini açıklar. SearchModal component'i örnek olarak kullanılmıştır.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Yapı ve Mimari](#yapı-ve-mimari)
4. [Implementasyon Detayları](#implementasyon-detayları)
5. [Thread Safety](#thread-safety)
6. [Gesture Handling](#gesture-handling)
7. [Kullanım Örneği](#kullanım-örneği)
8. [Best Practices](#best-practices)

---

## Genel Bakış

Top sheet, ekranın üstünden aşağıya doğru açılan bir modal yapısıdır. Bottom sheet'in tersi olarak çalışır ve kullanıcı deneyimi için önemli bir UI pattern'idir.

### Özellikler

- ✅ Yukarıdan aşağıya smooth animasyon
- ✅ Handler'dan sürükleme (alttan yukarı çekme ile kapatma)
- ✅ Realtime kayma takibi
- ✅ Thread-safe implementasyon
- ✅ Klavye yönetimi
- ✅ Safe area desteği

---

## Kullanılan Teknolojiler

### Ana Kütüphaneler

```json
{
  "react-native": "0.81.5",
  "react-native-reanimated": "~4.1.1",
  "react-native-gesture-handler": "~2.28.0"
}
```

### Import'lar

```typescript
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, Keyboard, ActivityIndicator, Dimensions, Modal, StyleSheet, Pressable as RNPressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

---

## Yapı ve Mimari

### Component Yapısı

```
SearchModal (Top Sheet)
├── Modal (React Native)
│   ├── GestureHandlerRootView
│   │   ├── Overlay (Animated.View)
│   │   └── Search Panel (Animated.View)
│   │       ├── Header
│   │       │   ├── Search Bar
│   │       │   └── Filters
│   │       ├── Content (ScrollView)
│   │       └── Handler (GestureDetector) - ALTA
```

### Önemli Sabitler

```typescript
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.5; // %50 ekran yüksekliği
const SWIPE_THRESHOLD = 100; // Kapatma için minimum kayma mesafesi
```

---

## Implementasyon Detayları

### 1. Animation Values

```typescript
// Animation values - Reanimated shared values
const translateY = useSharedValue(-MODAL_HEIGHT); // Başlangıç: ekranın dışında (yukarıda)
const opacity = useSharedValue(0); // Overlay opacity
const panY = useSharedValue(0); // Gesture sırasında kayma değeri
```

### 2. State Yönetimi

```typescript
const [shouldRender, setShouldRender] = useState(false); // Render kontrolü
const [isAnimating, setIsAnimating] = useState(false); // Animasyon durumu
```

### 3. Modal Açılma/Kapanma Animasyonu

```typescript
useEffect(() => {
  if (visible) {
    setShouldRender(true);
    setIsAnimating(true);
    
    // Değerleri reset et
    translateY.value = -MODAL_HEIGHT;
    panY.value = 0;
    
    // Animasyonu başlat
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(
        0, // Ekranın üstüne gel
        {
          damping: 20,
          stiffness: 90,
          mass: 0.5,
        },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(setIsAnimating)(false);
            runOnJS(focusInput)();
          }
        }
      );
    }, 50);

    return () => clearTimeout(timer);
  } else if (shouldRender) {
    setIsAnimating(true);
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(
      -MODAL_HEIGHT, // Ekranın dışına çık
      {
        damping: 20,
        stiffness: 90,
        mass: 0.5,
      },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(closeModal)();
        }
      }
    );
  }
}, [visible, translateY, opacity, panY, shouldRender, focusInput, closeModal]);
```

### 4. Animated Styles

```typescript
// Modal animasyon style'ı
const modalAnimatedStyle = useAnimatedStyle(() => {
  'worklet';
  return {
    transform: [{ translateY: translateY.value + panY.value }],
  };
}, [translateY, panY]);

// Overlay animasyon style'ı
const overlayAnimatedStyle = useAnimatedStyle(() => {
  'worklet';
  return {
    opacity: opacity.value,
  };
}, [opacity]);
```

---

## Thread Safety

### Önemli Noktalar

1. **Callback'ler Worklet Dışında Tanımlanmalı**
   ```typescript
   // ✅ DOĞRU
   const closeModal = useCallback(() => {
     handleClose();
     setShouldRender(false);
     setIsAnimating(false);
     translateY.value = -MODAL_HEIGHT;
     panY.value = 0;
   }, [handleClose]);

   // ❌ YANLIŞ - Worklet içinde state setter kullanmak
   ```

2. **runOnJS Kullanımı**
   ```typescript
   // Worklet callback içinde JS thread'ine geçiş
   runOnJS(closeModal)(); // ✅ Doğru
   runOnJS(setIsAnimating)(false); // ✅ Doğru
   ```

3. **'worklet' Directive**
   ```typescript
   .onUpdate((event) => {
     'worklet'; // ✅ Her zaman ekle
     // ...
   })
   ```

4. **useMemo ile Gesture Handler**
   ```typescript
   const panGesture = useMemo(
     () => Gesture.Pan()...
     [dependencies]
   );
   ```

---

## Gesture Handling

### Handler Konumu

**Handler ALTA yerleştirilmelidir** - alttan yukarı çekme için:

```typescript
<VStack flex={1}>
  {/* Header */}
  <VStack>...</VStack>
  
  {/* Content */}
  <ScrollView>...</ScrollView>
  
  {/* Handler - ALTA */}
  <GestureDetector gesture={panGesture}>
    <Animated.View
      style={{
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
      }}
    >
      <Box
        width={40}
        height={4}
        borderRadius={2}
        bg={isDark ? '#3C3C3E' : '#D1D1D6'}
      />
    </Animated.View>
  </GestureDetector>
</VStack>
```

### Gesture Handler Implementasyonu

```typescript
const panGesture = useMemo(
  () =>
    Gesture.Pan()
      .onStart(() => {
        'worklet';
        // Gesture başladı
      })
      .onUpdate((event) => {
        'worklet';
        // Alttan yukarı çekme (kapatma) - translationY negatif
        if (event.translationY < 0) {
          panY.value = event.translationY;
        }
      })
      .onEnd((event) => {
        'worklet';
        const totalTranslation = translateY.value + panY.value;

        // Eğer yeterince yukarı çekildiyse kapat
        if (totalTranslation < -SWIPE_THRESHOLD || event.velocityY < -500) {
          panY.value = 0;
          translateY.value = withSpring(
            -MODAL_HEIGHT,
            {
              damping: 20,
              stiffness: 90,
              mass: 0.5,
            },
            (finished) => {
              'worklet';
              if (finished) {
                runOnJS(closeModal)();
              }
            }
          );
          opacity.value = withTiming(0, { duration: 200 });
        } else {
          // Geri dön
          panY.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
          });
        }
      })
      .enabled(visible && shouldRender && !isAnimating), // Sadece gerektiğinde aktif
  [visible, shouldRender, isAnimating, panY, translateY, opacity, closeModal]
);
```

### Gesture Mantığı

- **Alttan yukarı çekme**: `event.translationY < 0` (negatif değer = yukarı)
- **Kapatma threshold**: `-SWIPE_THRESHOLD` (100px) veya `velocityY < -500`
- **Realtime kayma**: `panY.value` ile anlık takip

---

## Kullanım Örneği

### Component Kullanımı

```typescript
import { SearchModal } from '@/src/components/SearchModal';

const MyScreen = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setIsSearchVisible(true)}>
        Search
      </Button>
      
      <SearchModal
        visible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />
    </>
  );
};
```

### Props Interface

```typescript
interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}
```

---

## Best Practices

### 1. **Callback Sıralaması**

Callback'ler kullanılmadan önce tanımlanmalı:

```typescript
// ✅ DOĞRU SIRALAMA
const focusInput = useCallback(...);
const closeModal = useCallback(...); // useEffect'ten önce
useEffect(() => {
  // closeModal burada kullanılıyor
}, [closeModal]);
```

### 2. **Animasyon Kontrolü**

Animasyon sırasında gesture handler'ı devre dışı bırak:

```typescript
.enabled(visible && shouldRender && !isAnimating)
```

### 3. **Debounce Optimizasyonu**

Search API çağrıları için debounce kullan:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery.trim());
  }, 500); // 500ms debounce

  return () => clearTimeout(timer);
}, [searchQuery]);
```

### 4. **Memory Leak Önleme**

Cleanup fonksiyonları kullan:

```typescript
useEffect(() => {
  const timer = setTimeout(...);
  return () => clearTimeout(timer); // ✅ Cleanup
}, [dependencies]);
```

### 5. **Thread Safety**

- `'worklet'` directive ekle
- `runOnJS` ile JS thread'ine geçiş yap
- Callback'leri worklet dışında tanımla
- Shared value'lara direkt erişim yap (worklet dışında)

---

## Performans İpuçları

### 1. **useMemo ile Optimizasyon**

```typescript
const panGesture = useMemo(() => Gesture.Pan()..., [deps]);
const modalAnimatedStyle = useAnimatedStyle(..., [deps]);
```

### 2. **Conditional Rendering**

```typescript
if (!shouldRender && !visible) {
  return null; // Gereksiz render'ı önle
}
```

### 3. **Gesture Handler Enabled Control**

```typescript
.enabled(visible && shouldRender && !isAnimating)
```

---

## Sorun Giderme

### 1. **Thread Rush / Crash**

**Sorun:** Search sırasında app crash oluyor

**Çözüm:**
- Gesture handler'ı animasyon sırasında devre dışı bırak
- Debounce'u artır (500ms)
- `runOnJS` kullanımını minimize et
- Callback'leri worklet dışında tanımla

### 2. **Handler Görünmüyor**

**Sorun:** Handler görünmüyor veya çalışmıyor

**Çözüm:**
- Handler'ın altta olduğundan emin ol
- `GestureDetector` doğru kullanıldığından emin ol
- `enabled` prop'unu kontrol et

### 3. **Animasyon Yavaş**

**Sorun:** Animasyon yavaş veya takılıyor

**Çözüm:**
- Spring parametrelerini optimize et
- `isAnimating` state'i ile gesture handler'ı kontrol et
- Gereksiz re-render'ları önle

---

## Örnek Dosya Yapısı

```
src/components/SearchModal/
├── index.tsx          # Ana component
└── types.ts          # Type definitions (opsiyonel)
```

---

## Referanslar

- [React Native Reanimated v4 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [SearchModal Implementation](../src/components/SearchModal/index.tsx)

---

## Notlar

- Top sheet yapısı bottom sheet'in tersi mantıkla çalışır
- Handler **ALTA** yerleştirilmelidir (alttan yukarı çekme için)
- Thread safety kritik öneme sahiptir
- Animasyon sırasında gesture handler devre dışı bırakılmalıdır

---

*Son güncelleme: SearchModal implementasyonu baz alınarak oluşturulmuştur.*



