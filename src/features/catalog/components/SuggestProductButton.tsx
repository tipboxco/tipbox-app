import React, { useCallback, useRef, useState } from 'react';
import { TextInput, StyleSheet, Platform } from 'react-native';
import { Box, Text, Pressable, VStack, HStack } from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { LightBulbIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';

const STORAGE_KEY = 'catalog_product_suggestions';

export interface ProductSuggestion {
  id: string;
  productName: string;
  brand: string;
  category: string;
  createdAt: string;
}

interface SuggestProductButtonProps {
  /** If provided, pre-fills the category field */
  contextCategory?: string;
  /** Additional bottom margin for the button */
  mb?: number;
}

export const SuggestProductButton: React.FC<SuggestProductButtonProps> = ({
  contextCategory = '',
  mb = 0,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const toast = useToast();

  const sheetRef = useRef<BottomSheet>(null);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(contextCategory);
  const [isSaving, setIsSaving] = useState(false);

  const openSheet = useCallback(() => {
    setProductName('');
    setBrand('');
    setCategory(contextCategory);
    sheetRef.current?.expand();
  }, [contextCategory]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleSave = useCallback(async () => {
    if (!productName.trim()) {
      showCustomToast(toast, {
        title: 'Ürün adı gerekli',
        description: 'Lütfen önermek istediğiniz ürünün adını girin.',
        action: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: ProductSuggestion[] = raw ? JSON.parse(raw) : [];

      const newSuggestion: ProductSuggestion = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        productName: productName.trim(),
        brand: brand.trim(),
        category: category.trim(),
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...existing, newSuggestion]),
      );

      closeSheet();
      showCustomToast(toast, {
        title: 'Önerin alındı!',
        description: 'Moderasyon onayının ardından kataloğa eklenecektir.',
        action: 'success',
      });
    } catch {
      showCustomToast(toast, {
        title: 'Bir hata oluştu',
        description: 'Önerin kaydedilemedi, tekrar deneyin.',
        action: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [productName, brand, category, toast, closeSheet]);

  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const inputBorder = isDark ? '#444444' : '#E0E0E0';
  const inputColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const placeholderColor = isDark ? '#888888' : '#AAAAAA';
  const sheetBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const labelColor = isDark ? '#CCCCCC' : '#555555';

  return (
    <>
      {/* Suggest button */}
      <Pressable
        onPress={openSheet}
        mb={mb}
        borderWidth={1.5}
        borderColor="#BBFF4E"
        borderRadius={12}
        px="$4"
        py="$3"
        flexDirection="row"
        alignItems="center"
        bg={isDark ? 'rgba(187,255,78,0.06)' : 'rgba(187,255,78,0.08)'}
      >
        <LightBulbIcon
          size={20}
          color="#BBFF4E"
          style={{ marginRight: 10 }}
        />
        <VStack flex={1}>
          <Text
            fontSize="$sm"
            fontWeight="$semibold"
            color={isDark ? '#FFFFFF' : '#1A1A1A'}
          >
            Aradığını bulamadın mı? Öner!
          </Text>
          <Text fontSize="$2xs" color={isDark ? '#999999' : '#888888'} mt={2}>
            Moderasyon onayıyla eklenecektir
          </Text>
        </VStack>
      </Pressable>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['55%']}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#555555' : '#CCCCCC' }}
        backgroundStyle={{ backgroundColor: sheetBg }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <HStack alignItems="center" mb={16}>
            <LightBulbIcon size={20} color="#BBFF4E" style={{ marginRight: 8 }} />
            <Text
              fontSize="$md"
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#1A1A1A'}
            >
              Ürün Öner
            </Text>
          </HStack>

          <Text fontSize="$xs" color={labelColor} mb={4}>
            Ürün Adı *
          </Text>
          <TextInput
            value={productName}
            onChangeText={setProductName}
            placeholder="Örn: Sony WH-1000XM5"
            placeholderTextColor={placeholderColor}
            style={[
              styles.input,
              { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
            ]}
          />

          <Text fontSize="$xs" color={labelColor} mb={4} mt={12}>
            Marka (opsiyonel)
          </Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="Örn: Sony"
            placeholderTextColor={placeholderColor}
            style={[
              styles.input,
              { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
            ]}
          />

          <Text fontSize="$xs" color={labelColor} mb={4} mt={12}>
            Kategori (opsiyonel)
          </Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Örn: Kulaklıklar"
            placeholderTextColor={placeholderColor}
            style={[
              styles.input,
              { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
            ]}
          />

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            mt={24}
            py="$3"
            borderRadius={10}
            bg="#BBFF4E"
            alignItems="center"
          >
            <Text fontSize="$sm" fontWeight="$bold" color="#1A1A1A">
              {isSaving ? 'Kaydediliyor…' : 'Öneriyi Gönder'}
            </Text>
          </Pressable>

          <Pressable onPress={closeSheet} mt={12} py="$2" alignItems="center">
            <Text fontSize="$sm" color={isDark ? '#888888' : '#AAAAAA'}>
              Vazgeç
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
