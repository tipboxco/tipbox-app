import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import Animated from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, HStack, VStack, Input, InputField, Pressable } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useSearch, useSearchInfinite } from '@/src/features/search/api/hooks';
import { UserItem, BrandItem, ProductItem } from '@/src/features/search/components/SearchResultItems';
import type { SearchProduct } from '@/src/features/search/api/searchApi';
import { toImageSource } from '@/src/utils';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import type { RootStackParamList } from '@/src/navigation/navigation.types';

type SearchFilter = 'users' | 'brands' | 'products';
type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const TABS: Array<{ key: SearchFilter; labelKey: string }> = [
  { key: 'users', labelKey: 'searchModal.tabs.users' },
  { key: 'brands', labelKey: 'searchModal.tabs.brands' },
  { key: 'products', labelKey: 'searchModal.tabs.products' },
];

/**
 * SearchScreen - Tam sayfa arama ekranı
 * Kullanıcı, marka ve ürün araması yapar (eski SearchModal yerine geçer)
 * Sekme yapısı feed akışındaki PagerView tab yapısı ile aynıdır.
 */
export const SearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { t } = useTranslation('common');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const pagerRef = useRef<PagerView>(null);

  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';

  const hasQuery = debouncedQuery.length > 0;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Default data (input boşken) - tüm tipler tek istekte
  const { data: allDefaultData, isLoading: isAllDefaultLoading } = useSearch(
    { keyword: '', types: ['user', 'brand', 'product'], limit: 4 },
    !hasQuery
  );

  // Arama sonuçları (input doluyken) - cursor pagination
  const {
    data: searchInfiniteData,
    isLoading: isSearching,
    error: searchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchInfinite(
    { keyword: debouncedQuery, types: ['user', 'brand', 'product'], limit: 10 },
    hasQuery
  );

  const searchData = useMemo(() => {
    if (!searchInfiniteData?.pages) return null;
    return {
      userData: searchInfiniteData.pages.flatMap((p) => p.userData ?? []),
      brandData: searchInfiniteData.pages.flatMap((p) => p.brandData ?? []),
      productData: searchInfiniteData.pages.flatMap((p) => p.productData ?? []),
    };
  }, [searchInfiniteData]);

  const handleLoadMore = useCallback(() => {
    if (hasQuery && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasQuery, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
      if (isNearBottom) handleLoadMore();
    },
    [handleLoadMore]
  );

  // Tab geçişleri - feed akışı ile aynı (PagerView + tab bar)
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }, []);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  // Navigation handlers
  const handleUserPress = useCallback(
    (userId: string) => {
      if (!userId) return;
      navigation.navigate('Profile', { screen: 'ProfileMain', params: { userId } } as any);
    },
    [navigation]
  );

  const handleBrandPress = useCallback((brandId: string) => {
    if (!brandId) return;
    navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandPostListScreen' as any, { brandId });
  }, []);

  const handleProductPress = useCallback((product: SearchProduct) => {
    if (!product?.id) return;
    const productImage = toImageSource(product.image) || require('@/assets/inventory/product_01.png');
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostsScreen',
      params: {
        stage: 'Product',
        name: product.name || '',
        productInfo: {
          image: productImage,
          title: product.name || '',
          subName: product.model || product.specs || '',
        },
        selectedProduct: {
          id: product.id,
          name: product.name || '',
          description: product.model || product.specs || '',
          image: productImage,
        },
        contextType: ProductInfoType.PRODUCT,
        contextId: product.id,
      },
    });
  }, []);

  const isLoading = hasQuery ? isSearching : isAllDefaultLoading;
  const source = hasQuery ? searchData : allDefaultData;

  // Tek bir sekmenin içeriğini render eder (loading/error/empty/list)
  const renderTabContent = useCallback(
    (tab: SearchFilter) => {
      if (isLoading && !source) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" py="$20">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text mt="$4" fontSize="$xs" color="#8E8E93" textAlign="center">
              {hasQuery ? t('searchModal.searching') : t('searchModal.loading')}
            </Text>
          </Box>
        );
      }

      if (hasQuery && searchError) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" px="$4" py="$20">
            <Text fontSize="$xs" color="#CE4A4A" textAlign="center" fontWeight="$semibold">
              {t('searchModal.errorOccurred')}
            </Text>
            <Text mt="$2" fontSize="$sm" color="#8E8E93" textAlign="center">
              {t('searchModal.pleaseRetry')}
            </Text>
          </Box>
        );
      }

      let items: React.ReactNode = null;
      if (tab === 'users') {
        const data = source?.userData ?? [];
        items = data.length
          ? data.map((user) => <UserItem key={user.id} user={user} isDark={isDark} onPress={handleUserPress} />)
          : null;
      } else if (tab === 'brands') {
        const data = source?.brandData ?? [];
        items = data.length
          ? data.map((brand) => <BrandItem key={brand.id} brand={brand} isDark={isDark} onPress={handleBrandPress} />)
          : null;
      } else {
        const data = source?.productData ?? [];
        items = data.length
          ? data.map((product) => (
              <ProductItem key={product.id} product={product} isDark={isDark} onPress={handleProductPress} />
            ))
          : null;
      }

      if (!items) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" py="$20">
            <Search size={56} color={isDark ? '#48484A' : '#D1D1D6'} />
            <Text mt="$4" fontSize="$sm" color="#8E8E93" textAlign="center" fontWeight="$medium">
              {t('searchModal.noResults')}
            </Text>
            {hasQuery && (
              <Text mt="$2" fontSize="$xs" color="#8E8E93" textAlign="center">
                {t('searchModal.noSearchResults', { query: debouncedQuery })}
              </Text>
            )}
          </Box>
        );
      }

      return (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <VStack space="xs" pt="$2" pb="$2">
            {items}
            {hasQuery && isFetchingNextPage && (
              <Box py="$3" alignItems="center">
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
            )}
          </VStack>
        </ScrollView>
      );
    },
    [
      isLoading,
      source,
      isDark,
      hasQuery,
      searchError,
      debouncedQuery,
      isFetchingNextPage,
      handleScroll,
      handleUserPress,
      handleBrandPress,
      handleProductPress,
      t,
    ]
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor }}>
      <Box flex={1}>
        {/* Header: geri butonu + arama input */}
        <HStack alignItems="center" px="$4" pt="$3" pb="$3" space="sm">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </Pressable>

          <HStack flex={1} alignItems="center" bg={inputBg} borderRadius={12} px={14} space="sm" h={48}>
            <Search size={20} color="#8E8E93" />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder={t('searchModal.placeholder')}
                placeholderTextColor="#8E8E93"
                color={isDark ? '#FFFFFF' : '#000000'}
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
                <X size={18} color="#8E8E93" />
              </Pressable>
            )}
          </HStack>
        </HStack>

        {/* Sekme barı - feed akışındaki tab bar ile aynı */}
        <HStack borderBottomWidth={1} borderColor={isDark ? '#333333' : '#E9E9E9'}>
          {TABS.map((tab, index) => {
            const isActive = currentPage === index;
            return (
              <Pressable key={tab.key} flex={1} onPress={() => handleTabPress(index)} alignItems="center" py="$2">
                <Text
                  fontSize="$sm"
                  fontWeight="$bold"
                  color={isActive ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C'}
                >
                  {t(tab.labelKey)}
                </Text>
                {isActive && (
                  <Box position="absolute" bottom={0} width="60%" h={2} bg={isDark ? '#FFFFFF' : '#000000'} />
                )}
              </Pressable>
            );
          })}
        </HStack>

        {/* PagerView - feed akışı ile aynı swipe edilebilir sekme yapısı */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {TABS.map((tab) => (
            <View key={tab.key} style={{ flex: 1 }}>
              {renderTabContent(tab.key)}
            </View>
          ))}
        </AnimatedPagerView>
      </Box>
    </SafeAreaView>
  );
};

SearchScreen.displayName = 'SearchScreen';

export default SearchScreen;
