# Smooth Bottom Sheet Implementation Guide

Bu dokümantasyon, smooth animasyonlu ve klavye uyumlu bottom sheet implementasyonu için rehberdir. CommentBottomSheet örneği üzerinden açıklanmıştır.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Gereksinimler](#gereksinimler)
3. [Bottom Sheet Component Oluşturma](#bottom-sheet-component-oluşturma)
4. [Bottom Sheet Açma](#bottom-sheet-açma)
5. [İki Aşamalı Bottom Sheet (Küçük -> Büyük)](#iki-aşamalı-bottom-sheet-küçük---büyük)
6. [Klavye Uyumluluğu](#klavye-uyumluluğu)
7. [Best Practices](#best-practices)
8. [Örnek Kullanım](#örnek-kullanım)

---

## Genel Bakış

Bu implementasyon şu özellikleri sağlar:

- ✅ **Smooth Animasyonlar**: `@gorhom/bottom-sheet` ile native animasyonlar
- ✅ **Klavye Uyumluluğu**: Klavye açıldığında bottom sheet otomatik yukarı kayar
- ✅ **İki Aşamalı Yapı**: Küçük snap point'ten büyük snap point'e geçiş
- ✅ **Gesture Handler Uyumluluğu**: `InputField` kullanarak gesture handler hatalarını önler
- ✅ **Global Yönetim**: GlobalBottomSheetProvider ile merkezi yönetim

---

## Gereksinimler

### Kütüphaneler

```json
{
  "@gorhom/bottom-sheet": "^5.2.3",
  "@gluestack-ui/themed": "^1.1.73"
}
```

### Provider Setup

`App.tsx` içinde `GlobalBottomSheetProvider` zaten mevcut olmalı:

```tsx
import { GlobalBottomSheetProvider } from '@/src/providers/GlobalBottomSheetProvider';

export default function App() {
  return (
    <GlobalBottomSheetProvider>
      {/* Your app */}
    </GlobalBottomSheetProvider>
  );
}
```

---

## Bottom Sheet Component Oluşturma

### 1. Component Yapısı

Bottom sheet component'i sadece **içerik** döndürmelidir. `BottomSheet` wrapper'ı GlobalBottomSheet tarafından sağlanır.

```tsx
// src/features/your-feature/components/YourBottomSheet/index.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  VStack,
  HStack,
  Text,
  Pressable,
  Box,
  Input,
  InputField,
  Textarea,
  TextareaInput,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

interface YourBottomSheetProps {
  // Props
  onAction: (data: any) => void;
  isSubmitting?: boolean;
}

export const YourBottomSheet: React.FC<YourBottomSheetProps> = ({
  onAction,
  isSubmitting = false,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet } = useGlobalBottomSheet();
  
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<any>(null);
  const textareaRef = useRef<any>(null);

  // Bottom sheet açıldığında input'a focus
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!inputValue.trim() || isSubmitting) return;
    onAction(inputValue.trim());
    setInputValue('');
    closeBottomSheet();
  };

  const handleInputFocus = () => {
    // Input'a focus olduğunda geniş alana geç
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);
  };

  return (
    <VStack flex={1} px="$4" py="$2">
      {/* Küçük input (ilk snap point) */}
      <HStack space="sm" alignItems="center" py="$2">
        <Input
          flex={1}
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderWidth={0}
          borderRadius={20}
          height={40}
        >
          <InputField
            ref={inputRef}
            placeholder="Write something..."
            placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={14}
            value={inputValue}
            onChangeText={setInputValue}
            multiline={false}
            onFocus={handleInputFocus}
          />
        </Input>

        <Pressable
          onPress={handleSubmit}
          width={40}
          height={40}
          borderRadius={20}
          bg={
            inputValue.trim() && !isSubmitting
              ? '#6366F1'
              : isDark
              ? '#2A2A2A'
              : '#F2F2F2'
          }
          alignItems="center"
          justifyContent="center"
          disabled={!inputValue.trim() || isSubmitting}
        >
          <Feather
            name="send"
            size={18}
            color={
              inputValue.trim()
                ? '#FFFFFF'
                : isDark
                ? '#8C8C8C'
                : '#8C8C8C'
            }
          />
        </Pressable>
      </HStack>

      {/* Geniş textarea (ikinci snap point'te görünür) */}
      {isExpanded && (
        <Box flex={1} mt="$2">
          <Textarea
            bg={isDark ? '#2A2A2A' : '#F2F2F2'}
            borderWidth={0}
            borderRadius={12}
            minHeight={200}
          >
            <TextareaInput
              ref={textareaRef}
              placeholder="Write something..."
              placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={14}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
              style={{ minHeight: 200 }}
            />
          </Textarea>

          <Pressable
            onPress={handleSubmit}
            mt="$3"
            px="$4"
            py="$3"
            borderRadius={12}
            bg={
              inputValue.trim() && !isSubmitting
                ? '#6366F1'
                : isDark
                ? '#2A2A2A'
                : '#F2F2F2'
            }
            alignItems="center"
            justifyContent="center"
            disabled={!inputValue.trim() || isSubmitting}
          >
            <HStack space="sm" alignItems="center">
              <Feather
                name="send"
                size={18}
                color={
                  inputValue.trim()
                    ? '#FFFFFF'
                    : isDark
                    ? '#8C8C8C'
                    : '#8C8C8C'
                }
              />
              <Text
                color={
                  inputValue.trim()
                    ? '#FFFFFF'
                    : isDark
                    ? '#8C8C8C'
                    : '#8C8C8C'
                }
                fontSize={14}
                fontWeight="$medium"
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      )}
    </VStack>
  );
};
```

### 2. Önemli Noktalar

- ✅ **InputField kullan**: `BottomSheetTextInput` yerine `InputField` kullan (gesture handler hatası önlenir)
- ✅ **Ref tipi**: `useRef<any>(null)` kullan (InputField ref tipi belirsiz)
- ✅ **Focus yönetimi**: `useEffect` ile açılışta otomatik focus
- ✅ **Expanded state**: Input focus olduğunda geniş alan göster

---

## Bottom Sheet Açma

### 1. Hook Import

```tsx
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
```

### 2. Snap Points Hesaplama

**Klavyenin Üzerinde Açılması İçin:**

Bottom sheet klavyenin üzerinde açılacaksa, snap points'i klavye yüksekliğini hesaba katarak hesapla:

```tsx
import { Dimensions, Platform } from 'react-native';

const screenHeight = Dimensions.get('window').height;
const estimatedKeyboardHeight = Platform.OS === 'ios' ? 300 : 250;

// İlk snap point: küçük alan (klavye yüksekliği ekran yüksekliğinden çıkarılır)
const firstSnapPoint = 70;

// İkinci snap point: geniş alan (klavye yüksekliği ekran yüksekliğinden çıkarılır)
const secondSnapPoint = (screenHeight - estimatedKeyboardHeight) * 0.5;
```

**Not:** `keyboardBehavior: 'interactive'` kullanıldığında, bottom sheet klavye açıldığında otomatik olarak yukarı kayar ve klavyenin üzerinde konumlanır.

### 3. Bottom Sheet Açma

```tsx
const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

const handleOpenBottomSheet = () => {
  const screenHeight = Dimensions.get('window').height;
  const estimatedKeyboardHeight = Platform.OS === 'ios' ? 300 : 250;
  
  // Klavye üzerinde açılması için snap points (klavye yüksekliği ekran yüksekliğinden çıkarılır)
  const firstSnapPoint = 70;
  const secondSnapPoint = (screenHeight - estimatedKeyboardHeight) * 0.5;

  openBottomSheet(
    <YourBottomSheet
      onAction={(data) => {
        // Action handler
        console.log('Action:', data);
        closeBottomSheet();
      }}
      isSubmitting={false}
    />,
    {
      // Snap points - klavye üzerinde açılması için
      snapPoints: [firstSnapPoint, secondSnapPoint],
      
      // Gesture settings
      enablePanDownToClose: true,
      enableOverDrag: false,
      enableHandlePanningGesture: true,
      enableContentPanningGesture: true,
      
      // Sizing
      enableDynamicSizing: false, // Snap points kullanıyorsak false
      animateOnMount: true, // Smooth açılış animasyonu
      
      // Initial state
      initialSnapIndex: 0, // İlk snap point'te başla
      
      // Padding - klavye üzerinde olduğu için 0
      paddingBottom: 0,
      
      // Keyboard behavior - ÖNEMLİ!
      keyboardBehavior: 'interactive', // Klavye açıldığında bottom sheet yukarı kayar (klavye üzerinde)
      keyboardBlurBehavior: 'restore', // Klavye kapandığında eski haline döner
      android_keyboardInputMode: 'adjustResize', // Android klavye uyumu
      
      // Callbacks
      onChange: (index) => {
        // Snap point değişikliği
        console.log('Snap point changed:', index);
      },
    }
  );
};
```

---

## İki Aşamalı Bottom Sheet (Küçük -> Büyük)

### 1. Expanded State Yönetimi

```tsx
const [isExpanded, setIsExpanded] = useState(false);

const handleInputFocus = () => {
  // Input'a focus olduğunda geniş alana geç
  setIsExpanded(true);
  setTimeout(() => {
    textareaRef.current?.focus();
  }, 200);
};
```

### 2. Conditional Rendering

```tsx
{/* Küçük input (her zaman görünür) */}
<HStack>
  <Input>
    <InputField onFocus={handleInputFocus} />
  </Input>
</HStack>

{/* Geniş textarea (sadece expanded state'te görünür) */}
{isExpanded && (
  <Box flex={1}>
    <Textarea>
      <TextareaInput />
    </Textarea>
  </Box>
)}
```

### 3. Handler'dan Yukarı Çekme

Handler'dan yukarı çekilince bottom sheet otomatik olarak ikinci snap point'e geçer (GlobalBottomSheet tarafından yönetilir).

---

## Klavye Uyumluluğu

### 1. Keyboard Behavior Ayarları

```tsx
{
  keyboardBehavior: 'interactive', // 'interactive' | 'fillParent' | 'extend'
  keyboardBlurBehavior: 'restore', // 'none' | 'restore'
  android_keyboardInputMode: 'adjustResize', // 'adjustResize' | 'adjustPan'
}
```

**`keyboardBehavior` Seçenekleri:**

- `'interactive'`: Klavye açıldığında bottom sheet yukarı kayar ve klavyenin üzerinde konumlanır (önerilen - klavye üzerinde açılması için)
- `'extend'`: Klavye açıldığında bottom sheet genişler (ekranın altında kalır)
- `'fillParent'`: Bottom sheet ekranı doldurur

### 2. Snap Points Hesaplama (Klavye Üzerinde)

Bottom sheet klavyenin üzerinde açılacaksa, snap points'i klavye yüksekliğini hesaba katarak hesapla:

```tsx
const estimatedKeyboardHeight = Platform.OS === 'ios' ? 300 : 250;
// Klavye üzerinde açılması için: klavye yüksekliği ekran yüksekliğinden çıkarılır
const firstSnapPoint = 70; // Input + handler için yeterli alan
const secondSnapPoint = (screenHeight - estimatedKeyboardHeight) * 0.5; // Geniş alan (klavye yüksekliği çıkarılmış)
```

**Not:** `keyboardBehavior: 'interactive'` kullanıldığında, bottom sheet klavye açıldığında otomatik olarak yukarı kayar ve klavyenin üzerinde konumlanır.

### 3. Input Focus Yönetimi

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    inputRef.current?.focus();
  }, 300);
  return () => clearTimeout(timer);
}, []);
```

---

## Best Practices

### 1. InputField Kullan

❌ **Yanlış:**
```tsx
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

<BottomSheetTextInput ref={ref} /> // Gesture handler hatası!
```

✅ **Doğru:**
```tsx
import { InputField } from '@gluestack-ui/themed';

<InputField ref={ref} /> // Gesture handler uyumlu
```

### 2. Ref Tipi

```tsx
// ✅ Doğru
const inputRef = useRef<any>(null);

// ❌ Yanlış
const inputRef = useRef<TextInput>(null); // InputField ref tipi farklı
```

### 3. Snap Points Hesaplama (Klavye Üzerinde)

```tsx
// ✅ Doğru - Klavye üzerinde açılması için (klavye yüksekliği ekran yüksekliğinden çıkarılır)
const firstSnapPoint = 70;
const secondSnapPoint = (screenHeight - estimatedKeyboardHeight) * 0.5;

// ❌ Yanlış - Klavye yüksekliği eklenirse bottom sheet ekranın altında kalır
const firstSnapPoint = 70 + estimatedKeyboardHeight; // Ekranın altında
```

### 4. Keyboard Behavior (Klavye Üzerinde)

```tsx
// ✅ Önerilen - Klavye üzerinde açılması için
keyboardBehavior: 'interactive' // Klavye açıldığında bottom sheet yukarı kayar (klavye üzerinde)
paddingBottom: 0 // Klavye üzerinde olduğu için padding gerekmez

// Alternatif - Ekranın altında kalması için
keyboardBehavior: 'extend' // Klavye açıldığında bottom sheet genişler (ekranın altında)
paddingBottom: Platform.OS === 'ios' ? bottomInset : 20
```

### 5. Expanded State Yönetimi

```tsx
// ✅ Input focus olduğunda geniş alana geç
const handleInputFocus = () => {
  setIsExpanded(true);
  setTimeout(() => {
    textareaRef.current?.focus();
  }, 200);
};
```

---

## Örnek Kullanım

### Tam Örnek: Comment Bottom Sheet

```tsx
// src/features/post/screens/PostDetailScreen.tsx

import React, { useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CommentBottomSheet } from '../components/CommentBottomSheet';

export const PostDetailScreen = () => {
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomInset = useSafeAreaValues('bottom');

  const handleCommentInputPress = () => {
    // Snap points hesaplama
    const screenHeight = Dimensions.get('window').height;
    const estimatedKeyboardHeight = Platform.OS === 'ios' ? 300 : 250;
    const firstSnapPoint = 70 + estimatedKeyboardHeight;
    const secondSnapPoint = screenHeight * 0.5 + estimatedKeyboardHeight;

    openBottomSheet(
      <CommentBottomSheet
        postId={postId}
        onCommentSubmit={(comment) => {
          // API call
          createCommentMutation.mutate(
            { postId, comment },
            {
              onSuccess: () => closeBottomSheet(),
            }
          );
        }}
        isSubmitting={createCommentMutation.isPending}
      />,
      {
        snapPoints: [firstSnapPoint, secondSnapPoint],
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: false,
        animateOnMount: true,
        initialSnapIndex: 0,
        paddingBottom: Platform.OS === 'ios' ? bottomInset : 20,
        keyboardBehavior: 'extend',
        keyboardBlurBehavior: 'restore',
        android_keyboardInputMode: 'adjustResize',
      }
    );
  };

  return (
    // Your screen content
    <Pressable onPress={handleCommentInputPress}>
      {/* Trigger button */}
    </Pressable>
  );
};
```

---

## Özet

### Smooth Bottom Sheet için Gerekli Ayarlar

1. ✅ **Snap Points**: Klavye yüksekliği dahil hesapla
2. ✅ **Keyboard Behavior**: `'extend'` veya `'interactive'` kullan
3. ✅ **InputField**: `BottomSheetTextInput` yerine `InputField` kullan
4. ✅ **Animate On Mount**: `animateOnMount: true` ile smooth açılış
5. ✅ **Expanded State**: Input focus olduğunda geniş alan göster
6. ✅ **Ref Tipi**: `useRef<any>(null)` kullan

### Smooth Animasyon için

- `animateOnMount: true` - Açılış animasyonu
- `enablePanDownToClose: true` - Kapatma animasyonu
- `enableHandlePanningGesture: true` - Handler sürükleme animasyonu
- `enableContentPanningGesture: true` - İçerik sürükleme animasyonu

---

## Sorun Giderme

### Klavye Görünmüyor veya Bottom Sheet Klavyenin Altında

**Çözüm (Klavye Üzerinde Açılması İçin):**
- Snap points'i klavye yüksekliğini hesaba katarak hesapla (klavye yüksekliği ekran yüksekliğinden çıkarılır)
- `keyboardBehavior: 'interactive'` kullan (klavye açıldığında bottom sheet yukarı kayar)
- `paddingBottom: 0` ayarla (klavye üzerinde olduğu için padding gerekmez)
- `android_keyboardInputMode: 'adjustResize'` ayarla

### Gesture Handler Hatası

**Çözüm:**
- `BottomSheetTextInput` yerine `InputField` kullan
- Ref tipini `useRef<any>(null)` yap

### Animasyon Yavaş

**Çözüm:**
- `enableOverDrag: false` ayarla
- `enableDynamicSizing: false` kullan (snap points kullanıyorsan)

---

## Referanslar

- [@gorhom/bottom-sheet Documentation](https://gorhom.github.io/react-native-bottom-sheet/)
- [GlobalBottomSheet Implementation](../src/components/GlobalBottomSheet/index.tsx)
- [CommentBottomSheet Example](../src/features/post/components/CommentBottomSheet/index.tsx)

