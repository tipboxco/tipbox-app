import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Spinner } from '@gluestack-ui/themed';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { toImageSource } from '@/src/utils';
import { BrandCard } from '../components/BrandCard';
import { useCatalogBrandFilters } from '../api/hooks';
import type { CatalogBrandFilter, BrandCardModel } from '../types';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

type CategoryBrandsRouteProp = RouteProp<RootStackParamList, 'CatalogCategoryBrands'>;
type CategoryBrandsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Bir kategorinin (ve tüm alt kategorilerinin) tüm markalarını listeler.
 * Kategori sayfasındaki yatay marka çubuğunun (BrandFilterScroll) "Tümünü gör"
 * alanından bu ekrana yönlendirilir. Markaya tıklanınca markanın kendi detay
 * sayfasına (BrandDetailScreen) gider.
 */
export const CategoryBrandsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const { t } = useTranslation('catalog');
  const route = useRoute<CategoryBrandsRouteProp>();
  const navigation = useNavigation<CategoryBrandsNavigationProp>();
  const { categoryId, categoryName } = route.params;

  const backgroundColor = useMemo(() => (isDark ? '#1A1A1A' : '#FAFAFA'), [isDark]);

  const { data, isLoading } = useCatalogBrandFilters(categoryId);

  const brands = useMemo<CatalogBrandFilter[]>(() => data?.items ?? [], [data]);

  // Markaya tıklanınca markanın kendi detay sayfasına git.
  // Fallback: yeni Brand UUID (id) alanı deploy edilmemişse, mevcut CategoryBrandProducts
  // akışına (brandId === externalId) düş.
  const handleBrandPress = useCallback((brand: CatalogBrandFilter) => {
    if (brand.id) {
      navigationService.navigate(ROOT_ROUTES.BRAND as any, {
        screen: 'BrandDetailScreen',
        params: { brandId: brand.id },
      });
      return;
    }
    navigation.navigate('CategoryBrandProducts', {
      categoryId,
      brandId: brand.brandId,
      brandName: brand.name,
      categoryName,
    });
  }, [navigation, categoryId, categoryName]);

  const renderBrand: ListRenderItem<CatalogBrandFilter> = useCallback(
    ({ item }) => {
      const brandCard: BrandCardModel = {
        id: item.id ?? item.brandId,
        name: item.name,
        description: '',
        followers: '',
        logo: toImageSource(item.image),
        isJoined: false,
      };

      return <BrandCard brand={brandCard} onPress={() => handleBrandPress(item)} />;
    },
    [handleBrandPress]
  );

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header title={categoryName || t('brandScreen.brands', 'Markalar')} leftAction="back" />

        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="#6366F1" />
          </Box>
        ) : brands.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" px="$6">
            <Text color={isDark ? '#999' : '#666'} fontSize="$sm" textAlign="center">
              {t('brandScreen.noBrands', 'Bu kategoriye ait marka bulunamadı')}
            </Text>
          </Box>
        ) : (
          <FlatList
            data={brands}
            keyExtractor={(item) => item.id ?? item.brandId}
            renderItem={renderBrand}
            numColumns={3}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
            contentContainerStyle={{ gap: 12, paddingVertical: 16, paddingBottom: 52 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </SafeAreaView>
  );
};

export default CategoryBrandsScreen;
