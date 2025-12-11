import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Platform, FlatList, ActivityIndicator } from 'react-native';
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
import { useFeed } from '../api/hooks';
import { CardType, ProductInfoType } from '@/src/types/common';
import { toImageSource, useBottomOffset } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import type { FeedApiItem } from '../api/feedApi';
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

export const FeedScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAppStore();

  // Safe area and tab bar insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Feed API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed(10); // Test için limit 3 olarak ayarlandı

  // Console log for debugging - FeedScreen data
  useEffect(() => {
    if (data?.pages) {
      console.log('[FeedScreen] useFeed Hook Result:');
      console.log('  - Data Pages Count:', data.pages.length);
      console.log('  - Total Items:', data.pages.flatMap((page) => page.items).length);
      console.log('  - hasNextPage:', hasNextPage);
      console.log('  - isFetchingNextPage:', isFetchingNextPage);
      console.log('  - isLoading:', isLoading);
      console.log('  - error:', error ? error.message : null);
      
      // Her sayfanın detaylarını ayrı ayrı logla
      data.pages.forEach((page, pageIndex) => {
        console.log(`[FeedScreen] Page ${pageIndex + 1}:`, {
          itemsCount: page.items.length,
          pagination: page.pagination,
          items: page.items.map((item) => ({
            id: item.data.id,
            type: item.type,
            dataId: item.data.id,
            dataType: item.data.type || 'unknown',
          })),
        });
      });
      
      // Tüm ID'leri listele
      const allIds = data.pages.flatMap((page) => 
        page.items.map((item) => item.data.id)
      );
      console.log('[FeedScreen] All Item IDs:', allIds);
      
      // Her item'ın type'ını logla
      const itemsByType = data.pages.flatMap((page) => 
        page.items.map((item) => ({
          id: item.data.id,
          type: item.type,
        }))
      );
      console.log('[FeedScreen] Items by Type:', {
        update: itemsByType.filter(item => item.type === 'update').length,
        benchmark: itemsByType.filter(item => item.type === 'benchmark').length,
        experience: itemsByType.filter(item => item.type === 'experience').length,
        post: itemsByType.filter(item => item.type === 'post').length,
        question: itemsByType.filter(item => item.type === 'question').length,
        tipsAndTricks: itemsByType.filter(item => item.type === 'tipsAndTricks').length,
        total: itemsByType.length,
      });
      
      // Duplicate ID kontrolü
      const uniqueIds = Array.from(new Set(allIds));
      if (allIds.length !== uniqueIds.length) {
        console.warn('[FeedScreen] Duplicate IDs detected:', {
          total: allIds.length,
          unique: uniqueIds.length,
          duplicates: allIds.length - uniqueIds.length,
        });
        // Duplicate ID'leri bul
        const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
        console.warn('[FeedScreen] Duplicate ID list:', Array.from(new Set(duplicateIds)));
      }
    }
  }, [data, hasNextPage, isFetchingNextPage, isLoading, error]);

  // Flatten all pages into a single array and remove duplicates by ID
  const feedItems = useMemo(() => {
    if (!data?.pages) return [];
    
    const allItems = data.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID (cursor pagination'da aynı item tekrar gelebilir)
    const uniqueItemsMap = new Map<string, FeedApiItem>();
    for (const item of allItems) {
      const itemId = item.data.id;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    const uniqueItems = Array.from(uniqueItemsMap.values());
    
    // Debug: Duplicate kontrolü
    if (allItems.length !== uniqueItems.length) {
      console.warn('[FeedScreen] Duplicate items detected:', {
        total: allItems.length,
        unique: uniqueItems.length,
        duplicates: allItems.length - uniqueItems.length,
      });
    }
    
    // Debug: Render edilecek item sayısını logla
    console.log('[FeedScreen] feedItems after filtering:', {
      totalItems: uniqueItems.length,
      itemsByType: {
        update: uniqueItems.filter(item => item.type === CardType.UPDATE).length,
        benchmark: uniqueItems.filter(item => item.type === CardType.BENCHMARK).length,
        experience: uniqueItems.filter(item => item.type === CardType.EXPERIENCE).length,
        post: uniqueItems.filter(item => item.type === CardType.POST).length,
        question: uniqueItems.filter(item => item.type === CardType.QUESTION).length,
        tipsAndTricks: uniqueItems.filter(item => item.type === CardType.TIPS_AND_TRICKS).length,
      },
    });
    
    return uniqueItems;
  }, [data?.pages]);

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  const handleTabChange = (tab: 'wallet' | 'inventory') => {
    if (tab === 'wallet') {
      navigation.navigate('Main', {
        screen: 'Wallet',
      });
    } else if (tab === 'inventory') {
      if (user?.id) {
        navigation.navigate('Main', {
          screen: 'Profile',
          params: {
            screen: 'InventoryList',
            params: {
              userId: user.id,
            },
          },
        });
      }
    }
  };

  const handleExpertPress = () => {
    console.log('[FeedScreen] Expert button pressed');
    console.log('[FeedScreen] Opening ExpertBottomSheet via global bottom sheet');
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
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarHeight,
      }
    );
  };

  // Map Feed to PostCardData
  const mapFeedToCardData = (item: ProfilePost): PostCardData => {
    // content array ise string'e çevir, değilse direkt kullan
    const contentString = Array.isArray(item.content)
      ? item.content.map((contentItem) => contentItem.content || '').join(' ')
      : (item.content || '');

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: toImageSource(item.user.avatar)!,
      },
      content: contentString,
      images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData: item.contextData,
    };
  };

  // Map Experience (ReviewApiItem) to ReviewCardData
  const mapExperienceToCardData = (item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;
    const productImage = item.contextData?.image
      ? toImageSource(item.contextData.image)
      : undefined;

    const content: ReviewCardContentItem[] = item.content.map((contentItem) => ({
      tag: {
        icon: 'tag',
        title: contentItem.title,
      },
      text: contentItem.content,
      rating: Array(5)
        .fill(false)
        .map((_, index) => index < (contentItem.rating || 0)),
    }));

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
        action: 'wrote a review',
      },
      contextData: {
        id: item.contextData?.id || '',
        name: item.contextData?.name || '',
        subName: item.contextData?.subName || '',
        image: productImage,
        isOwned: item.contextData?.isOwned,
      },
      content,
      tags: item.tags,
      images: item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Benchmark to BenchmarkCardData
  const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;

    const products: BenchmarkProduct[] = item.products.map((p) => ({
      id: p.id,
      name: p.name,
      subName: p.subName,
      image: toImageSource(p.image)!,
      isOwned: p.isOwned,
      choice: p.choice,
    }));

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      products,
      content: item.content,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Tips to TipsCardData
  const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;

    const product: TipsProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
    };

    const category: TipsCategory = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
      product,
    };

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      category,
      content: item.content,
      images: item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
      stats: item.stats,
      tag: item.tag,
      createdAt: item.createdAt,
    };
  };

  // Map Question to QuestionCardData
  const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;

    const product: QuestionCardProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
    };

    const category: QuestionCardCategory = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
      product,
    };

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      category,
      content: item.content,
      isBoosted: item.isBoosted,
      images: item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Update to UpdateCardData
  const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;
    
    // ContextType'ı ProductInfoType'a çevir
    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (item.contextType === 'product_group') {
      productInfoType = ProductInfoType.PRODUCT_GROUP;
    } else if (item.contextType === 'sub_category') {
      productInfoType = ProductInfoType.SUB_CATEGORY;
    }

    // relatedPost.content formatını component'in beklediği formata çevir
    const relatedPostContent = item.relatedPost.content.map((contentItem) => {
      // Rating'i number'dan number[]'e çevir (5 yıldız için)
      const ratingArray: number[] = Array(5).fill(0);
      const ratingValue = Math.min(Math.max(Math.round(contentItem.rating / 20), 0), 5); // 0-100'den 0-5'e çevir
      for (let i = 0; i < ratingValue; i++) {
        ratingArray[i] = 1;
      }

      return {
        tag: {
          icon: 'tag',
          title: contentItem.title,
        },
        text: contentItem.content,
        rating: ratingArray,
      };
    });

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
        id: item.relatedPost.product.id,
        name: item.relatedPost.product.name,
        subName: item.relatedPost.product.subName,
        image: toImageSource(item.relatedPost.product.image)!,
        isOwned: item.relatedPost.product.isOwned,
      },
      content: item.content,
      images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
      relatedPost: {
        id: item.relatedPost.id,
        product: {
          id: item.relatedPost.product.id,
          name: item.relatedPost.product.name,
          subName: item.relatedPost.product.subName,
          image: toImageSource(item.relatedPost.product.image)!,
          isOwned: item.relatedPost.product.isOwned,
        },
        content: relatedPostContent,
        tags: item.relatedPost.tags,
        images: item.relatedPost.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
      },
    };
  };

  const renderFeedItem = (item: FeedApiItem) => {
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
        console.warn('[FeedScreen] Unknown item type, not rendered:', {
          id: item.data.id,
          type: item.type,
        });
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
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <Header
          title="Akış"
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />
        <AssetAccessCard onTabChange={handleTabChange} />
        <FilterBar />
        <Box flex={1}>
          {isLoading && feedItems.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color="#CE4A4A" fontSize="$sm">
                Feed yüklenirken bir hata oluştu: {error.message}
              </Text>
            </Box>
          ) : feedItems.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                Henüz feed içeriği bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={feedItems}
              renderItem={({ item }) => renderFeedItem(item)}
              keyExtractor={(item) => item.data.id}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomPadding }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
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
