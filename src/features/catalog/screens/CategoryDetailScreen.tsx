import React, { useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@gluestack-ui/themed';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import BrandFilterScroll from '../components/BrandFilterScroll';
import { useCatalogBrandFilters } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { CatalogBrandFilter } from '../types';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

// Yatay marka çubuğunda gösterilecek popüler marka sayısı (geri kalanı "Tümünü gör" sayfasında)
const POPULAR_BRANDS_LIMIT = 15;

type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CatalogCategory'>;
type CategoryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CategoryDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<CategoryDetailRouteProp>();
  const navigation = useNavigation<CategoryDetailNavigationProp>();
  const { categoryId, categoryName, categoryImage } = route.params;

  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FAFAFA', [isDark]);

  // O kategoriye (ve alt kategorilerine) ait markalar — popülerliğe göre sıralı gelir
  const { data: brandFiltersData, isLoading: isBrandsLoading } = useCatalogBrandFilters(categoryId);
  const allBrands = useMemo<CatalogBrandFilter[]>(() => brandFiltersData?.items ?? [], [brandFiltersData]);
  const popularBrands = useMemo<CatalogBrandFilter[]>(
    () => allBrands.slice(0, POPULAR_BRANDS_LIMIT),
    [allBrands]
  );
  // "Tümünü gör" yalnızca gösterilmeyen marka varsa anlamlı
  const hasMoreBrands = allBrands.length > POPULAR_BRANDS_LIMIT;

  // Markaya tıklanınca markanın kendi detay sayfasına git.
  // Fallback: yeni Brand UUID (id) alanı deploy edilmemişse, mevcut CategoryBrandProducts
  // akışına (brandId === externalId) düş — böylece marka tıklaması yine de çalışır.
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

  // "Tümünü gör" — o kategorinin tüm markalarını listeleyen sayfaya git
  const handleSeeAllBrands = useCallback(() => {
    navigation.navigate('CatalogCategoryBrands', { categoryId, categoryName });
  }, [navigation, categoryId, categoryName]);

  const handleSubCategoryNavigate = useCallback((subCategory: { id: string; name: string; image?: string }) => {
    navigation.navigate('CatalogSubCategory', {
      categoryId,
      categoryName,
      subCategoryId: subCategory.id,
      subCategoryName: subCategory.name,
      subCategoryImage: subCategory.image,
    });
  }, [navigation, categoryId, categoryName]);

  const handleProductGroupNavigate = useCallback((productGroup: { id: string; name: string; image?: string; subCategoryId?: string }) => {
    navigation.navigate('CatalogProductGroup', {
      categoryId,
      categoryName,
      subCategoryId: productGroup.subCategoryId ?? '',
      subCategoryName: '',
      productGroupId: productGroup.id,
      productGroupName: productGroup.name,
      productGroupImage: productGroup.image,
    });
  }, [navigation, categoryId, categoryName]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={categoryName}
          leftAction="back"
        />
        <BrandFilterScroll
          brands={popularBrands}
          onBrandPress={handleBrandPress}
          onSeeAllPress={hasMoreBrands ? handleSeeAllBrands : undefined}
          isLoading={isBrandsLoading}
        />
        <ProductCatalogScreen
          initialView="subcategories"
          initialSelectedCategoryId={categoryId}
          onSubCategoryNavigate={handleSubCategoryNavigate}
          onProductGroupNavigate={handleProductGroupNavigate}
          hideBreadcrumb
          initialBreadcrumbItems={[
            {
              id: categoryId,
              name: categoryName,
              type: 'category',
              data: { id: categoryId, name: categoryName, image: categoryImage },
            },
          ]}
          scrollViewPaddingBottom={52}
        />
      </Box>
    </SafeAreaView>
  );
};
