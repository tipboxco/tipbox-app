# Tab Swiping Implementation Guide

Bu dokümantasyon, React Native'de PagerView ve Reanimated kullanarak native tab swiping implementasyonunu açıklar. Bu yapı InboxScreen'de kullanılmaktadır ve başka ekranlarda da tekrar kullanılabilir.

## Özellikler

- ✅ Native swipe gesture desteği (PagerView)
- ✅ Smooth animasyonlu tab indicator
- ✅ Realtime tab label renk geçişleri
- ✅ Tab press ile programatik geçiş
- ✅ Performanslı (Reanimated worklet'ler)
- ✅ Type-safe implementasyon

## Gereksinimler

```json
{
  "react-native-pager-view": "^6.x.x",
  "react-native-reanimated": "^3.x.x"
}
```

## Temel Yapı

### 1. Import'lar

```typescript
import React, { useRef, useCallback, useState } from 'react';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
```

### 2. State ve Ref'ler

```typescript
const pagerRef = useRef<PagerView>(null);
const tabContainerRef = useRef<any>(null);
const [tabContainerWidth, setTabContainerWidth] = useState(0);
const [currentPage, setCurrentPage] = useState(0);

// 🎯 CORE: Shared progress value (0 = Tab 1, 1 = Tab 2, ...)
const progress = useSharedValue(0);
```

### 3. Event Handler'lar

#### Tab Press Handler
```typescript
const handleTabPress = useCallback((index: number) => {
  pagerRef.current?.setPage(index);
}, []);
```

#### Page Scroll Handler (Realtime Progress)
```typescript
const handlePageScroll = useCallback(
  (e: any) => {
    'worklet';
    const { position, offset } = e.nativeEvent;
    progress.value = position + offset;
  },
  [progress]
);
```

#### Page Selected Handler (Snap Sonrası Sync)
```typescript
const handlePageSelected = useCallback(
  (e: any) => {
    const position = e.nativeEvent.position;
    progress.value = withTiming(position, { duration: 0 });
    setCurrentPage(position);
  },
  [progress]
);
```

### 4. Animated Styles

#### Tab Label Color Animation

Her tab için ayrı animated style oluşturun:

```typescript
// Tab 1 (İlk tab)
const tab1Style = useAnimatedStyle(() => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#8C8C8C';
  const color = interpolateColor(
    progress.value,
    [0, 1], // Progress range
    [activeColor, inactiveColor] // Tab 1: active -> inactive
  );
  return { color };
});

// Tab 2 (İkinci tab)
const tab2Style = useAnimatedStyle(() => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#8C8C8C';
  const color = interpolateColor(
    progress.value,
    [0, 1], // Progress range
    [inactiveColor, activeColor] // Tab 2: inactive -> active
  );
  return { color };
});
```

#### Indicator Position Animation

```typescript
const tabWidth = tabContainerWidth / numberOfTabs || 0;
const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i

const indicatorStyle = useAnimatedStyle(() => {
  // Her tab'in ortasına yerleştirmek için
  const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
  return {
    transform: [{ translateX }],
  };
});
```

### 5. JSX Yapısı

```typescript
return (
  <VStack flex={1}>
    {/* Tab Header */}
    <VStack pt="$4" bg={isDark ? '#000' : '#FFF'}>
      <HStack
        ref={tabContainerRef}
        borderBottomWidth={1}
        borderColor="#E9E9E9"
        p={0}
        m={0}
        position="relative"
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          setTabContainerWidth(width);
        }}
      >
        {/* Tab 1 Label */}
        <Pressable
          flex={1}
          onPress={() => handleTabPress(0)}
          alignItems="center"
          py="$1"
        >
          <VStack alignItems="center" space="xs">
            <Animated.Text
              style={[
                {
                  fontSize: 12,
                  fontWeight: 'bold',
                },
                tab1Style,
              ]}
            >
              Tab 1 Label
            </Animated.Text>
          </VStack>
        </Pressable>

        {/* Tab 2 Label */}
        <Pressable
          flex={1}
          onPress={() => handleTabPress(1)}
          alignItems="center"
          py="$1"
        >
          <VStack alignItems="center" space="xs">
            <Animated.Text
              style={[
                {
                  fontSize: 12,
                  fontWeight: 'bold',
                },
                tab2Style,
              ]}
            >
              Tab 2 Label
            </Animated.Text>
          </VStack>
        </Pressable>

        {/* Animated Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: indicatorWidth,
                height: 2,
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
              },
              indicatorStyle,
            ]}
          />
        )}
      </HStack>
    </VStack>

    {/* PagerView - Native swipe tab switching */}
    <AnimatedPagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={0}
      onPageScroll={handlePageScroll}
      onPageSelected={handlePageSelected}
    >
      {/* Tab 1 Content */}
      <Box key="0" flex={1}>
        <Tab1Screen />
      </Box>

      {/* Tab 2 Content */}
      <Box key="1" flex={1}>
        <Tab2Screen />
      </Box>
    </AnimatedPagerView>
  </VStack>
);
```

## Dinamik Tab Sayısı İçin Genelleştirme

Eğer tab sayısı dinamikse, aşağıdaki gibi genelleştirilebilir:

```typescript
interface Tab {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

const tabs: Tab[] = [
  { id: 'tab1', label: 'Tab 1', component: Tab1Screen },
  { id: 'tab2', label: 'Tab 2', component: Tab2Screen },
  { id: 'tab3', label: 'Tab 3', component: Tab3Screen },
];

// Tab label styles - dinamik oluşturma
const tabStyles = tabs.map((_, index) => {
  return useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    
    // Her tab için progress range hesapla
    const startProgress = index / (tabs.length - 1);
    const endProgress = (index + 1) / (tabs.length - 1);
    
    const color = interpolateColor(
      progress.value,
      [startProgress, endProgress],
      index === currentPage ? [activeColor, activeColor] : [inactiveColor, inactiveColor]
    );
    
    return { color };
  });
});

// Indicator genişliği
const tabWidth = tabContainerWidth / tabs.length || 0;
const indicatorWidth = tabWidth * 0.8;

const indicatorStyle = useAnimatedStyle(() => {
  const translateX = progress.value * tabWidth * (tabs.length - 1) + (tabWidth - indicatorWidth) / 2;
  return {
    transform: [{ translateX }],
  };
});
```

## Özelleştirme Seçenekleri

### Indicator Genişliği
```typescript
const indicatorWidth = tabWidth * 0.8; // %80 (varsayılan)
// veya
const indicatorWidth = tabWidth * 0.6; // %60 (daha dar)
// veya
const indicatorWidth = tabWidth; // %100 (tam genişlik)
```

### Indicator Yüksekliği
```typescript
height: 2, // Varsayılan
// veya
height: 3, // Daha kalın
```

### Tab Label Font Size
```typescript
fontSize: 12, // Varsayılan
// veya
fontSize: 14, // Daha büyük
```

### Renkler
```typescript
const activeColor = isDark ? '#FFFFFF' : '#000000';
const inactiveColor = '#8C8C8C';
// Özelleştirilebilir
```

## Performans İpuçları

1. **Worklet Kullanımı**: `handlePageScroll` içinde `'worklet'` directive kullanın - bu UI thread'de çalışır
2. **useCallback**: Tüm handler'ları `useCallback` ile memoize edin
3. **useAnimatedStyle**: Animated style'ları `useAnimatedStyle` ile oluşturun
4. **Shared Value**: `progress` shared value'sunu doğrudan kullanın, state'e dönüştürmeyin

## Örnek Kullanım Senaryoları

### Senaryo 1: Basit 2 Tab
```typescript
// InboxScreen gibi - 2 tab (Messages, Support Requests)
const tabs = ['Messages', 'Support Requests'];
```

### Senaryo 2: 3+ Tab
```typescript
// EventsScreen gibi - 3 tab (Community, Achievement, Leaderboard)
const tabs = ['Community', 'Achievement', 'Leaderboard'];
```

### Senaryo 3: Dinamik Tab'lar
```typescript
// API'den gelen tab'lar
const tabs = categories.map(cat => cat.name);
```

## Sorun Giderme

### Tab'lar arası swipe çalışmıyor
- PagerView'un `style={{ flex: 1 }}` olduğundan emin olun
- `onPageScroll` ve `onPageSelected` handler'larının doğru tanımlandığından emin olun

### Indicator pozisyonu yanlış
- `tabContainerWidth` state'inin doğru güncellendiğinden emin olun
- `onLayout` event'inin çalıştığından emin olun
- `tabWidth` hesaplamasının doğru olduğundan emin olun

### Tab label renkleri animasyonlu değil
- `Animated.Text` kullandığınızdan emin olun (normal `Text` değil)
- `useAnimatedStyle` hook'unun doğru kullanıldığından emin olun
- `interpolateColor` fonksiyonunun doğru parametrelerle çağrıldığından emin olun

## Referanslar

- [react-native-pager-view](https://github.com/callstack/react-native-pager-view)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [InboxScreen Implementation](../../src/features/inbox/screens/InboxScreen.tsx)

## Versiyon

- **Oluşturulma Tarihi**: 2024-12-19
- **Son Güncelleme**: 2024-12-19
- **Versiyon**: 1.0.0

