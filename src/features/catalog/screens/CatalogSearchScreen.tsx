import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, HStack, VStack, Input, InputField, Pressable } from '@gluestack-ui/themed';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useGlobalProductSearch, useCatalogProducts } from '../api/hooks';
import CategoryCard from '../components/CategoryCard';
import { ProductSkeleton } from '@/src/components/Skeletons';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import type { CatalogProduct, GlobalProductSearchGroupItem } from '../types';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';

type CatalogSearchRouteProp = RouteProp<RootStackParamList, 'CatalogSearch'>;
type CatalogSearchNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ProductWithMeta = CatalogProduct & { id: string; image: any };

const COLUMNS = 3;

export const CatalogSearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const route = useRoute<CatalogSearchRouteProp>();
  const navigation = useNavigation<CatalogSearchNavigationProp>();
  const { t } = useTranslation();
  const { setFlowContext } = useCreatePostFlowStore();

  const { contextLabel, categoryId, subCategoryId, productGroupId } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const backgroundColor = useMemo(() => isDark ? '#000000' : '#FFFFFF', [isDark]);
  const inputBg = useMemo(() => isDark ? '#2A2A2A' : '#F2F2F2', [isDark]);
  const inputBorder = useMemo(() => isDark ? '#333333' : '#E9E9E9', [isDark]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isProductGroupLevel = !!productGroupId;
  const hasQuery = debouncedQuery.length > 1;

  const {
    data: productGroupData,
    isFetching: isProductGroupFetching,
    fetchNextPage: fetchProductGroupNext,
    hasNextPage: hasProductGroupNext,
    isFetchingNextPage: isFetchingProductGroupNext,
  } = useCatalogProducts(
    isProductGroupLevel ? productGroupId : undefined,
    isProductGroupLevel && hasQuery ? debouncedQuery : undefined
  );

  const {
    data: globalData,
    isFetching: isGlobalFetching,
    fetchNextPage: fetchGlobalNext,
    hasNextPage: hasGlobalNext,
    isFetchingNextPage: isFetchingGlobalNext,
  } = useGlobalProductSearch(
    !isProductGroupLevel && hasQuery ? debouncedQuery : undefined
  );

  const filteredGroupItems = useMemo<GlobalProductSearchGroupItem[]>(() => {
    if (isProductGroupLevel || !globalData) return [];
    const allItems = globalData.pages.flatMap(page => page.items);
    if (subCategoryId) return allItems.filter(item => item.subCategoryId === subCategoryId);
    if (categoryId) return allItems.filter(item => item.categoryId === categoryId);
    return allItems;
  }, [globalData, isProductGroupLevel, subCategoryId, categoryId]);

  const flatProducts = useMemo<ProductWithMeta[]>(() => {
    if (!isProductGroupLevel || !productGroupData) return [];
    return productGroupData.pages
      .flatMap(page => page.items)
      .map(p => ({ ...p, id: p.productId, image: p.image ?? null }));
  }, [productGroupData, isProductGroupLevel]);

  const isLoading = isProductGroupLevel ? (isProductGroupFetching && !productGroupData) : (isGlobalFetching && !globalData);
  const hasResults = isProductGroupLevel ? flatProducts.length > 0 : filteredGroupItems.length > 0;
  const isFetchingMore = isProductGroupLevel ? isFetchingProductGroupNext : isFetchingGlobalNext;

  const handleLoadMore = useCallback(() => {
    if (isProductGroupLevel && hasProductGroupNext && !isFetchingProductGroupNext) {
      fetchProductGroupNext();
    } else if (!isProductGroupLevel && hasGlobalNext && !isFetchingGlobalNext) {
      fetchGlobalNext();
    }
  }, [
    isProductGroupLevel,
    hasProductGroupNext, isFetchingProductGroupNext, fetchProductGroupNext,
    hasGlobalNext, isFetchingGlobalNext, fetchGlobalNext,
  ]);

  const handleProductPress = useCallback((product: ProductWithMeta, groupInfo?: GlobalProductSearchGroupItem) => {
    const pgId = groupInfo?.productGroupId ?? productGroupId ?? product.productGroupId;
    const subCatId = groupInfo?.subCategoryId ?? subCategoryId ?? product.subCategoryId;

    setFlowContext(ProductInfoType.PRODUCT, product.productId, {
      image: product.image,
      title: product.name,
      subName: product.name,
    });

    navigationService.navigate(ROOT_ROUTES.POST as any, {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        productId: product.productId,
        productName: product.name,
        productImage: product.image,
        productGroupId: pgId,
        subCategoryId: subCatId,
      },
    });
  }, [setFlowContext, productGroupId, subCategoryId]);

  const renderProductGrid = useCallback((
    products: ProductWithMeta[],
    groupInfo?: GlobalProductSearchGroupItem
  ): JSX.Element[] => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < products.length; i += COLUMNS) {
      const rowItems = products.slice(i, i + COLUMNS);
      rows.push(
        <HStack key={`row-${i}`} space="md" mb="$2">
          {rowItems.map(p => (
            <CategoryCard
              key={p.id}
              category={{ id: p.id, name: p.name, icon: 'shopping-bag', image: p.image, subCategories: [] } as any}
              onPress={() => handleProductPress(p, groupInfo)}
              priority={i < 6 ? 'high' : 'low'}
            />
          ))}
          {rowItems.length < COLUMNS && Array.from({ length: COLUMNS - rowItems.length }).map((_, idx) => (
            <Box key={`spacer-${idx}`} flex={1} />
          ))}
        </HStack>
      );
    }
    return rows;
  }, [handleProductPress]);

  const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 400;
    if (isNearBottom) handleLoadMore();
  }, [handleLoadMore]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor }}>
      <Box flex={1}>
        <HStack alignItems="center" px="$4" pt="$3" pb="$3" space="sm">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </Pressable>

          <HStack
            flex={1}
            alignItems="center"
            bg={inputBg}
            borderWidth={1}
            borderColor={inputBorder}
            borderRadius={20}
            px={14}
            space="sm"
          >
            <Search size={20} color="rgba(60, 60, 67, 0.6)" />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder={t('catalogSearch.searchPlaceholder', { context: contextLabel })}
                placeholderTextColor="#B9B9B9"
                color={isDark ? '#FFFFFF' : '#1A1A1A'}
                fontSize="$xs"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </Input>
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="rgba(60, 60, 67, 0.6)" />
              </Pressable>
            )}
          </HStack>
        </HStack>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={250}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {!hasQuery ? (
            <Box alignItems="center" pt="$16">
              <Search size={44} color={isDark ? '#444444' : '#CCCCCC'} />
              <Text
                mt="$4"
                color={isDark ? '#888888' : '#AAAAAA'}
                fontSize="$sm"
                textAlign="center"
                px="$6"
              >
                {t('catalogSearch.searchHint', { context: contextLabel })}
              </Text>
            </Box>
          ) : isLoading ? (
            <ProductSkeleton count={9} />
          ) : hasResults ? (
            <>
              {isProductGroupLevel ? (
                renderProductGrid(flatProducts)
              ) : (
                filteredGroupItems.map(groupItem => (
                  <VStack key={groupItem.productGroupId} mb="$5">
                    <Text
                      mb="$2"
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={isDark ? '#AAAAAA' : '#666666'}
                      textTransform="uppercase"
                      letterSpacing={0.5}
                    >
                      {groupItem.productGroupName}
                    </Text>
                    {renderProductGrid(
                      groupItem.products.map(p => ({ ...p, id: p.productId, image: p.image ?? null })),
                      groupItem
                    )}
                  </VStack>
                ))
              )}
              {isFetchingMore && (
                <Box py="$4" alignItems="center">
                  <ActivityIndicator color={isDark ? '#FFFFFF' : '#555555'} />
                </Box>
              )}
            </>
          ) : (
            <Box alignItems="center" pt="$16">
              <Text color={isDark ? '#888888' : '#AAAAAA'} fontSize="$sm" textAlign="center">
                {t('catalogSearch.noResults', { query: debouncedQuery })}
              </Text>
            </Box>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};
