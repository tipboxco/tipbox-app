import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDownIcon, ChevronUpIcon } from 'react-native-heroicons/outline';
import { useMainCategories, useSubCategories } from '../../api/hooks';
import type { CollectionFilters } from '../../types/medusa.types';
import type { Collection } from '../../types/collection.types';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useTranslation } from '@/src/hooks/useTranslation';

interface CollectionsBottomSheetProps {
  onApply: (filters: CollectionFilters) => void;
  isDark?: boolean;
  initialFilters?: CollectionFilters | null;
  /** Sağlanırsa response verisinden unique mainCategory/subCategory çıkarılır (client-side mode) */
  collections?: Collection[];
}

const CollectionsBottomSheet: React.FC<CollectionsBottomSheetProps> = ({
  onApply,
  isDark = false,
  initialFilters,
  collections,
}) => {
  const { closeBottomSheet, snapToIndex } = useGlobalBottomSheet();
  const { t } = useTranslation('events');
  const insets = useSafeAreaInsets();

  // collections prop varsa "name mode" (client-side), yoksa "id mode" (catalog API)
  const isNameMode = !!collections;

  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>(
    isNameMode ? initialFilters?.mainCategoryName : initialFilters?.mainCategoryId
  );
  const [subCategoryId, setSubCategoryId] = useState<string | undefined>(
    isNameMode ? initialFilters?.subCategoryName : initialFilters?.subCategoryId
  );
  const [productGroupId, setProductGroupId] = useState<string | undefined>(initialFilters?.productGroupId);

  // Hangi dropdown açık: 'main' | 'sub' | 'product' | null
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // === NAME MODE: collections'dan unique kategori çıkar ===
  const collectionMainCategories = useMemo(() => {
    if (!collections) return [];
    const names = new Set<string>();
    for (const c of collections) {
      if (c.mainCategory?.name) names.add(c.mainCategory.name);
    }
    return Array.from(names).sort().map((name) => ({ id: name, name }));
  }, [collections]);

  const collectionSubCategories = useMemo(() => {
    if (!collections || !mainCategoryId) return [];
    const names = new Set<string>();
    for (const c of collections) {
      if (c.mainCategory?.name === mainCategoryId && c.subCategory?.name) {
        names.add(c.subCategory.name);
      }
    }
    return Array.from(names).sort().map((name) => ({ id: name, name }));
  }, [collections, mainCategoryId]);

  // === ID MODE: catalog API hooks ===
  const { data: mainCategoriesRaw, isLoading: isLoadingMain } = useMainCategories();
  const { data: subCategoriesRaw, isLoading: isLoadingSub } = useSubCategories(
    (!isNameMode && mainCategoryId) ? mainCategoryId : '',
    !isNameMode && !!mainCategoryId,
  );
  const { data: productGroupsRaw, isLoading: isLoadingProduct } = useSubCategories(
    (!isNameMode && subCategoryId) ? subCategoryId : '',
    !isNameMode && !!subCategoryId,
  );

  const apiMainCategories = useMemo(
    () => (mainCategoriesRaw ?? []).map((c) => ({ id: c.id, name: c.name })),
    [mainCategoriesRaw],
  );
  const apiSubCategories = useMemo(
    () => (subCategoriesRaw ?? []).map((c) => ({ id: c.id, name: c.name })),
    [subCategoriesRaw],
  );
  const apiProductGroups = useMemo(
    () => (productGroupsRaw ?? []).map((c) => ({ id: c.id, name: c.name })),
    [productGroupsRaw],
  );

  // Aktif mod'a göre kategori listelerini seç
  const mainCategories = isNameMode ? collectionMainCategories : apiMainCategories;
  const subCategories = isNameMode ? collectionSubCategories : apiSubCategories;
  const productGroups = isNameMode ? [] : apiProductGroups;

  // Cascade reset
  useEffect(() => {
    setSubCategoryId(undefined);
    setProductGroupId(undefined);
  }, [mainCategoryId]);

  useEffect(() => {
    setProductGroupId(undefined);
  }, [subCategoryId]);

  const toggleDropdown = useCallback((key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  // Dropdown açılınca sheet'i 75%'e genişlet
  useEffect(() => {
    if (openDropdown) {
      snapToIndex(1);
    }
  }, [openDropdown, snapToIndex]);

  const handleApply = useCallback(() => {
    if (isNameMode) {
      // Client-side mode: name olarak gönder
      onApply({
        mainCategoryName: mainCategoryId,
        subCategoryName: subCategoryId,
      });
    } else {
      // Catalog API mode: ID olarak gönder
      onApply({ mainCategoryId, subCategoryId, productGroupId });
    }
    closeBottomSheet();
  }, [isNameMode, mainCategoryId, subCategoryId, productGroupId, onApply, closeBottomSheet]);

  const handleReset = useCallback(() => {
    // Filtreleri temizle, apply et ve kapat
    if (isNameMode) {
      onApply({ mainCategoryName: undefined, subCategoryName: undefined });
    } else {
      onApply({ mainCategoryId: undefined, subCategoryId: undefined, productGroupId: undefined });
    }
    closeBottomSheet();
  }, [isNameMode, onApply, closeBottomSheet]);

  // Helper: seçili item adını bul
  const getLabel = (
    list: { id: string; name: string }[],
    selectedId: string | undefined,
    placeholder: string,
  ) => {
    if (!selectedId) return placeholder;
    return list.find((i) => i.id === selectedId)?.name ?? placeholder;
  };

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dropdownBg = isDark ? '#2C2C2E' : '#F9F9F9';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const placeholderColor = '#999999';
  const borderClr = isDark ? '#3A3A3C' : '#E5E5E5';

  const renderDropdown = (
    key: string,
    label: string,
    items: { id: string; name: string }[],
    selectedId: string | undefined,
    onSelect: (id: string) => void,
    loading: boolean,
    disabled: boolean,
  ) => {
    const isOpen = openDropdown === key;
    const displayLabel = getLabel(items, selectedId, label);
    const hasSelection = !!selectedId;

    return (
      <View style={styles.fieldContainer}>
        <Pressable
          style={[
            styles.dropdown,
            {
              backgroundColor: dropdownBg,
              borderColor: isOpen ? (isDark ? '#636366' : '#C7C7CC') : borderClr,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
          onPress={() => !disabled && toggleDropdown(key)}
          disabled={disabled || loading}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: hasSelection ? textColor : placeholderColor },
            ]}
            numberOfLines={1}
          >
            {loading ? t('collectionsFilter.loading') : displayLabel}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={placeholderColor} />
          ) : isOpen ? (
            <ChevronUpIcon width={16} height={16} color={placeholderColor} />
          ) : (
            <ChevronDownIcon width={16} height={16} color={placeholderColor} />
          )}
        </Pressable>

        {isOpen && !loading && (
          <View style={[styles.optionsList, { backgroundColor: dropdownBg, borderColor: borderClr }]}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled bounces={false}>
              {items.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={[styles.emptyText, { color: placeholderColor }]}>
                    {t('collectionsFilter.noCategories')}
                  </Text>
                </View>
              ) : (
                items.map((item, idx) => {
                  const isSelected = item.id === selectedId;
                  const isLast = idx === items.length - 1;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.optionItem,
                        !isLast && { borderBottomWidth: 1, borderBottomColor: borderClr },
                        isSelected && { backgroundColor: isDark ? '#3A3A3C' : '#F0F0F0' },
                      ]}
                      onPress={() => {
                        onSelect(item.id);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.optionText, { color: textColor }]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const hasAnyFilter = !!(mainCategoryId || subCategoryId || productGroupId);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('collectionsFilter.title')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {renderDropdown(
          'main',
          t('collectionsFilter.mainCategory'),
          mainCategories,
          mainCategoryId,
          setMainCategoryId,
          !isNameMode && isLoadingMain,
          false,
        )}
        {renderDropdown(
          'sub',
          t('collectionsFilter.subCategory'),
          subCategories,
          subCategoryId,
          setSubCategoryId,
          !isNameMode && isLoadingSub,
          !mainCategoryId,
        )}
        {/* Product group sadece ID mode'da gösterilir */}
        {!isNameMode && renderDropdown(
          'product',
          t('collectionsFilter.productGroup'),
          productGroups,
          productGroupId,
          setProductGroupId,
          isLoadingProduct,
          !subCategoryId,
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { borderTopColor: borderClr, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.footerButtons}>
          {/* Reset */}
          <Pressable
            style={[
              styles.footerButton,
              { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F2', borderWidth: 1, borderColor: borderClr },
            ]}
            onPress={handleReset}
          >
            <Text style={[styles.applyButtonText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
              {t('collectionsFilter.reset')}
            </Text>
          </Pressable>

          {/* Apply */}
          <Pressable
            style={[
              styles.footerButton,
              { backgroundColor: hasAnyFilter ? '#C2E607' : (isDark ? '#374151' : '#E5E7EB') },
            ]}
            onPress={handleApply}
          >
            <Text style={[
              styles.applyButtonText,
              { color: hasAnyFilter ? '#111827' : (isDark ? '#9CA3AF' : '#6B7280') },
            ]}>
              {t('collectionsFilter.apply')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  fieldContainer: {
    zIndex: 1,
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  optionsList: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CollectionsBottomSheet;
