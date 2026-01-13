# Detached Bottom Sheet Implementation Guide

Bu dokümantasyon, React Native'de GlobalBottomSheet kullanarak detached bottom sheet implementasyonunu açıklar. Bu yapı badge detayları ve benzeri içerikler için kullanılmaktadır.

## Özellikler

- ✅ Detached modal görünümü (kenarlardan boşluklu)
- ✅ Backdrop ile arka plan karartma
- ✅ Smooth animasyonlu açılış/kapanış
- ✅ Dynamic sizing (içeriğe göre otomatik boyutlandırma)
- ✅ Pan down to close gesture desteği
- ✅ Dark mode desteği

## Gereksinimler

```json
{
  "@gorhom/bottom-sheet": "^5.x.x",
  "react-native-reanimated": "^3.x.x"
}
```

## Temel Yapı

### 1. Import'lar

```typescript
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSafeAreaValues } from '@/src/utils';
import { useColorMode } from '@/src/hooks/useColorMode';
```

### 2. Hook'lar ve State

```typescript
const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
const bottomInset = useSafeAreaValues('bottom');
const { colorMode } = useColorMode();
const isDark = colorMode === 'dark';
```

### 3. Bottom Sheet Açma Fonksiyonu

```typescript
const handleOpenBottomSheet = useCallback(() => {
  openBottomSheet(
    <YourBottomSheetContent
      data={yourData}
      onClose={closeBottomSheet}
    />,
    {
      detached: true,
      enablePanDownToClose: true,
      enableOverDrag: false,
      enableHandlePanningGesture: true,
      enableContentPanningGesture: true,
      enableDynamicSizing: true,
      animateOnMount: true,
      backdropOpacity: 0.5,
      backdropPressBehavior: 'close',
      backgroundStyle: {
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
        borderRadius: 20,
      },
      handleStyle: {
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      handleIndicatorStyle: {
        backgroundColor: isDark ? '#333333' : '#CCCCCC',
        width: 40,
        height: 4,
      },
      style: {
        marginHorizontal: 4, // veya 24 (ihtiyaca göre)
        marginBottom: bottomInset + 24,
      },
      paddingBottom: bottomInset + 8,
    }
  );
}, [openBottomSheet, closeBottomSheet, isDark, bottomInset]);
```

## Standart Konfigürasyon

### Minimal Margin (marginHorizontal: 4)

Daha geniş görünüm için:

```typescript
style: {
  marginHorizontal: 4,
  marginBottom: bottomInset + 24,
}
```

**Kullanım örnekleri:**
- AchievementTab.tsx
- CollectionsScreen.tsx (BadgeDetail için)

### Standart Margin (marginHorizontal: 24)

Daha dar, ortalanmış görünüm için:

```typescript
style: {
  marginHorizontal: 24,
}
```

**Kullanım örnekleri:**
- AchievementBadgesTab.tsx

## Options Açıklamaları

### Temel Ayarlar

| Option | Değer | Açıklama |
|--------|-------|----------|
| `detached` | `true` | Detached modal modu (kenarlardan boşluklu) |
| `enablePanDownToClose` | `true` | Aşağı çekerek kapatma |
| `enableOverDrag` | `false` | Sınır ötesi esneme kapalı |
| `enableHandlePanningGesture` | `true` | Handle'dan sürükleme açık |
| `enableContentPanningGesture` | `true` | İçerikten sürükleme açık |
| `enableDynamicSizing` | `true` | İçeriğe göre otomatik boyutlandırma |
| `animateOnMount` | `true` | Açılış animasyonu |

### Backdrop Ayarları

| Option | Değer | Açıklama |
|--------|-------|----------|
| `backdropOpacity` | `0.5` | Arka plan karartma opaklığı (0-1) |
| `backdropPressBehavior` | `'close'` | Backdrop'a tıklayınca kapat |

### Style Ayarları

#### backgroundStyle
```typescript
backgroundStyle: {
  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
  borderRadius: 20,
}
```

#### handleStyle
```typescript
handleStyle: {
  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
}
```

#### handleIndicatorStyle
```typescript
handleIndicatorStyle: {
  backgroundColor: isDark ? '#333333' : '#CCCCCC',
  width: 40,
  height: 4,
}
```

#### style (Container)
```typescript
style: {
  marginHorizontal: 4, // veya 24
  marginBottom: bottomInset + 24,
}
```

## Örnek Component Yapısı

### BadgeBottomSheet Örneği

```typescript
import React from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';

interface BadgeBottomSheetProps {
  data: YourDataType;
  onClose: () => void;
}

export const BadgeBottomSheet: React.FC<BadgeBottomSheetProps> = ({ data, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack space="lg" p="$6" minHeight={500}>
      {/* Header - X Button and Title */}
      <HStack alignItems="center" justifyContent="space-between" mb="$2">
        {/* X Close Button */}
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        
        {/* Title - Centered */}
        <Box flex={1} alignItems="center">
          <Text
            fontSize={24}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
            textAlign="center"
          >
            {data.title}
          </Text>
        </Box>
        
        {/* Spacer for centering */}
        <Box width={24} />
      </HStack>

      {/* Content */}
      {/* ... */}
    </VStack>
  );
};
```

## Kullanım Senaryoları

### Senaryo 1: Badge Detay Gösterimi

```typescript
// AchievementTab.tsx veya AchievementBadgesTab.tsx
const handleBadgePress = useCallback((badge: Badge) => {
  const badgeData = mapToBadgeData(badge);
  
  openBottomSheet(
    <BadgeBottomSheet
      data={badgeData}
      onClose={closeBottomSheet}
    />,
    {
      detached: true,
      enablePanDownToClose: true,
      enableOverDrag: false,
      enableHandlePanningGesture: true,
      enableContentPanningGesture: true,
      enableDynamicSizing: true,
      animateOnMount: true,
      backdropOpacity: 0.5,
      backdropPressBehavior: 'close',
      backgroundStyle: {
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
        borderRadius: 20,
      },
      handleStyle: {
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      handleIndicatorStyle: {
        backgroundColor: isDark ? '#333333' : '#CCCCCC',
        width: 40,
        height: 4,
      },
      style: {
        marginHorizontal: 4, // veya 24
        marginBottom: bottomInset + 24,
      },
      paddingBottom: bottomInset + 8,
    }
  );
}, [openBottomSheet, closeBottomSheet, isDark, bottomInset]);
```

### Senaryo 2: Scrollable İçerik (BadgeDetail)

```typescript
// CollectionsScreen.tsx
openBottomSheet(
  <Box flex={1}>
    {/* Sticky Header */}
    <Box
      bg={isDark ? '#1F1F1F' : '#FFFFFF'}
      borderBottomWidth={1}
      borderBottomColor={isDark ? '#333333' : '#F0F0F0'}
      px={15}
      py={15}
    >
      {/* Header content */}
    </Box>

    {/* Scrollable Content */}
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: safeAreaBottom }}
      showsVerticalScrollIndicator={false}
    >
      <YourScrollableContent />
    </BottomSheetScrollView>
  </Box>,
  {
    // ... same options
    enableContentPanningGesture: false, // Scrollable içerik için false
  }
);
```

## Özelleştirme Seçenekleri

### Margin Horizontal

```typescript
// Minimal margin (daha geniş)
marginHorizontal: 4

// Standart margin (daha dar, ortalanmış)
marginHorizontal: 24
```

### Border Radius

```typescript
// Yuvarlatılmış köşeler
borderRadius: 20

// Daha az yuvarlatılmış
borderRadius: 16
```

### Backdrop Opacity

```typescript
// Daha koyu arka plan
backdropOpacity: 0.7

// Daha açık arka plan
backdropOpacity: 0.3

// Arka plan yok (backdrop render edilmez)
backdropOpacity: 0
```

### Handle Indicator

```typescript
// Daha geniş indicator
width: 50, height: 4

// Daha dar indicator
width: 30, height: 3
```

## Performans İpuçları

1. **useCallback**: Handler fonksiyonlarını `useCallback` ile memoize edin
2. **Dynamic Sizing**: İçerik yüksekliği değişkense `enableDynamicSizing: true` kullanın
3. **Content Panning**: Scrollable içerik varsa `enableContentPanningGesture: false` yapın
4. **Animate On Mount**: Smooth açılış için `animateOnMount: true` kullanın

## Sorun Giderme

### Bottom sheet çok geniş görünüyor
- `marginHorizontal` değerini artırın (4 → 24)

### Bottom sheet çok dar görünüyor
- `marginHorizontal` değerini azaltın (24 → 4)

### Backdrop görünmüyor
- `backdropOpacity: 0` ise backdrop render edilmez
- `backdropOpacity: 0.5` gibi bir değer kullanın

### İçerik scroll edilmiyor
- `enableContentPanningGesture: false` yapın
- `BottomSheetScrollView` kullanın

### Bottom sheet safe area'yı göz ardı ediyor
- `bottomInset: safeAreaBottom` ekleyin
- `marginBottom: bottomInset + 24` kullanın
- `paddingBottom: bottomInset + 8` ekleyin

## Referanslar

- [GlobalBottomSheet Component](../../src/components/GlobalBottomSheet/index.tsx)
- [BadgeBottomSheet Component](../../src/features/events/components/BadgeBottomSheet/index.tsx)
- [AchievementTab Implementation](../../src/features/events/components/TabContents/AchievementTab.tsx)
- [AchievementBadgesTab Implementation](../../src/features/profile/components/TabsPage/AchievementBadgesTab.tsx)
- [CollectionsScreen Implementation](../../src/features/profile/screens/CollectionsScreen.tsx)

## Versiyon

- **Oluşturulma Tarihi**: 2024-12-19
- **Son Güncelleme**: 2024-12-19
- **Versiyon**: 1.0.0
