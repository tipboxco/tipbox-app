import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Platform, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { FeedListProvider, useFeedListContext } from '../context/FeedListContext';
import { Box, HStack, Text, VStack } from '@/src/components/ui';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { ScrollRegistry } from '@/src/services/ScrollRegistry';
import { FilterBarReanimated } from '../components/FilterBar/FilterBarReanimated';
import { AssetAccessCard } from '../components/AssetAccessCard';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import ExpertBottomSheet from '@/src/components/ExpertBottomSheet';
import { SearchModal } from '@/src/components/SearchModal';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFeed, useFeedFiltered } from '../api/hooks';
import { getFeed, getFilteredFeed } from '../api/feedApi';
import { CardType, ProductInfoType } from '@/src/types/common';
import type { FeedFilterParams } from '../api/feedApi';
import { toImageSource, useBottomOffset } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import { useDrawerStore } from '@/src/store/drawerStore';
import type { FeedApiItem } from '../api/feedApi';
import { useQueryClient } from '@tanstack/react-query';
import { FeedSkeleton } from '@/src/components/Skeletons';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';

type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList & RootStackParamList, 'FeedScreen'>;

/**
 * FeedScreen Inner Component
 * FeedListContext içinde render edilir, feedListRef'e erişebilir
 * 
 * PERFORMANCE FIX: React.memo ile sarmalandı - gereksiz re-render'ları önler
 * useFocusEffect ile sadece focus'ta render edilir
 */
const FeedScreenInner = React.memo(() => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { user } = useAppStore();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const queryClient = useQueryClient();
  
  // FEATURE: Pull-to-refresh için son görülen post ID'sini takip et
  // Kullanıcı en alta geldiğinde bu ID güncellenir, refresh'te cursor olarak kullanılır
  const [lastSeenPostId, setLastSeenPostId] = useState<string | undefined>(undefined);

  // FeedListContext'ten feedListRef'i al
  // FeedScreenInner FeedListProvider içinde render edildiği için context her zaman tanımlıdır
  const feedListContext = useFeedListContext();
  if (!feedListContext) {
    throw new Error('FeedScreenInner must be rendered within FeedListProvider');
  }
  const { feedListRef } = feedListContext;

  // ARCHITECTURE FIX: Instagram/Twitter-style scroll-to-top pattern
  // 1. useScrollToTop hook'u (React Navigation built-in) - aktif tab için
  // 2. ScrollRegistry (global fallback) - hangi tab aktif olursa olsun çalışır
  useScrollToTop(feedListRef);

  // CRITICAL FIX: Register scrollable in global registry
  // This ensures scroll-to-top works even when FeedScreen is not the active tab
  // or when detail screens are open on top
  useFocusEffect(
    useCallback(() => {
      // Register when screen is focused
      ScrollRegistry.register('feed', feedListRef);
      
      return () => {
        // Unregister when screen is unfocused (optional - can keep registered)
        // ScrollRegistry.unregister('feed');
      };
    }, [feedListRef])
  );

  // Safe area and tab bar insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // PERFORMANCE FIX: Drawer durumunu kontrol et - drawer açılırken/kapanırken FlatList scroll'unu önle
  // CRITICAL: isDragging state'ini kullan - swipe sırasında re-render önleme (JS thread'de kasma önleme)
  const isDrawerOpen = useDrawerStore((state) => state.isOpen);
  const isDragging = useDrawerStore((state) => state.isDragging);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Drawer açıkken veya swipe sırasında scroll'u disable et
  // CRITICAL: isDragging kontrolü ile swipe sırasında re-render önleme
  useEffect(() => {
    if (isDrawerOpen || isDragging) {
      setIsScrollEnabled(false);
    } else {
      // Drawer kapandıktan sonra kısa bir delay ile scroll'u enable et
      // Bu, drawer kapanma animasyonunun tamamlanmasını bekler ve titreme önler
      const timer = setTimeout(() => {
        setIsScrollEnabled(true);
      }, 150); // 150ms delay - drawer kapanma animasyonu tamamlandıktan sonra
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, isDragging]);

  // Filtre state'i
  // @see docs/FEED_FILTERS_STATUS.md - Detaylı filtre dokümantasyonu
  // 
  // FIX: Filter panel açık/kapalı durumu ve kapatma fonksiyonu - overlay için
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const closeFilterPanelRef = useRef<(() => void) | null>(null);
  
  // Filtre Parametreleri:
  // - interests: Interest type'ları array'i (CATEGORY_MATCH, MUTUAL_TRUST, ENGAGEMENT_HIGH, NEW_USER, BOOSTED, TRUSTER)
  //   NOTE: INVENTORY_MATCH temporarily disabled due to backend Prisma schema issue
  //   Backend'de category ile birleştirilir (OR mantığı)
  // - tags: Post türleri array'i (Review, Benchmark, Tips, Question, Experience, Update)
  //   contentPostTags ve tags tablolarında arama yapılır
  // - category: Tek bir kategori ID'si
  //   Backend'de interests ile birleştirilir (OR mantığı)
  // - sort: 'recent' (Boost → Tarih) veya 'top' (Beğeni → Görüntülenme → Tarih)
  const [filters, setFilters] = useState<FeedFilterParams>({});


  // FEATURE: Log lastSeenPostId changes - REMOVED for performance

  // Filtre aktif mi kontrolü
  // Herhangi bir filtre seçilmişse filtered feed API'sini kullan
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.interests && Array.isArray(filters.interests) && filters.interests.length > 0) ||
      (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) ||
      (filters.category && Array.isArray(filters.category) && filters.category.length > 0) ||
      filters.sort
    );
  }, [filters]);

  // Feed API hooks - PERFORMANCE FIX: Only enable filtered query when filters are active
  // Normal feed: /feed endpoint'i (filtre yok)
  // Filtered feed: /feed/filtered endpoint'i (filtre var)
  const normalFeedQuery = useFeed(10);
  const filteredFeedQuery = useFeedFiltered(10, filters, hasActiveFilters); // Only enabled when filters are active

  // Filtre varsa filtered feed'i, yoksa normal feed'i kullan
  // Bu sayede filtre değiştiğinde otomatik olarak doğru endpoint çağrılır
  const feedQuery = hasActiveFilters ? filteredFeedQuery : normalFeedQuery;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = feedQuery;

  // PERFORMANCE FIX: Optimized feedItems memoization
  // - Single pass through pages and items (reduced from 3 loops to 1)
  // - Early returns for invalid data
  // - Efficient Map-based deduplication
  const feedItems = useMemo(() => {
    // Early return for invalid data
    if (!data?.pages || !Array.isArray(data.pages)) {
      return [];
    }

    // Single-pass algorithm: flatten and deduplicate in one iteration
    const uniqueItemsMap = new Map<string, FeedApiItem>();

    // Iterate through pages once
    for (const page of data.pages) {
      // Skip invalid pages early
      if (!page || typeof page !== 'object' || !('items' in page)) {
        continue;
      }

      const pageItems = page.items;
      // Skip invalid items arrays
      if (!Array.isArray(pageItems)) {
        continue;
      }

      // Process items in this page
      for (const item of pageItems) {
        // Skip invalid items early
        if (!item || typeof item !== 'object' || !('data' in item)) {
          continue;
        }

        const itemData = item.data;
        // Extract ID efficiently
        if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
          const itemId = String(itemData.id);
          // Map.set automatically handles duplicates (last one wins, which is fine for pagination)
          uniqueItemsMap.set(itemId, item);
        }
      }
    }

    // Convert Map to array (single allocation)
    return Array.from(uniqueItemsMap.values());
  }, [data?.pages]);

  // FEATURE: feedItems her değiştiğinde son item'ın ID'sini güncelle
  // Bu sayede kullanıcı aşağı scroll etmeden de pull-to-refresh yapabilir
  useEffect(() => {
    if (feedItems.length > 0) {
      const lastItem = feedItems[feedItems.length - 1];
      if (lastItem?.data?.id) {
        const postId = String(lastItem.data.id);
        setLastSeenPostId(postId);
      }
    }
  }, [feedItems.length]); // Sadece item sayısı değiştiğinde çalış (performans için)

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  const handleTabChange = (tab: 'wallet' | 'inventory') => {
    if (tab === 'wallet') {
      // Wallet ekranına git - FeedStack içinde olduğu için global bottom sheet çalışır
      navigation.navigate('WalletScreen');
    } else if (tab === 'inventory') {
      if (user?.id) {
        // Inventory ekranına git - InventoryScreen mount olduğunda useInventory hook'u otomatik olarak /inventory endpoint'ine GET isteği atacak
        (navigation as any).navigate('Profile', {
          screen: 'InventoryList',
          params: {
            userId: user.id,
          },
        });
      }
    }
  };

  const handleExpertPress = () => {
    // ARCHITECTURE FIX: Use enableDynamicSizing instead of snapPoints
    openBottomSheet(
      <>
        {/* Header */}
        <VStack space="md" borderBottomWidth={1} borderBottomColor="#D9D9D9">
          <HStack justifyContent="center" alignItems="center">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              textAlign="center"
            >
              Expert Now
            </Text>
          </HStack>
        </VStack>
        <ExpertBottomSheet onClose={closeBottomSheet} />
      </>,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true, // ARCHITECTURE FIX: Use dynamic sizing instead of snapPoints
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarHeight,
      }
    );
  };

  // Map Feed to PostCardData
  const mapFeedToCardData = (item: ProfilePost): PostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    
    // content array ise string'e çevir, değilse direkt kullan
    const contentString = Array.isArray(item.content)
      ? item.content
        .filter((contentItem) => contentItem != null) // Filter out null/undefined items
        .map((contentItem) => contentItem?.content || '')
        .join(' ')
      : (item.content || '');

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
      : [];
    
    // Görseli olmayan postlar için boş array döndür (default görsel ekleme)
    const images = mappedImages;

    // contextData.image için fallback - null/undefined/empty string durumunda default görsel kullan
    const contextImage = item.contextData?.image
      ? (toImageSource(item.contextData.image) || defaultPostImage)
      : defaultPostImage; // FIX: contextData.image null/undefined ise direkt default görsel kullan
    const contextData = item.contextData
      ? {
          ...item.contextData,
          image: contextImage, // FIX: contextImage zaten default görsel içeriyor
        }
      : undefined;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png'),
      },
      content: contentString,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData,
    };
  };

  // Map Experience (ReviewApiItem) to ReviewCardData
  const mapExperienceToCardData = (item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
    const avatarSource = toImageSource(item.user?.avatar) || defaultAvatar;
    const productImage = item.contextData?.image
      ? toImageSource(item.contextData.image)
      : defaultPostImage;

    const content: ReviewCardContentItem[] = (item.content && Array.isArray(item.content))
      ? item.content
        .filter((contentItem) => contentItem != null) // Filter out null/undefined items
        .map((contentItem) => ({
          tag: {
            icon: 'tag',
            title: contentItem?.title || '',
          },
          text: contentItem?.content || '',
          rating: Array(5)
            .fill(false)
            .map((_, index) => index < (contentItem?.rating || 0)),
        }))
      : [];

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
        action: 'wrote a review',
      },
      contextData: {
        id: item.contextData?.id || '',
        name: item.contextData?.name || '',
        subName: item.contextData?.subName || '',
        image: productImage || defaultPostImage,
        isOwned: item.contextData?.isOwned || false,
      },
      content,
      tags: Array.isArray(item.tags) ? item.tags : [],
      images,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Benchmark to BenchmarkCardData
  const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    const products: BenchmarkProduct[] = (item.products && Array.isArray(item.products))
      ? item.products
        .filter((p) => p != null) // Filter out null/undefined products
        .map((p) => ({
          id: p?.id || '',
          name: p?.name || '',
          subName: p?.subName || '',
          image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: p?.isOwned || false,
          choice: p?.choice || false,
        }))
      : [];

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      products,
      content: item.content || '',
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Tips to TipsCardData
  const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    // contextData undefined kontrolü
    if (!item.contextData) {
      console.warn('[mapTipsToCardData] Missing contextData for item:', item.id);
      // Güvenli default değerler döndür
      // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
      // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
      const mappedImages = Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [];
      const images = mappedImages;

      return {
        id: item.id || '',
        user: {
          id: item.user?.id || '',
          name: item.user?.name || '',
          title: item.user?.title || '',
          avatar: avatarSource,
        },
        category: {
          id: '',
          name: '',
          subCategory: '',
          image: require('@/assets/inventory/product_01.png'),
          product: {
            id: '',
            name: '',
            subName: '',
            image: require('@/assets/inventory/product_01.png'),
          },
        },
        content: item.content || '',
        images,
        stats: item.stats,
        tag: item.tag,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    // Missing product image warning removed for performance
    const product: TipsProduct = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subName: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
    };

    const category: TipsCategory = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subCategory: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
      product,
    };

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      category,
      content: item.content || '',
      images,
      stats: item.stats,
      tag: item.tag,
      createdAt: item.createdAt,
    };
  };

  // Map Question to QuestionCardData
  const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    // contextData undefined kontrolü
    if (!item.contextData) {
      console.warn('[mapQuestionToCardData] Missing contextData for item:', item.id);
      // Güvenli default değerler döndür
      // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
      // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
      const mappedImages = Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [];
      const images = mappedImages;

      return {
        id: item.id || '',
        user: {
          id: item.user?.id || '',
          name: item.user?.name || '',
          title: item.user?.title || '',
          avatar: avatarSource,
        },
        category: {
          id: '',
          name: '',
          subCategory: '',
          image: require('@/assets/inventory/product_01.png'),
          product: {
            id: '',
            name: '',
            subName: '',
            image: require('@/assets/inventory/product_01.png'),
          },
        },
        content: item.content || '',
        isBoosted: item.isBoosted || false,
        images,
        stats: item.stats,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    // Missing product image warning removed for performance

    const product: QuestionCardProduct = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subName: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
    };

    const category: QuestionCardCategory = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subCategory: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
      product,
    };

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      category,
      content: item.content || '',
      isBoosted: item.isBoosted || false,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Update to UpdateCardData
  const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');

    // ContextType'ı ProductInfoType'a çevir
    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (item.contextType === 'product_group') {
      productInfoType = ProductInfoType.PRODUCT_GROUP;
    } else if (item.contextType === 'sub_category') {
      productInfoType = ProductInfoType.SUB_CATEGORY;
    }

    // relatedPost null check - eğer yoksa relatedPost olmadan döndür
    if (!item.relatedPost) {
      console.warn('[mapUpdateToCardData] Missing relatedPost for item:', item.id);
      // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
      // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
      const mappedImages = Array.isArray(item.images)
        ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
        : [];
      const images = mappedImages;

      // Return a safe default structure without relatedPost
      return {
        id: item.id,
        user: {
          id: item.user.id,
          name: item.user.name,
          title: item.user.title,
          avatar: avatarSource,
        },
        stats: item.stats,
        createdAt: item.createdAt,
        contextType: productInfoType,
        product: {
          id: '',
          name: '',
          subName: '',
          image: require('@/assets/inventory/product_01.png'),
          isOwned: false,
        },
        content: item.content || '',
        images,
        relatedPost: undefined, // relatedPost olmadığında undefined döndür
      };
    }

    // relatedPost.content formatını component'in beklediği formata çevir
    const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
      ? item.relatedPost.content
        .filter((contentItem) => contentItem != null) // Filter out null/undefined items
        .map((contentItem) => {
          // Rating'i number'dan number[]'e çevir (5 yıldız için)
          const ratingArray: number[] = Array(5).fill(0);
          const ratingValue = Math.min(Math.max(Math.round((contentItem?.rating || 0) / 20), 0), 5); // 0-100'den 0-5'e çevir
          for (let i = 0; i < ratingValue; i++) {
            ratingArray[i] = 1;
          }

          return {
            tag: {
              icon: 'tag',
              title: contentItem?.title || '',
            },
            text: contentItem?.content || '',
            rating: ratingArray,
          };
        })
      : [];

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: productInfoType,
      product: {
        id: item.relatedPost?.product?.id || '',
        name: item.relatedPost?.product?.name || '',
        subName: item.relatedPost?.product?.subName || '',
        image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
        isOwned: item.relatedPost?.product?.isOwned || false,
      },
      content: item.content || '',
      images,
      relatedPost: item.relatedPost ? {
        id: item.relatedPost.id || '',
        product: {
          id: item.relatedPost.product?.id || '',
          name: item.relatedPost.product?.name || '',
          subName: item.relatedPost.product?.subName || '',
          image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: item.relatedPost.product?.isOwned || false,
        },
        content: relatedPostContent,
        tags: (item.relatedPost.tags && Array.isArray(item.relatedPost.tags)) ? item.relatedPost.tags : [],
        images: (() => {
          // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
          // Kullanıcı post oluştururken görsel eklemek istememiş olabilir, bu durumda görsel alanı gösterilmemeli
          const relatedPostImages = (item.relatedPost?.images && Array.isArray(item.relatedPost.images))
            ? item.relatedPost.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
            : [];
          return relatedPostImages;
        })(),
      } : undefined,
    };
  };

  // PERFORMANCE FIX: Memoize renderFeedItem to prevent unnecessary re-renders
  // useCallback ensures the function reference stays stable across renders
  // Note: Mapping functions are pure functions and don't need to be in dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderFeedItem = useCallback(({ item }: { item: FeedApiItem }) => {
    // Safety check: ensure item and item.data exist
    if (!item || !item.data || !item.data.id) {
      if (__DEV__) {
        console.warn('[FeedScreen] Invalid feed item:', item);
      }
      return null;
    }

    const itemId = item.data.id;

    // Use string comparison for type matching (API returns strings, not enum values)
    switch (item.type) {
      case CardType.EXPERIENCE:
      case 'experience':
        // Experience type için ReviewApiItem kullan ve ExperiencePostCard render et
        if ('contextData' in item.data && 'content' in item.data && Array.isArray(item.data.content)) {
          return (
            <ExperiencePostCard
              key={itemId}
              data={mapExperienceToCardData(item.data as ReviewApiItem & { type: 'experience' })}
            />
          );
        }
        // EXPERIENCE validation warning removed for performance
        return null;
      case CardType.POST:
      case 'post':
        // Post type için ProfilePost kullan ve PostCard render et
        return (
          <PostCard
            key={itemId}
            data={mapFeedToCardData(item.data as ProfilePost)}
          />
        );
      case CardType.BENCHMARK:
      case 'benchmark':
        return (
          <BenchmarkPostCard
            key={itemId}
            data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
          />
        );
      case CardType.QUESTION:
      case 'question':
        // Question type kontrolü - isBoosted optional olabilir
        if ('contextType' in item.data && 'contextData' in item.data) {
          return (
            <QuestionPostCard
              key={itemId}
              data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
            />
          );
        }
        if (__DEV__) {
          console.warn(`[FeedScreen] QUESTION item ${itemId} failed validation checks:`, {
            hasContextType: 'contextType' in item.data,
            hasContextData: 'contextData' in item.data,
            hasIsBoosted: 'isBoosted' in item.data,
          });
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
      case 'tipsAndTricks':
        return (
          <TipsAndTricksPostCard
            key={itemId}
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
          />
        );
      case CardType.UPDATE:
      case 'update':
        // Update type için UpdateApiItem kullan ve UpdatePostCard render et
        if ('relatedPost' in item.data && 'contextType' in item.data) {
          return (
            <UpdatePostCard
              key={itemId}
              data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            />
          );
        }
        if (__DEV__) {
          console.warn(`[FeedScreen] UPDATE item ${itemId} failed validation checks`);
        }
        return null;
      default:
        if (__DEV__) {
          console.warn(`[FeedScreen] Unknown item type: ${item.type} for item ${itemId}`);
        }
        return null;
    }
  }, []); // Empty deps - mapping functions are pure and stable

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, feedItems.length]);

  // PERFORMANCE FIX: Memoize renderFooter to prevent unnecessary re-renders
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  // FEATURE: Pull-to-refresh handler - ESKİ listeyi temizleyip, son görülen ID'den başlayan YENİ bir liste başlat
  const handleRefresh = useCallback(async () => {
    if (!lastSeenPostId) {
      // İlk yüklemede normal refetch yap
      await refetch();
      return;
    }
    
    try {
      // Son görülen post ID'sini cursor olarak kullanarak sonraki sayfayı getir
      let newData;
      if (hasActiveFilters) {
        newData = await getFilteredFeed(lastSeenPostId, 10, filters);
      } else {
        newData = await getFeed(lastSeenPostId, 10);
      }
      
      if (newData.items.length > 0) {
        // ESKİ query cache'ini tamamen temizle ve YENİ veriyi set et
        const queryKey = hasActiveFilters 
          ? ['feed', 'filtered', undefined, 10, filters]
          : ['feed', undefined, 10, undefined, undefined];
        
        // Query cache'ini yeni veri ile değiştir (eski veriler silinir)
        queryClient.setQueryData(queryKey, {
          pages: [newData],
          pageParams: [undefined],
        });
        
        // YENİ listedeki son item ID'sini lastSeenPostId olarak güncelle
        const lastItem = newData.items[newData.items.length - 1];
        if (lastItem?.data?.id) {
          const newLastSeenPostId = String(lastItem.data.id);
          setLastSeenPostId(newLastSeenPostId);
        }
        
        // Scroll'u en üste götür
        if (feedListRef?.current) {
          feedListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (error) {
      // Hata durumunda normal refetch yap
      await refetch();
    }
  }, [lastSeenPostId, feedItems.length, hasNextPage, isFetchingNextPage, hasActiveFilters, filters, queryClient, refetch, feedListRef]);

  // PERFORMANCE FIX: Memoize keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item: FeedApiItem, index: number) => {
    // Güvenli key extraction: item.data.id varsa kullan, yoksa index kullan
    if (item?.data?.id) {
      return String(item.data.id);
    }
    return `feed-item-${index}`;
  }, []);

  // PERFORMANCE FIX: Memoize contentContainerStyle to prevent unnecessary re-renders
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomPadding }),
    [bottomPadding]
  );

  // FEATURE: Handle scrollToIndex failures - fallback to scrollToOffset
  const handleScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    // Fallback: Use scrollToOffset
    if (feedListRef?.current) {
      setTimeout(() => {
        feedListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [feedListRef]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          logo={require('@/assets/tipbox-nobg.png')}
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />
        <VStack>
          <Box pb="$0">
            <AssetAccessCard onTabChange={handleTabChange} />
          </Box>
          <Box pt={0}>
            <FilterBarReanimated 
              filters={filters} 
              onFiltersChange={setFilters}
              onPanelStateChange={setIsFilterPanelOpen}
              onClosePanelRef={(closeFn) => {
                closeFilterPanelRef.current = closeFn;
              }}
            />
          </Box>
        </VStack>
        <Box flex={1}>
          {isLoading && feedItems.length === 0 ? (
            <FeedSkeleton count={5} />
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <VStack space="md" alignItems="center">
                <Text color="#CE4A4A" fontSize="$md" fontWeight="$bold">
                  Feed Yüklenemedi
                </Text>
                {(error as any)?.response?.status === 500 ? (
                  <>
                    <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" textAlign="center">
                      Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.
                    </Text>
                    {(error as any)?.response?.data?.error?.message && (
                      <Text color={isDark ? '$textDark500' : '$textLight400'} fontSize="$xs" textAlign="center" mt="$2">
                        {(error as any).response.data.error.message}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" textAlign="center">
                      {error.message || 'Bilinmeyen bir hata oluştu'}
                    </Text>
                    {(error as any)?.response?.status && (
                      <Text color={isDark ? '$textDark500' : '$textLight400'} fontSize="$xs" textAlign="center">
                        HTTP Status: {(error as any).response.status}
                      </Text>
                    )}
                    {(error as any)?.response?.data?.message && (
                      <Text color={isDark ? '$textDark500' : '$textLight400'} fontSize="$xs" textAlign="center">
                        {(error as any).response.data.message}
                      </Text>
                    )}
                  </>
                )}
              </VStack>
            </Box>
          ) : feedItems.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                No feed content found yet.
              </Text>
            </Box>
          ) : (
            <FlatList<FeedApiItem>
              ref={feedListRef}
              data={feedItems}
              renderItem={renderFeedItem}
              keyExtractor={keyExtractor}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              contentContainerStyle={contentContainerStyle}
              showsVerticalScrollIndicator={false}
              // CRITICAL FIX: removeClippedSubviews={false} - scrollToOffset çalışması için gerekli
              // removeClippedSubviews={true} olduğunda native view detached olabilir ve scroll çalışmaz
              removeClippedSubviews={false}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              // PERFORMANCE FIX: Drawer açılırken/kapanırken scroll'u devre dışı bırak - titreme/kasma önleme
              scrollEnabled={isScrollEnabled}
              // PERFORMANCE FIX: extraData ile FlatList'e ne zaman re-render yapması gerektiğini söyle
              extraData={feedItems.length}
              // FEATURE: Pull-to-refresh - Son görülen post ID'sini cursor olarak kullanarak yeni içerikleri getir
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              // FEATURE: scrollToIndex failed handler - fallback to scrollToOffset
              onScrollToIndexFailed={handleScrollToIndexFailed}
              // CRITICAL FIX: onLayout - FlatList render olduğunda ScrollRegistry'yi güncelle
              // Bu, timing problemi nedeniyle scroll'un çalışmamasını önler
              onLayout={() => {
                // FlatList layout tamamlandığında ref'i tekrar register et
                if (feedListRef?.current) {
                  ScrollRegistry.register('feed', feedListRef);
                }
              }}
              // CRITICAL FIX: onContentSizeChange - Content size değiştiğinde scroll pozisyonunu kontrol et
              onContentSizeChange={() => {
                // Content size değiştiğinde ref'i güncelle
                if (feedListRef?.current) {
                  ScrollRegistry.register('feed', feedListRef);
                }
              }}
              // FIX: Filter panel açıkken FlatList tıklamalarını engelle - overlay önce çalışsın
              pointerEvents={isFilterPanelOpen ? 'none' : 'auto'}
            />
          )}
        </Box>
        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={handleSearchClose}
        />

        {/* FIX: Filter panel açıkken overlay - tüm ekranı kaplar, paneli kapatır */}
        {/* Overlay z-index: 998 (panel: 1000) - overlay panel'in altında, sadece panel dışındaki alanları kapsar */}
        {isFilterPanelOpen && (
          <Pressable
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={998}
            onPress={() => {
              // Panel kapatma işlemi - FilterBar'daki closePanel fonksiyonunu çağır
              if (closeFilterPanelRef.current) {
                closeFilterPanelRef.current();
              }
            }}
            style={{
              backgroundColor: 'transparent',
            }}
            // FIX: Overlay panel'in altında (z-index: 998) ama tüm ekranı kaplar
            // Panel'in z-index'i 1000 olduğu için panel içeriği tıklanabilir kalır
          />
        )}

      </Box>
    </SafeAreaView>
  );
}, (prevProps, nextProps) => {
  // PERFORMANCE FIX: Custom comparison - sadece gerçek değişikliklerde re-render
  // FeedScreen props almadığı için her zaman true döner (re-render yok)
  return true;
});
FeedScreenInner.displayName = 'FeedScreenInner';

/**
 * FeedScreen Component
 * FeedListProvider ile sarmalanmış, feedListRef'i tüm child component'lere sağlar
 * 
 * PERFORMANCE FIX: React.memo ile sarmalandı - gereksiz re-render'ları önler
 * useFocusEffect ile sadece focus'ta render edilir (mesaj ekranındayken render olmaz)
 */
export const FeedScreen = React.memo(() => {
  return (
    <FeedListProvider>
      <FeedScreenInner />
    </FeedListProvider>
  );
}, () => {
  // PERFORMANCE FIX: Custom comparison - sadece gerçek değişikliklerde re-render
  // FeedScreen props almadığı için her zaman true döner (re-render yok)
  return true;
});
FeedScreen.displayName = 'FeedScreen';
