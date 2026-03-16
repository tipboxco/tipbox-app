/**
 * FilterFeed - Filter options component for GlobalBottomSheet
 * Handles all filter logic for feed (interests, tags, category, sort)
 *
 * PERFORMANCE FIX: Memoization to reduce render time
 */

import React, { useMemo, useCallback } from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { HStack, Box, Text, VStack } from '@/src/components/ui';
import { CheckIcon as CheckIconSolid } from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { FeedFilterParams } from '../api/feedApi';
import { useTranslation } from '@/src/hooks/useTranslation';

// Filter options - Tags dropdown (values are API keys, labels come from i18n)
export const TAG_OPTIONS = [
  { value: 'Free', labelKey: 'filterFeed.tagOptions.free' },
  { value: 'Benchmark', labelKey: 'filterFeed.tagOptions.benchmark' },
  { value: 'Experience', labelKey: 'filterFeed.tagOptions.experience' },
  { value: 'Update', labelKey: 'filterFeed.tagOptions.update' },
  { value: 'Question', labelKey: 'filterFeed.tagOptions.question' },
  { value: 'Tips and Tricks', labelKey: 'filterFeed.tagOptions.tipsAndTricks' },
] as const;

export const INTEREST_OPTIONS = [
  { value: 'TRUSTER', labelKey: 'filterFeed.interestOptions.truster' },
  { value: 'CATEGORY_MATCH', labelKey: 'filterFeed.interestOptions.categoryMatch' },
  { value: 'TRENDING', labelKey: 'filterFeed.interestOptions.trending' },
  { value: 'NEW_USER', labelKey: 'filterFeed.interestOptions.newUser' },
  { value: 'BOOSTED', labelKey: 'filterFeed.interestOptions.boosted' },
  { value: 'INVENTORY_MATCH', labelKey: 'filterFeed.interestOptions.inventoryMatch' },
  { value: 'PRODUCT_GROUP_MATCH', labelKey: 'filterFeed.interestOptions.productGroupMatch' },
] as const;

export const SORT_OPTIONS = [
  { value: 'recent', labelKey: 'filterFeed.sortOptions.recent' },
  { value: 'oldest', labelKey: 'filterFeed.sortOptions.oldest' },
  { value: 'top', labelKey: 'filterFeed.sortOptions.top' },
] as const;

// Fixed categories - Beauty and Electronics
export const CATEGORY_OPTIONS = [
  { value: 'beauty', labelKey: 'filterFeed.categoryOptions.beauty' },
  { value: 'electronics', labelKey: 'filterFeed.categoryOptions.electronics' },
] as const;

interface FilterFeedProps {
  filterId: 'interest' | 'tag' | 'category' | 'sort';
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  onClose: () => void;
}

export const FilterFeed: React.FC<FilterFeedProps> = React.memo(({
  filterId,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('feed');

  // Local state for filters - only apply when "Apply" is clicked
  const [localFilters, setLocalFilters] = React.useState<FeedFilterParams>(filters);

  // Update local state when filters prop changes (e.g., when bottom sheet reopens)
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // PERFORMANCE FIX: Memoize options to prevent re-creation on every render
  const options = useMemo(() => {
    switch (filterId) {
      case 'interest':
        return INTEREST_OPTIONS;
      case 'tag':
        return TAG_OPTIONS;
      case 'category':
        return CATEGORY_OPTIONS;
      case 'sort':
        return SORT_OPTIONS;
      default:
        return [];
    }
  }, [filterId]);

  // PERFORMANCE FIX: Memoize isSelected function
  const isSelected = useCallback((value: string) => {
    switch (filterId) {
      case 'interest':
        return localFilters.interests?.includes(value) || false;
      case 'tag':
        return localFilters.tags?.includes(value) || false;
      case 'category':
        return localFilters.category === value;
      case 'sort':
        return localFilters.sort === value;
      default:
        return false;
    }
  }, [filterId, localFilters]);

  // PERFORMANCE FIX: Memoize handleToggle function
  const handleToggle = useCallback((value: string) => {
    switch (filterId) {
      case 'interest': {
        const currentInterests = localFilters.interests || [];
        const newInterests = currentInterests.includes(value)
          ? currentInterests.filter((v) => v !== value)
          : [...currentInterests, value];
        setLocalFilters({ ...localFilters, interests: newInterests.length > 0 ? newInterests : undefined });
        break;
      }
      case 'tag': {
        const currentTags = localFilters.tags || [];
        const newTags = currentTags.includes(value)
          ? currentTags.filter((v) => v !== value)
          : [...currentTags, value];
        setLocalFilters({ ...localFilters, tags: newTags.length > 0 ? newTags : undefined });
        break;
      }
      case 'category': {
        const newCategory = localFilters.category === value ? undefined : value;
        setLocalFilters({ ...localFilters, category: newCategory });
        break;
      }
      case 'sort': {
        const newSort = localFilters.sort === value ? undefined : (value as 'recent' | 'top' | 'oldest');
        setLocalFilters({ ...localFilters, sort: newSort });
        break;
      }
    }
  }, [filterId, localFilters]);

  // PERFORMANCE FIX: Memoize handleClear function
  const handleClear = useCallback(() => {
    switch (filterId) {
      case 'interest':
        setLocalFilters({ ...localFilters, interests: undefined });
        break;
      case 'tag':
        setLocalFilters({ ...localFilters, tags: undefined });
        break;
      case 'category':
        setLocalFilters({ ...localFilters, category: undefined });
        break;
      case 'sort':
        setLocalFilters({ ...localFilters, sort: undefined });
        break;
    }
  }, [filterId, localFilters]);

  // PERFORMANCE FIX: Memoize handleApply function
  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  // PERFORMANCE FIX: Memoize title
  const title = useMemo(() => {
    switch (filterId) {
      case 'interest':
        return t('filterFeed.title.interests');
      case 'tag':
        return t('filterFeed.title.tags');
      case 'category':
        return t('filterFeed.title.category');
      case 'sort':
        return t('filterFeed.title.sort');
      default:
        return '';
    }
  }, [filterId, t]);

  // PERFORMANCE FIX: Memoize rows to prevent re-calculation on every render
  const rows = useMemo(() => {
    const result: Array<Array<typeof options[number]>> = [];
    for (let i = 0; i < options.length; i += 3) {
      result.push(options.slice(i, i + 3));
    }
    return result;
  }, [options]);

  return (
    <VStack bg={isDark ? '#1A1A1A' : '#FFFFFF'} width="100%">
      <Text fontSize={16} fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'} mb="$4" textAlign="center">
        {title}
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
            {t('filterFeed.loading')}
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
                            {t(option.labelKey)}
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
                {t('filterFeed.clear')}
              </Text>
            </Box>
          </Pressable>
          <Pressable onPress={handleApply} flex={1}>
            <Box py="$1.5" bg="#D0F205" borderRadius={6} alignItems="center" justifyContent="center" minHeight={32}>
              <Text fontSize={12} fontWeight="$bold" color="#000000">
                {t('filterFeed.apply')}
              </Text>
            </Box>
          </Pressable>
        </HStack>
      </Box>
    </VStack>
  );
});
