import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

export const ProductCatalogWrapper = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation('catalog');

  // Drill-down navigation: her tıklamada Root'ta yeni ekran açılır (Explore catalog tab ile aynı yaklaşım)
  const handleCategoryNavigate = useCallback((category: { id: string; name: string; image?: string }) => {
    navigation.navigate('CatalogCategory', {
      categoryId: category.id,
      categoryName: category.name,
      categoryImage: category.image,
    });
  }, [navigation]);

  const handleSubCategoryNavigate = useCallback((subCategory: { id: string; name: string; image?: string; categoryId?: string }) => {
    navigation.navigate('CatalogSubCategory', {
      categoryId: subCategory.categoryId ?? '',
      categoryName: '',
      subCategoryId: subCategory.id,
      subCategoryName: subCategory.name,
      subCategoryImage: subCategory.image,
    });
  }, [navigation]);

  const handleProductGroupNavigate = useCallback((productGroup: { id: string; name: string; image?: string; subCategoryId?: string }) => {
    navigation.navigate('CatalogProductGroup', {
      categoryId: '',
      categoryName: '',
      subCategoryId: productGroup.subCategoryId ?? '',
      subCategoryName: '',
      productGroupId: productGroup.id,
      productGroupName: productGroup.name,
      productGroupImage: productGroup.image,
    });
  }, [navigation]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title={t('productCatalog.categories')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <ProductCatalogScreen
          scrollViewPaddingBottom={20}
          onCategoryNavigate={handleCategoryNavigate}
          onSubCategoryNavigate={handleSubCategoryNavigate}
          onProductGroupNavigate={handleProductGroupNavigate}
        />
      </VStack>
    </SafeAreaView>
  );
};
