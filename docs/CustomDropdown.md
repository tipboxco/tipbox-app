# Custom Dropdown Component Documentation

## Genel Bakış

Bu dokümantasyon, React Native + Gluestack UI kullanılarak oluşturulan custom dropdown component'inin mantığını ve tasarımını açıklar. Bu dropdown yapısı, Gluestack UI'ın Select component'i yerine kullanılır ve daha fazla kontrol ve özelleştirme imkanı sağlar.

## Özellikler

- ✅ Custom dropdown (Select component yerine)
- ✅ Açılır/kapanır animasyonlu border radius
- ✅ Icon desteği (Heroicons)
- ✅ Dark/Light mode desteği
- ✅ Seçili değer gösterimi
- ✅ Chevron icon animasyonu
- ✅ Seçenekler arası ayırıcı çizgiler
- ✅ Type-safe TypeScript implementasyonu

## Kullanım Senaryoları

### 1. Support Type Seçimi (OneOnOneSupportBottomSheet)

**Kullanım:**
```typescript
const [supportType, setSupportType] = useState<'GENERAL' | 'TECHNICAL' | 'PRODUCT' | ''>('');
const [showSupportTypeDropdown, setShowSupportTypeDropdown] = useState(false);

const supportTypes: Array<'GENERAL' | 'TECHNICAL' | 'PRODUCT'> = [
    'GENERAL',
    'TECHNICAL',
    'PRODUCT',
];
```

### 2. Product Status Seçimi (EventCreatePost)

**Kullanım:**
```typescript
const [productStatus, setProductStatus] = useState<'own' | 'tried' | ''>('');
const [showProductStatusDropdown, setShowProductStatusDropdown] = useState(false);
```

## Component Yapısı

### Temel Yapı

```typescript
<VStack space="xs" position="relative">
    {/* Trigger Button */}
    <Pressable onPress={() => setShowDropdown((v) => !v)}>
        <Box
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderWidth={1}
            borderColor={isDark ? '#333' : '#E9E9E9'}
            borderTopLeftRadius={12}
            borderTopRightRadius={12}
            borderBottomLeftRadius={showDropdown ? 0 : 12}
            borderBottomRightRadius={showDropdown ? 0 : 12}
            height={48}
            px="$4"
            justifyContent="center"
        >
            {/* Trigger Content */}
        </Box>
    </Pressable>

    {/* Dropdown Content */}
    {showDropdown && (
        <Box
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderWidth={1}
            borderColor={isDark ? '#333' : '#E9E9E9'}
            borderTopWidth={0}
            borderTopLeftRadius={0}
            borderTopRightRadius={0}
            borderBottomLeftRadius={12}
            borderBottomRightRadius={12}
            overflow="hidden"
        >
            {/* Dropdown Items */}
        </Box>
    )}
</VStack>
```

## Tasarım Detayları

### 1. Trigger Button

**Özellikler:**
- **Height**: 48px (veya 44px)
- **Padding**: `px="$4"` (16px)
- **Border Radius**: 
  - Açıkken: Üst köşeler 12px, alt köşeler 0px
  - Kapalıyken: Tüm köşeler 12px
- **Background**: Dark mode: `$backgroundDark800`, Light mode: `#FDFDFD`
- **Border**: 1px, Dark mode: `#333`, Light mode: `#E9E9E9`

**İçerik:**
- Seçili değer veya placeholder text
- Seçili değer varsa icon (opsiyonel)
- Chevron icon (açık/kapalı duruma göre)

### 2. Dropdown Content

**Özellikler:**
- **Border**: Üst border yok (`borderTopWidth={0}`)
- **Border Radius**: 
  - Üst köşeler: 0px (trigger ile birleşik)
  - Alt köşeler: 12px
- **Overflow**: `hidden` (içerik taşmasını önler)

### 3. Dropdown Items

**Özellikler:**
- **Padding**: `px="$4" py="$3"` (16px horizontal, 12px vertical)
- **Spacing**: Item'lar arası `space="sm"`
- **Ayırıcı Çizgi**: Her item arasında 1px çizgi (ilk item hariç)
  - Dark mode: `#333`
  - Light mode: `#E9E9E9`

## Icon Desteği

### Heroicons Kullanımı

```typescript
import { ChatBubbleLeftIcon, Cog6ToothIcon, CubeIcon } from 'react-native-heroicons/outline';

const getSupportTypeIcon = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT') => {
    switch (type) {
        case 'GENERAL':
            return ChatBubbleLeftIcon;
        case 'TECHNICAL':
            return Cog6ToothIcon;
        case 'PRODUCT':
            return CubeIcon;
    }
};
```

### Icon Render

```typescript
{selectedValue && (() => {
    const IconComponent = getTypeIcon(selectedValue);
    return IconComponent ? (
        <IconComponent
            width={20}
            height={20}
            color={selectedValue ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
        />
    ) : null;
})()}
```

## Renk Şeması

### Dark Mode

| Element | Renk |
|---------|------|
| Background | `$backgroundDark800` |
| Border | `#333` |
| Text (Selected) | `#FFFFFF` |
| Text (Placeholder) | `#8C8C8C` |
| Divider | `#333` |
| Icon | `#FFFFFF` |

### Light Mode

| Element | Renk |
|---------|------|
| Background | `#FDFDFD` |
| Border | `#E9E9E9` |
| Text (Selected) | `#000000` |
| Text (Placeholder) | `#8C8C8C` |
| Divider | `#E9E9E9` |
| Icon | `#000000` |

## Tam Implementasyon Örneği

### Support Type Dropdown

```typescript
import React, { useState } from 'react';
import {
    VStack,
    HStack,
    Text,
    Pressable,
    Box,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { ChatBubbleLeftIcon, Cog6ToothIcon, CubeIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';

const SupportTypeDropdown = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [supportType, setSupportType] = useState<'GENERAL' | 'TECHNICAL' | 'PRODUCT' | ''>('');
    const [showSupportTypeDropdown, setShowSupportTypeDropdown] = useState(false);

    const supportTypes: Array<'GENERAL' | 'TECHNICAL' | 'PRODUCT'> = [
        'GENERAL',
        'TECHNICAL',
        'PRODUCT',
    ];

    const getSupportTypeLabel = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT' | '') => {
        switch (type) {
            case 'GENERAL':
                return 'General';
            case 'TECHNICAL':
                return 'Technical';
            case 'PRODUCT':
                return 'Product';
            default:
                return 'Select Support Type';
        }
    };

    const getSupportTypeIcon = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT') => {
        switch (type) {
            case 'GENERAL':
                return ChatBubbleLeftIcon;
            case 'TECHNICAL':
                return Cog6ToothIcon;
            case 'PRODUCT':
                return CubeIcon;
        }
    };

    return (
        <VStack space="xs" position="relative">
            <Pressable onPress={() => setShowSupportTypeDropdown((v) => !v)}>
                <Box
                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                    borderWidth={1}
                    borderColor={isDark ? '#333' : '#E9E9E9'}
                    borderTopLeftRadius={12}
                    borderTopRightRadius={12}
                    borderBottomLeftRadius={showSupportTypeDropdown ? 0 : 12}
                    borderBottomRightRadius={showSupportTypeDropdown ? 0 : 12}
                    height={48}
                    px="$4"
                    justifyContent="center"
                >
                    <HStack
                        flex={1}
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <HStack alignItems="center" space="sm" flex={1}>
                            {supportType && (() => {
                                const IconComponent = getSupportTypeIcon(supportType);
                                return IconComponent ? (
                                    <IconComponent
                                        width={20}
                                        height={20}
                                        color={supportType ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                                    />
                                ) : null;
                            })()}
                            <Text
                                color={
                                    supportType
                                        ? (isDark ? '#FFFFFF' : '#000000')
                                        : (isDark ? '#8C8C8C' : '#8C8C8C')
                                }
                                fontSize={13}
                                fontWeight="$normal"
                                flex={1}
                            >
                                {getSupportTypeLabel(supportType)}
                            </Text>
                        </HStack>
                        <Feather
                            name={showSupportTypeDropdown ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </HStack>
                </Box>
            </Pressable>

            {showSupportTypeDropdown && (
                <Box
                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                    borderWidth={1}
                    borderColor={isDark ? '#333' : '#E9E9E9'}
                    borderTopWidth={0}
                    borderTopLeftRadius={0}
                    borderTopRightRadius={0}
                    borderBottomLeftRadius={12}
                    borderBottomRightRadius={12}
                    overflow="hidden"
                >
                    <VStack>
                        {supportTypes.map((type, index) => (
                            <React.Fragment key={type}>
                                {index > 0 && (
                                    <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} width="100%" />
                                )}
                                <Pressable
                                    onPress={() => {
                                        setSupportType(type);
                                        setShowSupportTypeDropdown(false);
                                    }}
                                >
                                    <HStack px="$4" py="$3" alignItems="center" space="sm">
                                        {(() => {
                                            const IconComponent = getSupportTypeIcon(type);
                                            return IconComponent ? (
                                                <IconComponent
                                                    width={20}
                                                    height={20}
                                                    color={isDark ? '#FFFFFF' : '#2F2F2F'}
                                                />
                                            ) : null;
                                        })()}
                                        <Text
                                            color={isDark ? '#FFFFFF' : '#2F2F2F'}
                                            fontSize={13}
                                            fontWeight="$normal"
                                        >
                                            {getSupportTypeLabel(type)}
                                        </Text>
                                    </HStack>
                                </Pressable>
                            </React.Fragment>
                        ))}
                    </VStack>
                </Box>
            )}
        </VStack>
    );
};
```

## Best Practices

### 1. State Management

- Dropdown açık/kapalı durumu için ayrı state kullanın
- Seçili değer için type-safe state kullanın
- State güncellemelerini `useState` ile yönetin

### 2. Type Safety

```typescript
// ✅ İyi: Type-safe
const [supportType, setSupportType] = useState<'GENERAL' | 'TECHNICAL' | 'PRODUCT' | ''>('');

// ❌ Kötü: String kullanımı
const [supportType, setSupportType] = useState<string>('');
```

### 3. Label Mapping

```typescript
// ✅ İyi: Label mapping fonksiyonu
const getSupportTypeLabel = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT' | '') => {
    switch (type) {
        case 'GENERAL':
            return 'General';
        case 'TECHNICAL':
            return 'Technical';
        case 'PRODUCT':
            return 'Product';
        default:
            return 'Select Support Type';
    }
};
```

### 4. Icon Mapping

```typescript
// ✅ İyi: Icon mapping fonksiyonu
const getSupportTypeIcon = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT') => {
    switch (type) {
        case 'GENERAL':
            return ChatBubbleLeftIcon;
        case 'TECHNICAL':
            return Cog6ToothIcon;
        case 'PRODUCT':
            return CubeIcon;
    }
};
```

### 5. Conditional Rendering

```typescript
// ✅ İyi: Conditional icon rendering
{supportType && (() => {
    const IconComponent = getSupportTypeIcon(supportType);
    return IconComponent ? (
        <IconComponent
            width={20}
            height={20}
            color={supportType ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
        />
    ) : null;
})()}
```

## Animasyon ve Etkileşim

### Border Radius Animasyonu

Dropdown açıldığında trigger'ın alt köşeleri 0px'e düşer, dropdown kapandığında 12px'e geri döner:

```typescript
borderBottomLeftRadius={showDropdown ? 0 : 12}
borderBottomRightRadius={showDropdown ? 0 : 12}
```

### Chevron Icon Animasyonu

Chevron icon açık/kapalı duruma göre değişir:

```typescript
<Feather
    name={showDropdown ? 'chevron-up' : 'chevron-down'}
    size={20}
    color={isDark ? '#FFFFFF' : '#000000'}
/>
```

## Responsive Tasarım

### Height Ayarları

- **Trigger**: 48px (veya 44px)
- **Item**: `py="$3"` (12px vertical padding)

### Padding Ayarları

- **Trigger**: `px="$4"` (16px horizontal)
- **Item**: `px="$4" py="$3"` (16px horizontal, 12px vertical)

## Accessibility

### Touch Targets

- Minimum touch target: 44x44px (iOS) / 48x48px (Android)
- Dropdown item'ları yeterli padding'e sahip

### Visual Feedback

- Seçili değer farklı renkte gösterilir
- Placeholder text daha açık renkte gösterilir
- Chevron icon duruma göre değişir

## Kullanım Örnekleri

### Örnek 1: Basit Dropdown (Icon Olmadan)

```typescript
const SimpleDropdown = () => {
    const [value, setValue] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);
    const options = ['Option 1', 'Option 2', 'Option 3'];

    return (
        <VStack space="xs" position="relative">
            <Pressable onPress={() => setShowDropdown((v) => !v)}>
                <Box
                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                    borderWidth={1}
                    borderColor={isDark ? '#333' : '#E9E9E9'}
                    borderRadius={showDropdown ? { top: 12, bottom: 0 } : 12}
                    height={48}
                    px="$4"
                    justifyContent="center"
                >
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text color={value ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}>
                            {value || 'Select Option'}
                        </Text>
                        <Feather
                            name={showDropdown ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </HStack>
                </Box>
            </Pressable>

            {showDropdown && (
                <Box
                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                    borderWidth={1}
                    borderColor={isDark ? '#333' : '#E9E9E9'}
                    borderTopWidth={0}
                    borderTopLeftRadius={0}
                    borderTopRightRadius={0}
                    borderBottomLeftRadius={12}
                    borderBottomRightRadius={12}
                    overflow="hidden"
                >
                    <VStack>
                        {options.map((option, index) => (
                            <React.Fragment key={option}>
                                {index > 0 && (
                                    <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} width="100%" />
                                )}
                                <Pressable
                                    onPress={() => {
                                        setValue(option);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <HStack px="$4" py="$3" alignItems="center">
                                        <Text color={isDark ? '#FFFFFF' : '#2F2F2F'}>
                                            {option}
                                        </Text>
                                    </HStack>
                                </Pressable>
                            </React.Fragment>
                        ))}
                    </VStack>
                </Box>
            )}
        </VStack>
    );
};
```

## İlgili Dosyalar

- `src/features/inbox/components/OneOnOneSupportBottomSheet/index.tsx` - Support type dropdown implementasyonu
- `src/features/events/screens/EventCreatePost.tsx` - Product status dropdown implementasyonu

## Notlar

- Dropdown açıkken dışarı tıklanınca kapanması için backdrop eklenebilir
- Scroll edilebilir içerik için `ScrollView` kullanılabilir
- Animasyon için `react-native-reanimated` kullanılabilir
- Keyboard açıkken dropdown'un klavye üzerinde görünmesi için `KeyboardAvoidingView` kullanılabilir
