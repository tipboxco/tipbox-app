/**
 * FilterFeed - Filter options component for GlobalBottomSheet
 * Handles all filter logic for feed (interests, tags, category, sort)
 */

import React, { useMemo } from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { HStack, Box, Text, VStack } from '@/src/components/ui';
import { CheckIcon as CheckIconSolid } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { FeedFilterParams } from '../api/feedApi';
import type { CatalogCategory, CatalogSubCategory } from '@/src/features/catalog/types';

// Filter options - Tags dropdown
export const TAG_OPTIONS = [
  { value: 'Free', label: 'Free' },
  { value: 'Benchmark', label: 'Benchmark' },
  { value: 'Experience', label: 'Experience' },
  { value: 'Update', label: 'Update' },
  { value: 'Question', label: 'Question' },
  { value: 'Tips and Tricks', label: 'Tips and Tricks' },
] as const;

export const INTEREST_OPTIONS = [
  { value: 'TRUSTER', label: 'Truster' },
  { value: 'CATEGORY_MATCH', label: 'Category Match' },
  { value: 'TRENDING', label: 'Trending' },
  { value: 'NEW_USER', label: 'New User' },
  { value: 'BOOSTED', label: 'Boosted' },
  { value: 'INVENTORY_MATCH', label: 'Inventory Match' },
  { value: 'PRODUCT_GROUP_MATCH', label: 'Product Group Match' },
] as const;

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'top', label: 'Top' },
] as const;

interface FilterFeedProps {
  filterId: 'interest' | 'tag' | 'category' | 'sort';
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  onClose: () => void;
  // Categories for category filter
  catalogCategories?: CatalogCategory[];
  catalogSubCategories?: CatalogSubCategory[];
}

export const FilterFeed: React.FC<FilterFeedProps> = ({
  filterId,
  filters,
  onFiltersChange,
  onClose,
  catalogCategories = [],
  catalogSubCategories = [],
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Merge categories
  const allCategories = useMemo(() => {
    const categoriesMap = new Map<string, { id: string; name: string; type: 'main' | 'sub' }>();
    const seenIds = new Set<string>();

    if (catalogCategories && Array.isArray(catalogCategories)) {
      catalogCategories.forEach((cat: CatalogCategory) => {
        if (seenIds.has(cat.categoryId)) return;
        categoriesMap.set(cat.categoryId, { id: cat.categoryId, name: cat.name, type: 'main' });
        seenIds.add(cat.categoryId);
      });
    }

    if (catalogSubCategories && Array.isArray(catalogSubCategories)) {
      catalogSubCategories.forEach((subCat: CatalogSubCategory) => {
        if (seenIds.has(subCat.subCategoryId)) return;
        categoriesMap.set(subCat.subCategoryId, {
          id: subCat.subCategoryId,
          name: subCat.name,
          type: 'sub',
        });
        seenIds.add(subCat.subCategoryId);
      });
    }

    return Array.from(categoriesMap.values());
  }, [catalogCategories, catalogSubCategories]);

  // Get options based on filter type
  const getOptions = (): Array<{ value: string; label: string }> => {
    switch (filterId) {
      case 'interest':
        return [...INTEREST_OPTIONS];
      case 'tag':
        return [...TAG_OPTIONS];
      case 'category':
        return allCategories.map((cat) => ({ value: cat.id, label: cat.name }));
      case 'sort':
        return [...SORT_OPTIONS];
      default:
        return [];
    }
  };

  const options = getOptions();

  // Check if value is selected
  const isSelected = (value: string) => {
    switch (filterId) {
      case 'interest':
        return filters.interests?.includes(value) || false;
      case 'tag':
        return filters.tags?.includes(value) || false;
      case 'category':
        return filters.category === value;
      case 'sort':
        return filters.sort === value;
      default:
        return false;
    }
  };

  // Handle toggle
  const handleToggle = (value: string) => {
    switch (filterId) {
      case 'interest': {
        const currentInterests = filters.interests || [];
        const newInterests = currentInterests.includes(value)
          ? currentInterests.filter((v) => v !== value)
          : [...currentInterests, value];
        onFiltersChange({ ...filters, interests: newInterests.length > 0 ? newInterests : undefined });
        break;
      }
      case 'tag': {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(value)
          ? currentTags.filter((v) => v !== value)
          : [...currentTags, value];
        onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
        break;
      }
      case 'category': {
        const newCategory = filters.category === value ? undefined : value;
        onFiltersChange({ ...filters, category: newCategory });
        break;
      }
      case 'sort': {
        const newSort = filters.sort === value ? undefined : (value as 'recent' | 'top');
        onFiltersChange({ ...filters, sort: newSort });
        break;
      }
    }
  };

  // Handle clear
  const handleClear = () => {
    switch (filterId) {
      case 'interest':
        onFiltersChange({ ...filters, interests: undefined });
        break;
      case 'tag':
        onFiltersChange({ ...filters, tags: undefined });
        break;
      case 'category':
        onFiltersChange({ ...filters, category: undefined });
        break;
      case 'sort':
        onFiltersChange({ ...filters, sort: undefined });
        break;
    }
  };

  // Get title
  const getTitle = () => {
    switch (filterId) {
      case 'interest':
        return 'Interests';
      case 'tag':
        return 'Tags';
      case 'category':
        return 'Category';
      case 'sort':
        return 'Sort';
      default:
        return '';
    }
  };

  // Group options into rows of 3
  const rows: Array<Array<{ value: string; label: string }>> = [];
  for (let i = 0; i < options.length; i += 3) {
    rows.push(options.slice(i, i + 3));
  }

  return (
    <VStack bg={isDark ? '#1A1A1A' : '#FFFFFF'} width="100%">
      <Text fontSize={16} fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'} mb="$4" textAlign="center">
        {getTitle()}
      </Text>

      {options.length === 0 ? (
        <VStack px={12} py="$2" alignItems="center" justifyContent="center" minHeight={50}>
          <RNText
            style={{
              fontSize: 12,
              color: isDark ? '#FFFFFF' : '#666666',
              fontWeight: '500',
            }}
          >
            Loading...
          </RNText>
        </VStack>
      ) : (
        <VStack px={12} py="$2" width="100%">
          {rows.map((row, rowIndex) => (
            <HStack key={rowIndex} space="xs" justifyContent="space-between" width="100%" mb="$1">
              {row.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <Pressable key={option.value} onPress={() => handleToggle(option.value)} flex={1} style={{ minHeight: 44 }}>
                    <Box
                      flex={1}
                      bg={selected ? (isDark ? '#2A2A2A' : '#F5F5F5') : 'transparent'}
                      borderWidth={selected ? 1 : 0}
                      borderColor={selected ? '#829905' : 'transparent'}
                      borderRadius={7}
                      px="$1.5"
                      py="$1"
                    >
                      <HStack alignItems="center" space="xs" flex={1}>
                        <Box
                          width={18}
                          height={18}
                          borderWidth={1.5}
                          borderColor={selected ? '#829905' : isDark ? '#444444' : '#CCCCCC'}
                          borderRadius={4}
                          bg={selected ? '#829905' : 'transparent'}
                          justifyContent="center"
                          alignItems="center"
                          flexShrink={0}
                        >
                          {selected && <CheckIconSolid width={11} height={11} color="#FFFFFF" />}
                        </Box>
                        <Box flex={1} flexShrink={1}>
                          <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={12} fontWeight={selected ? '$semibold' : '$normal'}>
                            {option.label}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
              {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, idx) => <Box key={`empty-${idx}`} flex={1} />)}
            </HStack>
          ))}
        </VStack>
      )}

      <Box px={12} pt="$1" style={{ paddingTop: 4, paddingBottom: 16 }}>
        <HStack space="xs" justifyContent="space-between" width="100%">
          <Pressable onPress={handleClear} flex={1}>
            <Box
              py="$1.5"
              bg="transparent"
              borderWidth={1}
              borderColor={isDark ? '#444444' : '#E9E9E9'}
              borderRadius={6}
              alignItems="center"
              justifyContent="center"
              minHeight={32}
            >
              <Text fontSize={12} fontWeight="$semibold" color={isDark ? '#FFFFFF' : '#666666'}>
                Clear
              </Text>
            </Box>
          </Pressable>
          <Pressable onPress={onClose} flex={1}>
            <Box py="$1.5" bg="#829905" borderRadius={6} alignItems="center" justifyContent="center" minHeight={32}>
              <Text fontSize={12} fontWeight="$bold" color="#FFFFFF">
                Apply
              </Text>
            </Box>
          </Pressable>
        </HStack>
      </Box>
    </VStack>
  );
};
