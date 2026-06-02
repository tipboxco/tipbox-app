# Gluestack UI → Pure NativeWind/Tailwind Migration Analizi

> **Tarih:** 2026-04-06
> **Proje:** Tipbox Mobile App (React Native + Expo SDK 53)
> **Hazırlayan:** Claude Code

---

## 1. Yonetici Ozeti

Tipbox uygulamasi su anda UI katmaninda **Gluestack UI** ve **NativeWind (Tailwind CSS)** birlikte kullanmaktadir. Bu dokuman, Gluestack UI bagimliliginin tamamen kaldirilarak saf NativeWind/Tailwind tabanli bir yapiya gecis surecini analiz eder.

**Tahmini toplam efor:** ~20-25 is gunu (1 gelistirici)
**Onerilen strateji:** `src/components/design-system/` altinda Gluestack isimlendirmesini koruyan NativeWind wrapper bilesenler olusturularak kademeli (incremental) gecis

### Temel Fikir

Mevcut Gluestack bilesen isimlerini (`Box`, `VStack`, `HStack`, `Text`, `Button`, vb.) koruyarak kendi design-system katmanimizi olusturuyoruz. Boylece 267 dosyada **sadece import path degisir**, bilesen isimleri ve temel API ayni kalir:

```tsx
// ONCE
import { Box, VStack, Text } from '@gluestack-ui/themed';

// SONRA — sadece import path degisti, bilesen isimleri ayni
import { Box, VStack, Text } from '@/src/components/design-system';
```

---

## 2. Mevcut Durum

### 2.1 Gluestack Paketleri (8 adet)

| Paket | Versiyon | Kullanim Amaci |
|-------|----------|----------------|
| `@gluestack-ui/themed` | ^1.1.73 | Ana bilesen kutuphanesi |
| `@gluestack-ui/config` | ^1.1.20 | Varsayilan tema konfigurasyonu |
| `@gluestack-style/react` | ^1.0.57 | Styling motoru |
| `@gluestack-ui/button` | ^1.0.14 | Button bileseni |
| `@gluestack-ui/icon` | ^0.1.27 | Icon bileseni |
| `@gluestack-ui/overlay` | ^0.1.22 | Modal/Overlay provider |
| `@gluestack-ui/toast` | ^1.0.9 | Toast notification |
| `@gluestack-ui/nativewind-utils` | ^1.0.10 | Tailwind entegrasyonu |

### 2.2 Kullanim Istatistikleri

| Metrik | Deger |
|--------|-------|
| Gluestack kullanan toplam dosya | **267** |
| Kullanilan unique bilesen sayisi | **35** |
| Layout bilesenleri (Box, VStack, HStack) | ~442 kullanim |
| Text bileseni | ~140 kullanim |
| Pressable bileseni | ~106 kullanim |
| Image bileseni | ~61 kullanim |
| Form bilesenleri (Input, Switch, etc.) | ~42 kullanim |
| Toast/useToast | ~29 dosya |
| Button/ButtonText | ~36 kullanim |
| `useColorMode` referansi | **~548 kullanim** |

### 2.3 Konfigurasyion Dosyalari

- `src/components/ui/gluestack-ui-provider/index.tsx` — Native provider
- `src/components/ui/gluestack-ui-provider/index.web.tsx` — Web provider
- `src/components/ui/gluestack-ui-provider/config.ts` — Tema token tanimlari
- `src/components/ui/gluestack-ui-provider/script.ts` — Dark mode script
- `src/components/ui/index.ts` — Barrel export dosyasi
- `src/types/gluestack-ui.d.ts` — TypeScript type augmentation
- `gluestack-ui.config.json` — Root konfigurasyion

---

## 3. Design System Mimarisi

### 3.1 Klasor Yapisi

```
src/components/design-system/
├── index.ts                    # Barrel export — tum bilesenler buradan
├── utils/
│   └── cn.ts                   # className merge utility (twMerge + clsx)
├── primitives/
│   ├── Box.tsx                 # View wrapper
│   ├── VStack.tsx              # Vertical stack
│   ├── HStack.tsx              # Horizontal stack
│   ├── Center.tsx              # Centered container
│   ├── Text.tsx                # Text wrapper
│   ├── Pressable.tsx           # Pressable wrapper
│   ├── Image.tsx               # Image wrapper
│   ├── ScrollView.tsx          # ScrollView wrapper
│   ├── Divider.tsx             # Separator line
│   └── Spinner.tsx             # Loading indicator
├── forms/
│   ├── Input.tsx               # TextInput (Input + InputField birlesiyor)
│   ├── Textarea.tsx            # Multiline TextInput
│   ├── Switch.tsx              # Toggle switch
│   ├── FormControl.tsx         # Form wrapper (label + error)
│   └── FormControlLabel.tsx    # Form label
├── feedback/
│   ├── Toast.tsx               # Toast notification
│   ├── useToast.ts             # Toast hook
│   ├── Progress.tsx            # Progress bar
│   └── Modal.tsx               # Modal dialog
├── actions/
│   ├── Button.tsx              # Button (Button + ButtonText birlesiyor)
│   └── IconButton.tsx          # Icon-only button
└── providers/
    └── DesignSystemProvider.tsx # Theme provider (dark mode toggle)
```

### 3.2 Import Degisikligi

Migration sirasinda her dosyada yapilacak tek degisiklik:

```tsx
// ONCE (farkli import kaynaklari)
import { Box, VStack, HStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

// SONRA (tek kaynak)
import { Box, VStack, HStack, Text, Image, Pressable } from '@/src/components/design-system';
// useColorMode artik gerekmiyor — dark: prefix kullaniliyor
```

### 3.3 Barrel Export (`index.ts`)

```tsx
// src/components/design-system/index.ts

// Primitives
export { Box } from './primitives/Box';
export { VStack } from './primitives/VStack';
export { HStack } from './primitives/HStack';
export { Center } from './primitives/Center';
export { Text } from './primitives/Text';
export { Pressable } from './primitives/Pressable';
export { Image } from './primitives/Image';
export { ScrollView } from './primitives/ScrollView';
export { Divider } from './primitives/Divider';
export { Spinner } from './primitives/Spinner';

// Forms
export { Input, InputField } from './forms/Input';
export { Textarea, TextareaInput } from './forms/Textarea';
export { Switch } from './forms/Switch';
export { FormControl } from './forms/FormControl';
export { FormControlLabel, FormControlLabelText } from './forms/FormControlLabel';

// Feedback
export { Toast, ToastTitle, ToastDescription } from './feedback/Toast';
export { useToast, showCustomToast } from './feedback/useToast';
export { Progress } from './feedback/Progress';
export { Modal, ModalBackdrop, ModalContent, ModalBody } from './feedback/Modal';

// Actions
export { Button, ButtonText } from './actions/Button';
export { IconButton } from './actions/IconButton';

// Providers
export { DesignSystemProvider } from './providers/DesignSystemProvider';

// Utilities
export { cn } from './utils/cn';
```

---

## 4. Bilesen Implementasyonlari

### 4.1 Utility — `cn.ts`

```tsx
// src/components/design-system/utils/cn.ts
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

> **Gerekli paketler:** `npm install tailwind-merge clsx`

---

### 4.2 Primitives

#### `Box.tsx`

Mevcut kullanim:
```tsx
<Box bg="$primary500" p="$4" borderRadius="$lg" flex={1} alignItems="center" justifyContent="center">
<Box width={42} height={42} borderRadius={21} bg="#F400FF" position="absolute" bottom={8} right={8}>
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/Box.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface BoxProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const Box = React.forwardRef<View, BoxProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <View ref={ref} className={cn(className)} style={style} {...props}>
        {children}
      </View>
    );
  }
);

Box.displayName = 'Box';
```

**Ornek migration:**
```tsx
// ONCE
<Box bg="$backgroundLight0" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200">

// SONRA
<Box className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
```

---

#### `VStack.tsx`

Mevcut kullanim:
```tsx
<VStack space="md" alignItems="center" flex={1} pt="$4">
<VStack space="xs">
<VStack space="sm" px="$4">
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/VStack.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type SpaceValue = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SPACE_MAP: Record<SpaceValue, string> = {
  xs: 'gap-1',     // 4px
  sm: 'gap-2',     // 8px
  md: 'gap-3',     // 12px
  lg: 'gap-4',     // 16px
  xl: 'gap-5',     // 20px
  '2xl': 'gap-6',  // 24px
};

interface VStackProps extends ViewProps {
  className?: string;
  space?: SpaceValue;
  reversed?: boolean;
  children?: React.ReactNode;
}

export const VStack = React.forwardRef<View, VStackProps>(
  ({ className, space, reversed, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex flex-col',
          reversed && 'flex-col-reverse',
          space && SPACE_MAP[space],
          className
        )}
        {...props}
      >
        {children}
      </View>
    );
  }
);

VStack.displayName = 'VStack';
```

**Ornek migration:**
```tsx
// ONCE
<VStack space="md" alignItems="center" pt="$4">

// SONRA
<VStack space="md" className="items-center pt-4">
```

---

#### `HStack.tsx`

Mevcut kullanim:
```tsx
<HStack space="sm" alignItems="center">
<HStack justifyContent="space-between" alignItems="center" space="xl" pb="$2">
<HStack alignItems="center" gap={"$2"}>
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/HStack.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

type SpaceValue = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SPACE_MAP: Record<SpaceValue, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
};

interface HStackProps extends ViewProps {
  className?: string;
  space?: SpaceValue;
  reversed?: boolean;
  children?: React.ReactNode;
}

export const HStack = React.forwardRef<View, HStackProps>(
  ({ className, space, reversed, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex flex-row',
          reversed && 'flex-row-reverse',
          space && SPACE_MAP[space],
          className
        )}
        {...props}
      >
        {children}
      </View>
    );
  }
);

HStack.displayName = 'HStack';
```

**Ornek migration:**
```tsx
// ONCE
<HStack justifyContent="space-between" alignItems="center" space="xl" pb="$2">

// SONRA
<HStack space="xl" className="justify-between items-center pb-2">
```

---

#### `Text.tsx`

Mevcut kullanim:
```tsx
<Text fontSize="$lg" fontWeight="$bold" color="$textLight900">
<Text fontSize={14} fontWeight="$semibold" textAlign="center" numberOfLines={1}>
<Text color={isDark ? '$textDark50' : '$textLight900'} fontSize={11} fontWeight="$semibold">
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/Text.tsx
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '../utils/cn';

interface TextProps extends RNTextProps {
  className?: string;
  children?: React.ReactNode;
}

export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn('text-neutral-900 dark:text-neutral-100', className)}
        {...props}
      >
        {children}
      </RNText>
    );
  }
);

Text.displayName = 'Text';
```

**Not:** Text bileseni varsayilan olarak dark mode uyumlu renk icerir. Bu sayede cogu yerde sadece `<Text>` yazmak yeterli olacak.

**Ornek migration:**
```tsx
// ONCE
<Text
  color={isDark ? '$textDark50' : '$textLight900'}
  fontSize={11}
  fontWeight="$semibold"
  textAlign="left"
  numberOfLines={1}
>

// SONRA — isDark conditional tamamen kaldirildi
<Text
  className="text-[11px] font-semibold text-left text-neutral-900 dark:text-neutral-50"
  numberOfLines={1}
>
```

---

#### `Pressable.tsx`

Mevcut kullanim:
```tsx
<Pressable onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
<Pressable onPress={onPress} disabled={isDisabled} opacity={isDisabled ? 0.5 : 1}>
<Pressable onPress={() => {}} px={20} py={16}>
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/Pressable.tsx
import React from 'react';
import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';
import { cn } from '../utils/cn';

interface PressableProps extends RNPressableProps {
  className?: string;
  children?: React.ReactNode;
}

export const Pressable = React.forwardRef<typeof RNPressable, PressableProps>(
  ({ className, disabled, children, ...props }, ref) => {
    return (
      <RNPressable
        ref={ref as any}
        className={cn(disabled && 'opacity-50', className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </RNPressable>
    );
  }
);

Pressable.displayName = 'Pressable';
```

**Ornek migration:**
```tsx
// ONCE
<Pressable onPress={onPress} disabled={isDisabled} opacity={isDisabled ? 0.5 : 1} px={20} py={16}>

// SONRA
<Pressable onPress={onPress} disabled={isDisabled} className="px-5 py-4">
```

---

#### `Image.tsx`

Mevcut kullanim:
```tsx
<Image source={{ uri: url }} w="$16" h="$16" borderRadius="$full" alt="avatar" />
<Image source={require('@/assets/avatar.png')} alt="Micheal" width={38} height={38} borderRadius={19} />
<Image style={{ width: '100%', height: '100%' }} source={img} alt="img" resizeMode="contain" />
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/Image.tsx
import React from 'react';
import { Image as RNImage, type ImageProps as RNImageProps } from 'react-native';
import { cn } from '../utils/cn';

interface ImageProps extends RNImageProps {
  className?: string;
  alt?: string; // Gluestack API uyumlulugu — RN Image'de zorunlu degil
}

export const Image = React.forwardRef<RNImage, ImageProps>(
  ({ className, alt, ...props }, ref) => {
    return (
      <RNImage
        ref={ref}
        className={cn(className)}
        accessibilityLabel={alt}
        {...props}
      />
    );
  }
);

Image.displayName = 'Image';
```

**Ornek migration:**
```tsx
// ONCE
<Image source={{ uri: url }} w="$16" h="$16" borderRadius="$full" alt="avatar" />

// SONRA
<Image source={{ uri: url }} className="w-16 h-16 rounded-full" alt="avatar" />
```

---

#### `ScrollView.tsx`

```tsx
// src/components/design-system/primitives/ScrollView.tsx
import React from 'react';
import { ScrollView as RNScrollView, type ScrollViewProps as RNScrollViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface ScrollViewProps extends RNScrollViewProps {
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const ScrollView = React.forwardRef<RNScrollView, ScrollViewProps>(
  ({ className, contentClassName, children, ...props }, ref) => {
    return (
      <RNScrollView
        ref={ref}
        className={cn(className)}
        contentContainerClassName={contentClassName}
        {...props}
      >
        {children}
      </RNScrollView>
    );
  }
);

ScrollView.displayName = 'ScrollView';
```

---

#### `Divider.tsx`

Mevcut kullanim:
```tsx
<Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
```

Yeni bilesen:
```tsx
// src/components/design-system/primitives/Divider.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface DividerProps extends ViewProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider: React.FC<DividerProps> = ({
  className,
  orientation = 'horizontal',
  ...props
}) => {
  return (
    <View
      className={cn(
        orientation === 'horizontal'
          ? 'h-px w-full bg-neutral-200 dark:bg-neutral-800'
          : 'w-px h-full bg-neutral-200 dark:bg-neutral-800',
        className
      )}
      {...props}
    />
  );
};
```

**Ornek migration:**
```tsx
// ONCE
<Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />

// SONRA
<Divider />
// veya ozel renk: <Divider className="bg-neutral-300 dark:bg-neutral-700" />
```

---

#### `Spinner.tsx`

```tsx
// src/components/design-system/primitives/Spinner.tsx
import React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

interface SpinnerProps extends ActivityIndicatorProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'small', ...props }) => {
  return <ActivityIndicator size={size} {...props} />;
};
```

---

#### `Center.tsx`

```tsx
// src/components/design-system/primitives/Center.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface CenterProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const Center = React.forwardRef<View, CenterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('items-center justify-center', className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Center.displayName = 'Center';
```

---

### 4.3 Form Bilesenleri

#### `Input.tsx` (Input + InputField birlesiyor)

Mevcut kullanim:
```tsx
<Input variant="outline" size="md" bg="$backgroundDark100" borderColor="$borderDark100" alignItems="center">
  <InputField placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
  <Icon as={CheckCircle} color="$success500" size="md" mr="$2" />
</Input>
```

Yeni bilesen:
```tsx
// src/components/design-system/forms/Input.tsx
import React from 'react';
import { View, TextInput, type TextInputProps, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

// Input — disardaki wrapper
interface InputProps extends ViewProps {
  className?: string;
  variant?: 'outline' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  isInvalid?: boolean;
  children?: React.ReactNode;
}

const SIZE_MAP = {
  sm: 'min-h-[36px]',
  md: 'min-h-[40px]',
  lg: 'min-h-[44px]',
};

const VARIANT_MAP = {
  outline: 'border border-neutral-300 dark:border-neutral-600 rounded-lg',
  filled: 'bg-neutral-100 dark:bg-neutral-800 rounded-lg',
  underlined: 'border-b border-neutral-300 dark:border-neutral-600',
};

export const Input = React.forwardRef<View, InputProps>(
  ({ className, variant = 'outline', size = 'md', isDisabled, isInvalid, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex flex-row items-center px-3',
          'bg-white dark:bg-neutral-800',
          VARIANT_MAP[variant],
          SIZE_MAP[size],
          isInvalid && 'border-red-500',
          isDisabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Input.displayName = 'Input';

// InputField — icerdeki TextInput
interface InputFieldProps extends TextInputProps {
  className?: string;
}

export const InputField = React.forwardRef<TextInput, InputFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'flex-1 text-base text-neutral-900 dark:text-white',
          className
        )}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    );
  }
);

InputField.displayName = 'InputField';
```

**Ornek migration:**
```tsx
// ONCE
<Input variant="outline" size="md" bg={isDark ? '$backgroundDark100' : '$backgroundLight100'} borderColor={isDark ? '$borderDark100' : '$borderLight100'}>
  <InputField placeholder="Email" value={email} onChangeText={setEmail} />
</Input>

// SONRA — isDark yok, API ayni
<Input variant="outline" size="md">
  <InputField placeholder="Email" value={email} onChangeText={setEmail} />
</Input>
```

---

#### `Textarea.tsx`

```tsx
// src/components/design-system/forms/Textarea.tsx
import React from 'react';
import { View, TextInput, type TextInputProps, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface TextareaProps extends ViewProps {
  className?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  children?: React.ReactNode;
}

export const Textarea = React.forwardRef<View, TextareaProps>(
  ({ className, isDisabled, isInvalid, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'border border-neutral-300 dark:border-neutral-600 rounded-lg p-3',
          'bg-white dark:bg-neutral-800',
          isInvalid && 'border-red-500',
          isDisabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Textarea.displayName = 'Textarea';

interface TextareaInputProps extends TextInputProps {
  className?: string;
}

export const TextareaInput = React.forwardRef<TextInput, TextareaInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        className={cn(
          'min-h-[80px] text-base text-neutral-900 dark:text-white',
          className
        )}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    );
  }
);

TextareaInput.displayName = 'TextareaInput';
```

---

#### `Switch.tsx`

Mevcut kullanim:
```tsx
<Switch
  value={isDark}
  onValueChange={toggleColorMode}
  trackColor={{ true: '#6366F1', false: '#D1D5DB' }}
  thumbColor={isDark ? '#818CF8' : '#FFFFFF'}
/>
```

Yeni bilesen:
```tsx
// src/components/design-system/forms/Switch.tsx
import React from 'react';
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';

interface SwitchProps extends RNSwitchProps {
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  trackColor = { true: '#6366F1', false: '#D1D5DB' },
  thumbColor,
  ...props
}) => {
  return (
    <RNSwitch
      trackColor={trackColor}
      thumbColor={thumbColor ?? (props.value ? '#818CF8' : '#FFFFFF')}
      {...props}
    />
  );
};
```

---

#### `FormControl.tsx` ve `FormControlLabel.tsx`

Mevcut kullanim:
```tsx
<FormControl>
  <FormControlLabel>
    <FormControlLabelText>Email</FormControlLabelText>
  </FormControlLabel>
  <Input><InputField /></Input>
</FormControl>
```

Yeni bilesenler:
```tsx
// src/components/design-system/forms/FormControl.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface FormControlProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControl: React.FC<FormControlProps> = ({ className, children, ...props }) => {
  return (
    <View className={cn('gap-1.5', className)} {...props}>
      {children}
    </View>
  );
};
```

```tsx
// src/components/design-system/forms/FormControlLabel.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { Text } from '../primitives/Text';
import { cn } from '../utils/cn';

interface FormControlLabelProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlLabel: React.FC<FormControlLabelProps> = ({ className, children, ...props }) => {
  return (
    <View className={cn(className)} {...props}>
      {children}
    </View>
  );
};

interface FormControlLabelTextProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlLabelText: React.FC<FormControlLabelTextProps> = ({ className, children }) => {
  return (
    <Text className={cn('text-sm font-medium text-neutral-700 dark:text-neutral-300', className)}>
      {children}
    </Text>
  );
};
```

---

### 4.4 Actions

#### `Button.tsx` (Button + ButtonText birlesiyor)

Mevcut kullanim:
```tsx
<Button bg="$buttonPrimary" py="$1" rounded="$lg" mt="$4" onPress={handleSend} opacity={0.5} disabled>
  <ButtonText color="$textLight900">Gonder</ButtonText>
</Button>
<Button variant="outline" onPress={check} isDisabled={loading}>
  <Text>Tekrar dene</Text>
</Button>
<Button variant="link" onPress={handleSkip} p="$2">
  <ButtonText fontSize="$sm" color="$textDark300" fontWeight="$medium">Atla</ButtonText>
</Button>
```

Yeni bilesen:
```tsx
// src/components/design-system/actions/Button.tsx
import React from 'react';
import { Pressable, type PressableProps, Text as RNText } from 'react-native';
import { cn } from '../utils/cn';

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2.5',
  lg: 'px-6 py-3',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: 'bg-[#D0F205] rounded-lg',
  outline: 'border border-indigo-500 rounded-lg bg-transparent',
  ghost: 'bg-transparent rounded-lg',
  link: 'bg-transparent',
};

export const Button = React.forwardRef<typeof Pressable, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', isDisabled, disabled, children, ...props }, ref) => {
    const isButtonDisabled = isDisabled || disabled;

    return (
      <Pressable
        ref={ref as any}
        className={cn(
          'items-center justify-center flex-row',
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          isButtonDisabled && 'opacity-50',
          className
        )}
        disabled={isButtonDisabled}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

// ButtonText — Button icinde text gostermek icin
interface ButtonTextProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const ButtonText: React.FC<ButtonTextProps> = ({ className, children, ...props }) => {
  return (
    <RNText
      className={cn('font-semibold text-base text-neutral-900', className)}
      {...props}
    >
      {children}
    </RNText>
  );
};
```

**Ornek migration:**
```tsx
// ONCE
<Button bg="$buttonPrimary" py="$1" rounded="$lg" onPress={handleSend} disabled={!valid}>
  <ButtonText color="$textLight900">Gonder</ButtonText>
</Button>

// SONRA — API ayni, sadece import degisti
<Button className="py-1" onPress={handleSend} isDisabled={!valid}>
  <ButtonText>Gonder</ButtonText>
</Button>
```

---

### 4.5 Feedback

#### `Toast.tsx` ve `useToast.ts`

Mevcut kullanim:
```tsx
const toast = useToast();
showCustomToast(toast, {
  title: 'Basarili!',
  action: 'success',
  duration: 3000,
});
```

Yeni bilesen (mevcut `showCustomToast` API'sini koruyor):
```tsx
// src/components/design-system/feedback/Toast.tsx
import React from 'react';
import { View, Text as RNText } from 'react-native';
import { cn } from '../utils/cn';

interface ToastProps {
  className?: string;
  children?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({ className, children }) => (
  <View className={cn(
    'bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 shadow-md w-[358px] min-h-[48px] overflow-hidden',
    className
  )}>
    {children}
  </View>
);

export const ToastTitle: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <RNText className={cn('text-xs font-medium', className)}>{children}</RNText>
);

export const ToastDescription: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <RNText className={cn('text-xs opacity-80', className)}>{children}</RNText>
);
```

```tsx
// src/components/design-system/feedback/useToast.ts
// Bu dosya mevcut CustomToast/showCustomToast API'sini korur
// Toast implementasyonu icin react-native-toast-message veya
// kendi custom cozumunuz kullanilabilir
// Detayli implementasyon Fase 1'de yapilacak

export { showCustomToast } from '@/src/components/CustomToast';
export { useToast } from '@gluestack-ui/themed'; // gecici — Fase 3'te kaldirilacak
```

---

#### `Progress.tsx`

Mevcut kullanim:
```tsx
<Progress value={downloadProgress} w="100%" size="sm" bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}>
  <Progress.FilledTrack />
</Progress>
```

Yeni bilesen:
```tsx
// src/components/design-system/feedback/Progress.tsx
import React from 'react';
import { View } from 'react-native';
import { cn } from '../utils/cn';

interface ProgressProps {
  value: number;       // 0-100
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  trackClassName?: string;
}

const SIZE_MAP = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const ProgressComponent: React.FC<ProgressProps> & { FilledTrack: React.FC } = ({
  value,
  size = 'md',
  className,
  trackClassName,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={cn(
      'w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden',
      SIZE_MAP[size],
      className
    )}>
      <View
        className={cn(
          'h-full rounded-full bg-indigo-500',
          trackClassName
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};

// Gluestack API uyumlulugu icin FilledTrack (no-op, styling Progress'te)
ProgressComponent.FilledTrack = () => null;

export const Progress = ProgressComponent;
```

**Ornek migration:**
```tsx
// ONCE
<Progress value={75} w="100%" size="sm" bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}>
  <Progress.FilledTrack />
</Progress>

// SONRA
<Progress value={75} size="sm" />
```

---

#### `Modal.tsx`

Mevcut kullanim:
```tsx
<Modal style={{ flex: 1 }} isOpen={isVisible} onClose={onClose}>
  <ModalBackdrop />
  <ModalContent width="90%" maxWidth={358} bg={isDark ? '#1A1A1A' : '#FFFFFF'} borderRadius={10}>
    <ModalBody p="$0">
      {content}
    </ModalBody>
  </ModalContent>
</Modal>
```

Yeni bilesen:
```tsx
// src/components/design-system/feedback/Modal.tsx
import React from 'react';
import { Modal as RNModal, View, Pressable, type ModalProps as RNModalProps } from 'react-native';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: any;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, style }) => {
  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose} style={style}>
      <View className="flex-1 justify-center items-center">
        {children}
      </View>
    </RNModal>
  );
};

export const ModalBackdrop: React.FC<{ onPress?: () => void }> = ({ onPress }) => (
  <Pressable
    className="absolute inset-0 bg-black/50"
    onPress={onPress}
  />
);

interface ModalContentProps {
  className?: string;
  children?: React.ReactNode;
  style?: any;
}

export const ModalContent: React.FC<ModalContentProps> = ({ className, children, style }) => (
  <View
    className={cn(
      'bg-white dark:bg-neutral-900 rounded-xl w-[90%] max-w-[358px] overflow-hidden z-10',
      className
    )}
    style={style}
  >
    {children}
  </View>
);

interface ModalBodyProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ className, children }) => (
  <View className={cn('p-4', className)}>
    {children}
  </View>
);
```

**Ornek migration:**
```tsx
// ONCE
<Modal isOpen={isVisible} onClose={onClose}>
  <ModalBackdrop />
  <ModalContent width="90%" maxWidth={358} bg={isDark ? '#1A1A1A' : '#FFFFFF'} borderRadius={10}>
    <ModalBody p="$0">{content}</ModalBody>
  </ModalContent>
</Modal>

// SONRA — isDark yok, API ayni
<Modal isOpen={isVisible} onClose={onClose}>
  <ModalBackdrop onPress={onClose} />
  <ModalContent>
    <ModalBody className="p-0">{content}</ModalBody>
  </ModalContent>
</Modal>
```

---

### 4.6 Provider

```tsx
// src/components/design-system/providers/DesignSystemProvider.tsx
import React from 'react';
import { View } from 'react-native';
import { useAppStore } from '@/src/store/appStore';

interface DesignSystemProviderProps {
  children: React.ReactNode;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({ children }) => {
  const colorMode = useAppStore((state) => state.colorMode);

  // NativeWind dark mode icin class stratejisi
  // colorMode 'dark' ise, wrapper View'a 'dark' class'i eklenir
  return (
    <View className={colorMode === 'dark' ? 'dark flex-1' : 'flex-1'}>
      {children}
    </View>
  );
};
```

> **Not:** NativeWind dark mode `class` stratejisine gecmek icin `tailwind.config.js`'te `darkMode: 'class'` yapilmali.

---

## 5. Migration Sirasinda Prop Donusum Referansi

### 5.1 Gluestack Style Props → className

| Gluestack Prop | Tailwind Class Karsiligi |
|----------------|------------------------|
| `bg="$primary500"` | `className="bg-indigo-500"` |
| `bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}` | `className="bg-white dark:bg-slate-900"` |
| `p="$4"` | `className="p-4"` |
| `px="$4"` | `className="px-4"` |
| `py="$2"` | `className="py-2"` |
| `pt="$4"` | `className="pt-4"` |
| `m="$2"` | `className="m-2"` |
| `mt="$4"` | `className="mt-4"` |
| `w="$16"` | `className="w-16"` |
| `h="$16"` | `className="h-16"` |
| `flex={1}` | `className="flex-1"` |
| `alignItems="center"` | `className="items-center"` |
| `justifyContent="center"` | `className="justify-center"` |
| `justifyContent="space-between"` | `className="justify-between"` |
| `borderRadius="$lg"` | `className="rounded-lg"` |
| `borderRadius="$full"` | `className="rounded-full"` |
| `borderWidth={1}` | `className="border"` |
| `borderColor="$borderLight200"` | `className="border-neutral-200"` |
| `position="absolute"` | `className="absolute"` |
| `overflow="hidden"` | `className="overflow-hidden"` |
| `opacity={0.5}` | `className="opacity-50"` |
| `fontSize="$lg"` | `className="text-lg"` |
| `fontSize={14}` | `className="text-sm"` veya `className="text-[14px]"` |
| `fontWeight="$bold"` | `className="font-bold"` |
| `fontWeight="$semibold"` | `className="font-semibold"` |
| `textAlign="center"` | `className="text-center"` |
| `color="$textLight900"` | `className="text-neutral-900"` |
| `color={isDark ? '#FFF' : '#000'}` | `className="text-black dark:text-white"` |

### 5.2 VStack/HStack space → gap

| `space` Prop | Tailwind Class |
|-------------|----------------|
| `space="xs"` | `gap-1` (4px) |
| `space="sm"` | `gap-2` (8px) |
| `space="md"` | `gap-3` (12px) |
| `space="lg"` | `gap-4` (16px) |
| `space="xl"` | `gap-5` (20px) |
| `space="2xl"` | `gap-6` (24px) |

### 5.3 Gluestack Token → Tailwind Renk Eslestirmesi

| Gluestack Token | Hex Degeri | Tailwind Class |
|-----------------|-----------|----------------|
| `$backgroundLight0` | `#FFFFFF` | `bg-white` |
| `$backgroundLight50` | `#F9FAFB` | `bg-neutral-50` |
| `$backgroundLight100` | `#F3F4F6` | `bg-neutral-100` |
| `$backgroundLight200` | `#E5E7EB` | `bg-neutral-200` |
| `$backgroundDark0` | `#0F172A` | `dark:bg-slate-900` |
| `$backgroundDark50` | `#1E293B` | `dark:bg-slate-800` |
| `$backgroundDark100` | `#334155` | `dark:bg-slate-700` |
| `$backgroundDark800` | `#1E293B` | `dark:bg-slate-800` |
| `$backgroundDark900` | `#0F172A` | `dark:bg-slate-900` |
| `$backgroundDark950` | `#020617` | `dark:bg-slate-950` |
| `$textLight50` | `#F9FAFB` | `text-neutral-50` |
| `$textLight300` | `#D1D5DB` | `text-neutral-300` |
| `$textLight500` | `#6B7280` | `text-neutral-500` |
| `$textLight600` | `#4B5563` | `text-neutral-600` |
| `$textLight700` | `#374151` | `text-neutral-700` |
| `$textLight900` | `#111827` | `text-neutral-900` |
| `$textDark50` | `#F8FAFC` | `dark:text-slate-50` |
| `$textDark100` | `#F1F5F9` | `dark:text-slate-100` |
| `$textDark300` | `#CBD5E1` | `dark:text-slate-300` |
| `$textDark400` | `#94A3B8` | `dark:text-slate-400` |
| `$textDark600` | `#475569` | `dark:text-slate-600` |
| `$primary500` | `#818CF8` | `text-indigo-400` / `bg-indigo-400` |
| `$primary600` | `#6366F1` | `text-indigo-500` / `bg-indigo-500` |
| `$buttonPrimary` / `$tipboxPrimary` | `#D0F205` | `bg-[#D0F205]` |
| `$error500` | — | `text-red-500` |
| `$success500` | — | `text-green-500` |
| `$warning500` | — | `text-amber-500` |
| `$borderLight100` / `$borderLight200` | — | `border-neutral-200` |
| `$borderDark100` / `$borderDark700` | — | `dark:border-neutral-700` |

### 5.4 fontSize Sayisal Deger → Tailwind

| Sayi (px) | Tailwind Class |
|-----------|----------------|
| `8` | `text-[8px]` |
| `9` | `text-[9px]` |
| `10` | `text-[10px]` |
| `11` | `text-[11px]` |
| `12` | `text-xs` |
| `13` | `text-sm` (Tipbox config: sm=13) |
| `14` | `text-sm` veya `text-[14px]` |
| `16` | `text-base` |
| `18` | `text-lg` |
| `20` | `text-xl` |
| `24` | `text-2xl` |

---

## 6. Dark Mode Migration Detaylari

### 6.1 Mevcut Sistem

```tsx
// Her dosyada tekrarlanan pattern
const { colorMode } = useColorMode();
const isDark = colorMode === 'dark';

// Her bilesende conditional
<Box bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}>
  <Text color={isDark ? '$textDark50' : '$textLight900'}>
```

### 6.2 Hedef Sistem

```tsx
// useColorMode artik gerekmiyor
// Tailwind dark: prefix otomatik olarak dark mode'u yonetiyor

<Box className="bg-white dark:bg-slate-900">
  <Text className="text-neutral-900 dark:text-slate-50">
```

### 6.3 tailwind.config.js Degisikligi

```diff
module.exports = {
-  darkMode: 'media',
+  darkMode: 'class',
```

### 6.4 Dark Mode Toggle

NativeWind'de `class` stratejisi icin `DesignSystemProvider` kullanilacak:

```tsx
// App.tsx
<DesignSystemProvider>
  <NavigationContainer>
    {/* app */}
  </NavigationContainer>
</DesignSystemProvider>
```

Toggle islemi icin mevcut `appStore.toggleColorMode` aynen kullanilmaya devam eder.

### 6.5 Migration Sirasi (Her Dosya Icin)

1. `useColorMode` import'unu kaldir
2. `const { colorMode } = useColorMode()` ve `const isDark = ...` satirlarini kaldir
3. Her `isDark ? darkValue : lightValue` conditional'ini `dark:` prefix'ine cevir
4. `$token` degerleri className'e cevir

**Ornek tam donusum:**
```tsx
// ONCE (15 satir)
import { Box, Text, VStack, HStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const MyComponent = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box bg={isDark ? '$backgroundDark900' : '$backgroundLight0'} p="$4" borderRadius="$lg">
      <VStack space="md">
        <Text fontSize="$xl" fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
          Baslik
        </Text>
        <Text fontSize="$sm" color={isDark ? '$textDark400' : '$textLight500'}>
          Aciklama
        </Text>
      </VStack>
    </Box>
  );
};

// SONRA (10 satir — %33 daha az kod)
import { Box, VStack, Text } from '@/src/components/design-system';

const MyComponent = () => {
  return (
    <Box className="bg-white dark:bg-slate-900 p-4 rounded-lg">
      <VStack space="md">
        <Text className="text-xl font-bold">Baslik</Text>
        <Text className="text-sm text-neutral-500 dark:text-slate-400">Aciklama</Text>
      </VStack>
    </Box>
  );
};
```

---

## 7. Toplam Efor Ozeti

| Kategori | Zorluk | Tahmini Sure |
|----------|--------|-------------|
| Design-system bilesenlerini yaz | Orta | 2-3 gun |
| Dark mode altyapisi (class stratejisi) | Orta | 1 gun |
| Layout bilesenleri migration (267 dosya) | Dusuk | 3-4 gun |
| Text donusumu | Dusuk | 1-2 gun |
| Pressable donusumu | Dusuk | 1-2 gun |
| Image donusumu | Dusuk | 0.5-1 gun |
| **isDark conditional → dark: prefix** | **Yuksek** | **3-4 gun** |
| Form bilesenleri migration | Orta | 1-2 gun |
| Button migration | Orta | 1 gun |
| Toast sistemi migration | Orta | 1-2 gun |
| Modal/Overlay migration | Dusuk | 0.5 gun |
| Spinner/Progress/Divider | Dusuk | 0.5 gun |
| Provider & Config temizligi | Orta | 1 gun |
| Test & regression fix | Yuksek | 2-3 gun |
| **TOPLAM (1 gelistirici)** | | **~20-25 is gunu** |
| **TOPLAM (2 gelistirici, paralel)** | | **~12-15 is gunu** |

---

## 8. Migration Stratejisi (3 Fazli)

### Fase 1: Hazirlik (3 gun)

1. `npm install tailwind-merge clsx` (veya sadece `clsx`)
2. `src/components/design-system/` klasorunu olustur
3. Tum wrapper bilesenleri yaz (bu dokumandaki kodlar)
4. `tailwind.config.js` — `darkMode: 'class'` olarak degistir
5. `DesignSystemProvider`'i `App.tsx`'e ekle
6. **Test:** Yeni bilesenlerle kucuk bir ekran (orn. Settings) calistir

### Fase 2: Feature-by-Feature Migration (14-18 gun)

Onerilen siralama (bagimlilik ve risk sirasina gore):

```
1. Settings (en az bagimli, iyi test alani)
2. Auth (az sayida ekran — Login, Register, ForgotPassword)
3. Profile
4. Inventory
5. Catalog
6. Explore
7. Feed (en karmasik, en son)
8. Shared components (Header, ReviewCard, SideMenu, CustomToast, vb.)
```

**Her feature icin adimlar:**
1. Import'lari `@gluestack-ui/themed` → `@/src/components/design-system` olarak degistir
2. `useColorMode` / `isDark` satirlarini kaldir
3. Gluestack style prop'larini `className`'e cevir (prop donusum tablosunu kullan)
4. Gorsel test yap (light + dark mode)

### Fase 3: Temizlik (2-3 gun)

1. Eski `src/components/ui/gluestack-ui-provider/` dizinini kaldir
2. `src/components/ui/index.ts` barrel export'unu guncelle veya kaldir
3. `src/types/gluestack-ui.d.ts` kaldir
4. `gluestack-ui.config.json` kaldir
5. Tum Gluestack paketlerini kaldir:
   ```bash
   npm uninstall @gluestack-ui/themed @gluestack-ui/config @gluestack-style/react @gluestack-ui/button @gluestack-ui/icon @gluestack-ui/overlay @gluestack-ui/toast @gluestack-ui/nativewind-utils
   ```
6. `tailwind.config.js`'ten `gluestackPlugin`'i kaldir
7. Full regression test (tum ekranlar, light + dark)
8. Bundle size karsilastirmasi

---

## 9. Kazanimlar

### Performans
- Gluestack'in runtime style hesaplamasi kalkacak
- NativeWind compile-time CSS daha hizli
- Daha az JavaScript bridge trafigi

### Bundle Size
- 8 Gluestack paketi (~2-3 MB) kaldirilacak
- Daha kucuk app binary

### Developer Experience
- Tek styling sistemi (sadece Tailwind/NativeWind)
- `dark:` prefix ile kolay dark mode (conditional logic yok)
- Daha az boilerplate (useColorMode, isDark pattern'i yok)
- Tailwind ekosistemi ile daha genis topluluk destegi
- **Bilesen isimleri ayni** — ogrenme egrisi minimum

### Bakim
- Gluestack breaking change riski ortadan kalkar
- Tek bagimlilik zinciri (NativeWind)
- Daha basit provider agaci
- Kendi design-system'iniz — tam kontrol

---

## 10. Riskler ve Mitigasyon

| Risk | Etki | Olasilik | Mitigasyon |
|------|------|----------|-----------|
| Visual regression (tasarim bozulmasi) | Yuksek | Orta | Her ekran icin light/dark screenshot karsilastirmasi |
| Token mapping hatalari | Orta | Yuksek | Bu dokumandaki mapping tablosunu referans al |
| NativeWind dark mode sorunlari | Orta | Dusuk | Fase 1'de altyapiyi saglam kur, kucuk ekranla test et |
| Migration sirasinda yeni feature ihtiyaci | Yuksek | Orta | Yeni feature'lari dogrudan design-system ile yaz |
| Performans farklilik | Dusuk | Dusuk | Wrapper bilesenler React.forwardRef + memo kullaniyor |
| Import path degisikligi hatasi | Dusuk | Orta | Find-replace ile toplu degisiklik, TypeScript hatalari yakalayacak |

---

## 11. Karar Kriterleri

| Kriter | Degerlendirme |
|--------|---------------|
| Gluestack maintenance riski | Orta — v2 migration belirsizligi |
| Performans kazanimi | Var — runtime style hesaplamasi kalkacak |
| DX iyilesmesi | Yuksek — tek styling sistemi, daha az boilerplate |
| Efor/fayda orani | Makul — 20-25 gunluk yatirim, uzun vadeli kazanim |
| Design system sahipligi | Yuksek — kendi bilesenleriniz uzerinde tam kontrol |
| Timing | Ideal donem: feature freeze veya major release oncesi |

**Oneri:** Migration yapilmali. Design-system katmani ile bilesen isimlerini koruyarak, feature-by-feature kademeli gecis uygulanmali. Yeni yazilacak ekranlar dogrudan design-system import'lari ile baslasin.
