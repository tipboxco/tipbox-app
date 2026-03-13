import React, { useCallback, useState, useMemo, useEffect } from 'react';
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
  ImageBackground,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import type { EventsStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import type { Collection, CollectionBadge as CollectionBadgeType } from '../types/collection.types';
import { useCollectionDetail } from '../api/hooks';
import CollectionCardModal from '../components/CollectionCardModal';
import { useTranslation } from '@/src/hooks/useTranslation';

const DEFAULT_COLLECTION_IMAGE = require('@/assets/defaultImages/default-collection.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Support both EventsStack and Root navigation contexts
type CollectionDetailScreenRouteProp =
  | RouteProp<EventsStackParamList, 'CollectionDetailScreen'>
  | RouteProp<RootStackParamList, 'CollectionDetail'>;
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


const CollectionDetailScreen: React.FC = () => {
  const { t } = useTranslation('events');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CollectionDetailScreenNavigationProp>();
  const route = useRoute<CollectionDetailScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');

  const { collectionId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedBadgeSearch, setDebouncedBadgeSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedBadge, setSelectedBadge] = useState<CollectionBadge | null>(null);

  // Debounce search for badge API (GET /api/collections/:id?search=...)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBadgeSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Backend'den collection detayını çek; badgeSearch ile badge'ler name/description'da filtrelenir
  const { data: collectionDetail, isLoading: isLoadingCollection } = useCollectionDetail(
    collectionId,
    debouncedBadgeSearch || undefined
  );

  const collection: Collection | null = useMemo(
    () => collectionDetail?.collection ?? null,
    [collectionDetail?.collection]
  );

  const allBadges: CollectionBadge[] = useMemo(() => {
    if (!collectionDetail?.badges) return [];
    return collectionDetail.badges.map((b: CollectionBadgeType): CollectionBadge => ({
      id: b.id,
      title: b.title,
      description: b.description,
      icon: typeof b.icon === 'string' ? (toImageSource(b.icon) ?? b.icon) : b.icon,
      currentProgress: b.currentProgress,
      totalProgress: b.totalProgress,
      status: b.status,
    }));
  }, [collectionDetail?.badges]);

  // Filter badges: arama API'de yapılıyor (badgeSearch); burada sadece status filtresi uygulanıyor
  const filteredBadges = useMemo(() => {
    switch (activeFilter) {
      case 'Not Started':
        return allBadges.filter((b) => b.status === 'not_started');
      case 'In Progress':
        return allBadges.filter((b) => b.status === 'in_progress');
      case 'Completed':
        return allBadges.filter((b) => b.status === 'completed');
      case 'All':
      default:
        return allBadges;
    }
  }, [allBadges, activeFilter]);

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
      const progressPercentage =
        item.totalProgress > 0
          ? Math.min((item.currentProgress / item.totalProgress) * 100, 100)
          : 0;

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
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: isDark ? '#2A2A2A' : '#EBEBEB' },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: isCompleted ? '#10B981' : isDark ? '#686868' : '#686868',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Progress (8/10) */}
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

  // Filter tabs with translations
  const filterTabs: FilterTab[] = ['All', 'Not Started', 'In Progress', 'Completed'];
  const filterTabLabels: Record<FilterTab, string> = {
    'All': t('collection.all'),
    'Not Started': t('collection.notStarted'),
    'In Progress': t('collection.inProgress'),
    'Completed': t('collection.completed'),
  };

  if (isLoadingCollection) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}
      >
        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}
        edges={['top']}
      >
        <View style={[styles.header, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
          <Pressable
            onPress={handleGoBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color={isDark ? '#FFF' : '#000'} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
            {t('collection.title')}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? '#B9B9B9' : '#666' }]}>
            {t('collection.notFound')}
          </Text>
        </View>
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
          {t('collection.title')}
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
              <ImageBackground
                source={toImageSource(collection.backgroundImage) || DEFAULT_COLLECTION_IMAGE}
                style={styles.heroCard}
                imageStyle={styles.heroCardImage}
                resizeMode="cover"
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
                      placeholder={t('search.badge')}
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>
              </ImageBackground>
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
              {searchQuery ? t('collection.noBadgesFound') : t('collection.noBadgesInCollection')}
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
    overflow: 'hidden',
  },
  heroCardImage: {
    borderRadius: 16,
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
  progressBarContainer: {
    marginTop: 6,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
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
