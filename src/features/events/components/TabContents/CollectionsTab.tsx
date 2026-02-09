import React, { useMemo, useCallback, useState } from 'react';
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
import type { Collection } from '../../types/collection.types';
import { useSafeAreaValues } from '@/src/utils';

// Mock data - Backend'den gelecek
const MOCK_COLLECTIONS: Collection[] = [
  {
    id: '1',
    title: 'Silicon Strategist',
    description: 'Master the hardware landscape.',
    currentProgress: 12,
    totalProgress: 120,
    backgroundGradient: {
      colors: ['#FF6B9D', '#C084FC', '#7C3AED'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
  {
    id: '2',
    title: 'Sonic Voyagers',
    description: 'Feel every beat.',
    currentProgress: 40,
    totalProgress: 74,
    backgroundGradient: {
      colors: ['#0EA5E9', '#6366F1', '#8B5CF6'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
  {
    id: '3',
    title: 'Link Masters',
    description: 'Stay connected everywhere.',
    currentProgress: 50,
    totalProgress: 100,
    backgroundGradient: {
      colors: ['#EC4899', '#8B5CF6'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
  {
    id: '4',
    title: 'Motion Pros',
    description: 'Track every move.',
    currentProgress: 0,
    totalProgress: 104,
    backgroundGradient: {
      colors: ['#000000', '#065F46', '#10B981'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
  {
    id: '5',
    title: 'Play Legends',
    description: 'Master the game.',
    currentProgress: 120,
    totalProgress: 120,
    backgroundGradient: {
      colors: ['#FBBF24', '#F59E0B'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
  {
    id: '6',
    title: 'Visual Storytellers',
    description: 'Capture every moment.',
    currentProgress: 32,
    totalProgress: 65,
    backgroundGradient: {
      colors: ['#14B8A6', '#0D9488'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    category: 'electronics',
  },
];

// Filter categories - Figma'dan
const FILTER_CATEGORIES = ['All', 'Starter Packs', 'Electronics', 'Cosmetics'];

type CollectionsTabProps = {
  searchQuery?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
};

type CollectionsTabNavigationProp = NativeStackNavigationProp<
  EventsStackParamList,
  'EventsScreen'
>;

const CollectionsTab: React.FC<CollectionsTabProps> = ({
  searchQuery,
  activeFilter = 'All',
  onFilterChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomInset = useSafeAreaValues('bottom');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const navigation = useNavigation<CollectionsTabNavigationProp>();

  // Filter collections based on search and active filter
  const filteredCollections = useMemo(() => {
    let filtered = MOCK_COLLECTIONS;

    // Apply search filter
    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (collection) =>
          collection.title.toLowerCase().includes(query) ||
          collection.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(
        (collection) => collection.category === selectedCategory.toLowerCase().replace(' ', '_')
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Pull-to-Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // TODO: Backend'den fresh data fetch et
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // Collection press handler
  const handleCollectionPress = useCallback((id: string) => {
    console.log('[CollectionsTab] Collection pressed:', id);
    navigation.navigate('CollectionDetailScreen', { collectionId: id });
  }, [navigation]);

  // Category filter handler
  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    onFilterChange?.(category);
  }, [onFilterChange]);

  // Filter chips component
  const FilterChips = useMemo(() => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
        style={styles.filterChips}
      >
        {FILTER_CATEGORIES.map((category) => {
          const isActive = category === selectedCategory;
          return (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? '#000'
                    : isDark
                    ? '#2A2A2A'
                    : '#FFF',
                  borderColor: isActive ? '#000' : '#E9E9E9',
                },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive ? '#FFF' : isDark ? '#FFF' : '#000',
                  },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }, [selectedCategory, isDark, handleCategoryPress]);

  // Empty state component
  const EmptyComponent = useMemo(() => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#B9B9B9' }]}>
          {searchQuery
            ? 'No collections found'
            : selectedCategory !== 'All'
            ? `No ${selectedCategory} collections yet`
            : 'No collections yet'}
        </Text>
      </View>
    );
  }, [searchQuery, selectedCategory, isDark]);

  // Layout pattern için helper function
  // Pattern: Full (index 0) → Half, Half (index 1, 2) → Half, Half (index 3, 4) → Full (index 5) → ...
  // Her 5 itemde bir full width (0, 5, 10, 15...)
  const getItemLayout = (index: number) => {
    const patternPosition = index % 5;
    return patternPosition === 0 ? 'full' : 'half';
  };

  // Render edilecek rows'ları hazırla
  const rows = useMemo(() => {
    const result: Array<{ items: Collection[]; type: 'full' | 'row' }> = [];
    
    for (let i = 0; i < filteredCollections.length; i++) {
      const layout = getItemLayout(i);
      
      if (layout === 'full') {
        // Full width item
        result.push({
          items: [filteredCollections[i]],
          type: 'full',
        });
      } else {
        // Half width items - 2'li grupla
        const nextIndex = i + 1;
        const nextItem = filteredCollections[nextIndex];
        const nextLayout = nextIndex < filteredCollections.length ? getItemLayout(nextIndex) : null;
        
        if (nextItem && nextLayout === 'half') {
          // İki half item'i birlikte row yap
          result.push({
            items: [filteredCollections[i], nextItem],
            type: 'row',
          });
          i++; // Bir sonraki item'i skip et
        } else {
          // Tek half item kaldı
          result.push({
            items: [filteredCollections[i]],
            type: 'row',
          });
        }
      }
    }
    
    return result;
  }, [filteredCollections]);

  // Row renderer
  const renderRow = useCallback(
    ({ item: row, index }: { item: { items: Collection[]; type: 'full' | 'row' }; index: number }) => {
      if (row.type === 'full') {
        const collection = row.items[0];
        return (
          <View style={{ width: '100%', marginBottom: 8 }}>
            <CollectionCard
              collection={collection}
              isFullWidth={true}
              onPress={handleCollectionPress}
            />
          </View>
        );
      }
      
      // Row with 1 or 2 half-width items
      return (
        <View style={styles.row}>
          {row.items.map((collection, idx) => (
            <View key={collection.id} style={{ width: '48.5%' }}>
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

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      {FilterChips}

      <FlatList
        data={rows}
        numColumns={1}
        key="rows-layout"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + 24 },
        ]}
        ListEmptyComponent={EmptyComponent}
        renderItem={renderRow}
        keyExtractor={(item, index) => `row-${index}-${item.items.map(c => c.id).join('-')}`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  columnWrapper: {
    gap: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default React.memo(CollectionsTab);
