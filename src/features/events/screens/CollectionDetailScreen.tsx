import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSafeAreaValues } from '@/src/utils';
import type { EventsStackParamList } from '../navigation';
import type { Collection } from '../types/collection.types';
import CollectionCardModal from '../components/CollectionCardModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CollectionDetailScreenRouteProp = RouteProp<EventsStackParamList, 'CollectionDetailScreen'>;
type CollectionDetailScreenNavigationProp = NativeStackNavigationProp<
  EventsStackParamList,
  'CollectionDetailScreen'
>;

// Badge/Achievement types
interface CollectionBadge {
  id: string;
  title: string;
  description: string;
  icon: ImageSourcePropType | string; // Local require() or URL from backend
  currentProgress: number;
  totalProgress: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

type FilterTab = 'All' | 'Not Started' | 'In Progress' | 'Completed';

// Mock collection data
const MOCK_COLLECTION: Collection = {
  id: '1',
  title: 'Silicon Strategist',
  description: 'Completing this collection proves your deep understanding of the digital backbone. You\'ve demonstrated that you know exactly what drives modern productivity. You are now a certified authority in high-performance computing.',
  currentProgress: 12,
  totalProgress: 120,
  backgroundGradient: {
    colors: ['#3B2F63', '#5C4A7D', '#8B6F47'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  category: 'electronics',
};

// Mock badges - Using existing badge images from assets
const MOCK_BADGES: CollectionBadge[] = [
  {
    id: '1',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/badge_01.png'),
    currentProgress: 8,
    totalProgress: 10,
    status: 'in_progress',
  },
  {
    id: '2',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/badge_02.png'),
    currentProgress: 8,
    totalProgress: 10,
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/badge_03.png'),
    currentProgress: 8,
    totalProgress: 10,
    status: 'not_started',
  },
  {
    id: '4',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/badge_04.png'),
    currentProgress: 10,
    totalProgress: 10,
    status: 'completed',
  },
  {
    id: '5',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/rozet_01.png'),
    currentProgress: 0,
    totalProgress: 10,
    status: 'not_started',
  },
  {
    id: '6',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/rozet_02.png'),
    currentProgress: 5,
    totalProgress: 10,
    status: 'in_progress',
  },
  {
    id: '7',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/rozet_03.png'),
    currentProgress: 3,
    totalProgress: 10,
    status: 'in_progress',
  },
  {
    id: '8',
    title: 'Boot Loader',
    description: 'Add your first computer or tablet to your inventory.',
    icon: require('@/assets/badges/rozet_04.png'),
    currentProgress: 0,
    totalProgress: 10,
    status: 'not_started',
  },
];

const CollectionDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CollectionDetailScreenNavigationProp>();
  const route = useRoute<CollectionDetailScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  
  const { collectionId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedBadge, setSelectedBadge] = useState<CollectionBadge | null>(null);

  // TODO: Backend'den collection detayını çek
  const collection = MOCK_COLLECTION;
  const allBadges = MOCK_BADGES;

  // Filter badges based on active filter
  const filteredBadges = useMemo(() => {
    let filtered = allBadges;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (badge) =>
          badge.title.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'Not Started':
        return filtered.filter((b) => b.status === 'not_started');
      case 'In Progress':
        return filtered.filter((b) => b.status === 'in_progress');
      case 'Completed':
        return filtered.filter((b) => b.status === 'completed');
      case 'All':
      default:
        return filtered;
    }
  }, [allBadges, activeFilter, searchQuery]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBadgePress = useCallback((badgeId: string) => {
    console.log('[CollectionDetailScreen] Badge pressed:', badgeId);
    const badge = allBadges.find((b) => b.id === badgeId);
    if (badge) {
      setSelectedBadge(badge);
    }
  }, [allBadges]);

  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  const handleFilterPress = useCallback((filter: FilterTab) => {
    setActiveFilter(filter);
  }, []);

  // Render badge item
  const renderBadgeItem = useCallback(
    ({ item }: { item: CollectionBadge }) => {
      const isCompleted = item.status === 'completed';
      
      return (
        <Pressable
          style={[
            styles.badgeCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFF',
              borderColor: isDark ? '#2A2A2A' : '#E9E9E9',
            },
          ]}
          onPress={() => handleBadgePress(item.id)}
        >
          {/* Badge Icon/Image */}
          <View style={styles.badgeIconContainer}>
            {item.icon ? (
              <Image 
                source={typeof item.icon === 'string' ? { uri: item.icon } : item.icon} 
                style={styles.badgeImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.badgeIconPlaceholder,
                  { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
                ]}
              >
                <Feather name="award" size={20} color={isCompleted ? '#10B981' : '#C1BEBF'} />
              </View>
            )}
          </View>

          {/* Badge Info */}
          <View style={styles.badgeInfo}>
            <Text
              style={[styles.badgeTitle, { color: isDark ? '#FFF' : '#000' }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.badgeDescription,
                { color: isDark ? '#8E8E93' : '#8E8E93' },
              ]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          </View>

          {/* Progress */}
          <Text
            style={[
              styles.badgeProgress,
              { 
                color: isCompleted ? '#10B981' : isDark ? '#8E8E93' : '#8E8E93',
              },
            ]}
          >
            {item.currentProgress}/{item.totalProgress}
          </Text>
        </Pressable>
      );
    },
    [isDark, handleBadgePress]
  );

  // Filter tabs
  const filterTabs: FilterTab[] = ['All', 'Not Started', 'In Progress', 'Completed'];

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#000' : '#FFF' },
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#FFF' },
      ]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? '#000' : '#FFF' },
        ]}
      >
        <Pressable
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather
            name="arrow-left"
            size={24}
            color={isDark ? '#FFF' : '#000'}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
          Collection
        </Text>
        <View style={styles.headerRight} />
      </View>

        <FlatList
        data={filteredBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + 24 },
        ]}
        ListHeaderComponent={
          <>
            {/* Collection Hero Card */}
            <View style={styles.heroCardContainer}>
              <LinearGradient
                colors={collection.backgroundGradient.colors}
                start={collection.backgroundGradient.start}
                end={collection.backgroundGradient.end}
                style={styles.heroCard}
              >
                {/* Progress Badge */}
                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeText}>
                    {collection.currentProgress}/{collection.totalProgress}
                  </Text>
                </View>

                {/* Content Container */}
                <View style={styles.heroContent}>
                  {/* Title */}
                  <Text style={styles.heroTitle}>{collection.title}</Text>
                  
                  {/* Description */}
                  <Text style={styles.heroDescription}>
                    {collection.description}
                  </Text>

                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                    <Feather name="search" size={18} color="rgba(255, 255, 255, 0.6)" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Badge"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsContent}
              >
                {filterTabs.map((tab) => {
                  const isActive = tab === activeFilter;
                  return (
                    <Pressable
                      key={tab}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: isActive
                            ? isDark
                              ? '#2A2A2A'
                              : '#000'
                            : 'transparent',
                          borderWidth: isActive ? 0 : 1,
                          borderColor: '#8E8E93',
                        },
                      ]}
                      onPress={() => handleFilterPress(tab)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          {
                            color: isActive ? '#FFF' : '#8E8E93',
                          },
                        ]}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDark ? '#B9B9B9' : '#666' }]}>
              {searchQuery ? 'No badges found' : 'No badges in this collection'}
            </Text>
          </View>
        }
      />

      {/* Collection Card Modal */}
      <CollectionCardModal
        visible={!!selectedBadge}
        onClose={handleCloseModal}
        badge={selectedBadge}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  heroCardContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    position: 'relative',
  },
  progressBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroContent: {
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterPillsContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    minHeight: 56,
  },
  badgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  badgeIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInfo: {
    flex: 1,
    gap: 2,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  badgeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  badgeProgress: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default CollectionDetailScreen;
