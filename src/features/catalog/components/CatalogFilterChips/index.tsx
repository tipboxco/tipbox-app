/**
 * CatalogFilterChips - Horizontal chip/pill filter buttons for product catalog
 * Same UI pattern as FeedFilterChips but with catalog-specific filter options (tag, sort)
 */

import React, { useCallback } from 'react';
import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { ChevronDownIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useColorMode } from '@/src/hooks/useColorMode';

export type CatalogFilterId = 'tag' | 'sort';

export interface CatalogFilterParams {
  tag?: string;
  sort?: string;
}

interface CatalogFilterChipsProps {
  filters: CatalogFilterParams;
  onFilterPress: (filterId: CatalogFilterId) => void;
  onClearAll: () => void;
}

const FILTER_BUTTONS: { id: CatalogFilterId; labelKey: string }[] = [
  { id: 'tag', labelKey: 'brandProductDetail.filterButtons.tags' },
  { id: 'sort', labelKey: 'brandProductDetail.filterButtons.sort' },
];

const getFilterCount = (filterId: CatalogFilterId, filters: CatalogFilterParams): number => {
  switch (filterId) {
    case 'tag':
      return filters.tag && filters.tag !== 'all' ? 1 : 0;
    case 'sort':
      return filters.sort && filters.sort !== 'newest' ? 1 : 0;
    default:
      return 0;
  }
};

export const CatalogFilterChips: React.FC<CatalogFilterChipsProps> = React.memo(({
  filters,
  onFilterPress,
  onClearAll,
}) => {
  const { t } = useTranslation('catalog');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const hasAnyActiveFilter = !!(
    (filters.tag && filters.tag !== 'all') ||
    (filters.sort && filters.sort !== 'newest')
  );

  const handlePress = useCallback((filterId: CatalogFilterId) => {
    onFilterPress(filterId);
  }, [onFilterPress]);

  const getChipLabel = useCallback((filterId: CatalogFilterId): string => {
    const baseLabel = t(FILTER_BUTTONS.find(b => b.id === filterId)?.labelKey || '');

    if (filterId === 'tag' && filters.tag && filters.tag !== 'all') {
      const tagKey = `brandProductDetail.filters.tagOptions.${filters.tag === 'tips_and_tricks' ? 'tipsAndTricks' : filters.tag}`;
      return t(tagKey);
    }
    if (filterId === 'sort' && filters.sort && filters.sort !== 'newest') {
      const sortKey = `brandProductDetail.filters.sortOptions.${filters.sort === 'most_popular' ? 'mostPopular' : filters.sort}`;
      return t(sortKey);
    }
    return baseLabel;
  }, [filters, t]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hasAnyActiveFilter && (
          <Pressable
            onPress={onClearAll}
            style={[
              styles.clearAllChip,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderColor: isDark ? '#444444' : '#E9E9E9',
              },
            ]}
          >
            <XMarkIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
            <Text style={[styles.clearAllText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {t('brandProductDetail.filterButtons.clearAll')}
            </Text>
          </Pressable>
        )}
        {FILTER_BUTTONS.map((button) => {
          const count = getFilterCount(button.id, filters);
          const isActive = count > 0;

          return (
            <Pressable
              key={button.id}
              onPress={() => handlePress(button.id)}
              style={[
                styles.chip,
                isActive
                  ? styles.chipActive
                  : [styles.chipInactive, {
                      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                      borderColor: isDark ? '#444444' : '#E9E9E9',
                    }],
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: isActive ? '#000000' : (isDark ? '#FFFFFF' : '#000000') },
                isActive && styles.chipTextActive,
              ]}>
                {getChipLabel(button.id)}
              </Text>
              <ChevronDownIcon width={9} height={9} color={isActive ? '#000000' : (isDark ? '#FFFFFF' : '#000000')} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

CatalogFilterChips.displayName = 'CatalogFilterChips';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E9E9E9',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#E2FF46',
    borderColor: '#E2FF46',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9E9E9',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  chipTextActive: {
    fontWeight: '700',
  },
});
