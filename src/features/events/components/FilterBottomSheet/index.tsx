import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTranslation } from '@/src/hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterSelection) => void;
  isDark?: boolean;
}

export interface FilterSelection {
  eventType?: string;
  mainCategory?: string;
  subCategory?: string;
  productGroup?: string;
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  isDark = false,
}) => {
  const { t } = useTranslation('events');

  // Event type filter options
  const EVENT_TYPES: FilterOption[] = useMemo(() => [
    { label: t('communityFilter.allTypes'), value: 'all' },
    { label: t('eventTypes.roast_picks'), value: 'roast_picks' },
    { label: t('eventTypes.challenge'), value: 'challenge' },
    { label: t('eventTypes.poll'), value: 'poll' },
    { label: t('eventTypes.community'), value: 'community' },
    { label: t('eventTypes.review'), value: 'review' },
    { label: t('eventTypes.giveaway'), value: 'giveaway' },
    { label: t('eventTypes.discussion'), value: 'discussion' },
  ], [t]);

  // Mock data - Backend'den gelecek
  const MAIN_CATEGORIES: FilterOption[] = useMemo(() => [
    { label: t('communityFilter.categories.all'), value: 'all' },
    { label: t('communityFilter.categories.starterPacks'), value: 'starter_packs' },
    { label: t('communityFilter.categories.electronics'), value: 'electronics' },
    { label: t('communityFilter.categories.cosmetics'), value: 'cosmetics' },
    { label: t('communityFilter.categories.homeGarden'), value: 'home_garden' },
  ], [t]);

  const SUB_CATEGORIES: FilterOption[] = useMemo(() => [
    { label: t('communityFilter.subCategories.all'), value: 'all' },
    { label: t('communityFilter.subCategories.smartphones'), value: 'smartphones' },
    { label: t('communityFilter.subCategories.laptops'), value: 'laptops' },
    { label: t('communityFilter.subCategories.tablets'), value: 'tablets' },
  ], [t]);
  const [selectedEventType, setSelectedEventType] = useState<string | undefined>();
  const [mainCategory, setMainCategory] = useState<string | undefined>();
  const [subCategory, setSubCategory] = useState<string | undefined>();
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);

  // BottomSheet ref
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  const handleDone = () => {
    onApply({
      eventType: selectedEventType && selectedEventType !== 'all' ? selectedEventType : undefined,
      mainCategory,
      subCategory,
      productGroup: undefined, // Coming soon
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedEventType(undefined);
    setMainCategory(undefined);
    setSubCategory(undefined);
  };

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      backgroundStyle={{
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#666' : '#B8B8B7',
      }}
    >
      <BottomSheetView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB' },
        ]}
      >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>
              {t('communityFilter.title')}
            </Text>
          </View>

          {/* Event Type Chips */}
          <View style={styles.content}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#000' }]}>
              {t('communityFilter.eventType')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventTypeChipsContainer}
            >
              {EVENT_TYPES.map((et) => {
                const isActive = (selectedEventType ?? 'all') === et.value;
                return (
                  <Pressable
                    key={et.value}
                    style={[
                      styles.eventTypeChip,
                      {
                        backgroundColor: isActive
                          ? (isDark ? '#FFF' : '#000')
                          : (isDark ? '#2A2A2A' : '#FFF'),
                        borderColor: isDark ? '#444' : '#E9E9E9',
                      },
                    ]}
                    onPress={() => setSelectedEventType(et.value)}
                  >
                    <Text
                      style={[
                        styles.eventTypeChipText,
                        {
                          color: isActive
                            ? (isDark ? '#000' : '#FFF')
                            : (isDark ? '#FFF' : '#000'),
                        },
                      ]}
                    >
                      {et.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Filter Fields */}
          <View style={styles.content}>
            {/* Main Category Dropdown */}
            <View style={styles.fieldContainer}>
              <Pressable
                style={[
                  styles.dropdown,
                  { 
                    borderColor: '#BBB',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFF',
                  },
                ]}
                onPress={() => {
                  setShowMainDropdown(!showMainDropdown);
                  setShowSubDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    { color: mainCategory ? (isDark ? '#FFF' : '#000') : '#C1BEBF' },
                  ]}
                >
                  {mainCategory
                    ? MAIN_CATEGORIES.find((c) => c.value === mainCategory)?.label
                    : t('communityFilter.mainCategory')}
                </Text>
                <Feather
                  name={showMainDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#C1BEBF"
                />
              </Pressable>

              {/* Main Category Options */}
              {showMainDropdown && (
                <View
                  style={[
                    styles.optionsList,
                    {
                      backgroundColor: isDark ? '#2A2A2A' : '#FFF',
                      borderColor: '#BBB',
                    },
                  ]}
                >
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {MAIN_CATEGORIES.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.optionItem, { borderBottomColor: isDark ? '#3A3A3A' : '#E9E9E9' }]}
                        onPress={() => {
                          setMainCategory(option.value);
                          setShowMainDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Sub Category Dropdown */}
            <View style={styles.fieldContainer}>
              <Pressable
                style={[
                  styles.dropdown,
                  { 
                    borderColor: '#BBB',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFF',
                  },
                ]}
                onPress={() => {
                  setShowSubDropdown(!showSubDropdown);
                  setShowMainDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    { color: subCategory ? (isDark ? '#FFF' : '#000') : '#C1BEBF' },
                  ]}
                >
                  {subCategory
                    ? SUB_CATEGORIES.find((c) => c.value === subCategory)?.label
                    : t('communityFilter.subCategory')}
                </Text>
                <Feather
                  name={showSubDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#C1BEBF"
                />
              </Pressable>

              {/* Sub Category Options */}
              {showSubDropdown && (
                <View
                  style={[
                    styles.optionsList,
                    {
                      backgroundColor: isDark ? '#2A2A2A' : '#FFF',
                      borderColor: '#BBB',
                    },
                  ]}
                >
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {SUB_CATEGORIES.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.optionItem, { borderBottomColor: isDark ? '#3A3A3A' : '#E9E9E9' }]}
                        onPress={() => {
                          setSubCategory(option.value);
                          setShowSubDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Product Group Dropdown (Disabled - Coming Soon) */}
            <View style={styles.fieldContainer}>
              <View
                style={[
                  styles.dropdown,
                  {
                    borderColor: '#BBB',
                    backgroundColor: isDark ? '#2A2A2A' : '#FFF',
                    opacity: 0.5,
                  },
                ]}
              >
                <Text style={[styles.dropdownText, { color: '#C1BEBF' }]}>
                  {t('communityFilter.productGroup')}
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>{t('communityFilter.comingSoon')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Done Button */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.doneButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>{t('communityFilter.done')}</Text>
            </Pressable>
          </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 34, // Home indicator space
  },
  header: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTypeChipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  eventTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  eventTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '500',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#C1BEBF',
  },
  optionsList: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  doneButton: {
    backgroundColor: '#D8FF08',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
});

export default FilterBottomSheet;
