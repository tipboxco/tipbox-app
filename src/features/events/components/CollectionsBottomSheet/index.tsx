import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMainCategories, useSubCategories } from '../../api/hooks';
import type { CollectionFilters } from '../../types/medusa.types';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useTranslation } from '@/src/hooks/useTranslation';

interface CollectionsBottomSheetProps {
  onApply: (filters: CollectionFilters) => void;
  isDark?: boolean;
  initialFilters?: CollectionFilters | null;
}

const CollectionsBottomSheet: React.FC<CollectionsBottomSheetProps> = ({
  onApply,
  isDark = false,
  initialFilters,
}) => {
  const { closeBottomSheet } = useGlobalBottomSheet();
  const { t } = useTranslation('events');
  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>(initialFilters?.mainCategoryId);
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>(initialFilters?.subCategoryId);
  const [productGroupId, setProductGroupId] = useState<string | undefined>(initialFilters?.productGroupId);
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showProductGroupDropdown, setShowProductGroupDropdown] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const mainCategoryRef = useRef<View>(null);
  const subCategoryRef = useRef<View>(null);
  const productGroupRef = useRef<View>(null);

  // Medusa'dan gerçek kategori verileri
  const { data: mainCategoriesData, isLoading: isLoadingMain } = useMainCategories();
  const { data: subCategoriesData, isLoading: isLoadingSub } = useSubCategories(
    mainCategoryId ?? '',
    !!mainCategoryId
  );
  const { data: productGroupsData, isLoading: isLoadingProductGroup } = useSubCategories(
    subCategoryId ?? '',
    !!subCategoryId
  );

  const mainCategories = useMemo(
    () => (mainCategoriesData ?? []).map((c) => ({ id: c.id, name: c.name })),
    [mainCategoriesData]
  );

  const subCategories = useMemo(() => {
    console.log('[CollectionsBottomSheet] subCategoriesData:', subCategoriesData);
    console.log('[CollectionsBottomSheet] mainCategoryId:', mainCategoryId);
    const mapped = (subCategoriesData ?? []).map((c) => ({ id: c.id, name: c.name }));
    console.log('[CollectionsBottomSheet] Mapped subCategories:', mapped);
    return mapped;
  }, [subCategoriesData, mainCategoryId]);

  const productGroups = useMemo(
    () => (productGroupsData ?? []).map((c) => ({ id: c.id, name: c.name })),
    [productGroupsData]
  );

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
    closeBottomSheet();
  }, [mainCategoryId, subCategoryId, productGroupId, onApply, closeBottomSheet]);

  const getSelectedMainCategoryName = () => {
    if (!mainCategoryId) return t('collectionsFilter.mainCategory');
    const category = mainCategories.find((c) => c.id === mainCategoryId);
    return category?.name || t('collectionsFilter.mainCategory');
  };

  const getSelectedSubCategoryName = () => {
    if (!subCategoryId) return t('collectionsFilter.subCategory');
    const category = subCategories.find((c) => c.id === subCategoryId);
    return category?.name || t('collectionsFilter.subCategory');
  };

  const getSelectedProductGroupName = () => {
    if (!productGroupId) return t('collectionsFilter.productGroup');
    const group = productGroups.find((g) => g.id === productGroupId);
    return group?.name || t('collectionsFilter.productGroup');
  };

  return (
    <View style={{ paddingBottom: 20, paddingTop: 8, minHeight: 200 }}>
      {/* Header */}
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#000', textAlign: 'center', marginBottom: 16 }]}>
        {t('collectionsFilter.title')}
      </Text>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={{ maxHeight: 400 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
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
                {isLoadingMain ? t('collectionsFilter.loading') : getSelectedMainCategoryName()}
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

            {/* Main Category Options - Scrollable */}
            {showMainDropdown && !isLoadingMain && (
              <ScrollView
                style={styles.inlineOptionsList}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {mainCategories.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      {t('collectionsFilter.noCategories')}
                    </Text>
                  </View>
                ) : (
                  <>
                    {mainCategories.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.simpleOptionItem}
                        onPress={() => {
                          console.log('[CollectionsBottomSheet] Main category selected:', option.id, option.name);
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
              </ScrollView>
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
                {isLoadingSub ? t('collectionsFilter.loading') : getSelectedSubCategoryName()}
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

            {/* Sub Category Options - Scrollable */}
            {showSubDropdown && !isLoadingSub && mainCategoryId && (
              <ScrollView
                style={styles.inlineOptionsList}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {subCategories.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      {t('collectionsFilter.noSubCategories')}
                    </Text>
                  </View>
                ) : (
                  <>
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
              </ScrollView>
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
                {isLoadingProductGroup ? t('collectionsFilter.loading') : getSelectedProductGroupName()}
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

            {/* Product Group Options - Scrollable */}
            {showProductGroupDropdown && !isLoadingProductGroup && subCategoryId && (
              <ScrollView
                style={styles.inlineOptionsList}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {productGroups.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                      {t('collectionsFilter.noProductGroups')}
                    </Text>
                  </View>
                ) : (
                  <>
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
              </ScrollView>
            )}
          </View>
      </ScrollView>

      {/* Apply Button */}
      <Pressable
        style={{
          backgroundColor: isDark ? '#FFFFFF' : '#000000',
          marginHorizontal: 16,
          marginTop: 16,
          height: 48,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={handleDone}
      >
        <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
          {t('collectionsFilter.apply')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
    maxHeight: 200,
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
});

export default CollectionsBottomSheet;
