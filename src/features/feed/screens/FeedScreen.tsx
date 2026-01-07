import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Platform, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { FeedListProvider, useFeedListContext } from '../context/FeedListContext';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { FilterBar } from '../components/FilterBar';
import { AssetAccessCard } from '../components/AssetAccessCard';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ExpertButton } from '@/src/components/FloatingActionButton';
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
import { CardType, ProductInfoType } from '@/src/types/common';
import type { FeedFilterParams } from '../api/feedApi';
import { toImageSource, useBottomOffset } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import type { FeedApiItem } from '../api/feedApi';
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
 */
const FeedScreenInner = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAppStore();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // FeedListContext'ten feedListRef'i al
  const { feedListRef } = useFeedListContext();

  // Safe area and tab bar insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Filtre state'i
  // @see docs/FEED_FILTERS_STATUS.md - Detaylı filtre dokümantasyonu
  // 
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

  // Log filter changes (especially for interests)
  useEffect(() => {
    if (filters.interests && Array.isArray(filters.interests) && filters.interests.length > 0) {
      console.log('[FeedScreen] 🔍 Interests filter changed:', {
        interests: filters.interests,
        allFilters: filters,
      });
    }
  }, [filters.interests]);

  // Filtre aktif mi kontrolü
  // Herhangi bir filtre seçilmişse filtered feed API'sini kullan
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.interests && Array.isArray(filters.interests) && filters.interests.length > 0) ||
      (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) ||
      filters.category ||
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

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  const handleTabChange = (tab: 'wallet' | 'inventory') => {
    if (tab === 'wallet') {
      // Wallet ekranına git - WalletNavigator otomatik olarak bağlantı durumuna göre WalletConnection veya WalletScreen'i gösterir
      (navigation as any).navigate('Wallet', {
        screen: 'WalletScreen',
      });
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
        <VStack space="md" pb={'$3'} mb={'$4'} borderBottomWidth={1} borderBottomColor="#D9D9D9">
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
    // content array ise string'e çevir, değilse direkt kullan
    const contentString = Array.isArray(item.content)
      ? item.content
          .filter((contentItem) => contentItem != null) // Filter out null/undefined items
          .map((contentItem) => contentItem?.content || '')
          .join(' ')
      : (item.content || '');

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: toImageSource(item.user?.avatar) || require('@/assets/avatar/ozan.png'),
      },
      content: contentString,
      images: Array.isArray(item.images) 
        ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
        : [],
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData: item.contextData,
    };
  };

  // Map Experience (ReviewApiItem) to ReviewCardData
  const mapExperienceToCardData = (item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/ozan.png');
    const productImage = item.contextData?.image
      ? toImageSource(item.contextData.image)
      : undefined;

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
        image: productImage,
        isOwned: item.contextData?.isOwned || false,
      },
      content,
      tags: Array.isArray(item.tags) ? item.tags : [],
      images: Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [],
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Benchmark to BenchmarkCardData
  const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/ozan.png');

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
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/ozan.png');

    // contextData undefined kontrolü
    if (!item.contextData) {
      console.warn('[mapTipsToCardData] Missing contextData for item:', item.id);
      // Güvenli default değerler döndür
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
        images: Array.isArray(item.images)
          ? item.images
              .map((img) => toImageSource(img))
              .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
          : [],
        stats: item.stats,
        tag: item.tag,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    if (!productImage) {
      console.warn('[mapTipsToCardData] Missing product image for item:', item.id);
    }
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
      images: Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [],
      stats: item.stats,
      tag: item.tag,
      createdAt: item.createdAt,
    };
  };

  // Map Question to QuestionCardData
  const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/ozan.png');

    // contextData undefined kontrolü
    if (!item.contextData) {
      console.warn('[mapQuestionToCardData] Missing contextData for item:', item.id);
      // Güvenli default değerler döndür
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
        images: Array.isArray(item.images)
          ? item.images
              .map((img) => toImageSource(img))
              .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
          : [],
        stats: item.stats,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    if (!productImage) {
      console.warn('[mapQuestionToCardData] Missing product image for item:', item.id);
    }

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
      images: Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [],
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Update to UpdateCardData
  const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
    const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/ozan.png');
    
    // ContextType'ı ProductInfoType'a çevir
    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (item.contextType === 'product_group') {
      productInfoType = ProductInfoType.PRODUCT_GROUP;
    } else if (item.contextType === 'sub_category') {
      productInfoType = ProductInfoType.SUB_CATEGORY;
    }

    // relatedPost null check - eğer yoksa default değerler kullan
    if (!item.relatedPost) {
      console.warn('[mapUpdateToCardData] Missing relatedPost for item:', item.id);
      // Return a safe default structure
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
        images: Array.isArray(item.images)
          ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
          : [],
        relatedPost: {
          id: '',
          product: {
            id: '',
            name: '',
            subName: '',
            image: require('@/assets/inventory/product_01.png'),
            isOwned: false,
          },
          content: [],
          tags: [],
          images: [],
        },
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
      images: Array.isArray(item.images)
        ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
        : [],
      relatedPost: {
        id: item.relatedPost?.id || '',
        product: {
          id: item.relatedPost?.product?.id || '',
          name: item.relatedPost?.product?.name || '',
          subName: item.relatedPost?.product?.subName || '',
          image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: item.relatedPost?.product?.isOwned || false,
        },
        content: relatedPostContent,
        tags: (item.relatedPost?.tags && Array.isArray(item.relatedPost.tags)) ? item.relatedPost.tags : [],
        images: (item.relatedPost?.images && Array.isArray(item.relatedPost.images))
          ? item.relatedPost.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
          : [],
      },
    };
  };

  const renderFeedItem = (item: FeedApiItem) => {
    // Safety check: ensure item and item.data exist
    if (!item || !item.data || !item.data.id) {
      console.warn('[FeedScreen] Invalid feed item:', item);
      return null;
    }

    switch (item.type) {
      case CardType.EXPERIENCE:
        // Experience type için ReviewApiItem kullan ve ExperiencePostCard render et
        if ('contextData' in item.data && 'content' in item.data && Array.isArray(item.data.content)) {
          return (
            <ExperiencePostCard
              key={item.data.id}
              data={mapExperienceToCardData(item.data as ReviewApiItem & { type: 'experience' })}
            />
          );
        }
        return null;
      case CardType.POST:
        // Post type için ProfilePost kullan ve PostCard render et
        return (
          <PostCard
            key={item.data.id}
            data={mapFeedToCardData(item.data as ProfilePost)}
          />
        );
      case CardType.BENCHMARK:
        return (
          <BenchmarkPostCard
            key={item.data.id}
            data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
          />
        );
      case CardType.QUESTION:
        // Question type kontrolü
        if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
          return (
            <QuestionPostCard
              key={item.data.id}
              data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
            />
          );
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
        return (
          <TipsAndTricksPostCard
            key={item.data.id}
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
          />
        );
      case CardType.UPDATE:
        // Update type için UpdateApiItem kullan ve UpdatePostCard render et
        if ('relatedPost' in item.data && 'contextType' in item.data) {
          return (
            <UpdatePostCard
              key={item.data.id}
              data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          title="Akış"
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />
        <AssetAccessCard onTabChange={handleTabChange} />
        <FilterBar filters={filters} onFiltersChange={setFilters} />
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
                Henüz feed içeriği bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList<FeedApiItem>
              ref={feedListRef}
              data={feedItems}
              renderItem={({ item }) => renderFeedItem(item)}
              keyExtractor={(item, index) => {
                // Güvenli key extraction: item.data.id varsa kullan, yoksa index kullan
                if (item?.data?.id) {
                  return String(item.data.id);
                }
                return `feed-item-${index}`;
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomPadding }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => refetch()}
                  tintColor={isDark ? '#FFFFFF' : '#000000'}
                  colors={isDark ? ['#FFFFFF'] : ['#000000']}
                />
              }
            />
          )}
        </Box>
        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={handleSearchClose}
        />

        {/* Expert Button */}
        <ExpertButton
          onPress={handleExpertPress}
        />

      </Box>
    </SafeAreaView>
  );
};

/**
 * FeedScreen Component
 * FeedListProvider ile sarmalanmış, feedListRef'i tüm child component'lere sağlar
 */
export const FeedScreen = () => {
  return (
    <FeedListProvider>
      <FeedScreenInner />
    </FeedListProvider>
  );
};
