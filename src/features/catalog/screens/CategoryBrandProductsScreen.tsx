import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, Text, Pressable, Spinner } from '@gluestack-ui/themed';
import { useRoute, RouteProp } from '@react-navigation/native';
import { CachedImage } from '@/src/components/CachedImage';
import { Header } from '@/src/components/Header';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCatalogProductsByCategory } from '../api/hooks';
import type { CatalogProduct } from '../types';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

type CategoryBrandProductsRouteProp = RouteProp<RootStackParamList, 'CategoryBrandProducts'>;

/**
 * Bir markaya göre, seçili kategori ve tüm alt kategorilerindeki ürünleri listeler.
 * Listeleme sayfasındaki yatay marka filtresinden (BrandFilterScroll) markaya
 * tıklanınca bu ekrana yönlendirilir.
 */
export const CategoryBrandProductsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const { t } = useTranslation('catalog');
  const route = useRoute<CategoryBrandProductsRouteProp>();
  const { categoryId, brandId, brandName, categoryName } = route.params;

  const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);

  const backgroundColor = useMemo(() => (isDark ? '#1A1A1A' : '#FAFAFA'), [isDark]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCatalogProductsByCategory(categoryId, brandId);

  const products = useMemo<CatalogProduct[]>(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleProductPress = useCallback(
    (product: CatalogProduct) => {
      setFlowContext(ProductInfoType.PRODUCT, product.productId, {
        image: product.image,
        title: product.name,
        subName: product.name,
      });

      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'PostsScreen',
        params: {
          stage: 'Product',
          name: product.name,
          productInfo: {
            image: product.image,
            title: product.name,
            subName: product.name,
          },
          selectedProduct: {
            id: product.productId,
            name: product.name,
            description: '',
            image: product.image,
            productGroupId: product.productGroupId,
          },
          contextType: ProductInfoType.PRODUCT,
        },
      });
    },
    [setFlowContext]
  );

  const renderProduct: ListRenderItem<CatalogProduct> = useCallback(
    ({ item }) => {
      const productImage =
        item.image && item.image.trim() !== '' ? item.image : undefined;

      return (
        <Pressable
          flex={1}
          onPress={() => handleProductPress(item)}
          style={({ pressed }: { pressed: boolean }) => ({
            transform: [{ scale: pressed ? 0.95 : 1 }],
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <VStack
            height={132}
            borderRadius={5}
            bg={isDark ? '#2A2A2A' : '#FDFDFD'}
            borderWidth={1}
            borderColor={isDark ? '#404040' : '#E9E9E9'}
            justifyContent="center"
            alignItems="center"
            space="sm"
            px="$1"
          >
            <Box width={86} height={86} justifyContent="center" alignItems="center">
              {productImage ? (
                <CachedImage
                  source={productImage}
                  style={{ width: '100%', height: '100%' }}
                  alt={item.name}
                  resizeMode="contain"
                  cachePolicy="memory-disk"
                  recyclingKey={`product-${item.productId}`}
                />
              ) : null}
            </Box>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$2xs"
              fontWeight="$bold"
              numberOfLines={2}
              textAlign="center"
            >
              {item.name}
            </Text>
          </VStack>
        </Pressable>
      );
    },
    [isDark, handleProductPress]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header title={brandName || categoryName || ''} leftAction="back" />

        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="#6366F1" />
          </Box>
        ) : products.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" px="$6">
            <Text color={isDark ? '#999' : '#666'} fontSize="$sm" textAlign="center">
              {t('productCatalog.noProducts', 'Bu markaya ait ürün bulunamadı')}
            </Text>
          </Box>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.productId}
            renderItem={renderProduct}
            numColumns={3}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
            contentContainerStyle={{ gap: 12, paddingVertical: 16, paddingBottom: 52 }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isFetchingNextPage ? (
                <Box py="$4" alignItems="center">
                  <Spinner color="#6366F1" />
                </Box>
              ) : null
            }
          />
        )}
      </Box>
    </SafeAreaView>
  );
};

export default CategoryBrandProductsScreen;
