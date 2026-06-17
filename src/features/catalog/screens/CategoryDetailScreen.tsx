import React, { useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@gluestack-ui/themed';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CatalogCategory'>;
type CategoryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CategoryDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<CategoryDetailRouteProp>();
  const navigation = useNavigation<CategoryDetailNavigationProp>();
  const { categoryId, categoryName, categoryImage } = route.params;

  const backgroundColor = useMemo(() => isDark ? '#1A1A1A' : '#FAFAFA', [isDark]);

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
