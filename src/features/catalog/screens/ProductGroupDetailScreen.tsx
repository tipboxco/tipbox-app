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
import type { CatalogBrandFilter } from '../types';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

type ProductGroupDetailRouteProp = RouteProp<RootStackParamList, 'CatalogProductGroup'>;
type ProductGroupDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProductGroupDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<ProductGroupDetailRouteProp>();
  const navigation = useNavigation<ProductGroupDetailNavigationProp>();
  const {
    categoryId, categoryName,
    subCategoryId, subCategoryName,
    productGroupId, productGroupName, productGroupImage,
  } = route.params;

  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FAFAFA', [isDark]);

  // Ürün grubu (ve tüm alt kategorilerine) ait marka filtresi
  const { data: brandFilters, isLoading: isBrandFiltersLoading } = useCatalogBrandFilters(productGroupId);

  const handleBrandPress = useCallback((brand: CatalogBrandFilter) => {
    navigation.navigate('CategoryBrandProducts', {
      categoryId: productGroupId,
      brandId: brand.brandId,
      brandName: brand.name,
      categoryName: productGroupName,
    });
  }, [navigation, productGroupId, productGroupName]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={productGroupName}
          leftAction="back"
        />
        <BrandFilterScroll
          brands={brandFilters?.items ?? []}
          onBrandPress={handleBrandPress}
          isLoading={isBrandFiltersLoading}
        />
        <ProductCatalogScreen
          initialView="products"
          initialSelectedCategoryId={categoryId}
          initialSelectedSubCategoryId={subCategoryId}
          initialSelectedProductGroupId={productGroupId}
          hideBreadcrumb
          initialBreadcrumbItems={[
            {
              id: categoryId,
              name: categoryName,
              type: 'category',
              data: { id: categoryId, name: categoryName },
            },
            {
              id: subCategoryId,
              name: subCategoryName,
              type: 'subCategory',
              data: { id: subCategoryId, name: subCategoryName },
            },
            {
              id: productGroupId,
              name: productGroupName,
              type: 'productGroup',
              data: { id: productGroupId, name: productGroupName, image: productGroupImage },
            },
          ]}
          scrollViewPaddingBottom={52}
        />
      </Box>
    </SafeAreaView>
  );
};
