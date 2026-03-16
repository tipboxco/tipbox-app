/**
 * FeedFilterSheet - Grid card selection bottom sheet content
 * Shows filter options in a 2-column grid layout with multi/single select
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { CheckIcon } from 'react-native-heroicons/solid';
import type { FeedFilterParams } from '../api/feedApi';
import { INTEREST_OPTIONS, TAG_OPTIONS, CATEGORY_OPTIONS, SORT_OPTIONS } from './FilterFeed';
import { useTranslation } from '@/src/hooks/useTranslation';

type FilterId = 'interest' | 'tag' | 'category' | 'sort';

interface FeedFilterSheetProps {
  filterId: FilterId;
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 8) / 2; // padding (24*2) + gap (8)

export const FeedFilterSheet: React.FC<FeedFilterSheetProps> = React.memo(({
  filterId,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { t } = useTranslation('feed');
  const [localFilters, setLocalFilters] = useState<FeedFilterParams>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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

  const handleToggle = useCallback((value: string) => {
    switch (filterId) {
      case 'interest': {
        const current = localFilters.interests || [];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        setLocalFilters({ ...localFilters, interests: updated.length > 0 ? updated : undefined });
        break;
      }
      case 'tag': {
        const current = localFilters.tags || [];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        setLocalFilters({ ...localFilters, tags: updated.length > 0 ? updated : undefined });
        break;
      }
      case 'category': {
        const newVal = localFilters.category === value ? undefined : value;
        setLocalFilters({ ...localFilters, category: newVal });
        break;
      }
      case 'sort': {
        const newVal = localFilters.sort === value ? undefined : (value as 'recent' | 'top');
        setLocalFilters({ ...localFilters, sort: newVal });
        break;
      }
    }
  }, [filterId, localFilters]);

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

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.grid}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => handleToggle(option.value)}
              style={[
                styles.card,
                selected ? styles.cardSelected : styles.cardUnselected,
              ]}
            >
              <Text style={[styles.cardText, selected && styles.cardTextSelected]}>
                {t(option.labelKey)}
              </Text>
              {selected && (
                <View style={styles.checkIcon}>
                  <CheckIcon width={14} height={14} color="#829905" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>{t('filterFeed.clear')}</Text>
        </Pressable>
        <Pressable onPress={handleApply} style={styles.applyButton}>
          <Text style={styles.applyButtonText}>{t('filterFeed.apply')}</Text>
        </Pressable>
      </View>
    </View>
  );
});

FeedFilterSheet.displayName = 'FeedFilterSheet';

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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#829905',
  },
  cardUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#E9E9E9',
  },
  cardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  cardTextSelected: {
    fontWeight: '600',
    color: '#000000',
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
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
