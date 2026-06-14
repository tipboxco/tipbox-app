import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ScrollView, FlatList, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Input,
  InputField,
  Spinner,
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Search, ChevronRight } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import {
  useSubCategorySearch,
  useProductGroupSearch,
  useGlobalProductSearch,
  usePopularSubCategories,
  usePopularProductGroups,
} from '@/src/features/catalog/api/hooks';
import { ProductInfoType } from '@/src/types/common';
import type { CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '@/src/features/catalog/types';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { PostStackParamList } from '../navigation';

type CategorySearchNavigationProp = NativeStackNavigationProp<PostStackParamList>;

type SearchTabKey = 'subcategories' | 'productGroups' | 'products';

/** Uniform row shape so every tab can share one renderer */
type RowItem = { id: string; name: string; onPress: () => void };

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Renders text with every case-insensitive occurrence of `query` rendered in bold.
 * Designed to be used as a child of a parent <Text>.
 */
const HighlightedText: React.FC<{ text: string; query: string; color: string }> = ({ text, query, color }) => {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'));
  const lowerQuery = trimmed.toLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerQuery ? (
          <Text key={`${part}-${index}`} fontWeight="$bold" color={color}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </>
  );
};

export const CategorySearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const navigation = useNavigation<CategorySearchNavigationProp>();
  const { t } = useTranslation('post');
  const { setFlowContext } = useCreatePostFlowStore();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: subCatSearchData, isLoading: subCatSearchLoading } = useSubCategorySearch(debouncedQuery);
  const { data: pgSearchData, isLoading: pgSearchLoading } = useProductGroupSearch(debouncedQuery);
  const { data: productSearchData, isLoading: productSearchLoading } = useGlobalProductSearch(debouncedQuery);
  const { data: popularSubCats, isLoading: popularSubCatsLoading } = usePopularSubCategories(10);
  const { data: popularPGs, isLoading: popularPGsLoading } = usePopularProductGroups(10);

  const isSearching = !!debouncedQuery && debouncedQuery.trim().length > 0;
  const isSearchLoading = subCatSearchLoading || pgSearchLoading || productSearchLoading;

  // Per-type result lists — one tab each
  const subCatResults = useMemo<CatalogSubCategory[]>(() => {
    if (!isSearching) return [];
    return (subCatSearchData?.pages ?? []).flatMap((p) => p.items);
  }, [isSearching, subCatSearchData]);

  const pgResults = useMemo<CatalogProductGroup[]>(() => {
    if (!isSearching) return [];
    return (pgSearchData?.pages ?? []).flatMap((p) => p.items);
  }, [isSearching, pgSearchData]);

  const productResults = useMemo<CatalogProduct[]>(() => {
    if (!isSearching) return [];
    // Global product search groups results by product group; flatten to individual products.
    return (productSearchData?.pages ?? []).flatMap((p) => p.items).flatMap((group) => group.products);
  }, [isSearching, productSearchData]);

  const handleSelectSubCategory = useCallback(
    (item: CatalogSubCategory) => {
      setFlowContext(ProductInfoType.SUB_CATEGORY, item.subCategoryId, {
        title: item.name,
        image: item.image,
      });
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreatePostScreen',
        params: {
          contextType: ProductInfoType.SUB_CATEGORY,
          contextId: item.subCategoryId,
        },
      });
    },
    [setFlowContext]
  );

  const handleSelectProductGroup = useCallback(
    (item: CatalogProductGroup) => {
      setFlowContext(ProductInfoType.PRODUCT_GROUP, item.productGroupId, {
        title: item.name,
        image: item.image,
      });
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreatePostScreen',
        params: {
          contextType: ProductInfoType.PRODUCT_GROUP,
          contextId: item.productGroupId,
        },
      });
    },
    [setFlowContext]
  );

  const handleSelectProduct = useCallback(
    (item: CatalogProduct) => {
      setFlowContext(ProductInfoType.PRODUCT, item.productId, {
        title: item.name,
        image: item.image,
      });
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreatePostScreen',
        params: {
          contextType: ProductInfoType.PRODUCT,
          contextId: item.productId,
        },
      });
    },
    [setFlowContext]
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const page = e.nativeEvent.position;
    setCurrentPage(page);
    tabScrollRef.current?.scrollTo({ x: Math.max(0, page - 1) * 120, animated: true });
  }, []);

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
    tabScrollRef.current?.scrollTo({ x: Math.max(0, index - 1) * 120, animated: true });
  }, []);

  // Theme colors — kept as explicit values to stay consistent with sibling catalog screens
  const bgColor = isDark ? '#1A1A1A' : '#FAFAFA';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#2A2A2A' : '#F2F2F2';
  const inputBorder = isDark ? '#333333' : '#E9E9E9';
  const chipBg = isDark ? '#222222' : '#FFFFFF';
  const chipBorder = isDark ? '#374151' : '#E5E7EB';
  const sectionLabelColor = isDark ? '#D1D5DB' : '#374151';
  const resultItemBg = isDark ? '#222222' : '#FFFFFF';
  const resultItemBorder = isDark ? '#333333' : '#EFEFEF';
  const tabInactiveColor = isDark ? '#8C8C8C' : '#8C8C8C';
  const accentColor = isDark ? '#818CF8' : '#6366F1';

  // Rows per tab, mapped to a uniform shape
  const subCatRows = useMemo<RowItem[]>(
    () =>
      subCatResults.map((i) => ({
        id: `sub-${i.subCategoryId}`,
        name: i.name,
        onPress: () => handleSelectSubCategory(i),
      })),
    [subCatResults, handleSelectSubCategory]
  );

  const pgRows = useMemo<RowItem[]>(
    () =>
      pgResults.map((i) => ({
        id: `pg-${i.productGroupId}`,
        name: i.name,
        onPress: () => handleSelectProductGroup(i),
      })),
    [pgResults, handleSelectProductGroup]
  );

  const productRows = useMemo<RowItem[]>(
    () =>
      productResults.map((i) => ({
        id: `prod-${i.productId}`,
        name: i.name,
        onPress: () => handleSelectProduct(i),
      })),
    [productResults, handleSelectProduct]
  );

  const tabPages: Array<{ key: SearchTabKey; label: string; rows: RowItem[] }> = [
    { key: 'subcategories', label: t('categorySearch.tabSubcategories'), rows: subCatRows },
    { key: 'productGroups', label: t('categorySearch.tabProductGroups'), rows: pgRows },
    { key: 'products', label: t('categorySearch.tabProducts'), rows: productRows },
  ];

  const renderRow = useCallback(
    ({ item }: { item: RowItem }) => (
      <Pressable onPress={item.onPress} mb="$2">
        <HStack
          alignItems="center"
          justifyContent="space-between"
          bg={resultItemBg}
          borderWidth={1}
          borderColor={resultItemBorder}
          borderRadius={12}
          px="$4"
          py="$3"
        >
          <Text flex={1} fontSize="$sm" fontWeight="$medium" color={textColor} numberOfLines={1}>
            <HighlightedText text={item.name} query={debouncedQuery} color={textColor} />
          </Text>
          <ChevronRight size={18} color={subTextColor} />
        </HStack>
      </Pressable>
    ),
    [resultItemBg, resultItemBorder, textColor, subTextColor, debouncedQuery]
  );

  const renderPageContent = useCallback(
    (rows: RowItem[]) => {
      if (isSearchLoading) {
        return (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Spinner color={accentColor} />
          </Box>
        );
      }
      if (rows.length === 0) {
        return (
          <Box flex={1} alignItems="center" justifyContent="center" px="$8">
            <Text fontSize="$sm" textAlign="center" color={subTextColor}>
              {t('categorySearch.noResultsInTab')}
            </Text>
          </Box>
        );
      }
      return (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      );
    },
    [isSearchLoading, accentColor, subTextColor, renderRow, t]
  );

  const popularSubCatItems = popularSubCats?.items ?? [];
  const popularPGItems = popularPGs?.items ?? [];

  const renderChips = (items: Array<{ id: string; name: string; onPress: () => void }>) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          bg={chipBg}
          borderWidth={1}
          borderColor={chipBorder}
          borderRadius={999}
          px="$4"
          py="$2"
        >
          <Text fontSize="$sm" fontWeight="$medium" color={textColor}>
            {item.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: bgColor }}>
      <Box flex={1}>
        {/* Header — title centered; close icon absolutely positioned so it never shifts the title */}
        <Box h={48} justifyContent="center" px="$4">
          <Text textAlign="center" fontSize="$md" fontWeight="$semibold" color={textColor}>
            {t('categorySearch.title')}
          </Text>
          <Pressable
            position="absolute"
            left={16}
            top={0}
            bottom={0}
            justifyContent="center"
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={textColor} />
          </Pressable>
        </Box>

        {/* Search Input */}
        <Box px="$4" pb="$3">
          <HStack
            alignItems="center"
            bg={inputBg}
            borderWidth={1}
            borderColor={inputBorder}
            borderRadius={12}
            px={12}
            space="sm"
          >
            <Search size={16} color={subTextColor} />
            <Input flex={1} borderWidth={0} bg="transparent" h={40}>
              <InputField
                placeholder={t('categorySearch.placeholder')}
                placeholderTextColor={subTextColor}
                color={textColor}
                fontSize="$sm"
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
                returnKeyType="search"
              />
            </Input>
          </HStack>
        </Box>

        {/* Content */}
        {isSearching ? (
          /* Swipeable tabbed search results (feed-style pager) */
          <Box flex={1}>
            {/* Tab bar with active underline (feed style) */}
            <Box borderBottomWidth={1} borderColor={inputBorder}>
              <ScrollView
                ref={tabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {tabPages.map((tab, index) => {
                  const isActive = currentPage === index;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => handleTabPress(index)}
                      px="$4"
                      py="$2.5"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text
                        fontSize="$sm"
                        fontWeight={isActive ? '$bold' : '$medium'}
                        color={isActive ? textColor : tabInactiveColor}
                      >
                        {tab.label} ({tab.rows.length})
                      </Text>
                      {isActive && (
                        <Box
                          position="absolute"
                          bottom={0}
                          left={16}
                          right={16}
                          h={2}
                          bg={accentColor}
                          borderRadius={1}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Box>

            {/* Swipeable pages — one per tab */}
            <PagerView
              ref={pagerRef}
              style={{ flex: 1 }}
              initialPage={0}
              onPageSelected={handlePageSelected}
            >
              {tabPages.map((tab) => (
                <View key={tab.key} style={{ flex: 1 }}>
                  {renderPageContent(tab.rows)}
                </View>
              ))}
            </PagerView>
          </Box>
        ) : (
          /* Popular Lists */
          <ScrollView
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Popular Subcategories */}
            <VStack mb="$6">
              <Text px="$4" mb="$3" fontSize="$sm" fontWeight="$semibold" color={sectionLabelColor}>
                {t('categorySearch.popularSubcategories')}
              </Text>
              {popularSubCatsLoading ? (
                <Box px="$4">
                  <Spinner color={accentColor} />
                </Box>
              ) : (
                renderChips(
                  popularSubCatItems.map((item) => ({
                    id: item.subCategoryId,
                    name: item.name,
                    onPress: () => handleSelectSubCategory(item),
                  }))
                )
              )}
            </VStack>

            {/* Popular Product Groups */}
            <VStack>
              <Text px="$4" mb="$3" fontSize="$sm" fontWeight="$semibold" color={sectionLabelColor}>
                {t('categorySearch.popularProductGroups')}
              </Text>
              {popularPGsLoading ? (
                <Box px="$4">
                  <Spinner color={accentColor} />
                </Box>
              ) : (
                renderChips(
                  popularPGItems.map((item) => ({
                    id: item.productGroupId,
                    name: item.name,
                    onPress: () => handleSelectProductGroup(item),
                  }))
                )
              )}
            </VStack>
          </ScrollView>
        )}
      </Box>
    </SafeAreaView>
  );
};
