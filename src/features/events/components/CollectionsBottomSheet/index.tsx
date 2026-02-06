import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useMainCategories, useSubCategories } from '../../api/hooks';
import type { CollectionFilters } from '../../types/medusa.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dropdown açık olduğunda eklenecek boşluk (dropdown options height)
const DROPDOWN_OPTIONS_HEIGHT = 200;

interface CollectionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: CollectionFilters) => void;
  isDark?: boolean;
}

const CollectionsBottomSheet: React.FC<CollectionsBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  isDark = false,
}) => {
  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>();
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  
  // Reanimated shared values for smooth animations
  const mainDropdownHeight = useSharedValue(0);
  const subDropdownHeight = useSharedValue(0);
  
  // Dropdown açılma/kapanma animasyonları
  useEffect(() => {
    mainDropdownHeight.value = withSpring(showMainDropdown ? DROPDOWN_OPTIONS_HEIGHT : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [showMainDropdown, mainDropdownHeight]);
  
  useEffect(() => {
    subDropdownHeight.value = withSpring(showSubDropdown ? DROPDOWN_OPTIONS_HEIGHT : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [showSubDropdown, subDropdownHeight]);
  
  // Sub Category field için animated style (Main dropdown açıldığında aşağı kayacak)
  const subCategoryAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginTop: mainDropdownHeight.value,
    };
  });
  
  // Product Group field için animated style (Main + Sub dropdown açıldığında aşağı kayacak)
  const productGroupAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginTop: mainDropdownHeight.value + subDropdownHeight.value,
    };
  });

  // Main Categories API hook
  const {
    data: mainCategories = [],
    isLoading: isLoadingMain,
    error: mainError,
  } = useMainCategories();

  // Sub Categories API hook (only fetch if main category is selected)
  const {
    data: subCategories = [],
    isLoading: isLoadingSub,
    error: subError,
  } = useSubCategories(mainCategoryId || '', !!mainCategoryId);

  // Reset sub category when main category changes
  useEffect(() => {
    setSubCategoryId(undefined);
  }, [mainCategoryId]);

  const handleDone = () => {
    onApply({
      mainCategoryId,
      subCategoryId,
      productGroupId: undefined, // Coming soon
    });
    onClose();
  };

  const handleReset = () => {
    setMainCategoryId(undefined);
    setSubCategoryId(undefined);
  };

  const getSelectedMainCategoryName = () => {
    if (!mainCategoryId) return 'Main Category';
    const category = mainCategories.find((c) => c.id === mainCategoryId);
    return category?.name || 'Main Category';
  };

  const getSelectedSubCategoryName = () => {
    if (!subCategoryId) return 'Sub Category';
    const category = subCategories.find((c) => c.id === subCategoryId);
    return category?.name || 'Sub Category';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>

      {/* Bottom Sheet Container */}
      <View style={styles.bottomSheetWrapper}>
        <View
          style={[
            styles.container,
            { 
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#666' : '#D1D1D6' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>
              Filter
            </Text>
          </View>

          {/* Filter Fields */}
          <ScrollView
            style={styles.contentScrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Main Category Dropdown */}
            <View style={[styles.fieldContainer, { zIndex: showMainDropdown ? 100 : 1 }]}>
              <Pressable
                style={[
                  styles.dropdown,
                  { 
                    borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  },
                ]}
                onPress={() => {
                  setShowMainDropdown(!showMainDropdown);
                  setShowSubDropdown(false);
                }}
                disabled={isLoadingMain}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    { color: mainCategoryId ? (isDark ? '#FFF' : '#000') : '#C7C7CC' },
                  ]}
                  numberOfLines={1}
                >
                  {isLoadingMain ? 'Loading...' : getSelectedMainCategoryName()}
                </Text>
                {isLoadingMain ? (
                  <ActivityIndicator size="small" color="#C7C7CC" />
                ) : (
                  <Feather
                    name="chevron-down"
                    size={20}
                    color="#C7C7CC"
                  />
                )}
              </Pressable>

              {/* Main Category Options */}
              {showMainDropdown && !isLoadingMain && (
                <View
                  style={[
                    styles.optionsList,
                    { 
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                    },
                  ]}
                >
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {mainError ? (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>
                          Failed to load categories
                        </Text>
                      </View>
                    ) : mainCategories.length === 0 ? (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                          No categories available
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Clear selection option */}
                        <Pressable
                          style={[
                            styles.optionItem,
                            { borderBottomColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                          ]}
                          onPress={() => {
                            setMainCategoryId(undefined);
                            setShowMainDropdown(false);
                          }}
                        >
                          <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                            All Categories
                          </Text>
                        </Pressable>
                        {mainCategories.map((option) => (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.optionItem,
                              { borderBottomColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                            ]}
                            onPress={() => {
                              setMainCategoryId(option.id);
                              setShowMainDropdown(false);
                            }}
                          >
                            <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                              {option.name}
                            </Text>
                            {mainCategoryId === option.id && (
                              <Feather name="check" size={16} color="#007AFF" />
                            )}
                          </Pressable>
                        ))}
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Sub Category Dropdown - Animated */}
            <Animated.View style={[styles.fieldContainer, { zIndex: showSubDropdown ? 99 : 1 }, subCategoryAnimatedStyle]}>
              <Pressable
                style={[
                  styles.dropdown,
                  { 
                    borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    opacity: !mainCategoryId ? 0.5 : 1,
                  },
                ]}
                onPress={() => {
                  if (mainCategoryId) {
                    setShowSubDropdown(!showSubDropdown);
                    setShowMainDropdown(false);
                  }
                }}
                disabled={!mainCategoryId || isLoadingSub}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    { color: subCategoryId ? (isDark ? '#FFF' : '#000') : '#C7C7CC' },
                  ]}
                  numberOfLines={1}
                >
                  {isLoadingSub ? 'Loading...' : getSelectedSubCategoryName()}
                </Text>
                {isLoadingSub ? (
                  <ActivityIndicator size="small" color="#C7C7CC" />
                ) : (
                  <Feather
                    name="chevron-down"
                    size={20}
                    color="#C7C7CC"
                  />
                )}
              </Pressable>

              {/* Sub Category Options */}
              {showSubDropdown && !isLoadingSub && mainCategoryId && (
                <View
                  style={[
                    styles.optionsList,
                    { 
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                    },
                  ]}
                >
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {subError ? (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>
                          Failed to load sub categories
                        </Text>
                      </View>
                    ) : subCategories.length === 0 ? (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                          No sub categories available
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Clear selection option */}
                        <Pressable
                          style={[
                            styles.optionItem,
                            { borderBottomColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                          ]}
                          onPress={() => {
                            setSubCategoryId(undefined);
                            setShowSubDropdown(false);
                          }}
                        >
                          <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                            All Sub Categories
                          </Text>
                        </Pressable>
                        {subCategories.map((option) => (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.optionItem,
                              { borderBottomColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                            ]}
                            onPress={() => {
                              setSubCategoryId(option.id);
                              setShowSubDropdown(false);
                            }}
                          >
                            <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                              {option.name}
                            </Text>
                            {subCategoryId === option.id && (
                              <Feather name="check" size={16} color="#007AFF" />
                            )}
                          </Pressable>
                        ))}
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </Animated.View>

            {/* Product Group Dropdown (Disabled - Coming Soon) - Animated */}
            <Animated.View style={[styles.fieldContainer, productGroupAnimatedStyle]}>
              <Pressable
                style={[
                  styles.dropdown,
                  {
                    borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    opacity: 0.5,
                  },
                ]}
                disabled
              >
                <Text style={[styles.dropdownText, { color: '#C7C7CC' }]}>
                  Product Group
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </Pressable>
            </Animated.View>
          </ScrollView>

          {/* Footer - Done Button Only */}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 8,
  },
  handleBar: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C6C6C8',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  contentScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  fieldContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  dropdown: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 17,
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  optionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 17,
    flex: 1,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  doneButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8FF08',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default CollectionsBottomSheet;
