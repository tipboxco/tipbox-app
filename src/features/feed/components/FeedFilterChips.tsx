/**
 * FeedFilterChips - Horizontal scrollable filter chip buttons for FeedScreen
 * 4 chips: Interests, Tags, Category, Sort
 * Each chip opens its own bottom sheet on press
 */

import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import type { FeedFilterParams } from '../api/feedApi';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useColorMode } from '@/src/hooks/useColorMode';

export type FilterId = 'interest' | 'tag' | 'category' | 'sort';

const FILTER_BUTTONS: { id: FilterId; labelKey: string }[] = [
  { id: 'interest', labelKey: 'filterButtons.interests' },
  { id: 'tag', labelKey: 'filterButtons.tags' },
  { id: 'category', labelKey: 'filterButtons.category' },
  { id: 'sort', labelKey: 'filterButtons.sort' },
];

interface FeedFilterChipsProps {
  filters: FeedFilterParams;
  onFilterPress: (filterId: FilterId) => void;
  onClearAll: () => void;
}

export const FeedFilterChips: React.FC<FeedFilterChipsProps> = React.memo(({
  filters,
  onFilterPress,
  onClearAll,
}) => {
  const { t } = useTranslation('feed');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const hasActiveFilter = !!(
    (filters.interests && filters.interests.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.category ||
    filters.sort
  );

  const isChipActive = (id: FilterId): boolean => {
    switch (id) {
      case 'interest':
        return !!(filters.interests && filters.interests.length > 0);
      case 'tag':
        return !!(filters.tags && filters.tags.length > 0);
      case 'category':
        return !!filters.category;
      case 'sort':
        return !!filters.sort;
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {FILTER_BUTTONS.map((btn) => {
          const active = isChipActive(btn.id);
          return (
            <Pressable
              key={btn.id}
              onPress={() => onFilterPress(btn.id)}
              style={[
                styles.chip,
                active
                  ? styles.chipActive
                  : (isDark ? styles.chipInactiveDark : styles.chipInactive),
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  isDark && !active && styles.chipTextDark,
                ]}
              >
                {t(btn.labelKey)}
              </Text>
              {active && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>

      {hasActiveFilter && (
        <View style={styles.clearRow}>
          <Pressable onPress={onClearAll} style={[styles.clearChip, isDark && styles.clearChipDark]}>
            <Text style={[styles.clearText, isDark && styles.clearTextDark]}>
              {t('filterButtons.clearAll')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

FeedFilterChips.displayName = 'FeedFilterChips';

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    paddingVertical: 5,
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
  chipInactiveDark: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  chipTextActive: {
    fontWeight: '700',
  },
  chipTextDark: {
    color: '#FFFFFF',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  clearRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  clearChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    backgroundColor: '#F5F5F5',
  },
  clearChipDark: {
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  clearTextDark: {
    color: '#FFFFFF',
  },
});
