import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  ScrollView,
  Pressable,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../../navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import CollectionCard from '../CollectionCard';
import type { Collection } from '../../types/collection.types';
import type { CollectionFilters } from '../../types/medusa.types';
import { useSafeAreaValues } from '@/src/utils';
import { useCollections, useUserProgressCollections } from '../../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useTranslation } from '@/src/hooks/useTranslation';

/** Status filter keys */
const STATUS_KEYS = ['all', 'completed', 'in_progress', 'not_started'] as const;

type CollectionsTabProps = {
  searchQuery?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  collectionFilters?: CollectionFilters | null;
  userId?: string; // Profile ekranında kullanıcının tamamladığı collections'ları göstermek için
};

type CollectionsTabNavigationProp = NativeStackNavigationProp<
  EventsStackParamList,
  'EventsScreen'
>;

const CollectionsTab: React.FC<CollectionsTabProps> = ({
  searchQuery,
  onFilterChange,
  collectionFilters,
  userId, // Profile'da userId ile tamamlanmış collections
}) => {
  const { t } = useTranslation('events');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>(undefined);
  const navigation = useNavigation<CollectionsTabNavigationProp>();

  // Translated status filter labels
  const STATUS_LABEL_KEYS: Record<typeof STATUS_KEYS[number], string> = {
    all: 'collection.all',
    completed: 'collection.completed',
    in_progress: 'collection.inProgress',
    not_started: 'collection.notStarted',
  };

  const STATUS_FILTERS = STATUS_KEYS.map((key) => ({
    key,
    label: t(STATUS_LABEL_KEYS[key]),
  }));

  // Arama debounce (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = (searchQuery ?? '').trim();
      setDebouncedSearch(trimmed.length > 0 ? trimmed : undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // EP-01: Collections listesi (infinite scroll)
  // Tüm filtreleme client-side yapılacak (mainCategory.name / subCategory.name)
  const allCollectionsQuery = useCollections({
    search: debouncedSearch,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const userCollectionsQuery = useUserProgressCollections(userId);

  // Profile'da userId varsa user collections, yoksa all collections
  const activeQuery = userId ? userCollectionsQuery : allCollectionsQuery;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = activeQuery;

  // Tüm collections (filtresiz)
  const allCollections = useMemo<Collection[]>(() => {
    if (!data) return [];

    return data.pages.flatMap((page: any) => {
      return (page.collections || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        currentProgress: c.currentProgress ?? 0,
        totalProgress: c.totalProgress ?? 0,
        coverImage: c.coverImage ?? null,
        category: c.category ?? undefined,
        mainCategory: c.mainCategory ?? null,
        subCategory: c.subCategory ?? null,
        totalBadges: c.totalBadges ?? 0,
        earnedBadges: c.earnedBadges ?? 0,
      }));
    });
  }, [data]);

  // Chip kategorileri: response'daki unique mainCategory.name değerlerinden oluştur
  const chipCategories = useMemo(
    () => {
      const names = new Set<string>();
      for (const c of allCollections) {
        if (c.mainCategory?.name) names.add(c.mainCategory.name);
      }
      return [
        { id: 'all', name: t('collection.all') },
        ...Array.from(names).sort().map((name) => ({ id: name, name })),
      ];
    },
    [allCollections, t]
  );

  // Client-side filtreleme: mainCategory.name ve subCategory.name
  const collections = useMemo<Collection[]>(() => {
    let filtered = allCollections;

    // Chip filtresi: mainCategory.name ile eşleştir
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.mainCategory?.name === selectedCategory);
    }

    // Bottom sheet filtresi: mainCategoryName ile eşleştir
    if (collectionFilters?.mainCategoryName && selectedCategory === 'all') {
      filtered = filtered.filter((c) => c.mainCategory?.name === collectionFilters.mainCategoryName);
    }

    // Bottom sheet filtresi: subCategoryName ile eşleştir
    if (collectionFilters?.subCategoryName) {
      filtered = filtered.filter((c) => c.subCategory?.name === collectionFilters.subCategoryName);
    }

    return filtered;
  }, [allCollections, selectedCategory, collectionFilters]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Collection kart tıklama
  const handleCollectionPress = useCallback(
    (id: string) => {
      if (userId) {
        // Profile context: Root-level navigation kullan
        navigationService.navigate(ROOT_ROUTES.COLLECTION_DETAIL as any, { collectionId: id });
      } else {
        // Events context: Local stack navigation kullan
        navigation.navigate('CollectionDetailScreen', { collectionId: id });
      }
    },
    [navigation, userId]
  );

  // Status chip seçimi
  const handleStatusPress = useCallback(
    (status: 'all' | 'completed' | 'in_progress' | 'not_started') => {
      setSelectedStatus(status);
    },
    []
  );

  // Chip seçimi
  const handleCategoryPress = useCallback(
    (handle: string) => {
      setSelectedCategory(handle);
      onFilterChange?.(handle);
    },
    [onFilterChange]
  );

  // Infinite scroll: listenin sonuna gelince sonraki sayfayı çek
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ScrollView onScroll: kullanıcı alt tarafa yaklaşınca handleEndReached tetikle
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 200) {
        handleEndReached();
      }
    },
    [handleEndReached]
  );

  // Layout helper: Her 5 item'da bir full (index % 5 === 0), geri kalan half
  const getItemLayout = (index: number) => (index % 5 === 0 ? 'full' : 'half');

  // Collections'ı row'lara dönüştür (full / 2'li half)
  const rows = useMemo(() => {
    type Row = { items: Collection[]; type: 'full' | 'row' };
    const result: Row[] = [];
    for (let i = 0; i < collections.length; i++) {
      if (getItemLayout(i) === 'full') {
        result.push({ items: [collections[i]], type: 'full' });
      } else {
        const nextIdx = i + 1;
        const nextItem = collections[nextIdx];
        if (nextItem && getItemLayout(nextIdx) === 'half') {
          result.push({ items: [collections[i], nextItem], type: 'row' });
          i++;
        } else {
          result.push({ items: [collections[i]], type: 'row' });
        }
      }
    }
    return result;
  }, [collections]);

  // Row renderer
  const renderRow = useCallback(
    ({ item: row }: { item: { items: Collection[]; type: 'full' | 'row' } }) => {
      if (row.type === 'full') {
        return (
          <View style={styles.fullRow}>
            <CollectionCard
              collection={row.items[0]}
              isFullWidth
              onPress={handleCollectionPress}
            />
          </View>
        );
      }
      return (
        <View style={styles.halfRow}>
          {row.items.map((collection) => (
            <View key={collection.id} style={styles.halfItem}>
              <CollectionCard
                collection={collection}
                isFullWidth={false}
                onPress={handleCollectionPress}
              />
            </View>
          ))}
        </View>
      );
    },
    [handleCollectionPress]
  );

  // Status filter chips
  const StatusChips = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChips}
      >
        {STATUS_FILTERS.map((sf) => {
          const isActive = sf.key === selectedStatus;
          return (
            <Pressable
              key={sf.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? '#F1F1F1' : 'transparent',
                  borderColor: '#EFEFEF',
                },
              ]}
              onPress={() => handleStatusPress(sf.key)}
            >
              <Text style={styles.filterChipText}>
                {sf.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    ),
    [selectedStatus, handleStatusPress]
  );

  // Category filter chips
  const FilterChips = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChips}
      >
        {chipCategories.map((cat) => {
          const isActive = cat.id === selectedCategory;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? '#F1F1F1' : 'transparent',
                  borderColor: '#EFEFEF',
                },
              ]}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <Text style={styles.filterChipText}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    ),
    [chipCategories, selectedCategory, handleCategoryPress]
  );

  // Footer: infinite scroll yükleme göstergesi
  const ListFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <ActivityIndicator
          style={styles.footerLoader}
          color={isDark ? '#E2FF46' : '#8B5CF6'}
        />
      ) : null,
    [isFetchingNextPage, isDark]
  );

  // Empty state
  const EmptyComponent = useMemo(
    () =>
      !isLoading ? (
        <View style={styles.emptyContainer}>
          {userId ? (
            <>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {t('collection.emptyStates.noProgressTitle')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: '#999999' }]}>
                {t('collection.emptyStates.noProgressSubtitle')}
              </Text>
            </>
          ) : (
            <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#B9B9B9' }]}>
              {debouncedSearch
                ? t('collection.emptyStates.noResults')
                : selectedStatus !== 'all'
                ? t('collection.emptyStates.noStatus')
                : selectedCategory !== 'all'
                ? t('collection.emptyStates.noCategory')
                : t('collection.emptyStates.noCollections')}
            </Text>
          )}
        </View>
      ) : null,
    [isLoading, debouncedSearch, selectedStatus, selectedCategory, isDark, userId]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={isDark ? '#E2FF46' : '#8B5CF6'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!userId && FilterChips}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 24 }]}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {rows.length === 0 ? EmptyComponent : null}
        {rows.map((item, index) => (
          <View key={`row-${index}-${item.items.map((c) => c.id).join('-')}`}>
            {renderRow({ item })}
          </View>
        ))}
        {ListFooter}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChips: {
    backgroundColor: 'transparent',
    maxHeight: 52,
  },
  scrollView: {
    marginTop: 0,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 14,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  fullRow: {
    width: '100%',
    marginBottom: 8,
  },
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfItem: {
    width: '48.5%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

export default React.memo(CollectionsTab);
