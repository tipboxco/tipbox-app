import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@gluestack-ui/themed';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

type ProductGroupDetailRouteProp = RouteProp<RootStackParamList, 'CatalogProductGroup'>;

export const ProductGroupDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<ProductGroupDetailRouteProp>();
  const {
    categoryId, categoryName,
    subCategoryId, subCategoryName,
    productGroupId, productGroupName, productGroupImage,
  } = route.params;

  const backgroundColor = useMemo(() => isDark ? '#000000' : '#FFFFFF', [isDark]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={productGroupName}
          leftAction="back"
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
