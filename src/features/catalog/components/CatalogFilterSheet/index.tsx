/**
 * CatalogFilterSheet - List selection bottom sheet content for product catalog
 * Same UI pattern as FeedFilterSheet but with catalog-specific options (tag, sort)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckIcon } from 'react-native-heroicons/solid';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { CatalogFilterId, CatalogFilterParams } from '../CatalogFilterChips';

export const TAG_OPTIONS = [
  { value: 'all', labelKey: 'brandProductDetail.filters.tagOptions.all' },
  { value: 'reviews', labelKey: 'brandProductDetail.filters.tagOptions.reviews' },
  { value: 'benchmarks', labelKey: 'brandProductDetail.filters.tagOptions.benchmarks' },
  { value: 'tips_and_tricks', labelKey: 'brandProductDetail.filters.tagOptions.tipsAndTricks' },
  { value: 'questions', labelKey: 'brandProductDetail.filters.tagOptions.questions' },
  { value: 'updates', labelKey: 'brandProductDetail.filters.tagOptions.updates' },
  { value: 'news', labelKey: 'brandProductDetail.filters.tagOptions.news' },
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'brandProductDetail.filters.sortOptions.newest' },
  { value: 'oldest', labelKey: 'brandProductDetail.filters.sortOptions.oldest' },
  { value: 'most_popular', labelKey: 'brandProductDetail.filters.sortOptions.mostPopular' },
] as const;

interface CatalogFilterSheetProps {
  filterId: CatalogFilterId;
  filters: CatalogFilterParams;
  onFiltersChange: (filters: CatalogFilterParams) => void;
  onClose: () => void;
}

export const CatalogFilterSheet: React.FC<CatalogFilterSheetProps> = React.memo(({
  filterId,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { t } = useTranslation('catalog');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [localFilters, setLocalFilters] = useState<CatalogFilterParams>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const options = useMemo(() => {
    switch (filterId) {
      case 'tag':
        return TAG_OPTIONS;
      case 'sort':
        return SORT_OPTIONS;
      default:
        return [];
    }
  }, [filterId]);

  const title = useMemo(() => {
    switch (filterId) {
      case 'tag':
        return t('brandProductDetail.filters.title.tags');
      case 'sort':
        return t('brandProductDetail.filters.title.sort');
      default:
        return '';
    }
  }, [filterId, t]);

  const isSelected = useCallback((value: string) => {
    switch (filterId) {
      case 'tag':
        // If no tag filter is set, "all" is selected by default
        if (!localFilters.tag || localFilters.tag === 'all') {
          return value === 'all';
        }
        return localFilters.tag === value;
      case 'sort':
        // If no sort is set, "newest" is selected by default
        if (!localFilters.sort || localFilters.sort === 'newest') {
          return value === 'newest';
        }
        return localFilters.sort === value;
      default:
        return false;
    }
  }, [filterId, localFilters]);

  const handleToggle = useCallback((value: string) => {
    switch (filterId) {
      case 'tag': {
        const newVal = value === 'all' ? undefined : value;
        setLocalFilters({ ...localFilters, tag: newVal });
        break;
      }
      case 'sort': {
        const newVal = value === 'newest' ? undefined : value;
        setLocalFilters({ ...localFilters, sort: newVal });
        break;
      }
    }
  }, [filterId, localFilters]);

  const handleClear = useCallback(() => {
    switch (filterId) {
      case 'tag':
        setLocalFilters({ ...localFilters, tag: undefined });
        break;
      case 'sort':
        setLocalFilters({ ...localFilters, sort: undefined });
        break;
    }
  }, [filterId, localFilters]);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>

      <View style={styles.list}>
        {options.map((option, index) => {
          const selected = isSelected(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => handleToggle(option.value)}
              style={[
                styles.row,
                selected && styles.rowSelected,
                index < options.length - 1 && [styles.rowBorder, { borderBottomColor: isDark ? '#333333' : '#F0F0F0' }],
              ]}
            >
              <Text style={[styles.rowText, { color: isDark ? '#CCCCCC' : '#333333' }, selected && styles.rowTextSelected, selected && { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {t(option.labelKey)}
              </Text>
              {selected && (
                <CheckIcon width={18} height={18} color="#829905" />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleClear} style={[styles.clearButton, { borderColor: isDark ? '#333333' : '#E9E9E9' }]}>
          <Text style={[styles.clearButtonText, { color: isDark ? '#AAAAAA' : '#666666' }]}>{t('brandProductDetail.filters.clear')}</Text>
        </Pressable>
        <Pressable onPress={handleApply} style={styles.applyButton}>
          <Text style={styles.applyButtonText}>{t('brandProductDetail.filters.apply')}</Text>
        </Pressable>
      </View>
    </View>
  );
});

CatalogFilterSheet.displayName = 'CatalogFilterSheet';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  list: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowSelected: {
    backgroundColor: 'transparent',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  rowTextSelected: {
    fontWeight: '600',
    color: '#000000',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    paddingBottom: 16,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#D0F205',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
});
