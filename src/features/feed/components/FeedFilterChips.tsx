/**
 * FeedFilterChips - Horizontal chip/pill filter buttons for FeedScreen
 * Shows active filter counts and opens bottom sheet on press
 */

import React, { useCallback } from 'react';
import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { ChevronDownIcon, XMarkIcon } from 'react-native-heroicons/outline';
import type { FeedFilterParams } from '../api/feedApi';
import { useTranslation } from '@/src/hooks/useTranslation';

type FilterId = 'interest' | 'tag' | 'category' | 'sort';

interface FeedFilterChipsProps {
  filters: FeedFilterParams;
  onFilterPress: (filterId: FilterId) => void;
  onClearAll: () => void;
}

const FILTER_BUTTONS: { id: FilterId; labelKey: string }[] = [
  { id: 'interest', labelKey: 'filterButtons.interests' },
  { id: 'tag', labelKey: 'filterButtons.tags' },
  { id: 'category', labelKey: 'filterButtons.category' },
  { id: 'sort', labelKey: 'filterButtons.sort' },
];

const getFilterCount = (filterId: FilterId, filters: FeedFilterParams): number => {
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

export const FeedFilterChips: React.FC<FeedFilterChipsProps> = React.memo(({
  filters,
  onFilterPress,
  onClearAll,
}) => {
  const { t } = useTranslation('feed');

  const hasAnyActiveFilter = !!(
    (filters.interests && filters.interests.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.category ||
    filters.sort
  );

  const handlePress = useCallback((filterId: FilterId) => {
    onFilterPress(filterId);
  }, [onFilterPress]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hasAnyActiveFilter && (
          <Pressable onPress={onClearAll} style={styles.clearAllChip}>
            <XMarkIcon width={12} height={12} color="#000000" />
            <Text style={styles.clearAllText}>{t('filterButtons.clearAll')}</Text>
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
                isActive ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {t(button.labelKey)}
              </Text>
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
              <ChevronDownIcon width={9} height={9} color="#000000" />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

FeedFilterChips.displayName = 'FeedFilterChips';

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
  badge: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 6,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
