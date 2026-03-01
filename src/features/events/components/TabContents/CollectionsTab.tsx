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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../../navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import CollectionCard from '../CollectionCard';
import type { Collection, CollectionCategory } from '../../types/collection.types';
import type { CollectionFilters } from '../../types/medusa.types';
import { useSafeAreaValues } from '@/src/utils';
import { useCollections, useCollectionCategories } from '../../api/hooks';

/** "All" chip'i her zaman başta sabit olur — backend'den gelmez */
const ALL_CATEGORY: CollectionCategory = { id: 'all', name: 'All', handle: 'all' };

type CollectionsTabProps = {
  searchQuery?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  collectionFilters?: CollectionFilters | null;
};

type CollectionsTabNavigationProp = NativeStackNavigationProp<
  EventsStackParamList,
  'EventsScreen'
>;

const CollectionsTab: React.FC<CollectionsTabProps> = ({
  searchQuery,
  onFilterChange,
  collectionFilters,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');
  const [selectedHandle, setSelectedHandle] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>(undefined);
  const navigation = useNavigation<CollectionsTabNavigationProp>();

  // Arama debounce (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = (searchQuery ?? '').trim();
      setDebouncedSearch(trimmed.length > 0 ? trimmed : undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // EP-02: Chip filtre kategorileri
  const { data: categoriesData } = useCollectionCategories();
  const chipCategories = useMemo<CollectionCategory[]>(
    () => [ALL_CATEGORY, ...(categoriesData?.categories ?? [])],
    [categoriesData]
  );

  // EP-01: Collections listesi (infinite scroll)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useCollections({
    search: debouncedSearch,
    category: selectedHandle !== 'all' ? selectedHandle : undefined,
    mainCategoryId: collectionFilters?.mainCategoryId,
    subCategoryId: collectionFilters?.subCategoryId,
    productGroupId: collectionFilters?.productGroupId,
  });

  const collections = useMemo<Collection[]>(
    () => data?.pages.flatMap((page) => page.collections) ?? [],
    [data]
  );

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Collection kart tıklama
  const handleCollectionPress = useCallback(
    (id: string) => {
      navigation.navigate('CollectionDetailScreen', { collectionId: id });
    },
    [navigation]
  );

  // Chip seçimi
  const handleCategoryPress = useCallback(
    (handle: string) => {
      setSelectedHandle(handle);
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

  // Filter chips
  const FilterChips = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChips}
      >
        {chipCategories.map((cat) => {
          const isActive = cat.handle === selectedHandle;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? '#000' : isDark ? '#2A2A2A' : '#FFF',
                  borderColor: isActive ? '#000' : '#E9E9E9',
                },
              ]}
              onPress={() => handleCategoryPress(cat.handle)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? '#FFF' : isDark ? '#FFF' : '#000' },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    ),
    [chipCategories, selectedHandle, isDark, handleCategoryPress]
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
          <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#B9B9B9' }]}>
            {debouncedSearch
              ? 'No collections found'
              : selectedHandle !== 'all'
              ? 'No collections in this category'
              : 'No collections yet'}
          </Text>
        </View>
      ) : null,
    [isLoading, debouncedSearch, selectedHandle, isDark]
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
      {FilterChips}
      <FlatList
        data={rows}
        numColumns={1}
        key="rows-layout"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 24 }]}
        ListEmptyComponent={EmptyComponent}
        ListFooterComponent={ListFooter}
        renderItem={renderRow}
        keyExtractor={(item, index) =>
          `row-${index}-${item.items.map((c) => c.id).join('-')}`
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
          />
        }
      />
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
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    paddingVertical: 32,
    alignItems: 'center',
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
