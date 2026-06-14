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

type SubCategoryDetailRouteProp = RouteProp<RootStackParamList, 'CatalogSubCategory'>;
type SubCategoryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SubCategoryDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<SubCategoryDetailRouteProp>();
  const navigation = useNavigation<SubCategoryDetailNavigationProp>();
  const { categoryId, categoryName, subCategoryId, subCategoryName, subCategoryImage } = route.params;

  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FAFAFA', [isDark]);

  const handleProductGroupNavigate = useCallback((productGroup: { id: string; name: string; image?: string }) => {
    navigation.navigate('CatalogProductGroup', {
      categoryId,
      categoryName,
      subCategoryId,
      subCategoryName,
      productGroupId: productGroup.id,
      productGroupName: productGroup.name,
      productGroupImage: productGroup.image,
    });
  }, [navigation, categoryId, categoryName, subCategoryId, subCategoryName]);

  // Alt kategori (ve tüm alt kategorilerine) ait marka filtresi
  const { data: brandFilters, isLoading: isBrandFiltersLoading } = useCatalogBrandFilters(subCategoryId);

  const handleBrandPress = useCallback((brand: CatalogBrandFilter) => {
    navigation.navigate('CategoryBrandProducts', {
      categoryId: subCategoryId,
      brandId: brand.brandId,
      brandName: brand.name,
      categoryName: subCategoryName,
    });
  }, [navigation, subCategoryId, subCategoryName]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={subCategoryName}
          leftAction="back"
        />
        <BrandFilterScroll
          brands={brandFilters?.items ?? []}
          onBrandPress={handleBrandPress}
          isLoading={isBrandFiltersLoading}
        />
        <ProductCatalogScreen
          initialView="productgroups"
          initialSelectedCategoryId={categoryId}
          initialSelectedSubCategoryId={subCategoryId}
          onProductGroupNavigate={handleProductGroupNavigate}
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
              data: { id: subCategoryId, name: subCategoryName, image: subCategoryImage },
            },
          ]}
          scrollViewPaddingBottom={52}
        />
      </Box>
    </SafeAreaView>
  );
};
