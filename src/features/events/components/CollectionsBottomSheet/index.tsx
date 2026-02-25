import React, { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { useMainCategories, useSubCategories } from '../../api/hooks';
import type { CollectionFilters } from '../../types/medusa.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OPTION_ITEM_HEIGHT = 48;

// Mock Data
const MOCK_MAIN_CATEGORIES = [
  { id: '1', name: 'Analytics Tools' },
  { id: '2', name: 'Content Management' },
  { id: '3', name: 'Customer Support' },
  { id: '4', name: 'Design Tools' },
  { id: '5', name: 'Development Tools' },
  { id: '6', name: 'Finance & Accounting' },
  { id: '7', name: 'Marketing Automation' },
  { id: '8', name: 'Project Management' },
  { id: '9', name: 'Sales CRM' },
  { id: '10', name: 'Security & Privacy' },
].sort((a, b) => a.name.localeCompare(b.name));

const MOCK_SUB_CATEGORIES: Record<string, Array<{ id: string; name: string }>> = {
  '1': [
    { id: 'sub-1-1', name: 'Business Intelligence' },
    { id: 'sub-1-2', name: 'Data Visualization' },
    { id: 'sub-1-3', name: 'Marketing Analytics' },
    { id: 'sub-1-4', name: 'Web Analytics' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  '2': [
    { id: 'sub-2-1', name: 'Blogging Platforms' },
    { id: 'sub-2-2', name: 'CMS Systems' },
    { id: 'sub-2-3', name: 'Digital Asset Management' },
    { id: 'sub-2-4', name: 'Documentation Tools' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  '3': [
    { id: 'sub-3-1', name: 'Chat Support' },
    { id: 'sub-3-2', name: 'Help Desk Software' },
    { id: 'sub-3-3', name: 'Knowledge Base' },
    { id: 'sub-3-4', name: 'Ticketing Systems' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  '4': [
    { id: 'sub-4-1', name: 'Graphic Design' },
    { id: 'sub-4-2', name: 'Prototyping Tools' },
    { id: 'sub-4-3', name: 'UI/UX Design' },
    { id: 'sub-4-4', name: 'Video Editing' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  '5': [
    { id: 'sub-5-1', name: 'Code Editors' },
    { id: 'sub-5-2', name: 'Database Tools' },
    { id: 'sub-5-3', name: 'DevOps Platforms' },
    { id: 'sub-5-4', name: 'Version Control' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
};

const MOCK_PRODUCT_GROUPS: Record<string, Array<{ id: string; name: string }>> = {
  'sub-1-1': [
    { id: 'pg-1-1-1', name: 'Cloud BI Solutions' },
    { id: 'pg-1-1-2', name: 'Enterprise BI' },
    { id: 'pg-1-1-3', name: 'Self-Service BI' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  'sub-1-2': [
    { id: 'pg-1-2-1', name: 'Chart Libraries' },
    { id: 'pg-1-2-2', name: 'Dashboard Tools' },
    { id: 'pg-1-2-3', name: 'Infographic Makers' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  'sub-4-1': [
    { id: 'pg-4-1-1', name: 'Adobe Suite' },
    { id: 'pg-4-1-2', name: 'Icon Editors' },
    { id: 'pg-4-1-3', name: 'Illustration Tools' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
};

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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>();
  const [productGroupId, setProductGroupId] = useState<string | undefined>();
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showProductGroupDropdown, setShowProductGroupDropdown] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const mainCategoryRef = useRef<View>(null);
  const subCategoryRef = useRef<View>(null);
  const productGroupRef = useRef<View>(null);

  // Dropdown açık mı kontrolü - herhangi biri açıksa 75%'e snap et
  const isAnyDropdownOpen = showMainDropdown || showSubDropdown || showProductGroupDropdown;

  // SnapPoints: default 45%, dropdown açıkken 70%
  const snapPoints = useMemo(() => ['40%', '70%'], []);

  // Mock data usage
  const mainCategories = MOCK_MAIN_CATEGORIES;
  const subCategories = mainCategoryId ? MOCK_SUB_CATEGORIES[mainCategoryId] || [] : [];
  const productGroups = subCategoryId ? MOCK_PRODUCT_GROUPS[subCategoryId] || [] : [];
  const isLoadingMain = false;
  const isLoadingSub = false;
  const isLoadingProductGroup = false;

  // Visible değiştiğinde bottom sheet'i aç/kapat
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      // Present sonrası default snap point'e git
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Dropdown açıldığında/kapandığında snap point değiştir
  useEffect(() => {
    if (visible) {
      if (isAnyDropdownOpen) {
        bottomSheetRef.current?.snapToIndex(1); // 75%'e expand et
      } else {
        bottomSheetRef.current?.snapToIndex(0); // 50%'e küçült
      }
    }
  }, [isAnyDropdownOpen, visible]);

  useEffect(() => {
    setSubCategoryId(undefined);
    setProductGroupId(undefined);
    setShowSubDropdown(false);
    setShowProductGroupDropdown(false);
  }, [mainCategoryId]);

  useEffect(() => {
    setProductGroupId(undefined);
    setShowProductGroupDropdown(false);
  }, [subCategoryId]);

  // Auto scroll to opened dropdown
  useEffect(() => {
    if (showMainDropdown && mainCategoryRef.current) {
      setTimeout(() => {
        mainCategoryRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo?.({ y: y - 20, animated: true });
          },
          () => {}
        );
      }, 100);
    }
  }, [showMainDropdown]);

  useEffect(() => {
    if (showSubDropdown && subCategoryRef.current) {
      setTimeout(() => {
        subCategoryRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo?.({ y: y - 20, animated: true });
          },
          () => {}
        );
      }, 100);
    }
  }, [showSubDropdown]);

  useEffect(() => {
    if (showProductGroupDropdown && productGroupRef.current) {
      setTimeout(() => {
        productGroupRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo?.({ y: y - 20, animated: true });
          },
          () => {}
        );
      }, 100);
    }
  }, [showProductGroupDropdown]);

  const handleDone = useCallback(() => {
    onApply({
      mainCategoryId,
      subCategoryId,
      productGroupId,
    });
    onClose();
  }, [mainCategoryId, subCategoryId, productGroupId, onApply, onClose]);

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

  const getSelectedProductGroupName = () => {
    if (!productGroupId) return 'Product Group';
    const group = productGroups.find((g) => g.id === productGroupId);
    return group?.name || 'Product Group';
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      onDismiss={onClose}
      onChange={handleSheetChanges}
      backgroundStyle={{
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#666' : '#B8B8B7',
        width: 70,
        height: 5,
        borderRadius: 10,
      }}
      bottomInset={insets.bottom}
      detached={false}
      enableDynamicSizing={false}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={false}
      activeOffsetY={[-5, 5]}
      failOffsetX={[-5, 5]}
    >
      {/* Header - Filter daima üstte sabit */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>Filter</Text>
      </View>

      {/* ScrollView içinde tüm içerik + Footer */}
      <BottomSheetScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
          {/* Main Category */}
          <View ref={mainCategoryRef} style={styles.fieldContainer}>
            <Pressable
              style={[
                styles.dropdown,
                {
                  borderColor: isDark ? '#3A3A3C' : '#BBB',
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                },
              ]}
              onPress={() => {
                setShowMainDropdown(!showMainDropdown);
                setShowSubDropdown(false);
                setShowProductGroupDropdown(false);
              }}
              disabled={isLoadingMain}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: mainCategoryId ? (isDark ? '#FFF' : '#000') : (isDark ? '#999' : '#666') },
                ]}
                numberOfLines={1}
              >
                {isLoadingMain ? 'Loading...' : getSelectedMainCategoryName()}
              </Text>
              {isLoadingMain ? (
                <ActivityIndicator size="small" color="#C7C7CC" />
              ) : (
                <View
                  style={[
                    styles.chevronIcon,
                    showMainDropdown && styles.chevronIconRotated,
                  ]}
                >
                  <Feather name="chevron-left" size={25} color="#C7C7CC" />
                </View>
              )}
            </Pressable>

            {/* Main Category Options - Inline */}
            {showMainDropdown && !isLoadingMain && (
              <View style={styles.inlineOptionsList}>
                {mainCategories.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      No categories available
                    </Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={styles.simpleOptionItem}
                      onPress={() => {
                        setMainCategoryId(undefined);
                        setShowMainDropdown(false);
                      }}
                    >
                      <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                        All Categories
                      </Text>
                    </Pressable>
                    {mainCategories.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.simpleOptionItem}
                        onPress={() => {
                          setMainCategoryId(option.id);
                          setShowMainDropdown(false);
                        }}
                      >
                        <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                        {mainCategoryId === option.id && (
                          <Feather name="check" size={16} color="#007AFF" style={styles.checkIcon} />
                        )}
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Sub Category */}
          <View ref={subCategoryRef} style={styles.fieldContainer}>
            <Pressable
              style={[
                styles.dropdown,
                {
                  borderColor: isDark ? '#3A3A3C' : '#BBB',
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  opacity: !mainCategoryId ? 0.5 : 1,
                },
              ]}
              onPress={() => {
                if (mainCategoryId) {
                  setShowSubDropdown(!showSubDropdown);
                  setShowMainDropdown(false);
                  setShowProductGroupDropdown(false);
                }
              }}
              disabled={!mainCategoryId || isLoadingSub}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: subCategoryId ? (isDark ? '#FFF' : '#000') : (isDark ? '#999' : '#666') },
                ]}
                numberOfLines={1}
              >
                {isLoadingSub ? 'Loading...' : getSelectedSubCategoryName()}
              </Text>
              {isLoadingSub ? (
                <ActivityIndicator size="small" color="#C7C7CC" />
              ) : (
                <View
                  style={[
                    styles.chevronIcon,
                    showSubDropdown && styles.chevronIconRotated,
                  ]}
                >
                  <Feather name="chevron-left" size={25} color="#C7C7CC" />
                </View>
              )}
            </Pressable>

            {/* Sub Category Options - Inline */}
            {showSubDropdown && !isLoadingSub && mainCategoryId && (
              <View style={styles.inlineOptionsList}>
                {subCategories.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      No sub categories available
                    </Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={styles.simpleOptionItem}
                      onPress={() => {
                        setSubCategoryId(undefined);
                        setShowSubDropdown(false);
                      }}
                    >
                      <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                        All Sub Categories
                      </Text>
                    </Pressable>
                    {subCategories.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.simpleOptionItem}
                        onPress={() => {
                          setSubCategoryId(option.id);
                          setShowSubDropdown(false);
                        }}
                      >
                        <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                        {subCategoryId === option.id && (
                          <Feather name="check" size={16} color="#007AFF" style={styles.checkIcon} />
                        )}
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Product Group */}
          <View ref={productGroupRef} style={styles.fieldContainer}>
            <Pressable
              style={[
                styles.dropdown,
                {
                  borderColor: isDark ? '#3A3A3C' : '#BBB',
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  opacity: !subCategoryId ? 0.5 : 1,
                },
              ]}
              onPress={() => {
                if (subCategoryId) {
                  setShowProductGroupDropdown(!showProductGroupDropdown);
                  setShowMainDropdown(false);
                  setShowSubDropdown(false);
                }
              }}
              disabled={!subCategoryId || isLoadingProductGroup}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: productGroupId ? (isDark ? '#FFF' : '#000') : (isDark ? '#999' : '#666') },
                ]}
                numberOfLines={1}
              >
                {isLoadingProductGroup ? 'Loading...' : getSelectedProductGroupName()}
              </Text>
              {isLoadingProductGroup ? (
                <ActivityIndicator size="small" color="#C7C7CC" />
              ) : (
                <View
                  style={[
                    styles.chevronIcon,
                    showProductGroupDropdown && styles.chevronIconRotated,
                  ]}
                >
                  <Feather name="chevron-left" size={25} color="#C7C7CC" />
                </View>
              )}
            </Pressable>

            {/* Product Group Options - Inline */}
            {showProductGroupDropdown && !isLoadingProductGroup && subCategoryId && (
              <View style={styles.inlineOptionsList}>
                {productGroups.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      No product groups available
                    </Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={styles.simpleOptionItem}
                      onPress={() => {
                        setProductGroupId(undefined);
                        setShowProductGroupDropdown(false);
                      }}
                    >
                      <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                        All Product Groups
                      </Text>
                    </Pressable>
                    {productGroups.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.simpleOptionItem}
                        onPress={() => {
                          setProductGroupId(option.id);
                          setShowProductGroupDropdown(false);
                        }}
                      >
                        <Text style={[styles.simpleOptionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                        {productGroupId === option.id && (
                          <Feather name="check" size={16} color="#007AFF" style={styles.checkIcon} />
                        )}
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Footer - Done Button - ScrollView içinde */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.doneButton, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  chevronIcon: {
    transform: [{ rotate: '-90deg' }],
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIconRotated: {
    transform: [{ rotate: '90deg' }],
  },
  inlineOptionsList: {
    marginTop: 8,
    paddingVertical: 8,
  },
  simpleOptionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simpleOptionText: {
    fontSize: 14,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 16,
    paddingBottom: 34,
    marginTop: 0,
  },
  doneButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8FF08',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
});

export default CollectionsBottomSheet;
