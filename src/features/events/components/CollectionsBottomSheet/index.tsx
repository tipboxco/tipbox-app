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
    <View style={{ flex: 1, paddingTop: 8 }}>
      {/* Header */}
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#000', textAlign: 'center', marginBottom: 16 }]}>
        {t('collectionsFilter.title')}
      </Text>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
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
                  borderColor: '#BBB',
                  backgroundColor: isDark ? '#2A2A2A' : '#FFF',
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
                  { color: mainCategoryId ? (isDark ? '#FFF' : '#000') : '#C1BEBF' },
                ]}
                numberOfLines={1}
              >
                {isLoadingMain ? t('collectionsFilter.loading') : getSelectedMainCategoryName()}
              </Text>
              {isLoadingMain ? (
                <ActivityIndicator size="small" color="#C1BEBF" />
              ) : (
                <Feather
                  name={showMainDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#C1BEBF"
                />
              )}
            </Pressable>

            {/* Main Category Options */}
            {showMainDropdown && !isLoadingMain && (
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
                  {mainCategories.length === 0 ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                        {t('collectionsFilter.noCategories')}
                      </Text>
                    </View>
                  ) : (
                    mainCategories.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.optionItem}
                        onPress={() => {
                          setMainCategoryId(option.id);
                          setShowMainDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Sub Category */}
          <View ref={subCategoryRef} style={styles.fieldContainer}>
            <Pressable
              style={[
                styles.dropdown,
                {
                  borderColor: '#BBB',
                  backgroundColor: isDark ? '#2A2A2A' : '#FFF',
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
                  { color: subCategoryId ? (isDark ? '#FFF' : '#000') : '#C1BEBF' },
                ]}
                numberOfLines={1}
              >
                {isLoadingSub ? t('collectionsFilter.loading') : getSelectedSubCategoryName()}
              </Text>
              {isLoadingSub ? (
                <ActivityIndicator size="small" color="#C1BEBF" />
              ) : (
                <Feather
                  name={showSubDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#C1BEBF"
                />
              )}
            </Pressable>

            {/* Sub Category Options */}
            {showSubDropdown && !isLoadingSub && mainCategoryId && (
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
                  {subCategories.length === 0 ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                        {t('collectionsFilter.noSubCategories')}
                      </Text>
                    </View>
                  ) : (
                    subCategories.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.optionItem}
                        onPress={() => {
                          setSubCategoryId(option.id);
                          setShowSubDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Product Group */}
          <View ref={productGroupRef} style={styles.fieldContainer}>
            <Pressable
              style={[
                styles.dropdown,
                {
                  borderColor: '#BBB',
                  backgroundColor: isDark ? '#2A2A2A' : '#FFF',
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
                  { color: productGroupId ? (isDark ? '#FFF' : '#000') : '#C1BEBF' },
                ]}
                numberOfLines={1}
              >
                {isLoadingProductGroup ? t('collectionsFilter.loading') : getSelectedProductGroupName()}
              </Text>
              {isLoadingProductGroup ? (
                <ActivityIndicator size="small" color="#C1BEBF" />
              ) : (
                <Feather
                  name={showProductGroupDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#C1BEBF"
                />
              )}
            </Pressable>

            {/* Product Group Options */}
            {showProductGroupDropdown && !isLoadingProductGroup && subCategoryId && (
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
                  {productGroups.length === 0 ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.emptyText, { color: '#8E8E93' }]}>
                        {t('collectionsFilter.noProductGroups')}
                      </Text>
                    </View>
                  ) : (
                    productGroups.map((option) => (
                      <Pressable
                        key={option.id}
                        style={styles.optionItem}
                        onPress={() => {
                          setProductGroupId(option.id);
                          setShowProductGroupDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, { color: isDark ? '#FFF' : '#000' }]}>
                          {option.name}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>
      </ScrollView>

      {/* Footer - Apply Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.applyButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleDone}
        >
          <Text style={styles.applyButtonText}>
            {t('collectionsFilter.apply')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: 'bold',
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
    flex: 1,
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#D8FF08',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default CollectionsBottomSheet;
