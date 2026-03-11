import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Input, InputField, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Search } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PostStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { useCatalogProducts } from '@/src/features/catalog/api/hooks';
import type { CatalogProduct } from '@/src/features/catalog/types';
import { ProductSkeleton } from '@/src/components/Skeletons';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useTranslation } from '@/src/hooks/useTranslation';

type SelectCompareProductScreenRouteProp = RouteProp<PostStackParamList, 'SelectCompareProductScreen'>;
type SelectCompareProductScreenNavigationProp = NativeStackNavigationProp<PostStackParamList, 'SelectCompareProductScreen'>;

export const SelectCompareProductScreen: React.FC = () => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SelectCompareProductScreenNavigationProp>();
  const route = useRoute<SelectCompareProductScreenRouteProp>();

  const { productGroupId, initialProduct, selectedProductField } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  console.log('🎯 [SelectCompareProductScreen] Mounted with:', {
    productGroupId,
    hasProductGroupId: !!productGroupId,
    selectedProductField,
    initialProduct: initialProduct?.id,
  });

  console.log('🔍 [SelectCompareProductScreen] Fetching products:', {
    productGroupId,
    hasProductGroupId: !!productGroupId,
    debouncedSearchQuery,
  });

  // ONLY fetch products if productGroupId exists
  // Benchmark requires comparing products from the SAME product group
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCatalogProducts(
    productGroupId,
    debouncedSearchQuery || undefined
  );

  // Format products
  const products = useMemo(() => {
    if (!data?.pages) return [];
    const allProducts = data.pages.flatMap((page) => page.items || []);
    return allProducts.map((product: CatalogProduct) => ({
      id: product.productId,
      name: product.name,
      image: product.image || undefined,
      productGroupId: product.productGroupId,
      subCategoryId: product.subCategoryId,
      description: product.description || '',
    }));
  }, [data]);

  console.log('📦 [SelectCompareProductScreen] Products:', {
    totalProducts: products.length,
    productGroupId,
    searchQuery: debouncedSearchQuery,
    isLoading,
    hasData: !!data,
    pagesCount: data?.pages?.length || 0,
  });

  // Handle product selection
  const handleProductPress = useCallback((product: typeof products[0]) => {
    console.log('✅ [SelectCompareProductScreen] Product selected:', {
      id: product.id,
      name: product.name,
      productGroupId: product.productGroupId,
    });

    // Parse product name to extract brand
    const nameParts = product.name.split(' ');
    const brand = nameParts.length > 1 ? nameParts[0] : undefined;
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;

    // Navigate back to CreateBenchmarkPostScreen
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateBenchmarkPostScreen',
      params: {
        product: initialProduct,
        selectedProduct: {
          id: product.id,
          name: productName,
          brand,
          description: product.description || '',
          image: product.image,
          productGroupId: product.productGroupId,
        },
        selectedProductField: selectedProductField || 'selectedProduct2',
      },
    });
  }, [initialProduct, selectedProductField]);

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render product item
  const renderProductItem = useCallback(({ item }: { item: typeof products[0] }) => {
    return (
      <Pressable
        onPress={() => handleProductPress(item)}
        style={styles.productItem}
      >
        <HStack space="md" alignItems="center" p="$3">
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              alt={item.name}
              width={60}
              height={60}
              borderRadius={8}
            />
          ) : (
            <Box
              width={60}
              height={60}
              borderRadius={8}
              bg={isDark ? '#2A2A2A' : '#F5F5F5'}
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize={12} color={isDark ? '#999' : '#666'}>
                No Image
              </Text>
            </Box>
          )}
          <VStack flex={1}>
            <Text
              fontSize={14}
              fontWeight="600"
              color={isDark ? '#FFF' : '#000'}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.description ? (
              <Text
                fontSize={12}
                color={isDark ? '#999' : '#666'}
                numberOfLines={1}
                mt={4}
              >
                {item.description}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </Pressable>
    );
  }, [isDark, handleProductPress]);

  // Empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    // If no productGroupId, show error message
    if (!productGroupId) {
      return (
        <Box py="$20" px="$4" alignItems="center" justifyContent="center">
          <Text color={isDark ? '#FF6B6B' : '#FF0000'} fontSize="$sm" textAlign="center" fontWeight="$semibold">
            Product group information missing
          </Text>
          <Text color={isDark ? '#999' : '#666'} fontSize="$xs" textAlign="center" mt="$2">
            Cannot filter products for comparison. Please contact support.
          </Text>
        </Box>
      );
    }

    return (
      <Box py="$20" alignItems="center" justifyContent="center">
        <Text color={isDark ? '#999' : '#666'} fontSize="$sm">
          {searchQuery ? t('create.benchmark.noProductsFound') : t('create.benchmark.noProductsInGroup')}
        </Text>
      </Box>
    );
  }, [isLoading, isDark, searchQuery, productGroupId, t]);

  // Footer loader
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py="$4" alignItems="center">
        <ActivityIndicator color={isDark ? '#D0F205' : '#8B5CF6'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  const backgroundColor = isDark ? '$backgroundDark950' : '#FFFFFF';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title={t('create.benchmark.selectCompareProduct')}
          leftAction="back"
        />

        {/* Search Bar */}
        <VStack space="md" pb="$4" px="$4" bg={backgroundColor}>
          <HStack
            alignItems="center"
            bg={isDark ? '#2A2A2A' : '#F2F2F2'}
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={20}
            px={14}
            space="sm"
          >
            <Search size={24} color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder={t('create.benchmark.searchPlaceholder')}
                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                color={isDark ? '#FFF' : '#000'}
                fontSize="$xs"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
        </VStack>

        {/* Products List */}
        {isLoading ? (
          <ProductSkeleton count={6} />
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
          />
        )}
      </Box>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  productItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
