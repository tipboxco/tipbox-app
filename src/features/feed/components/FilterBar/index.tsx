import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { HStack, Pressable, Text, Box, VStack, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useCatalogCategories, useCatalogSubCategories } from '@/src/features/catalog/api/hooks';
import type { CatalogCategory, CatalogSubCategory } from '@/src/features/catalog/types';
import type { FeedFilterParams } from '../../api/feedApi';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/**
 * Backend expected tag values
 * @see docs/FEED_FILTERS_STATUS.md - Detailed filter documentation
 * 
 * Supported Tags:
 * - Review: Review posts
 * - Benchmark: Comparison posts
 * - Tips: Tips posts
 * - Question: Question posts
 * - Experience: Experience posts
 * - Update: Update posts
 * 
 * Backend searches in contentPostTags and tags tables
 */
export const TAG_OPTIONS = [
  { value: 'Review', label: 'Review' },
  { value: 'Benchmark', label: 'Benchmark' },
  { value: 'Tips', label: 'Tips' },
  { value: 'Question', label: 'Question' },
  { value: 'Experience', label: 'Experience' },
  { value: 'Update', label: 'Update' },
] as const;

/**
 * Interest options for feed filtering
 * Backend expects these values for interests filter
 */
export const INTEREST_OPTIONS = [
  { value: 'INVENTORY_MATCH', label: 'Inventory Match', count: 57 },
  { value: 'CATEGORY_MATCH', label: 'Category Match', count: 52 },
  { value: 'MUTUAL_TRUST', label: 'Mutual Trust', count: 17 },
  { value: 'ENGAGEMENT_HIGH', label: 'Trending', count: 13 }, // Displayed as "Trending" instead of "Engagement High"
  { value: 'NEW_USER', label: 'New User', count: 6 },
  { value: 'BOOSTED', label: 'Boosted', count: 3 },
  { value: 'TRUSTER', label: 'Truster', count: 1 },
] as const;

/**
 * Sort options
 * @see docs/FEED_FILTERS_STATUS.md - Detailed filter documentation
 * 
 * - recent: Boosted posts first, then by creation date (new → old)
 *   Backend: orderBy: [{ post: { isBoosted: 'desc' } }, { post: { createdAt: 'desc' } }]
 * 
 * - top: By like count (high → low), then views, finally date
 *   Backend: orderBy: [{ post: { likesCount: 'desc' } }, { post: { viewsCount: 'desc' } }, { post: { createdAt: 'desc' } }]
 */
export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'top', label: 'Top' },
] as const;

interface FilterBarProps {
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
}

/**
 * FilterBar Component
 * Feed filtering UI component
 * 
 * @see docs/FEED_FILTERS_STATUS.md - Detailed filter documentation and backend implementation
 * 
 * Filters:
 * - Interests: Multiple interest type selection (INVENTORY_MATCH, CATEGORY_MATCH, MUTUAL_TRUST, ENGAGEMENT_HIGH/Trending, NEW_USER, BOOSTED, TRUSTER)
 * - Tags: Multiple tag selection, searches in contentPostTags and tags tables
 * - Category: Single category selection, merged with interests in backend
 * - Sort: recent (Boost → Date) or top (Likes → Views → Date)
 */
export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { openBottomSheet, closeBottomSheet, updateContent, isOpen } = useGlobalBottomSheet();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Track which filter bottom sheet is open
  const openFilterRef = useRef<string | null>(null);

  // Get categories from API (only for Category filter, not for Interests)
  const { data: catalogCategories } = useCatalogCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { data: catalogSubCategories } = useCatalogSubCategories(selectedCategoryId || undefined);

  // Auto-select first category
  React.useEffect(() => {
    if (!selectedCategoryId && catalogCategories && catalogCategories.length > 0) {
      setSelectedCategoryId(catalogCategories[0].categoryId);
    }
  }, [catalogCategories, selectedCategoryId]);

  // Merge all categories (main + sub) and remove duplicates by ID and normalized name
  // Also removes duplicates between main and sub categories
  const allCategories = useMemo(() => {
    const categoriesMap = new Map<string, { id: string; name: string; type: 'main' | 'sub' }>();
    const normalizedNamesMap = new Map<string, string>(); // Track normalized names to prevent duplicates
    const seenIds = new Set<string>(); // Track all seen IDs to prevent duplicates
    
    // Helper function to normalize category name (more aggressive normalization)
    const normalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/[çğıöşü]/g, (char) => {
          // Turkish character normalization
          const map: { [key: string]: string } = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
          };
          return map[char] || char;
        });
    };
    
    // Process main categories first
    if (catalogCategories) {
      catalogCategories.forEach((cat: CatalogCategory) => {
        const normalizedName = normalizeName(cat.name);
        
        // Skip if same ID already exists
        if (seenIds.has(cat.categoryId)) {
          return;
        }
        
        // Skip if same normalized name already exists (duplicate name)
        if (normalizedNamesMap.has(normalizedName)) {
          return;
        }
        
        // Add category
        categoriesMap.set(cat.categoryId, {
          id: cat.categoryId,
          name: cat.name,
          type: 'main',
        });
        normalizedNamesMap.set(normalizedName, cat.categoryId);
        seenIds.add(cat.categoryId);
      });
    }
    
    // Process sub categories - check against both main and other sub categories
    if (catalogSubCategories) {
      catalogSubCategories.forEach((subCat: CatalogSubCategory) => {
        const normalizedName = normalizeName(subCat.name);
        
        // Skip if same ID already exists (could be in main categories or other sub categories)
        if (seenIds.has(subCat.subCategoryId)) {
          return;
        }
        
        // Skip if same normalized name already exists (duplicate name)
        if (normalizedNamesMap.has(normalizedName)) {
          return;
        }
        
        // Add category
        categoriesMap.set(subCat.subCategoryId, {
          id: subCat.subCategoryId,
          name: subCat.name,
          type: 'sub',
        });
        normalizedNamesMap.set(normalizedName, subCat.subCategoryId);
        seenIds.add(subCat.subCategoryId);
      });
    }
    
    return Array.from(categoriesMap.values());
  }, [catalogCategories, catalogSubCategories]);

  // Interests - multiple selection (using interest types instead of category IDs)
  const handleInterestToggle = useCallback((interestValue: string) => {
    const currentInterests = filters.interests || [];
    const newInterests = currentInterests.includes(interestValue)
      ? currentInterests.filter((value) => value !== interestValue)
      : [...currentInterests, interestValue];
    
    onFiltersChange({
      ...filters,
      interests: newInterests.length > 0 ? newInterests : undefined,
    });
  }, [filters, onFiltersChange]);

  // Tags - multiple selection
  const handleTagToggle = useCallback((tagValue: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter((tag) => tag !== tagValue)
      : [...currentTags, tagValue];
    
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  }, [filters, onFiltersChange]);

  // Category - single selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === categoryId ? undefined : categoryId,
    });
    openFilterRef.current = null;
    closeBottomSheet();
  }, [filters, onFiltersChange, closeBottomSheet]);

  // Sort - single selection
  const handleSortSelect = useCallback((sortValue: 'recent' | 'top') => {
    onFiltersChange({
      ...filters,
      sort: filters.sort === sortValue ? undefined : sortValue,
    });
    openFilterRef.current = null;
    closeBottomSheet();
  }, [filters, onFiltersChange, closeBottomSheet]);
  
  // Clear ref when bottom sheet closes
  useEffect(() => {
    if (!isOpen) {
      openFilterRef.current = null;
    }
  }, [isOpen]);

  // Get selected filter count
  const getFilterCount = (filterId: string) => {
    switch (filterId) {
      case 'interest':
        return filters.interests?.length || 0;
      case 'tag':
        return filters.tags?.length || 0;
      case 'category':
        return filters.category ? 1 : 0;
      case 'sort':
        return filters.sort ? 1 : 0;
      default:
        return 0;
    }
  };

  // Interests bottom sheet content - memoized with useMemo
  const interestsContent = useMemo(() => {
    return (
      <VStack space="md" pb={Platform.OS === 'ios' ? insets.bottom : tabBarHeight}>
        {/* Header */}
        <VStack space="sm" pb="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333333' : '#E9E9E9'} px="$3">
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Select Interests
            </Text>
            <Pressable onPress={() => {
              openFilterRef.current = null;
              closeBottomSheet();
            }}>
              <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </HStack>
        </VStack>

        {/* Interest options list */}
        <ScrollView showsVerticalScrollIndicator={false} maxHeight={400}>
          <VStack space="xs" px="$3">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = filters.interests?.includes(interest.value) || false;
              return (
                <Pressable
                  key={interest.value}
                  onPress={() => handleInterestToggle(interest.value)}
                >
                  <Box
                    py="$3"
                    bg={isSelected ? '#E2FF46' : 'transparent'}
                    borderRadius={8}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <HStack alignItems="center" space="sm" flex={1}>
                      <Text
                        fontSize={13}
                        fontWeight="$medium"
                        color={isSelected ? '#000000' : isDark ? '#FFFFFF' : '#000000'}
                      >
                        {interest.label}
                      </Text>
                      {interest.count !== undefined && (
                        <Text
                          fontSize={11}
                          color={isSelected ? '#666666' : isDark ? '#999999' : '#666666'}
                        >
                          ({interest.count})
                        </Text>
                      )}
                    </HStack>
                    {isSelected && (
                      <Feather name="check" size={18} color="#000000" />
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </VStack>
        </ScrollView>
      </VStack>
    );
  }, [isDark, filters.interests, insets.bottom, tabBarHeight, handleInterestToggle, closeBottomSheet]);

  // Tags bottom sheet content - memoized with useMemo
  const tagsContent = useMemo(() => {
    return (
      <VStack space="md" pb={Platform.OS === 'ios' ? insets.bottom : tabBarHeight}>
        {/* Header */}
        <VStack space="sm" pb="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333333' : '#E9E9E9'} px="$3">
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Select Tags
            </Text>
            <Pressable onPress={() => {
              openFilterRef.current = null;
              closeBottomSheet();
            }}>
              <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </HStack>
        </VStack>

        {/* Tags list */}
        <ScrollView showsVerticalScrollIndicator={false} maxHeight={400}>
          <VStack space="xs" px="$3">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = filters.tags?.includes(tag.value) || false;
              return (
                <Pressable
                  key={tag.value}
                  onPress={() => handleTagToggle(tag.value)}
                >
                  <Box
                    px="$3"
                    py="$3"
                    bg={isSelected ? '#E2FF46' : 'transparent'}
                    borderRadius={8}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text
                      fontSize={13}
                      fontWeight="$medium"
                      color={isSelected ? '#000000' : isDark ? '#FFFFFF' : '#000000'}
                    >
                      {tag.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={18} color="#000000" />
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </VStack>
        </ScrollView>
      </VStack>
    );
  }, [isDark, filters.tags, insets.bottom, tabBarHeight, handleTagToggle, closeBottomSheet]);

  // Category bottom sheet content - memoized with useMemo
  const categoryContent = useMemo(() => {
    return (
      <VStack space="md" pb={Platform.OS === 'ios' ? insets.bottom : tabBarHeight}>
        {/* Header */}
        <VStack space="sm" pb="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333333' : '#E9E9E9'} px="$3">
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Select Category
            </Text>
            <Pressable onPress={() => {
              openFilterRef.current = null;
              closeBottomSheet();
            }}>
              <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </HStack>
        </VStack>

        {/* Category list */}
        <ScrollView showsVerticalScrollIndicator={false} maxHeight={400}>
          <VStack space="xs" px="$3">
            {allCategories.length === 0 ? (
              <Text
                fontSize={12}
                color={isDark ? '#999999' : '#666666'}
                textAlign="center"
                py="$4"
              >
                Loading categories...
              </Text>
            ) : (
              allCategories.map((category) => {
                const isSelected = filters.category === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <Box
                      py="$3"
                      bg={isSelected ? '#E2FF46' : 'transparent'}
                      borderRadius={8}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="$medium"
                        color={isSelected ? '#000000' : isDark ? '#FFFFFF' : '#000000'}
                      >
                        {category.name}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })
            )}
          </VStack>
        </ScrollView>
      </VStack>
    );
  }, [isDark, filters.category, allCategories, insets.bottom, tabBarHeight, handleCategorySelect, closeBottomSheet]);

  // Sort bottom sheet content - memoized with useMemo
  const sortContent = useMemo(() => {
    return (
      <VStack space="md" pb={Platform.OS === 'ios' ? insets.bottom : tabBarHeight}>
        {/* Header */}
        <VStack space="sm" pb="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333333' : '#E9E9E9'} px="$3">
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Select Sort
            </Text>
            <Pressable onPress={() => {
              openFilterRef.current = null;
              closeBottomSheet();
            }}>
              <Feather name="x" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </HStack>
        </VStack>

        {/* Sort options */}
        <VStack space="xs" px="$3">
          {SORT_OPTIONS.map((sort) => {
            const isSelected = filters.sort === sort.value;
            return (
              <Pressable
                key={sort.value}
                onPress={() => handleSortSelect(sort.value)}
              >
                <Box
                  px="$3"
                  py="$3"
                  bg={isSelected ? '#E2FF46' : 'transparent'}
                  borderRadius={8}
                >
                  <Text
                    fontSize={13}
                    fontWeight="$medium"
                    color={isSelected ? '#000000' : isDark ? '#FFFFFF' : '#000000'}
                  >
                    {sort.label}
                  </Text>
                </Box>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    );
  }, [isDark, filters.sort, insets.bottom, tabBarHeight, handleSortSelect, closeBottomSheet]);

  // Update content when bottom sheet is open
  useEffect(() => {
    if (isOpen && openFilterRef.current) {
      let contentToUpdate: React.ReactNode | null = null;
      
      switch (openFilterRef.current) {
        case 'interest':
          contentToUpdate = interestsContent;
          break;
        case 'tag':
          contentToUpdate = tagsContent;
          break;
        case 'category':
          contentToUpdate = categoryContent;
          break;
        case 'sort':
          contentToUpdate = sortContent;
          break;
      }
      
      if (contentToUpdate) {
        updateContent(contentToUpdate);
      }
    }
  }, [isOpen, interestsContent, tagsContent, categoryContent, sortContent, updateContent]);

  // Render filter button
  const renderFilterButton = (
    filterId: string,
    label: string,
    icon: string,
    content: React.ReactNode
  ) => {
    const count = getFilterCount(filterId);
    const isActive = count > 0;

    const handlePress = () => {
      openFilterRef.current = filterId;
      openBottomSheet(content, {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        snapPoints: ['50%', '75%'],
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarHeight,
      });
    };

    return (
      <Pressable onPress={handlePress}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          gap={4}
          px="$3"
          bg={isActive ? '#E2FF46' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isActive ? '#E2FF46' : '#E9E9E9'}
          borderRadius={10}
          height={23}
        >
          <HStack alignItems="center" space="xs">
            <Text
              color={isActive ? '#000000' : '#000000'}
              fontSize={9}
              fontWeight="$bold"
            >
              {label}
            </Text>
            {count > 0 && (
              <Box
                bg={isActive ? '#000000' : '#E2FF46'}
                borderRadius={8}
                px={6}
                minWidth={16}
                height={16}
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  color={isActive ? '#FFFFFF' : '#000000'}
                  fontSize={8}
                  fontWeight="$bold"
                >
                  {count}
                </Text>
              </Box>
            )}
          </HStack>
          <Box
            width={12}
            height={12}
            alignItems="center"
            justifyContent="center"
          >
            <Feather
              name="chevron-down"
              size={8}
              color={isActive ? '#000000' : '#000000'}
            />
          </Box>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box px="$4" pb="$2" mt="$2">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="sm" alignItems="center">
          {renderFilterButton('interest', 'Interests', 'filter', interestsContent)}
          {renderFilterButton('tag', 'Tags', 'tag', tagsContent)}
          {renderFilterButton('category', 'Category', 'grid', categoryContent)}
        </HStack>
        <Box>
          {renderFilterButton('sort', 'Sort', 'arrow-up-down', sortContent)}
        </Box>
      </HStack>
    </Box>
  );
};
