import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Animated, Platform, Text as RNText } from 'react-native';
import { HStack, Pressable, Text, Box, VStack, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useCatalogCategories, useCatalogSubCategories } from '@/src/features/catalog/api/hooks';
import type { CatalogCategory, CatalogSubCategory } from '@/src/features/catalog/types';
import type { FeedFilterParams } from '../../api/feedApi';

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
 * 
 * NOTE: INVENTORY_MATCH temporarily removed due to backend Prisma schema issue
 * Backend FeedSource enum does not include INVENTORY_MATCH
 * TODO: Re-enable when backend adds INVENTORY_MATCH to FeedSource enum
 */
export const INTEREST_OPTIONS = [
  // { value: 'INVENTORY_MATCH', label: 'Inventory Match', count: 57 }, // Temporarily disabled - backend enum issue
  { value: 'CATEGORY_MATCH', label: 'Category Match' },
  { value: 'MUTUAL_TRUST', label: 'Mutual Trust' },
  { value: 'ENGAGEMENT_HIGH', label: 'Trending' }, // Displayed as "Trending" instead of "Engagement High"
  { value: 'NEW_USER', label: 'New User' },
  { value: 'BOOSTED', label: 'Boosted' },
  { value: 'TRUSTER', label: 'Truster' },
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
 * - Interests: Multiple interest type selection (CATEGORY_MATCH, MUTUAL_TRUST, ENGAGEMENT_HIGH/Trending, NEW_USER, BOOSTED, TRUSTER)
 *   NOTE: INVENTORY_MATCH temporarily disabled due to backend Prisma schema issue
 * - Tags: Multiple tag selection, searches in contentPostTags and tags tables
 * - Category: Single category selection, merged with interests in backend
 * - Sort: recent (Boost → Date) or top (Likes → Views → Date)
 */
export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Track which filter panel is open
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  
  // Animation value for expandable panel height (0 to dynamic height based on content)
  const panelHeight = useRef(new Animated.Value(0)).current;
  
  // Calculate panel height for 2 rows x 3 columns grid
  const getPanelHeight = () => {
    const rowHeight = 50; // Each row height
    const rows = 2; // 2 rows
    const padding = 16;
    const dividerHeight = 1;
    const buttonHeight = 50;
    const buttonPadding = 16;
    return (rows * rowHeight) + (padding * 2) + dividerHeight + buttonHeight + buttonPadding;
  };
  
  // Track FilterBar height for absolute positioning
  const [filterBarHeight, setFilterBarHeight] = useState(0);

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
    if (catalogCategories && Array.isArray(catalogCategories)) {
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
    if (catalogSubCategories && Array.isArray(catalogSubCategories)) {
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
    setOpenFilterId(null);
  }, [filters, onFiltersChange]);

  // Sort - single selection
  const handleSortSelect = useCallback((sortValue: 'recent' | 'top') => {
    onFiltersChange({
      ...filters,
      sort: filters.sort === sortValue ? undefined : sortValue,
    });
    setOpenFilterId(null);
  }, [filters, onFiltersChange]);
  
  // Animate panel open/close
  useEffect(() => {
    const targetHeight = openFilterId ? getPanelHeight() : 0;
    console.log('[FilterBar] Panel animation:', { openFilterId, targetHeight });
    Animated.timing(panelHeight, {
      toValue: targetHeight,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [openFilterId, panelHeight]);

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

  // Clear all filters for current filter type
  const handleClear = useCallback(() => {
    switch (openFilterId) {
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
  }, [openFilterId, filters, onFiltersChange]);

  // Apply filters (close panel)
  const handleApply = useCallback(() => {
    setOpenFilterId(null);
  }, []);

  // Render filter panel content
  const renderFilterPanel = () => {
    if (!openFilterId) return null;

    const isSelected = (value: string) => {
      switch (openFilterId) {
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

    let options: Array<{ value: string; label: string }> = [];
    let onSelect: (value: string) => void;
    let isMultipleSelection = false;

    switch (openFilterId) {
      case 'interest':
        options = [...INTEREST_OPTIONS];
        onSelect = handleInterestToggle;
        isMultipleSelection = true;
        break;
      case 'tag':
        options = [...TAG_OPTIONS];
        onSelect = handleTagToggle;
        isMultipleSelection = true;
        break;
      case 'category':
        options = allCategories.map(cat => ({ value: cat.id, label: cat.name }));
        onSelect = handleCategorySelect;
        isMultipleSelection = false;
        break;
      case 'sort':
        options = [...SORT_OPTIONS];
        onSelect = (value: string) => handleSortSelect(value as 'recent' | 'top');
        isMultipleSelection = false;
        break;
      default:
        return null;
    }

    // Debug: Log options to verify they're loaded
    console.log('[FilterBar] Rendering panel:', {
      openFilterId,
      optionsCount: options.length,
      options: options.map(opt => opt.label)
    });
    
    if (options.length === 0) {
      console.log('[FilterBar] No options available for filter:', openFilterId);
    }

    // Group options into rows of 3
    const rows: Array<Array<{ value: string; label: string }>> = [];
    for (let i = 0; i < options.length; i += 3) {
      rows.push(options.slice(i, i + 3));
    }
    // Limit to 2 rows (6 items max)
    const displayRows = rows.slice(0, 2);

    return (
      <VStack bg="#FAFAFA" width="100%">
        {/* Options Grid - 2 rows x 3 columns */}
        {options.length === 0 ? (
          <VStack px="$4" py="$3" alignItems="center" justifyContent="center" minHeight={50}>
            <Text
              fontSize="$sm"
              color="#666666"
              style={{ color: '#666666', fontSize: 14 }}
            >
              Yükleniyor...
            </Text>
          </VStack>
        ) : (
          <VStack px="$4" py="$3" space="sm" width="100%">
            {displayRows.map((row, rowIndex) => (
            <HStack key={rowIndex} space="sm" justifyContent="space-between" width="100%">
              {row.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onSelect(option.value)}
                    flex={1}
                  >
                    <HStack 
                      alignItems="center" 
                      space="xs" 
                      py="$2"
                      flex={1}
                      justifyContent="flex-start"
                    >
                      {/* Checkbox */}
                      <Box
                        width={20}
                        height={20}
                        borderWidth={1}
                        borderColor={selected ? '#829905' : '#CCCCCC'}
                        borderRadius={4}
                        bg={selected ? '#829905' : '#FFFFFF'}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {selected && (
                          <Feather name="check" size={14} color="#FFFFFF" />
                        )}
                      </Box>
                      {/* Label */}
                      <RNText
                        style={{ 
                          color: '#000000',
                          fontSize: 16,
                          fontWeight: '600',
                          flex: 1,
                          opacity: 1
                        }}
                        numberOfLines={1}
                      >
                        {option.label}
                      </RNText>
                    </HStack>
                  </Pressable>
                );
              })}
              {/* Fill empty spaces in last row if needed */}
              {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, idx) => (
                <Box key={`empty-${idx}`} flex={1} />
              ))}
            </HStack>
          ))}
          </VStack>
        )}

        {/* Divider */}
        <Box height={1} bg="#E9E9E9" />

        {/* Action Buttons */}
        <HStack px="$4" py="$3" space="sm" justifyContent="space-between">
          <Pressable
            onPress={handleClear}
            flex={1}
          >
            <Box
              py="$3"
              bg="transparent"
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize="$sm"
                fontWeight="$medium"
                color="#666666"
              >
                Temizle
              </Text>
            </Box>
          </Pressable>
          <Pressable
            onPress={handleApply}
            flex={1}
          >
            <Box
              py="$3"
              bg="#829905"
              borderRadius={8}
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize="$sm"
                fontWeight="$bold"
                color="#FFFFFF"
              >
                Uygula
              </Text>
            </Box>
          </Pressable>
        </HStack>
      </VStack>
    );
  };

  // Render filter button
  const renderFilterButton = (
    filterId: string,
    label: string
  ) => {
    const count = getFilterCount(filterId);
    const isActive = count > 0;
    const isOpen = openFilterId === filterId;

    const handlePress = () => {
      // Toggle: If same filter is already open, close it
      if (isOpen) {
        setOpenFilterId(null);
      } else {
        setOpenFilterId(filterId);
      }
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
              fontSize="$2xs"
              fontWeight="$medium"
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
                  fontSize="$2xs"
                  fontWeight="$medium"
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
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={8}
              color={isActive ? '#000000' : '#000000'}
            />
          </Box>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box position="relative" zIndex={1000}>
      <Box 
        px="$4" 
        pb="$2" 
        mt="$2"
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setFilterBarHeight(height);
        }}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="sm" alignItems="center">
            {renderFilterButton('interest', 'Interests')}
            {renderFilterButton('tag', 'Tags')}
            {renderFilterButton('category', 'Category')}
          </HStack>
          <Box>
            {renderFilterButton('sort', 'Sort')}
          </Box>
        </HStack>
      </Box>
      
      {/* Expandable Panel - Absolute positioned, overlays content below */}
      {openFilterId && (
        <Animated.View
          style={{
            position: 'absolute',
            top: filterBarHeight,
            left: 0,
            right: 0,
            height: panelHeight,
            overflow: 'hidden',
            backgroundColor: '#FAFAFA',
            borderTopWidth: 1,
            borderTopColor: '#E9E9E9',
            borderBottomWidth: 1,
            borderBottomColor: '#E9E9E9',
            minHeight: openFilterId ? 50 : 0,
            zIndex: 1000,
            elevation: 10, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          {renderFilterPanel()}
        </Animated.View>
      )}
    </Box>
  );
};
