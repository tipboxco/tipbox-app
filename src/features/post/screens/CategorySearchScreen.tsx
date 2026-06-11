import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Search } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import {
  useSubCategorySearch,
  useProductGroupSearch,
  usePopularSubCategories,
  usePopularProductGroups,
} from '@/src/features/catalog/api/hooks';
import { ProductInfoType } from '@/src/types/common';
import type { CatalogSubCategory, CatalogProductGroup } from '@/src/features/catalog/types';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { PostStackParamList } from '../navigation';

type CategorySearchNavigationProp = NativeStackNavigationProp<PostStackParamList>;

type SearchResultItem =
  | { kind: 'subcategory'; item: CatalogSubCategory }
  | { kind: 'productGroup'; item: CatalogProductGroup };

export const CategorySearchScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = useMemo(() => colorMode === 'dark', [colorMode]);
  const navigation = useNavigation<CategorySearchNavigationProp>();
  const { t } = useTranslation('post');
  const { setFlowContext } = useCreatePostFlowStore();

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: subCatSearchData, isLoading: subCatSearchLoading } = useSubCategorySearch(debouncedQuery);
  const { data: pgSearchData, isLoading: pgSearchLoading } = useProductGroupSearch(debouncedQuery);
  const { data: popularSubCats, isLoading: popularSubCatsLoading } = usePopularSubCategories(10);
  const { data: popularPGs, isLoading: popularPGsLoading } = usePopularProductGroups(10);

  const isSearching = !!debouncedQuery && debouncedQuery.trim().length > 0;
  const isSearchLoading = subCatSearchLoading || pgSearchLoading;

  const searchResults = useMemo<SearchResultItem[]>(() => {
    if (!isSearching) return [];
    const subCats = (subCatSearchData?.pages ?? []).flatMap((p) => p.items);
    const pgs = (pgSearchData?.pages ?? []).flatMap((p) => p.items);
    return [
      ...subCats.map((item): SearchResultItem => ({ kind: 'subcategory', item })),
      ...pgs.map((item): SearchResultItem => ({ kind: 'productGroup', item })),
    ];
  }, [isSearching, subCatSearchData, pgSearchData]);

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

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const bgColor = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#1A1A1A' : '#F3F4F6';
  const chipBg = isDark ? '#1A1A1A' : '#F9FAFB';
  const chipBorder = isDark ? '#374151' : '#E5E7EB';
  const sectionLabelColor = isDark ? '#D1D5DB' : '#374151';
  const resultItemBg = isDark ? '#111111' : '#F9FAFB';
  const badgeBg = isDark ? '#374151' : '#E5E7EB';
  const badgeText = isDark ? '#9CA3AF' : '#6B7280';

  const renderSearchResult = useCallback(
    ({ item: resultItem }: { item: SearchResultItem }) => {
      const isSubCat = resultItem.kind === 'subcategory';
      const name = isSubCat
        ? (resultItem.item as CatalogSubCategory).name
        : (resultItem.item as CatalogProductGroup).name;
      const badgeLabel = isSubCat ? t('categorySearch.subcategory') : t('categorySearch.productGroup');

      return (
        <TouchableOpacity
          onPress={() =>
            isSubCat
              ? handleSelectSubCategory(resultItem.item as CatalogSubCategory)
              : handleSelectProductGroup(resultItem.item as CatalogProductGroup)
          }
          className="flex-row items-center justify-between px-4 py-3 mb-1 rounded-xl"
          style={{ backgroundColor: resultItemBg }}
          activeOpacity={0.7}
        >
          <Text
            className="flex-1 text-sm font-medium"
            style={{ color: textColor }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View
            className="ml-3 px-2 py-0.5 rounded-md"
            style={{ backgroundColor: badgeBg }}
          >
            <Text className="text-xs" style={{ color: badgeText }}>
              {badgeLabel}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectSubCategory, handleSelectProductGroup, resultItemBg, textColor, badgeBg, badgeText, t]
  );

  const popularSubCatItems = popularSubCats?.items ?? [];
  const popularPGItems = popularPGs?.items ?? [];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={22} color={textColor} />
        </TouchableOpacity>
        <Text className="text-base font-semibold" style={{ color: textColor }}>
          {t('categorySearch.title')}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search Input */}
      <View className="px-4 pb-3">
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5"
          style={{ backgroundColor: inputBg }}
        >
          <Search size={16} color={subTextColor} />
          <TextInput
            className="flex-1 ml-2 text-sm"
            style={{ color: textColor }}
            placeholder={t('categorySearch.placeholder')}
            placeholderTextColor={subTextColor}
            value={inputValue}
            onChangeText={setInputValue}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Content */}
      {isSearching ? (
        /* Search Results */
        isSearchLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={isDark ? '#818CF8' : '#6366F1'} />
          </View>
        ) : searchResults.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-center" style={{ color: subTextColor }}>
              {t('categorySearch.noResults')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) =>
              item.kind === 'subcategory'
                ? `sub-${item.item.subCategoryId}`
                : `pg-${item.item.productGroupId}`
            }
            renderItem={renderSearchResult}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : (
        /* Popular Lists */
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Popular Subcategories */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold px-4 mb-3"
              style={{ color: sectionLabelColor }}
            >
              {t('categorySearch.popularSubcategories')}
            </Text>
            {popularSubCatsLoading ? (
              <View className="px-4">
                <ActivityIndicator color={isDark ? '#818CF8' : '#6366F1'} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {popularSubCatItems.map((item) => (
                  <TouchableOpacity
                    key={item.subCategoryId}
                    onPress={() => handleSelectSubCategory(item)}
                    className="px-4 py-2 rounded-full border"
                    style={{ backgroundColor: chipBg, borderColor: chipBorder }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm font-medium" style={{ color: textColor }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Popular Product Groups */}
          <View>
            <Text
              className="text-sm font-semibold px-4 mb-3"
              style={{ color: sectionLabelColor }}
            >
              {t('categorySearch.popularProductGroups')}
            </Text>
            {popularPGsLoading ? (
              <View className="px-4">
                <ActivityIndicator color={isDark ? '#818CF8' : '#6366F1'} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {popularPGItems.map((item) => (
                  <TouchableOpacity
                    key={item.productGroupId}
                    onPress={() => handleSelectProductGroup(item)}
                    className="px-4 py-2 rounded-full border"
                    style={{ backgroundColor: chipBg, borderColor: chipBorder }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm font-medium" style={{ color: textColor }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
