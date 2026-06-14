import React from 'react';
import { ScrollView, HStack, VStack, Box, Pressable, Text } from '@gluestack-ui/themed';
import { ChevronRight } from 'lucide-react-native';
import { CachedImage } from '@/src/components/CachedImage';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { CatalogBrandFilter } from '../../types';

export interface BrandFilterScrollProps {
  brands: CatalogBrandFilter[];
  selectedBrandId?: string;
  onBrandPress: (brand: CatalogBrandFilter) => void;
  isLoading?: boolean;
  /** Sağ tarafta "Tümünü gör" alanına tıklanınca çağrılır (tüm markaların listelendiği sayfa). */
  onSeeAllPress?: () => void;
  /** "Tümünü gör" alanının görünme koşulu: yalnızca onSeeAllPress verilmişse gösterilir. */
  seeAllLabel?: string;
}

/**
 * Listeleme sayfalarının üstünde gösterilen yatay (scroll-x) marka filtresi.
 * Her marka chip'i logo + isimden oluşur; tıklanınca markaya göre filtreli
 * ürün listesine yönlendirme yapılır (onBrandPress).
 */
const BrandFilterScroll: React.FC<BrandFilterScrollProps> = ({
  brands,
  selectedBrandId,
  onBrandPress,
  isLoading = false,
  onSeeAllPress,
  seeAllLabel = 'Tümünü gör',
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Yükleniyor veya marka yoksa hiç gösterme (layout'u kirletmemek için)
  if (isLoading || !brands || brands.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <HStack space="sm" alignItems="flex-start">
        {brands.map((brand) => {
          const isSelected = !!selectedBrandId && selectedBrandId === brand.brandId;
          const fallbackInitial = brand.name?.trim().charAt(0).toUpperCase() || '?';

          return (
            <Pressable
              key={brand.brandId}
              onPress={() => onBrandPress(brand)}
              width={72}
              alignItems="center"
            >
              <VStack space="xs" alignItems="center">
                {/* Marka logosu */}
                <Box
                  width={56}
                  height={56}
                  borderRadius={28}
                  overflow="hidden"
                  justifyContent="center"
                  alignItems="center"
                  bg={isDark ? '#2A2A2A' : '#FDFDFD'}
                  borderWidth={isSelected ? 2 : 1}
                  borderColor={
                    isSelected
                      ? '#6366F1'
                      : isDark
                      ? '#404040'
                      : '#E9E9E9'
                  }
                >
                  {brand.image ? (
                    <CachedImage
                      source={brand.image}
                      style={{ width: '100%', height: '100%' }}
                      alt={brand.name}
                      resizeMode="contain"
                      cachePolicy="memory-disk"
                      recyclingKey={`brand-${brand.brandId}`}
                    />
                  ) : (
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$lg"
                      fontWeight="$bold"
                    >
                      {fallbackInitial}
                    </Text>
                  )}
                </Box>

                {/* Marka adı */}
                <Text
                  color={
                    isSelected
                      ? '#6366F1'
                      : isDark
                      ? '#FFFFFF'
                      : '#000000'
                  }
                  fontSize="$2xs"
                  fontWeight={isSelected ? '$bold' : '$medium'}
                  numberOfLines={1}
                  textAlign="center"
                >
                  {brand.name}
                </Text>
              </VStack>
            </Pressable>
          );
        })}

        {/* "Tümünü gör" — scroll-x'in sağ ucunda; o kategorinin tüm markalarını listeleyen sayfaya gider */}
        {onSeeAllPress && (
          <Pressable
            onPress={onSeeAllPress}
            width={72}
            alignItems="center"
            accessibilityRole="button"
            accessibilityLabel={seeAllLabel}
          >
            <VStack space="xs" alignItems="center">
              <Box
                width={56}
                height={56}
                borderRadius={28}
                justifyContent="center"
                alignItems="center"
                bg={isDark ? '#2A2A2A' : '#F1F1F4'}
                borderWidth={1}
                borderColor={isDark ? '#404040' : '#E9E9E9'}
              >
                <ChevronRight size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$2xs"
                fontWeight="$medium"
                numberOfLines={1}
                textAlign="center"
              >
                {seeAllLabel}
              </Text>
            </VStack>
          </Pressable>
        )}
      </HStack>
    </ScrollView>
  );
};

export default BrandFilterScroll;
