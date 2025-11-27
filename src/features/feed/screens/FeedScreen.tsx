import React, { useState, useRef, useCallback } from 'react';
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
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFeed } from '../api/hooks';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';
import type { FeedApiItem } from '../api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
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

  // Bottom sheet refs
  const expertBottomSheetRef = useRef<BottomSheet>(null);

  // Feed API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed(3); // Test için limit 3 olarak ayarlandı

  // Flatten all pages into a single array
  const feedItems = data?.pages.flatMap((page) => page.items) ?? [];

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
    if (expertBottomSheetRef.current) {
      expertBottomSheetRef.current.snapToIndex(0);
    } else {
      console.log('[FeedScreen] Expert BottomSheet ref is null, trying again...');
      setTimeout(() => {
        if (expertBottomSheetRef.current) {
          expertBottomSheetRef.current.snapToIndex(0);
        } else {
          console.log('[FeedScreen] Expert BottomSheet ref still null after timeout');
        }
      }, 100);
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // Map Feed to PostCardData
  const mapFeedToCardData = (item: ProfilePost): PostCardData => {
    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatarUrl: item.user.avatarUrl,
      },
      content: item.content,
      images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData: item.contextData,
    };
  };

  // Map Experience (ReviewApiItem) to ReviewCardData
  const mapExperienceToCardData = (item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
    const avatarSource = toImageSource(item.user.avatarUrl)!;
    const productImage = item.product.image
      ? toImageSource(item.product.image)
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
      product: {
        id: item.product.id,
        name: item.product.name,
        subName: item.product.subName,
        image: productImage,
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
    const avatarSource = toImageSource(item.user.avatarUrl)!;

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
    const avatarSource = toImageSource(item.user.avatarUrl)!;

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
    const avatarSource = toImageSource(item.user.avatarUrl)!;

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

  const renderFeedItem = (item: FeedApiItem) => {
    switch (item.type) {
      case CardType.EXPERIENCE:
        // Experience type için ReviewApiItem kullan ve ExperiencePostCard render et
        if ('product' in item.data && 'content' in item.data && Array.isArray(item.data.content)) {
          return (
            <ExperiencePostCard
              key={item.data.id}
              data={mapExperienceToCardData(item.data as ReviewApiItem & { type: 'experience' })}
            />
          );
        }
        return null;
      case CardType.FEED:
        // Feed type için ProfilePost kullan ve PostCard render et
        return (
          <PostCard
            key={item.data.id}
            data={mapFeedToCardData(item.data as ProfilePost)}
          />
        );
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
        // Question type kontrolü - "feed" de question olarak kabul ediliyor
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
        // UpdatePostCard için mock tip hala kullanılıyor, bu ayrı bir refactoring konusu
        return null;
      default:
        return null;
    }
  };

  const handleLoadMore = useCallback(() => {
    console.log('[FeedScreen] handleLoadMore called', { hasNextPage, isFetchingNextPage });
    if (hasNextPage && !isFetchingNextPage) {
      console.log('[FeedScreen] Fetching next page...');
      fetchNextPage();
    } else {
      console.log('[FeedScreen] Not fetching - hasNextPage:', hasNextPage, 'isFetchingNextPage:', isFetchingNextPage);
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
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
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

        {/* Expert Bottom Sheet */}
        <BottomSheet
          ref={expertBottomSheetRef}
          index={-1}
          enablePanDownToClose
          enableOverDrag={false}
          enableHandlePanningGesture={true}
          enableContentPanningGesture={true}
          animateOnMount={true}
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
          handleStyle={{
            backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
          handleIndicatorStyle={{
            backgroundColor: isDark ? '#333333' : '#CCCCCC',
            width: 40,
            height: 4,
          }}
        >
          <BottomSheetView style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarHeight }}>
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
            <ExpertBottomSheet
              onClose={() => expertBottomSheetRef.current?.close()}
            />
          </BottomSheetView>
        </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};
