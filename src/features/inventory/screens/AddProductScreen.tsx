import React, { useRef } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Image } from '@gluestack-ui/themed';
import BottomSheet from '@gorhom/bottom-sheet';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InventoryStackParamList } from '../types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { ComboBox } from '@/src/components/ComboBox';
import { Star } from 'lucide-react-native';
import { CategoryBottomSheet } from '../components/CategoryBottomSheet';
import type { Product, MainCategory, SubCategory, ProductGroup } from '@/src/mock/inventory/AllCategories';

const USAGE_DURATION_OPTIONS = [
  '1 Ay - 6 Ay',
  '6 Ay - 1 Yıl',
  '1 Yıl - 3 Yıl',
  '3 Yıl - Daha Fazla',
];

const USAGE_LOCATION_OPTIONS = ['Ev', 'Ofis', 'Diğer'];

const USAGE_PURPOSE_OPTIONS = [
  'Günlük Kullanım',
  'Kişisel İhtiyaç',
  'İş Yeri İhtiyacı',
];

export const AddProductScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedOption, setSelectedOption] = React.useState<'own' | 'experienced' | null>(null);
  const [usageDuration, setUsageDuration] = React.useState<string | null>(null);
  const [usageLocation, setUsageLocation] = React.useState<string | null>(null);
  const [usagePurpose, setUsagePurpose] = React.useState<string | null>(null);

  const [showCategorySheet, setShowCategorySheet] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selection, setSelection] = React.useState<{
    mainCategory?: MainCategory;
    subCategory?: SubCategory;
    productGroup?: ProductGroup;
  }>({});
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Form validasyonu
  const isFormValid = React.useMemo(() => {
    // Ürün seçili mi?
    if (!selectedProduct) return false;

    // Kullanım süresi seçili mi?
    if (!usageDuration) return false;

    // Kullanım yeri seçili mi?
    if (!usageLocation) return false;

    // Kullanım amacı seçili mi?
    if (!usagePurpose) return false;

    // Ürünün yıldız derecelendirmesi var mı?
    if (!selectedProduct?.rating || selectedProduct.rating < 1) return false;

    // Ürün sahipliği seçili mi?
    if (!selectedOption) return false;

    // Tüm kontroller geçildi
    return true;
  }, [selectedProduct, usageDuration, usageLocation, usagePurpose, selectedOption]);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Ürün Ekle"
        showBackButton
        onMenuPress={() => navigation.goBack()}
      />
      <ScrollView>
        <VStack space="lg" p="$4">
          {/* Ürün Başlığı */}
          <VStack space="sm">
            <Text
              fontWeight="$semibold"
              size="sm"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Ürün
            </Text>
            <HStack space="md">
              <Pressable onPress={() => setShowCategorySheet(true)}>
                <Box
                  bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                  borderRadius="$lg"
                  width={120}
                  height={120}
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                >
                  {selectedProduct ? (
                    <Image
                      source={{ uri: selectedProduct.image }}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      color={isDark ? '$textDark400' : '$textLight500'}
                      fontSize="$3xl"
                    >
                      +
                    </Text>
                  )}
                </Box>
              </Pressable>
              {/* Fotoğraf Önizleme Alanı */}
              <Box flex={1}>
                <VStack space="sm">
                  {selectedProduct ? (
                    <>
                      <Text
                        color={isDark ? '$textDark50' : '$textLight900'}
                        fontSize="$lg"
                        fontWeight="$bold"
                      >
                        {selectedProduct.name}
                      </Text>
                      <HStack space="sm" flexWrap="wrap">
                        <Box
                          bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
                          px="$2"
                          py="$1"
                          borderRadius="$sm"
                        >
                          <Text
                            color={isDark ? '$textDark300' : '$textLight600'}
                            fontSize="$xs"
                          >
                            {selection.mainCategory?.name}
                          </Text>
                        </Box>
                        <Box
                          bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
                          px="$2"
                          py="$1"
                          borderRadius="$sm"
                        >
                          <Text
                            color={isDark ? '$textDark300' : '$textLight600'}
                            fontSize="$xs"
                          >
                            {selection.subCategory?.name}
                          </Text>
                        </Box>
                        <Box
                          bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
                          px="$2"
                          py="$1"
                          borderRadius="$sm"
                        >
                          <Text
                            color={isDark ? '$textDark300' : '$textLight600'}
                            fontSize="$xs"
                          >
                            {selection.productGroup?.name}
                          </Text>
                        </Box>
                      </HStack>
                    </>
                  ) : (
                    <>
                      <Box
                        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                        height={24}
                        borderRadius="$sm"
                      />
                      <Box
                        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                        height={15}
                        width="80%"
                        borderRadius="$sm"
                      />
                      <Box
                        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                        height={15}
                        width="60%"
                        borderRadius="$sm"
                      />
                    </>
                  )}
                </VStack>
                <HStack mt="$4" space="sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      color="#FFD700"
                      fill={star <= (selectedProduct?.rating || 0) ? "#FFD700" : "transparent"}
                    />
                  ))}
                </HStack>
              </Box>
            </HStack>
          </VStack>

          {/* Kullanım Detayları */}
          <VStack space="md">
            <ComboBox
              label="Ne Kadar Süre Kullanıldı"
              value={usageDuration}
              options={USAGE_DURATION_OPTIONS}
              onSelect={setUsageDuration}
            />

            <ComboBox
              label="Nerede Kullanıldı"
              value={usageLocation}
              options={USAGE_LOCATION_OPTIONS}
              onSelect={setUsageLocation}
            />

            <ComboBox
              label="Hangi İhtiyaç için Kullanıldı"
              value={usagePurpose}
              options={USAGE_PURPOSE_OPTIONS}
              onSelect={setUsagePurpose}
            />
          </VStack>

          {/* Ürün Sahipliği */}
          <HStack w="$full" alignItems="center" justifyContent="center" space="md" mt="$2">
            <Box flex={1}>
              <Pressable onPress={() => setSelectedOption('own')}>
                <Box
                  flex={1}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark400' : '$borderLight400'}
                  borderRadius="$md"
                  p="$2"
                  bg={selectedOption === 'own' ? '#D8FF08' : 'transparent'}
                >
                  <Text
                    textAlign="center"
                    color={selectedOption === 'own' ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
                    size="sm"
                  >
                    Ürüne Sahibim
                  </Text>
                </Box>
              </Pressable>
            </Box>
            <Box flex={1}>
              <Pressable onPress={() => setSelectedOption('experienced')}>
                <Box
                  flex={1}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark400' : '$borderLight400'}
                  borderRadius="$md"
                  p="$2"
                  bg={selectedOption === 'experienced' ? '#D8FF08' : 'transparent'}
                >
                  <Text
                    textAlign="center"
                    color={selectedOption === 'experienced' ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
                    size="sm"
                  >
                    Sadece Deneyimledim
                  </Text>
                </Box>
              </Pressable>
            </Box>
          </HStack>
        </VStack>
      </ScrollView>

      {/* Onay Butonu */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p="$4"
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <Pressable 
          onPress={() => {
            if (selectedProduct) {
              navigation.navigate('PriceExperience', {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
              });
            }
          }}
          disabled={!isFormValid}
        >
          <Box
            bg={isFormValid ? "#D8FF08" : isDark ? "$backgroundDark800" : "$backgroundLight200"}
            borderRadius="$lg"
            p="$3"
            alignItems="center"
            opacity={isFormValid ? 1 : 0.5}
          >
            <Text
              color={isFormValid ? "#000000" : isDark ? "$textDark400" : "$textLight500"}
              fontWeight="$bold"
              size="md"
            >
              {isFormValid ? "Onayla" : "Tüm Alanları Doldurun"}
            </Text>
          </Box>
        </Pressable>
      </Box>

      <CategoryBottomSheet
        ref={bottomSheetRef}
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        onSelect={(product, currentSelection) => {
          setSelectedProduct(product);
          setSelection({
            mainCategory: currentSelection.mainCategory,
            subCategory: currentSelection.subCategory,
            productGroup: currentSelection.productGroup
          });
          setShowCategorySheet(false);
          bottomSheetRef.current?.close();
        }}
      />
    </Box>
  );
};
