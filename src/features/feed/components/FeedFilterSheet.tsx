/**
 * FeedFilterSheet - Per-filter bottom sheet content
 * Opens with a specific filterId and shows relevant options
 * Uses radio buttons for single-select (category, sort) and checkboxes for multi-select (interest, tag)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { FeedFilterParams } from '../api/feedApi';
import { TAG_OPTIONS, SORT_OPTIONS, INTEREST_OPTIONS, CATEGORY_OPTIONS } from './FilterFeed';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { FilterId } from './FeedFilterChips';

interface FeedFilterSheetProps {
  filterId: FilterId;
  filters: FeedFilterParams;
  onFiltersChange: (filters: FeedFilterParams) => void;
  onClose: () => void;
}

/** Radio circle component (single-select) */
const RadioCircle: React.FC<{ selected: boolean; isDark: boolean }> = ({ selected, isDark }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = isDark ? '#555555' : '#CCCCCC';
  return (
    <View style={[styles.radioOuter, { borderColor: selected ? activeColor : inactiveColor }]}>
      {selected && <View style={[styles.radioInner, { backgroundColor: activeColor }]} />}
    </View>
  );
};

/** Checkbox component (multi-select) */
const CheckBox: React.FC<{ selected: boolean; isDark: boolean }> = ({ selected, isDark }) => {
  const activeColor = '#829905';
  const inactiveColor = isDark ? '#555555' : '#CCCCCC';
  return (
    <View style={[styles.checkOuter, { borderColor: selected ? activeColor : inactiveColor, backgroundColor: selected ? activeColor : 'transparent' }]}>
      {selected && <Text style={styles.checkMark}>✓</Text>}
    </View>
  );
};

export const FeedFilterSheet: React.FC<FeedFilterSheetProps> = React.memo(({
  filterId,
  filters,
  onFiltersChange,
  onClose,
}) => {
  const { t } = useTranslation('feed');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const isMultiSelect = filterId === 'interest' || filterId === 'tag';

  // Get title based on filterId
  const title = useMemo(() => {
    switch (filterId) {
      case 'interest': return t('filterFeed.title.interests');
      case 'tag': return t('filterFeed.title.tags');
      case 'category': return t('filterFeed.title.category');
      case 'sort': return t('filterFeed.title.sort');
      default: return '';
    }
  }, [filterId, t]);

  // Get options based on filterId
  const options = useMemo(() => {
    switch (filterId) {
      case 'interest': return INTEREST_OPTIONS;
      case 'tag': return TAG_OPTIONS;
      case 'category': return CATEGORY_OPTIONS;
      case 'sort': return SORT_OPTIONS;
      default: return [];
    }
  }, [filterId]);

  // Local state for multi-select (array)
  const [selectedMulti, setSelectedMulti] = useState<string[]>(() => {
    if (filterId === 'interest') return filters.interests || [];
    if (filterId === 'tag') return filters.tags || [];
    return [];
  });

  // Local state for single-select (string | null)
  const [selectedSingle, setSelectedSingle] = useState<string | null>(() => {
    if (filterId === 'category') return filters.category || null;
    if (filterId === 'sort') return filters.sort || null;
    return null;
  });

  // Sync with external filters
  useEffect(() => {
    if (filterId === 'interest') setSelectedMulti(filters.interests || []);
    else if (filterId === 'tag') setSelectedMulti(filters.tags || []);
    else if (filterId === 'category') setSelectedSingle(filters.category || null);
    else if (filterId === 'sort') setSelectedSingle(filters.sort || null);
  }, [filters, filterId]);

  const handleToggleMulti = useCallback((value: string) => {
    setSelectedMulti(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }, []);

  const handleSelectSingle = useCallback((value: string) => {
    setSelectedSingle(prev => prev === value ? null : value);
  }, []);

  const handleReset = useCallback(() => {
    if (isMultiSelect) setSelectedMulti([]);
    else setSelectedSingle(null);
  }, [isMultiSelect]);

  const handleDone = useCallback(() => {
    const newFilters: FeedFilterParams = { ...filters };

    if (filterId === 'interest') {
      newFilters.interests = selectedMulti.length > 0 ? selectedMulti : undefined;
    } else if (filterId === 'tag') {
      newFilters.tags = selectedMulti.length > 0 ? selectedMulti : undefined;
    } else if (filterId === 'category') {
      newFilters.category = selectedSingle || undefined;
    } else if (filterId === 'sort') {
      newFilters.sort = (selectedSingle as FeedFilterParams['sort']) || undefined;
    }

    onFiltersChange(newFilters);
    onClose();
  }, [filterId, selectedMulti, selectedSingle, filters, onFiltersChange, onClose]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Title */}
      <Text style={[styles.title, isDark && styles.textDark]}>
        {title}
      </Text>

      {/* Options */}
      {options.map((option) => {
        const isSelected = isMultiSelect
          ? selectedMulti.includes(option.value)
          : selectedSingle === option.value;

        return (
          <Pressable
            key={option.value}
            style={styles.optionRow}
            onPress={() => isMultiSelect ? handleToggleMulti(option.value) : handleSelectSingle(option.value)}
          >
            {isMultiSelect ? (
              <CheckBox selected={isSelected} isDark={isDark} />
            ) : (
              <RadioCircle selected={isSelected} isDark={isDark} />
            )}
            <Text style={[styles.optionText, isDark && styles.textDark, isSelected && styles.optionTextSelected]}>
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable onPress={handleReset} style={[styles.resetButton, isDark && styles.resetButtonDark]}>
          <Text style={[styles.resetButtonText, isDark && styles.resetButtonTextDark]}>
            {t('filterFeed.reset')}
          </Text>
        </Pressable>
        <Pressable onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>
            {t('filterFeed.done')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

FeedFilterSheet.displayName = 'FeedFilterSheet';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  containerDark: {},
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 14,
  },
  textDark: {
    color: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#333333',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  checkOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingBottom: 6,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDark: {
    borderColor: '#444444',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  resetButtonTextDark: {
    color: '#AAAAAA',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#D0F205',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
});
