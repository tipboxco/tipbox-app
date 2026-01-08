/**
 * FilterBar - Reanimated Performance Implementation
 * 
 * PERFORMANCE ARCHITECTURE:
 * - Single SharedValue (progress: 0-1) controls all animations
 * - All style calculations in worklets (UI thread)
 * - No LayoutAnimation, no measure during animation
 * - Pre-calculated panel height for smooth animations
 * - Feed container receives animated translateY style
 * 
 * DESIGN DECISIONS:
 * 1. Single progress value (0=closed, 1=open) for simplicity and performance
 * 2. Panel height calculated once, stored in sharedValue
 * 3. withSpring for natural feel (can switch to withTiming if needed)
 * 4. Feed translateY exposed via callback for FeedScreen integration
 * 5. Arrow rotation interpolated from same progress value
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Text as RNText } from 'react-native';
import { HStack, Pressable, Text, Box, VStack } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useCatalogCategories, useCatalogSubCategories } from '@/src/features/catalog/api/hooks';
import type { CatalogCategory, CatalogSubCategory } from '@/src/features/catalog/types';
import type { FeedFilterParams } from '../../api/feedApi';

// Filter options (same as before)
export const TAG_OPTIONS = [
  { value: 'Review', label: 'Review' },
  { value: 'Benchmark', label: 'Benchmark' },
  { value: 'Tips', label: 'Tips' },
  { value: 'Question', label: 'Question' },
  { value: 'Experience', label: 'Experience' },
  { value: 'Update', label: 'Update' },
] as const;

export const INTEREST_OPTIONS = [
  { value: 'CATEGORY_MATCH', label: 'Category Match' },
  { value: 'MUTUAL_TRUST', label: 'Mutual Trust' },
  { value: 'ENGAGEMENT_HIGH', label: 'Trending' },
  { value: 'NEW_USER', label: 'New User' },
  { value: 'BOOSTED', label: 'Boosted' },
  { value: 'TRUSTER', label: 'Truster' },
] as const;

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'top', label: 'Top' },
] as const;

// Spring configuration for natural feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Fixed panel height - no calculation needed
const FIXED_PANEL_HEIGHT = 180; // Fixed height in pixels

interface FilterBarProps {
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  // Expose sharedValues for direct access (better performance)
  onSharedValuesReady?: (values: { progress: SharedValue<number>; panelHeight: SharedValue<number> }) => void;
}

/**
 * FilterBar - Performance-optimized with Reanimated
 * 
 * Exposes animated translateY style for FeedScreen integration
 */
export const FilterBarReanimated: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onSharedValuesReady,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // State
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [lastOpenFilterId, setLastOpenFilterId] = useState<string | null>(null);
  const filterBarHeight = useSharedValue(0);

  // 🎯 CORE: Single progress sharedValue (0 = closed, 1 = open)
  const progress = useSharedValue(0);
  // Fixed panel height - no calculation needed
  const panelHeight = useSharedValue(FIXED_PANEL_HEIGHT);
  
  // Track which filter is open (for arrow rotation)
  const openFilterIdShared = useSharedValue<string | null>(null);

  // Categories
  const { data: catalogCategories } = useCatalogCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { data: catalogSubCategories } = useCatalogSubCategories(selectedCategoryId || undefined);

  // Auto-select first category
  useEffect(() => {
    if (!selectedCategoryId && catalogCategories && catalogCategories.length > 0) {
      setSelectedCategoryId(catalogCategories[0].categoryId);
    }
  }, [catalogCategories, selectedCategoryId]);

  // Merge categories
  const allCategories = useMemo(() => {
    const categoriesMap = new Map<string, { id: string; name: string; type: 'main' | 'sub' }>();
    const normalizedNamesMap = new Map<string, string>();
    const seenIds = new Set<string>();

    const normalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/[çğıöşü]/g, (char) => {
          const map: { [key: string]: string } = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
          };
          return map[char] || char;
        });
    };

    if (catalogCategories && Array.isArray(catalogCategories)) {
      catalogCategories.forEach((cat: CatalogCategory) => {
        const normalizedName = normalizeName(cat.name);
        if (seenIds.has(cat.categoryId) || normalizedNamesMap.has(normalizedName)) return;
        categoriesMap.set(cat.categoryId, { id: cat.categoryId, name: cat.name, type: 'main' });
        normalizedNamesMap.set(normalizedName, cat.categoryId);
        seenIds.add(cat.categoryId);
      });
    }

    if (catalogSubCategories && Array.isArray(catalogSubCategories)) {
      catalogSubCategories.forEach((subCat: CatalogSubCategory) => {
        const normalizedName = normalizeName(subCat.name);
        if (seenIds.has(subCat.subCategoryId) || normalizedNamesMap.has(normalizedName)) return;
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

  // Filter handlers
  const handleInterestToggle = useCallback(
    (interestValue: string) => {
      const currentInterests = filters.interests || [];
      const newInterests = currentInterests.includes(interestValue)
        ? currentInterests.filter((value) => value !== interestValue)
        : [...currentInterests, interestValue];

      onFiltersChange({
        ...filters,
        interests: newInterests.length > 0 ? newInterests : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleTagToggle = useCallback(
    (tagValue: string) => {
      const currentTags = filters.tags || [];
      const newTags = currentTags.includes(tagValue)
        ? currentTags.filter((tag) => tag !== tagValue)
        : [...currentTags, tagValue];

      onFiltersChange({
        ...filters,
        tags: newTags.length > 0 ? newTags : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      onFiltersChange({
        ...filters,
        category: filters.category === categoryId ? undefined : categoryId,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSortSelect = useCallback(
    (sortValue: 'recent' | 'top') => {
      onFiltersChange({
        ...filters,
        sort: filters.sort === sortValue ? undefined : sortValue,
      });
    },
    [filters, onFiltersChange]
  );

  // Toggle filter panel
  const handleFilterToggle = useCallback(
    (filterId: string) => {
      if (openFilterId === filterId) {
        // Close
        setOpenFilterId(null);
        openFilterIdShared.value = null;
        progress.value = withSpring(0, SPRING_CONFIG);
      } else {
        // Open
        setLastOpenFilterId(openFilterId || filterId);
        setOpenFilterId(filterId);
        openFilterIdShared.value = filterId;
        progress.value = withSpring(1, SPRING_CONFIG);
      }
    },
    [openFilterId, progress, openFilterIdShared]
  );

  // Apply filters (close panel)
  const handleApply = useCallback(() => {
    // Close: Keep panelHeight constant, only animate progress
    setOpenFilterId(null);
    openFilterIdShared.value = null;
    progress.value = withSpring(0, SPRING_CONFIG);
    // Don't change panelHeight - it should stay constant during close animation
  }, [progress, openFilterIdShared]);

  // Clear filters
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

  // 🎯 EXPOSE: SharedValues to parent (FeedScreen) for direct access
  // This avoids callback overhead and re-renders
  // Only expose once on mount to prevent re-renders
  useEffect(() => {
    if (onSharedValuesReady) {
      onSharedValuesReady({ progress, panelHeight });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Panel animated style - absolute positioned, z-index on top
  const panelStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(progress.value, [0, 1], [0, FIXED_PANEL_HEIGHT]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      position: 'absolute' as const,
      top: filterBarHeight.value, // CRITICAL FIX: Shared value'ları .value ile eriş
      left: 0,
      right: 0,
      height,
      opacity,
      overflow: 'hidden' as const,
      zIndex: 1000,
      elevation: 10, // Android
    };
  });

  // Arrow rotation styles for each button
  const interestArrowStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = openFilterIdShared.value === 'interest' ? interpolate(progress.value, [0, 1], [0, 180]) : 0;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const tagArrowStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = openFilterIdShared.value === 'tag' ? interpolate(progress.value, [0, 1], [0, 180]) : 0;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const categoryArrowStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = openFilterIdShared.value === 'category' ? interpolate(progress.value, [0, 1], [0, 180]) : 0;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const sortArrowStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = openFilterIdShared.value === 'sort' ? interpolate(progress.value, [0, 1], [0, 180]) : 0;
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Get filter count
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

  // Render filter panel content
  const renderFilterPanel = () => {
    const filterIdToRender = openFilterId || lastOpenFilterId;
    if (!filterIdToRender) return null;

    const isSelected = (value: string) => {
      switch (filterIdToRender) {
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

    switch (filterIdToRender) {
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
        options = allCategories.map((cat) => ({ value: cat.id, label: cat.name }));
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

    // Group options into rows of 3
    const rows: Array<Array<{ value: string; label: string }>> = [];
    for (let i = 0; i < options.length; i += 3) {
      rows.push(options.slice(i, i + 3));
    }
    const displayRows = rows.slice(0, 2);

    return (
      <VStack bg={isDark ? '#1A1A1A' : '#FFFFFF'} width="100%" mt="$4">
        {options.length === 0 ? (
          <VStack px={12} py="$3" alignItems="center" justifyContent="center" minHeight={60}>
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
          <VStack px={12} py="$3" space="sm" width="100%">
            {displayRows.map((row, rowIndex) => (
              <HStack key={rowIndex} space="sm" justifyContent="space-between" width="100%">
                {row.map((option) => {
                  const selected = isSelected(option.value);
                  return (
                    <Pressable key={option.value} onPress={() => onSelect(option.value)} flex={1} style={{ minHeight: 40 }}>
                      <Box
                        flex={1}
                        bg={selected ? (isDark ? '#2A2A2A' : '#F5F5F5') : 'transparent'}
                        borderWidth={selected ? 1 : 0}
                        borderColor={selected ? '#829905' : 'transparent'}
                        borderRadius={6}
                        px="$1.5"
                        py="$1.5"
                      >
                        <HStack alignItems="center" space="xs" flex={1} justifyContent="flex-start">
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
                            {selected && <Feather name="check" size={12} color="#FFFFFF" />}
                          </Box>
                          <Box flex={1} justifyContent="center">
                            <RNText
                              style={{
                                color: isDark ? '#FFFFFF' : '#000000',
                                fontSize: 12,
                                fontWeight: selected ? '600' : '500',
                                lineHeight: 16,
                              }}
                              numberOfLines={2}
                            >
                              {option.label}
                            </RNText>
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

        <Box px={12} pt="$2" pb="$3" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <HStack space="sm" justifyContent="space-between" width="100%">
            <Pressable onPress={handleClear} flex={1}>
              <Box
                py="$2"
                bg="transparent"
                borderWidth={1}
                borderColor={isDark ? '#444444' : '#E9E9E9'}
                borderRadius={6}
                alignItems="center"
                justifyContent="center"
                minHeight={36}
              >
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#666666',
                  }}
                >
                  Clear
                </RNText>
              </Box>
            </Pressable>
            <Pressable onPress={handleApply} flex={1}>
              <Box
                py="$2"
                bg="#829905"
                borderRadius={6}
                alignItems="center"
                justifyContent="center"
                minHeight={36}
              >
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Apply
                </RNText>
              </Box>
            </Pressable>
          </HStack>
        </Box>
      </VStack>
    );
  };

  // Render filter button
  const renderFilterButton = (
    filterId: string,
    label: string,
    arrowStyle?: ReturnType<typeof useAnimatedStyle>
  ) => {
    const count = getFilterCount(filterId);
    const isActive = count > 0;
    const isOpen = openFilterId === filterId;

    return (
      <Pressable onPress={() => handleFilterToggle(filterId)}>
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
            <Text color={isActive ? '#000000' : '#000000'} fontSize="$2xs" fontWeight="$medium">
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
                <Text color={isActive ? '#FFFFFF' : '#000000'} fontSize="$2xs" fontWeight="$medium">
                  {count}
                </Text>
              </Box>
            )}
          </HStack>
          {arrowStyle ? (
            <Animated.View style={arrowStyle}>
              <Box width={12} height={12} alignItems="center" justifyContent="center">
                <Feather name="chevron-down" size={8} color={isActive ? '#000000' : '#000000'} />
              </Box>
            </Animated.View>
          ) : (
            <Box width={12} height={12} alignItems="center" justifyContent="center">
              <Feather name="chevron-down" size={8} color={isActive ? '#000000' : '#000000'} />
            </Box>
          )}
        </Box>
      </Pressable>
    );
  };

  return (
    <Box position="relative">
      <Box 
        px="$4" 
        pb="$2" 
        mt="$2"
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          filterBarHeight.value = height;
        }}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="sm" alignItems="center">
            {renderFilterButton('interest', 'Interests', interestArrowStyle)}
            {renderFilterButton('tag', 'Tags', tagArrowStyle)}
            {renderFilterButton('category', 'Category', categoryArrowStyle)}
          </HStack>
          <Box>{renderFilterButton('sort', 'Sort', sortArrowStyle)}</Box>
        </HStack>
      </Box>

      {/* Animated Panel - Absolute positioned, z-index on top */}
      <Animated.View
        style={[
          panelStyle,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderTopWidth: openFilterId || lastOpenFilterId ? 1 : 0,
            borderTopColor: isDark ? '#333333' : '#E9E9E9',
            borderBottomWidth: openFilterId || lastOpenFilterId ? 1 : 0,
            borderBottomColor: isDark ? '#333333' : '#E9E9E9',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
          },
        ]}
      >
        {(openFilterId || lastOpenFilterId) && renderFilterPanel()}
      </Animated.View>
    </Box>
  );
};

