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
import { Text as RNText, ScrollView } from 'react-native';
import { HStack, Pressable, Text, Box, VStack } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import {
  CheckIcon,
  ChevronDownIcon,
} from 'react-native-heroicons/outline';
import { CheckIcon as CheckIconSolid } from 'react-native-heroicons/solid';
import { useCatalogCategories, useCatalogSubCategories } from '@/src/features/catalog/api/hooks';
import type { CatalogCategory, CatalogSubCategory } from '@/src/features/catalog/types';
import type { FeedFilterParams } from '../../api/feedApi';

// Filter options - Tags dropdown
// Backend mapping: Free→FREE, Benchmark→COMPARE, Experience→EXPERIENCE, Update→UPDATE, Question→QUESTION, Tips and Tricks→TIPS
// Backend'e UI değerleri gönderilir, backend kendi mapping'ini yapar
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

// Spring configuration for open animation (natural feel)
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Kapanışta overshoot olmasın, tek seferde yerleşsin
const CLOSE_TIMING_CONFIG = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};

// Fixed panel height - no calculation needed
const FIXED_PANEL_HEIGHT = 150; // Fixed height in pixels (reduced from 180)

interface FilterBarProps {
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  // NEW: Bottom sheet mode - callback when filter button is clicked
  onFilterButtonPress?: (filterId: string) => void;
  // Expose sharedValues for direct access (better performance)
  onSharedValuesReady?: (values: { progress: SharedValue<number>; panelHeight: SharedValue<number> }) => void;
  // FIX: Panel açık/kapalı durumunu parent'a bildir (overlay için)
  onPanelStateChange?: (isOpen: boolean) => void;
  // FIX: Panel kapatma fonksiyonunu expose et (overlay için)
  onClosePanelRef?: (closeFn: () => void) => void;
  // FIX: Panel height değişikliklerini parent'a bildir (FlatList padding için)
  onPanelHeightChange?: (height: number) => void;
}

/**
 * FilterBar - Performance-optimized with Reanimated
 * 
 * Exposes animated translateY style for FeedScreen integration
 */
export const FilterBarReanimated: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onFilterButtonPress,
  onSharedValuesReady,
  onPanelStateChange,
  onClosePanelRef,
  onPanelHeightChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // State
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [lastOpenFilterId, setLastOpenFilterId] = useState<string | null>(null);

  // FIX: Debounce mechanism to prevent multiple rapid calls
  const lastToggleTimeRef = useRef<number>(0);
  const TOGGLE_DEBOUNCE_MS = 300; // 300ms debounce

  // 🎯 CORE: Single progress sharedValue (0 = closed, 1 = open)
  const progress = useSharedValue(0);
  // Dynamic panel height - calculated based on number of rows
  const panelHeight = useSharedValue(FIXED_PANEL_HEIGHT);
  
  // Track which filter is open (for arrow rotation)
  const openFilterIdShared = useSharedValue<string | null>(null);
  
  // Calculate panel height based on number of rows
  const calculatePanelHeight = useCallback((optionsCount: number, filterId: string) => {
    // Sort için tek satır yatay scrollable liste
    if (filterId === 'sort') {
      const rowHeight = 32; // minHeight of each option
      const topPadding = 8; // py="$2" = 8px (VStack py="$2")
      const bottomPadding = 8; // py="$2" = 8px bottom (VStack py="$2")

      // Button area için gerçek değerler (satır 636-681)
      const buttonContainerPaddingTop = 6; // pt="$1.5" = 6px
      const buttonContainerPaddingX = 12; // px={12}
      const buttonContainerPaddingBottom = 16; // style={{ paddingBottom: 16 }} - UPDATED
      const buttonMinHeight = 36; // minHeight={36}
      const buttonPaddingY = 6; // py="$1.5" = 6px (üst+alt)
      const extraSafeSpace = 8; // Additional breathing room

      // Total height = content + button area + safe space
      const totalHeight =
        topPadding +
        rowHeight +
        bottomPadding +
        buttonContainerPaddingTop +
        buttonMinHeight +
        buttonContainerPaddingBottom +
        extraSafeSpace;
      return totalHeight;
    }

    // Tags ve Category için grid (3 sütun)
    if (filterId === 'tag' || filterId === 'category') {
      const rowHeight = 44; // minHeight for potential 2-line text wrapping
      const rowSpacing = 4; // space="xs" between rows
      const topPadding = 8; // py="$2" = 8px (VStack py="$2")
      const bottomPadding = 8; // py="$2" = 8px bottom (VStack py="$2")
      const rows = filterId === 'tag' ? 2 : Math.ceil(optionsCount / 3); // Tags için sabit 2 satır, Category için dinamik

      // Button area için gerçek değerler (satır 764-809)
      const buttonContainerPaddingTop = 4; // pt="$1" = 4px
      const buttonContainerPaddingX = 12; // px={12}
      const buttonContainerPaddingBottom = 16; // style={{ paddingBottom: 16 }} - UPDATED
      const buttonMinHeight = 32; // minHeight={32}
      const buttonPaddingY = 6; // py="$1.5" = 6px (üst+alt)
      const extraSafeSpace = 8; // Additional breathing room

      // Total height = content + button area + safe space
      const totalHeight =
        topPadding +
        (rows * rowHeight) +
        ((rows - 1) * rowSpacing) +
        bottomPadding +
        buttonContainerPaddingTop +
        buttonMinHeight +
        buttonContainerPaddingBottom +
        extraSafeSpace;
      return totalHeight;
    }

    // Interest için dinamik yükseklik (grid, 3 sütun)
    const rows = Math.ceil(optionsCount / 3);
    const rowHeight = 44; // minHeight for potential 2-line text wrapping
    const rowSpacing = 4; // space="xs" between rows
    const topPadding = 8; // py="$2"
    const bottomPadding = 8; // py="$2" = 8px bottom (VStack py="$2")

    // Button area için gerçek değerler (satır 764-809)
    const buttonContainerPaddingTop = 4; // pt="$1" = 4px
    const buttonContainerPaddingX = 12; // px={12}
    const buttonContainerPaddingBottom = 2; // style={{ paddingBottom: 2 }}
    const buttonMinHeight = 32; // minHeight={32}
    const buttonPaddingY = 6; // py="$1.5" = 6px (üst+alt)
    const extraSafeSpace = 28; // CRITICAL: Generous space to ensure buttons are fully visible

    // Total height = content + button area + safe space
    const totalHeight =
      topPadding +
      (rows * rowHeight) +
      ((rows - 1) * rowSpacing) +
      bottomPadding +
      buttonContainerPaddingTop +
      buttonMinHeight +
      buttonContainerPaddingBottom +
      extraSafeSpace;
    return totalHeight;
  }, []);

  // Categories
  const { data: catalogCategoriesData } = useCatalogCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { data: catalogSubCategoriesData } = useCatalogSubCategories(selectedCategoryId || undefined);

  // FIX: API'den gelen data'yı items array'inden çıkar
  const catalogCategories = useMemo(() => {
    if (!catalogCategoriesData?.items) return [];
    return catalogCategoriesData.items;
  }, [catalogCategoriesData]);

  const catalogSubCategories = useMemo(() => {
    if (!catalogSubCategoriesData?.items) return [];
    return catalogSubCategoriesData.items;
  }, [catalogSubCategoriesData]);

  // Auto-select first category
  useEffect(() => {
    if (!selectedCategoryId && catalogCategories && catalogCategories.length > 0) {
      setSelectedCategoryId(catalogCategories[0].categoryId);
    }
  }, [catalogCategories, selectedCategoryId]);

  // Merge categories - FIX: Tüm kategorileri göster (filtreleme kaldırıldı)
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

    if (__DEV__ && catalogCategories && catalogCategories.length > 0) {
      console.log('[FilterBarReanimated] Available categories:', catalogCategories.map(c => c.name));
    }

    // FIX: Tüm kategorileri ekle (filtreleme yok)
    if (catalogCategories && Array.isArray(catalogCategories)) {
      catalogCategories.forEach((cat: CatalogCategory) => {
        const normalizedName = normalizeName(cat.name);
        if (seenIds.has(cat.categoryId) || normalizedNamesMap.has(normalizedName)) return;
        categoriesMap.set(cat.categoryId, { id: cat.categoryId, name: cat.name, type: 'main' });
        normalizedNamesMap.set(normalizedName, cat.categoryId);
        seenIds.add(cat.categoryId);
        
        if (__DEV__) {
          console.log('[FilterBarReanimated] Added category:', cat.name);
        }
      });
    }

    // FIX: Tüm alt kategorileri ekle (filtreleme yok)
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

    if (__DEV__) {
      console.log('[FilterBarReanimated] Final categories count:', categoriesMap.size);
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

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      // Category tek bir string olarak saklanır (array değil)
      // Eğer aynı kategori seçilirse, filtreyi temizle
      const newCategory = filters.category === categoryId ? undefined : categoryId;

      onFiltersChange({
        ...filters,
        category: newCategory,
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

  // Get options count for a filter type
  const getOptionsCount = useCallback((filterId: string, allCategoriesLength: number) => {
    switch (filterId) {
      case 'interest':
        return INTEREST_OPTIONS.length;
      case 'tag':
        return TAG_OPTIONS.length;
      case 'category':
        return allCategoriesLength;
      case 'sort':
        return SORT_OPTIONS.length;
      default:
        return 0;
    }
  }, []);

  // FIX: Panel kapatma - withTiming ile tek seferde kapanır (spring overshoot = çift sıçrama yok)
  // lastOpenFilterId bir frame sonra temizlenir, içerik unmount layout tam oturduktan sonra olur
  const scheduleClearLastFilterId = useCallback(() => {
    requestAnimationFrame(() => setLastOpenFilterId(null));
  }, []);
  const closePanel = useCallback(() => {
    setOpenFilterId(null);
    openFilterIdShared.value = null;
    progress.value = withTiming(0, CLOSE_TIMING_CONFIG, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(scheduleClearLastFilterId)();
      }
    });
  }, [progress, openFilterIdShared, scheduleClearLastFilterId]);

  // FIX: Panel kapatma fonksiyonunu parent'a expose et
  useEffect(() => {
    if (onClosePanelRef) {
      onClosePanelRef(closePanel);
    }
  }, [onClosePanelRef, closePanel]);

  // FIX: Panel durumu değiştiğinde parent'a bildir
  useEffect(() => {
    if (onPanelStateChange) {
      onPanelStateChange(!!(openFilterId || lastOpenFilterId));
    }
  }, [openFilterId, lastOpenFilterId, onPanelStateChange]);

  // Toggle filter panel or trigger bottom sheet
  const handleFilterToggle = useCallback(
    (filterId: string) => {
      // FIX: Debounce rapid calls to prevent double-trigger issues
      const now = Date.now();
      if (now - lastToggleTimeRef.current < TOGGLE_DEBOUNCE_MS) {
        if (__DEV__) {
          console.log('[FilterBarReanimated] handleFilterToggle debounced (too fast)');
        }
        return;
      }
      lastToggleTimeRef.current = now;

      if (__DEV__) {
        console.log('[FilterBarReanimated] handleFilterToggle:', { filterId, openFilterId, useBottomSheet: !!onFilterButtonPress });
      }

      // NEW: If onFilterButtonPress callback is provided, use bottom sheet mode
      if (onFilterButtonPress) {
        onFilterButtonPress(filterId);
        return;
      }

      // OLD: Use panel mode
      if (openFilterId === filterId) {
        // Close
        closePanel();
      } else {
        // Open - calculate dynamic height based on filter type
        const optionsCount = getOptionsCount(filterId, allCategories.length);
        const calculatedHeight = calculatePanelHeight(optionsCount, filterId);

        // FIX: State güncellemeleri önce yap
        setLastOpenFilterId(openFilterId || filterId);
        setOpenFilterId(filterId);

        // FIX: Shared value yazma işlemlerini render cycle'ından sonraya ertele
        // requestAnimationFrame kullanarak Reanimated warning'ini önle
        requestAnimationFrame(() => {
          openFilterIdShared.value = filterId;
          panelHeight.value = calculatedHeight;
          progress.value = withSpring(1, SPRING_CONFIG);
        });
      }
    },
    [onFilterButtonPress, openFilterId, progress, openFilterIdShared, panelHeight, getOptionsCount, calculatePanelHeight, allCategories.length, closePanel]
  );

  // Apply filters (close panel)
  const handleApply = useCallback(() => {
    // Close: Keep panelHeight constant, only animate progress
    // Keep lastOpenFilterId for smooth close animation
    closePanel();
    // Don't change panelHeight - it should stay constant during close animation
    // Note: lastOpenFilterId is kept for renderFilterPanel to show content during close animation
  }, [closePanel]);

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
        onFiltersChange({ ...filters, category: undefined }); // Category tek bir string, undefined yap
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

  // FIX: Panel height değişikliklerini parent'a bildir (FlatList padding için)
  // Progress > 0 olduğunda (panel açık) panel height'ı gönder, 0 olduğunda (panel kapalı) 0 gönder
  useAnimatedReaction(
    () => {
      // Panel açık mı kontrol et (progress > 0)
      const isOpen = progress.value > 0;
      const height = isOpen ? panelHeight.value : 0;
      return height;
    },
    (height) => {
      // Panel height değiştiğinde parent'a bildir
      if (onPanelHeightChange) {
        runOnJS(onPanelHeightChange)(height);
      }
    },
    [onPanelHeightChange]
  );

  // Panel animated style - IN FLOW: aşağı doğru açılır, feed içeriği aşağı kayar (modal/overlay yok)
  // height 0'ın altına inmesin (overshoot / ikinci layout sıçraması önlenir)
  const panelStyle = useAnimatedStyle(() => {
    'worklet';
    const rawHeight = interpolate(progress.value, [0, 1], [0, panelHeight.value]);
    const height = Math.max(0, rawHeight);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      height,
      opacity,
      overflow: 'hidden' as const,
      width: '100%' as const,
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
        return filters.category ? 1 : 0; // Category tek bir string, 0 veya 1
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
          return filters.category === value; // Category tek bir string, direkt karşılaştır
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
        onSelect = handleCategoryToggle;
        isMultipleSelection = false; // Sort gibi tek seçimli
        break;
      case 'sort':
        options = [...SORT_OPTIONS];
        onSelect = (value: string) => handleSortSelect(value as 'recent' | 'top');
        isMultipleSelection = false;
        break;
      default:
        return null;
    }

    // Sort için tek satır yatay scrollable liste
    if (filterIdToRender === 'sort') {
      return (
        <VStack bg={isDark ? '#1A1A1A' : '#FFFFFF'} width="100%">
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
              {/* Tek satır yatay scrollable liste */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 12 }}
              >
                <HStack space="xs" alignItems="center">
                  {options.map((option) => {
                    const selected = isSelected(option.value);
                    return (
                      <Pressable key={option.value} onPress={() => onSelect(option.value)}>
                        <Box
                          bg={selected ? (isDark ? '#2A2A2A' : '#F5F5F5') : 'transparent'}
                          borderWidth={selected ? 1 : 0}
                          borderColor={selected ? '#829905' : 'transparent'}
                          borderRadius={7}
                          px="$2"
                          py="$1"
                          minHeight={32}
                          maxWidth={140}
                        >
                          <HStack alignItems="center" space="xs">
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
                            <Box flexShrink={1} style={{ maxWidth: 110 }}>
                              <RNText
                                style={{
                                  color: isDark ? '#FFFFFF' : '#000000',
                                  fontSize: 12,
                                  fontWeight: selected ? '600' : '500',
                                  lineHeight: 16,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {option.label}
                              </RNText>
                            </Box>
                          </HStack>
                        </Box>
                      </Pressable>
                    );
                  })}
                </HStack>
              </ScrollView>
            </VStack>
          )}

          {/* Clear ve Apply butonları */}
          <Box px={12} pt="$1.5" bg={isDark ? '#1A1A1A' : '#FFFFFF'} style={{ paddingTop: 6, paddingBottom: 16 }}>
            <HStack space="xs" justifyContent="space-between" width="100%">
              <Pressable onPress={handleClear} flex={1}>
                <Box
                  py="$1.5"
                  bg="transparent"
                  borderWidth={1}
                  borderColor={isDark ? '#444444' : '#E9E9E9'}
                  borderRadius={7}
                  alignItems="center"
                  justifyContent="center"
                  minHeight={36}
                >
                  <RNText
                    style={{
                      fontSize: 13,
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
                  py="$1.5"
                  bg="#829905"
                  borderRadius={7}
                  alignItems="center"
                  justifyContent="center"
                  minHeight={36}
                >
                  <RNText
                    style={{
                      fontSize: 13,
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
    }

    // Tags, Category, Interest için grid yapısı (3 sütun)
    // Group options into rows of 3
    const rows: Array<Array<{ value: string; label: string }>> = [];
    for (let i = 0; i < options.length; i += 3) {
      rows.push(options.slice(i, i + 3));
    }
    // Show all rows (not limited to 2) - height is now dynamic
    const displayRows = rows;

    return (
      <VStack bg={isDark ? '#1A1A1A' : '#FFFFFF'} width="100%">
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
            {displayRows.map((row, rowIndex) => (
              <HStack key={rowIndex} space="xs" justifyContent="space-between" width="100%">
                {row.map((option) => {
                  const selected = isSelected(option.value);
                  return (
                    <Pressable key={option.value} onPress={() => onSelect(option.value)} flex={1} style={{ minHeight: 44 }}>
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
                            <RNText
                              style={{
                                color: isDark ? '#FFFFFF' : '#000000',
                                fontSize: 12,
                                fontWeight: selected ? '600' : '500',
                                lineHeight: 16,
                                flexWrap: 'wrap',
                              }}
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

        <Box px={12} pt="$1" bg={isDark ? '#1A1A1A' : '#FFFFFF'} style={{ paddingTop: 4, paddingBottom: 16 }}>
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
                py="$1.5"
                bg="#829905"
                borderRadius={6}
                alignItems="center"
                justifyContent="center"
                minHeight={32}
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
          gap={5}
          px="$3"

          bg={isActive ? '#E2FF46' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isActive ? '#E2FF46' : '#E9E9E9'}
          borderRadius={10}
          height={26}
        >
          <HStack alignItems="center" space="xs">
            <Text color={isActive ? '#000000' : '#000000'} fontSize="$xs" fontWeight="$semibold">
              {label}
            </Text>
            {count > 0 && (
              <Box
                bg={isActive ? '#000000' : '#E2FF46'}
                borderRadius={9}
                px={6}
                minWidth={18}
                height={18}
                alignItems="center"
                justifyContent="center"
              >
                <Text color={isActive ? '#FFFFFF' : '#000000'} fontSize="$xs" fontWeight="$semibold">
                  {count}
                </Text>
              </Box>
            )}
          </HStack>
          {arrowStyle ? (
            <Animated.View style={arrowStyle}>
              <Box width={12} height={12} alignItems="center" justifyContent="center">
                <ChevronDownIcon width={9} height={9} color={isActive ? '#000000' : '#000000'} />
              </Box>
            </Animated.View>
          ) : (
            <Box width={12} height={12} alignItems="center" justifyContent="center">
              <ChevronDownIcon width={9} height={9} color={isActive ? '#000000' : '#000000'} />
            </Box>
          )}
        </Box>
      </Pressable>
    );
  };

  return (
    <Box position="relative">
      <Box px="$4" pb="$2" mt="$2">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="sm" alignItems="center">
            {renderFilterButton('interest', 'Interests', interestArrowStyle)}
            {renderFilterButton('tag', 'Tags', tagArrowStyle)}
            {renderFilterButton('category', 'Category', categoryArrowStyle)}
          </HStack>
          <Box>{renderFilterButton('sort', 'Sort', sortArrowStyle)}</Box>
        </HStack>
      </Box>

      {/* Animated Panel - IN FLOW: aşağı doğru açılır, feed aşağı kayar (aynı z-index, overlay yok) */}
      <Animated.View
        style={[
          panelStyle,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderTopWidth: (openFilterId || lastOpenFilterId) ? 1 : 0,
            borderTopColor: isDark ? '#333333' : '#E9E9E9',
            borderBottomWidth: (openFilterId || lastOpenFilterId) ? 1 : 0,
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

