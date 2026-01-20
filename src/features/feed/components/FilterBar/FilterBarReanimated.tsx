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
  interpolate,
  runOnJS,
  useAnimatedReaction,
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

// Spring configuration for natural feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Fixed panel height - no calculation needed
const FIXED_PANEL_HEIGHT = 150; // Fixed height in pixels (reduced from 180)

interface FilterBarProps {
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
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
  const filterBarHeight = useSharedValue(0);

  // 🎯 CORE: Single progress sharedValue (0 = closed, 1 = open)
  const progress = useSharedValue(0);
  // Dynamic panel height - calculated based on number of rows
  const panelHeight = useSharedValue(FIXED_PANEL_HEIGHT);
  
  // Track which filter is open (for arrow rotation)
  const openFilterIdShared = useSharedValue<string | null>(null);
  
  // Calculate panel height based on number of rows
  const calculatePanelHeight = useCallback((optionsCount: number, filterId: string) => {
    // Category ve Sort için tek satır yatay scrollable liste
    if (filterId === 'category' || filterId === 'sort') {
      const rowHeight = 28; // minHeight of each option
      const topPadding = 8; // py="$2" = 8px (VStack py="$2")
      const buttonTopPadding = 4; // pt="$1" = 4px
      const buttonBottomPadding = 8; // pb="$2" = 8px
      const buttonHeight = 32; // button minHeight
      
      // Total height = topPadding + rowHeight + buttonTopPadding + buttonHeight + buttonBottomPadding
      const totalHeight = topPadding + rowHeight + buttonTopPadding + buttonHeight + buttonBottomPadding;
      return totalHeight;
    }
    
    // Tags için 2 satır grid (3 sütun)
    if (filterId === 'tag') {
      const rowHeight = 28; // minHeight of each option
      const rowSpacing = 4; // space="xs" between rows (VStack space="xs")
      const topPadding = 8; // py="$2" = 8px (VStack py="$2")
      const buttonTopPadding = 4; // pt="$1" = 4px
      const buttonBottomPadding = 8; // pb="$2" = 8px
      const buttonHeight = 32; // button minHeight
      const rows = 2; // Tags için sabit 2 satır (6 seçenek = 2 satır x 3 sütun)
      
      // Total height = topPadding + (2 rows * rowHeight) + (1 spacing) + buttonTopPadding + buttonHeight + buttonBottomPadding
      const totalHeight = topPadding + (rows * rowHeight) + ((rows - 1) * rowSpacing) + buttonTopPadding + buttonHeight + buttonBottomPadding;
      return totalHeight;
    }
    
    // Interest için dinamik yükseklik (grid, 3 sütun)
    const rows = Math.ceil(optionsCount / 3);
    const rowHeight = 28; // minHeight of each option
    const rowSpacing = 4; // space="xs" between rows
    const topMargin = 16; // mt="$4"
    const topPadding = 8; // py="$2"
    const bottomPadding = 8; // py="$2"
    const buttonArea = 44; // pt="$1" + pb="$2" + button height (32px)
    
    // Total height = margin + padding + (rows * rowHeight) + (spacing between rows) + padding + button area
    const totalHeight = topMargin + topPadding + (rows * rowHeight) + ((rows - 1) * rowSpacing) + bottomPadding + buttonArea;
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

  // FIX: Panel kapatma fonksiyonu
  const closePanel = useCallback(() => {
    setOpenFilterId(null);
    openFilterIdShared.value = null;
    progress.value = withSpring(0, SPRING_CONFIG);
    // Kapanma animasyonu tamamlandıktan sonra lastOpenFilterId'yi temizle
    setTimeout(() => {
      setLastOpenFilterId(null);
    }, 400);
  }, [progress, openFilterIdShared]);

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

  // Toggle filter panel
  const handleFilterToggle = useCallback(
    (filterId: string) => {
      if (__DEV__) {
        console.log('[FilterBarReanimated] handleFilterToggle:', { filterId, openFilterId });
      }
      
      if (openFilterId === filterId) {
        // Close
        closePanel();
      } else {
        // Open - calculate dynamic height based on filter type
        const optionsCount = getOptionsCount(filterId, allCategories.length);
        const calculatedHeight = calculatePanelHeight(optionsCount, filterId);
        
        if (__DEV__) {
          console.log('[FilterBarReanimated] Opening panel:', { filterId, optionsCount, calculatedHeight, filterBarHeight: filterBarHeight.value });
        }
        
        // FIX: Önce state'leri güncelle, sonra animasyonu başlat
        // Bu sayede panel render edilir ve animasyon düzgün çalışır
        setLastOpenFilterId(openFilterId || filterId);
        setOpenFilterId(filterId);
        openFilterIdShared.value = filterId;
        
        // Panel height'ı güncelle (animasyon başlamadan önce)
        panelHeight.value = calculatedHeight;
        
        // FIX: requestAnimationFrame ile animasyonu başlat - DOM'un hazır olmasını bekle
        requestAnimationFrame(() => {
          progress.value = withSpring(1, SPRING_CONFIG);
        });
      }
    },
    [openFilterId, progress, openFilterIdShared, panelHeight, filterBarHeight, getOptionsCount, calculatePanelHeight, allCategories.length]
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

  // Panel animated style - absolute positioned, z-index on top
  const panelStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(progress.value, [0, 1], [0, panelHeight.value]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    // FIX: filterBarHeight 0 ise varsayılan bir değer kullan (filter bar'ın yüksekliği yaklaşık 50px)
    const topPosition = filterBarHeight.value > 0 ? filterBarHeight.value : 50;
    return {
      position: 'absolute' as const,
      top: topPosition,
      left: 0,
      right: 0,
      height,
      opacity,
      overflow: 'hidden' as const, // Animasyon için gerekli
      zIndex: 1000,
      elevation: 10, // Android
      // FIX: Panel içeriği tıklanabilir olmalı (overlay'in üstünde)
      pointerEvents: 'auto' as const,
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

    // Category ve Sort için tek satır yatay scrollable liste
    if (filterIdToRender === 'category' || filterIdToRender === 'sort') {
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
            <VStack px={12} py="$2" width="100%" style={{ paddingBottom: 0 }}>
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
                          borderRadius={6}
                          px="$2"
                          py="$1"
                          minHeight={28}
                        >
                          <HStack alignItems="center" space="xs">
                            <Box
                              width={16}
                              height={16}
                              borderWidth={1.5}
                              borderColor={selected ? '#829905' : isDark ? '#444444' : '#CCCCCC'}
                              borderRadius={4}
                              bg={selected ? '#829905' : 'transparent'}
                              justifyContent="center"
                              alignItems="center"
                              flexShrink={0}
                            >
                              {selected && <CheckIconSolid width={10} height={10} color="#FFFFFF" />}
                            </Box>
                            <RNText
                              style={{
                                color: isDark ? '#FFFFFF' : '#000000',
                                fontSize: 11,
                                fontWeight: selected ? '600' : '500',
                                lineHeight: 14,
                              }}
                              numberOfLines={1}
                            >
                              {option.label}
                            </RNText>
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
          <Box px={12} pt="$1" pb="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'} style={{ paddingTop: 4, paddingBottom: 8 }}>
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
    }

    // Diğer filtreler için mevcut grid yapısı (3 sütun)
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
          <VStack px={12} py="$2" space="xs" width="100%">
            {displayRows.map((row, rowIndex) => (
              <HStack key={rowIndex} space="xs" justifyContent="space-between" width="100%">
                {row.map((option) => {
                  const selected = isSelected(option.value);
                  return (
                    <Pressable key={option.value} onPress={() => onSelect(option.value)} flex={1} style={{ minHeight: 28 }}>
                      <Box
                        flex={1}
                        bg={selected ? (isDark ? '#2A2A2A' : '#F5F5F5') : 'transparent'}
                        borderWidth={selected ? 1 : 0}
                        borderColor={selected ? '#829905' : 'transparent'}
                        borderRadius={6}
                        px="$1"
                        py="$0.5"
                      >
                        <HStack alignItems="center" space="xs" flex={1} justifyContent="flex-start">
                          <Box
                            width={16}
                            height={16}
                            borderWidth={1.5}
                            borderColor={selected ? '#829905' : isDark ? '#444444' : '#CCCCCC'}
                            borderRadius={4}
                            bg={selected ? '#829905' : 'transparent'}
                            justifyContent="center"
                            alignItems="center"
                            flexShrink={0}
                          >
                            {selected && <CheckIconSolid width={10} height={10} color="#FFFFFF" />}
                          </Box>
                          <Box flex={1} justifyContent="center">
                            <RNText
                              style={{
                                color: isDark ? '#FFFFFF' : '#000000',
                                fontSize: 11,
                                fontWeight: selected ? '600' : '500',
                                lineHeight: 14,
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

        <Box px={12} pt="$1" pb="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'} style={{ paddingTop: 4, paddingBottom: 8 }}>
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
          gap={4}
          px="$3"
          
          bg={isActive ? '#E2FF46' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isActive ? '#E2FF46' : '#E9E9E9'}
          borderRadius={10}
          height={23}
        >
          <HStack alignItems="center" space="xs">
            <Text color={isActive ? '#000000' : '#000000'} fontSize="$xs" fontWeight="$medium">
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
                <Text color={isActive ? '#FFFFFF' : '#000000'} fontSize="$xs" fontWeight="$medium">
                  {count}
                </Text>
              </Box>
            )}
          </HStack>
          {arrowStyle ? (
            <Animated.View style={arrowStyle}>
              <Box width={12} height={12} alignItems="center" justifyContent="center">
                <ChevronDownIcon width={8} height={8} color={isActive ? '#000000' : '#000000'} />
              </Box>
            </Animated.View>
          ) : (
            <Box width={12} height={12} alignItems="center" justifyContent="center">
              <ChevronDownIcon width={8} height={8} color={isActive ? '#000000' : '#000000'} />
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
          // FIX: filterBarHeight'ı hemen güncelle (animasyon başlamadan önce)
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
      {/* FIX: Panel'i her zaman render et, sadece opacity ve height ile kontrol et */}
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
        pointerEvents={(openFilterId || lastOpenFilterId) ? 'auto' : 'none'}
      >
        {(openFilterId || lastOpenFilterId) && renderFilterPanel()}
      </Animated.View>

      {/* FIX: Overlay kaldırıldı - FeedScreen seviyesinde overlay kullanılıyor */}
    </Box>
  );
};

