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
  mainCategory?: string;
  subCategory?: string;
  productGroup?: string;
}

// Mock data - Backend'den gelecek
const MAIN_CATEGORIES: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Starter Packs', value: 'starter_packs' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Cosmetics', value: 'cosmetics' },
  { label: 'Home & Garden', value: 'home_garden' },
];

const SUB_CATEGORIES: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Smartphones', value: 'smartphones' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Tablets', value: 'tablets' },
];

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  isDark = false,
}) => {
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
      mainCategory,
      subCategory,
      productGroup: undefined, // Coming soon
    });
    onClose();
  };

  const handleReset = () => {
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
              Filter
            </Text>
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
                    : 'Main Category'}
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
                        style={styles.optionItem}
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
                    : 'Sub Category'}
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
                        style={styles.optionItem}
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
                  Product Group
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
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
              <Text style={styles.doneButtonText}>Done</Text>
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
