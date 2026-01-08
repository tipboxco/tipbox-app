import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Check, ChevronRight, ChevronLeft, Search, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterableOptionsType = {
  categories?: any[];
  metadata?: Record<string, any>;
};

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: FilterableOptionsType | null;
  selectedFilters: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
  onApply: () => void;
}

type NavigationView = 'main' | 'detail';

interface NavigationState {
  view: NavigationView;
  selectedKey: string | null;
  selectedLabel: string | null;
}

interface NormalizedFilterSection {
  key: string;
  label: string;
  values: Array<{ value: string; count?: number }>;
}

// Optimized List Item Component - Removed animations for better performance
const FilterListItem = React.memo<{
  item: { value: string; count?: number };
  isSelected: boolean;
  isLast: boolean;
  isDark: boolean;
  onPress: () => void;
}>(({ item, isSelected, isLast, isDark, onPress }) => {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.listItem,
          { backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent' }
        ]}
      >
        <View style={styles.listItemContent}>
          <View style={styles.listItemLeft}>
            <Text 
              style={[
                styles.listItemText,
                { color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              numberOfLines={2}
            >
              {item.value}
            </Text>
            {item.count !== undefined && (
              <Text style={[styles.listItemCount, { color: '#8E8E93' }]}>
                {item.count} ürün
              </Text>
            )}
          </View>

          <View style={styles.checkmarkContainer}>
            {isSelected && (
              <View style={styles.checkmarkCircle}>
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {!isLast && (
        <View style={[
          styles.separator,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(60,60,67,0.29)' }
        ]} />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item.value === nextProps.item.value &&
    prevProps.item.count === nextProps.item.count &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.isLast === nextProps.isLast
  );
});

FilterListItem.displayName = 'FilterListItem';

const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filterOptions,
  selectedFilters,
  onToggle,
  onApply,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [navigation, setNavigation] = useState<NavigationState>({
    view: 'main',
    selectedKey: null,
    selectedLabel: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setNavigation({ view: 'main', selectedKey: null, selectedLabel: null });
      setSearchQuery('');
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (navigation.view === 'main') {
      setSearchQuery('');
      Keyboard.dismiss();
    } else if (navigation.view === 'detail') {
      // Auto-focus search on detail view
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [navigation.view]);

  const selectedCount = useMemo(() => 
    Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0),
    [selectedFilters]
  );

  const normalizedFilters = useMemo((): NormalizedFilterSection[] => {
    if (!filterOptions) return [];
    
    const sections: NormalizedFilterSection[] = [];

    if (filterOptions.categories && Array.isArray(filterOptions.categories)) {
      sections.push({
        key: 'categories',
        label: 'Kategoriler',
        values: filterOptions.categories.map((cat: any) => ({
          value: cat.name || cat.id,
          count: cat.count,
        })),
      });
    }

    if (filterOptions.metadata && typeof filterOptions.metadata === 'object') {
      Object.entries(filterOptions.metadata).forEach(([key, data]) => {
        let values: Array<{ value: string; count?: number }> = [];
        
        if (Array.isArray(data)) {
          values = data.map((item: any) => {
            if (typeof item === 'string') {
              return { value: item };
            } else if (item && typeof item === 'object') {
              return {
                value: item.value || item.name || String(item),
                count: item.count,
              };
            }
            return { value: String(item) };
          });
        } 
        else if (data && typeof data === 'object' && 'values' in data) {
          const valuesData = (data as any).values;
          if (Array.isArray(valuesData)) {
            values = valuesData.map((item: any) => {
              if (typeof item === 'string') {
                return { value: item };
              } else if (item && typeof item === 'object') {
                return {
                  value: item.value || item.name || String(item),
                  count: item.count,
                };
              }
              return { value: String(item) };
            });
          }
        }

        if (values.length > 0) {
          const labelMap: Record<string, string> = {
            brand: 'Marka',
            color: 'Renk',
            size: 'Beden',
            material: 'Malzeme',
            price: 'Fiyat',
          };
          
          sections.push({
            key,
            label: labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            values,
          });
        }
      });
    }

    return sections;
  }, [filterOptions]);

  const handleNavigateToDetail = useCallback((key: string, label: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavigation({
      view: 'detail',
      selectedKey: key,
      selectedLabel: label,
    });
  }, []);

  const handleNavigateBack = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Keyboard.dismiss();
    setNavigation({
      view: 'main',
      selectedKey: null,
      selectedLabel: null,
    });
  }, []);

  const handleClearAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Object.keys(selectedFilters).forEach((key) => {
      const currentValues = selectedFilters[key] || [];
      currentValues.forEach((value) => {
        onToggle(key, value);
      });
    });
  }, [selectedFilters, onToggle]);

  const handleClearSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const currentValues = selectedFilters[key] || [];
    currentValues.forEach((value) => {
      onToggle(key, value);
    });
  }, [selectedFilters, onToggle]);

  const handleApplyAndClose = useCallback(() => {
    onApply();
    onClose();
  }, [onApply, onClose]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const currentSection = useMemo(() => 
    normalizedFilters.find(s => s.key === navigation.selectedKey),
    [normalizedFilters, navigation.selectedKey]
  );

  const currentSelectedValues = useMemo(() => 
    navigation.selectedKey ? (selectedFilters[navigation.selectedKey] || []) : [],
    [selectedFilters, navigation.selectedKey]
  );

  const filteredValues = useMemo(() => {
    if (!currentSection) return [];
    if (!searchQuery.trim()) return currentSection.values;
    
    const query = searchQuery.toLowerCase().trim();
    return currentSection.values.filter(item => 
      item.value.toLowerCase().includes(query)
    );
  }, [currentSection, searchQuery]);

  // Optimized toggle handler - prevents re-renders
  const handleToggleItem = useCallback((value: string) => {
    if (navigation.selectedKey) {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        onToggle(navigation.selectedKey!, value);
      });
    }
  }, [navigation.selectedKey, onToggle]);

  // Quick select all/none
  const handleSelectAll = useCallback(() => {
    if (!currentSection || !navigation.selectedKey) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const allSelected = filteredValues.every(item => 
      currentSelectedValues.includes(item.value)
    );

    if (allSelected) {
      // Deselect all
      filteredValues.forEach(item => {
        if (currentSelectedValues.includes(item.value)) {
          onToggle(navigation.selectedKey!, item.value);
        }
      });
    } else {
      // Select all
      filteredValues.forEach(item => {
        if (!currentSelectedValues.includes(item.value)) {
          onToggle(navigation.selectedKey!, item.value);
        }
      });
    }
  }, [currentSection, navigation.selectedKey, filteredValues, currentSelectedValues, onToggle]);

  const allSelected = useMemo(() => {
    if (filteredValues.length === 0) return false;
    return filteredValues.every(item => currentSelectedValues.includes(item.value));
  }, [filteredValues, currentSelectedValues]);

  // Main view
  const renderMainView = () => (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Navigation Bar */}
      <View style={[
        styles.navigationBar,
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(60,60,67,0.29)',
        }
      ]}>
        <View style={styles.navContent}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>İptal</Text>
          </TouchableOpacity>

          <Text style={[styles.navTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Filtrele
          </Text>

          {selectedCount > 0 ? (
            <TouchableOpacity
              onPress={handleClearAll}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>Temizle</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
      >
        {normalizedFilters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Filtre seçeneği bulunamadı
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {normalizedFilters.map((section) => {
              const selectedValues = selectedFilters[section.key] || [];
              const displayCount = selectedValues.length;

              return (
                <View key={section.key} style={styles.section}>
                  <Text style={[
                    styles.sectionHeader,
                    { color: isDark ? '#8E8E93' : '#6E6E73' }
                  ]}>
                    {section.label.toUpperCase()}
                  </Text>

                  <View style={[
                    styles.card,
                    { 
                      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0 : 0.04,
                      shadowRadius: 2,
                    }
                  ]}>
                    <TouchableOpacity
                      onPress={() => handleNavigateToDetail(section.key, section.label)}
                      activeOpacity={0.6}
                      style={styles.cardButton}
                    >
                      <View style={styles.cardLeft}>
                        <Text style={[
                          styles.cardTitle,
                          { color: isDark ? '#FFFFFF' : '#000000' }
                        ]}>
                          Tüm {section.label}
                        </Text>
                        {displayCount > 0 && (
                          <Text style={styles.cardSubtitle}>
                            {displayCount} seçili
                          </Text>
                        )}
                      </View>

                      <View style={styles.cardRight}>
                        {displayCount > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{displayCount}</Text>
                          </View>
                        )}
                        <ChevronRight
                          size={20}
                          color={isDark ? '#8E8E93' : '#C7C7CC'}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Apply Button with selection count */}
      <View style={[
        styles.bottomBar,
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
          borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(60,60,67,0.29)',
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            selectedCount === 0 && styles.applyButtonDisabled
          ]}
          onPress={handleApplyAndClose}
          activeOpacity={0.7}
          disabled={selectedCount === 0}
        >
          <Text style={[
            styles.applyButtonText,
            selectedCount === 0 && styles.applyButtonTextDisabled
          ]}>
            {selectedCount > 0 
              ? `${selectedCount} Filtre Uygula` 
              : 'Filtre Seçiniz'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Detail view with search
  const renderDetailView = () => {
    if (!navigation.selectedKey || !currentSection) return null;

    const hasResults = filteredValues.length > 0;
    const isSearching = searchQuery.trim().length > 0;

    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
        {/* Navigation Bar */}
        <View style={[
          styles.navigationBar,
          { 
            backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
            borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(60,60,67,0.29)',
          }
        ]}>
          <View style={styles.navContent}>
            <TouchableOpacity
              onPress={handleNavigateBack}
              hitSlop={{ top: 10, bottom: 10, left: 0, right: 20 }}
              style={styles.backButton}
            >
              <ChevronLeft size={28} color="#007AFF" strokeWidth={2.5} />
              <Text style={[styles.navButtonText, { marginLeft: 4 }]}>Filtreler</Text>
            </TouchableOpacity>

            {currentSelectedValues.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearSection(navigation.selectedKey!)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>Temizle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Large Title */}
          <View style={styles.largeTitleContainer}>
            <View style={styles.largeTitleRow}>
              <View style={styles.largeTitleLeft}>
                <Text style={[
                  styles.largeTitle,
                  { color: isDark ? '#FFFFFF' : '#000000' }
                ]}>
                  {navigation.selectedLabel}
                </Text>
                {currentSelectedValues.length > 0 && (
                  <Text style={styles.largeTitleSubtext}>
                    {currentSelectedValues.length} / {currentSection.values.length} seçili
                  </Text>
                )}
              </View>
              
              {/* Select All/None Button */}
              {hasResults && !isSearching && (
                <TouchableOpacity
                  onPress={handleSelectAll}
                  style={styles.selectAllButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.selectAllText}>
                    {allSelected ? 'Hiçbiri' : 'Tümü'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchBar,
              { backgroundColor: isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)' }
            ]}>
              <Search 
                size={18} 
                color={isDark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)'} 
              />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ara"
                placeholderTextColor={isDark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)'}
                style={[
                  styles.searchInput,
                  { color: isDark ? '#FFFFFF' : '#000000' }
                ]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[
                    styles.clearButton,
                    { backgroundColor: isDark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)' }
                  ]}
                >
                  <X 
                    size={12} 
                    color={isDark ? '#FFFFFF' : '#000000'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScrollContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          windowSize={10}
          initialNumToRender={15}
        >
          {!hasResults ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isSearching ? '🔍 Sonuç bulunamadı' : 'Filtre bulunamadı'}
              </Text>
              {isSearching && (
                <Text style={[styles.emptyStateSubtext, { color: '#8E8E93' }]}>
                  Farklı bir arama terimi deneyin
                </Text>
              )}
            </View>
          ) : (
            <View style={[
              styles.detailCard,
              { 
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.04,
                shadowRadius: 2,
              }
            ]}>
              {filteredValues.map((item, index) => (
                <FilterListItem
                  key={`${item.value}-${index}`}
                  item={item}
                  isSelected={currentSelectedValues.includes(item.value)}
                  isLast={index === filteredValues.length - 1}
                  isDark={isDark}
                  onPress={() => handleToggleItem(item.value)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Done Button */}
        <View style={[
          styles.bottomBar,
          { 
            backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
            borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(60,60,67,0.29)',
          }
        ]}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleNavigateBack}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>
              Tamam {currentSelectedValues.length > 0 && `(${currentSelectedValues.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalContainer}>
        {navigation.view === 'main' ? renderMainView() : renderDetailView()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  navigationBar: {
    borderBottomWidth: 0.5,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  navContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navButton: {
    minWidth: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  navButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  detailScrollContent: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    textAlign: 'center',
  },
  sectionsContainer: {
    gap: 32,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#007AFF',
    letterSpacing: -0.24,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  applyButtonTextDisabled: {
    opacity: 0.7,
  },
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  largeTitleLeft: {
    flex: 1,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  largeTitleSubtext: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.41,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  selectAllText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    letterSpacing: -0.41,
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    minHeight: 44,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  listItemLeft: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  listItemText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  listItemCount: {
    fontSize: 15,
    letterSpacing: -0.24,
    marginTop: 2,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 0.5,
    marginLeft: 16,
  },
});

export default FilterDialog;