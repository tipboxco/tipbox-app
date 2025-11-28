import React, { useState, useCallback } from 'react';
import { ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Input,
  InputField,
  Image
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchModal } from '@/src/components/SearchModal';
import { Feather } from '@expo/vector-icons';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useSafeAreaValues } from '@/src/utils';
import EventCard from '@/src/components/EventCard';
import { mock_community_events } from '@/src/mock/events/communityEvents';
import { useNavigation } from '@react-navigation/native';
import { BrandCard, ProductCard } from '../components';
import { Brand } from '@/src/mock/catalog/brandCatalog/types';
import type { ProductCardData } from '../components/ProductCard';
import { useHottest } from '../api/hooks';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';



const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'hottest' | 'news'>('hottest');
  const bottomInset = useSafeAreaValues('bottom');

  // Hottest API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useHottest(3); // Test için limit 3 olarak ayarlandı

  // Flatten all pages into a single array
  const hottestItems = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  const handleEventPress = (eventId: string) => {
    // Navigate to event detail if needed
    console.log('Event pressed:', eventId);
  };

  const handleSeeAllEvents = () => {
    // Navigate to events screen or event catalog
    console.log('See All Event Catalog pressed');
  };

  const handleBrandPress = (brandId: string) => {
    // Navigate to brand detail if needed
    console.log('Brand pressed:', brandId);
  };

  const handleSeeAllBrands = () => {
    // Navigate to brand catalog
    console.log('See Brand Catalog pressed');
  };

  const handleProductPress = (productId: string) => {
    // Navigate to product detail if needed
    console.log('Product pressed:', productId);
  };

  const handleSeeAllProducts = () => {
    // Navigate to product catalog
    console.log('See Product Catalog pressed');
  };

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

  const renderHottestItem = (item: FeedApiItem) => {
    switch (item.type) {
      case CardType.FEED:
        // Feed type için ProfilePost kullan ve PostCard render et
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
      case CardType.TIPS_AND_TRICKS:
        return (
          <TipsAndTricksPostCard
            key={item.data.id}
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
          />
        );
      default:
        return null;
    }
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mock brand data
  const mockBrands: Brand[] = [
    {
      id: '1',
      name: 'Apple',
      description: 'Technology brand',
      followers: '120K Followers',
      logo: require('@/assets/avatar/ozan.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: false,
    },
    {
      id: '2',
      name: 'Samsung',
      description: 'Technology brand',
      followers: '95K Followers',
      logo: require('@/assets/avatar/ozan.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: true,
    },
    {
      id: '3',
      name: 'Sony',
      description: 'Technology brand',
      followers: '80K Followers',
      logo: require('@/assets/avatar/ozan.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: false,
    },
    {
      id: '4',
      name: 'Nike',
      description: 'Sports brand',
      followers: '150K Followers',
      logo: require('@/assets/avatar/ozan.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: true,
    },
    {
      id: '5',
      name: 'Adidas',
      description: 'Sports brand',
      followers: '110K Followers',
      logo: require('@/assets/avatar/ozan.png'),
      bannerImage: require('@/assets/events/banner.png'),
      isJoined: false,
    },
  ];

  // Mock product data
  const mockProducts: ProductCardData[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      description: 'Latest iPhone with advanced features and premium design',
      image: require('@/assets/inventory/product_01.png'),
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Flagship Android phone with cutting-edge technology',
      image: require('@/assets/inventory/product_02.png'),
    },
    {
      id: '3',
      name: 'MacBook Pro 16"',
      description: 'Powerful laptop for professionals and creatives',
      image: require('@/assets/inventory/product_03.png'),
    },
    {
      id: '4',
      name: 'AirPods Pro',
      description: 'Premium wireless earbuds with noise cancellation',
      image: require('@/assets/inventory/product_04.png'),
    },
    {
      id: '5',
      name: 'iPad Pro',
      description: 'High-performance tablet for work and creativity',
      image: require('@/assets/inventory/product_05.png'),
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title="Explore"
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />

        {/* Search Bar - Trust_TrusterListScreen style */}
        <VStack px="$4" py="$2">
          <HStack
            alignItems="center"
            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={23}
            px={12}
            space="sm"
          >
            <Feather
              name="search"
              size={24}
              color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
            />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Ürün Grubu seçin veya ürün adı arayın"
                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                color={isDark ? '#fff' : '#000'}
                fontSize={11}
              />
            </Input>
          </HStack>
        </VStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack py={'$2'} space="md">
            <VStack px='$4'>
              {/* Marketplace Card */}
              <Box
                bg="#CCCCCC"
                borderRadius={10}
                height={186}
                mb="$4"
                overflow="hidden"
              >
                {/* Top Section - Image Area */}
                <Box
                  flex={1}
                  bg="#CCCCCC"
                  alignItems="center"
                  justifyContent="center"
                  minHeight={124}
                >
                  {/* Placeholder for image - dashed border style */}
                  <Box
                    width={60}
                    height={60}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    borderStyle="dashed"
                    borderRadius={8}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather name="image" size={24} color="#FFFFFF" />
                  </Box>
                </Box>

                {/* Bottom Section - Text Area */}
                <Box
                  bg="#727272"
                  height={62}
                  px="$6"
                  py="$4"
                  justifyContent="center"
                >
                  <VStack space="xs">
                    <Text
                      color="#FFFFFF"
                      fontSize={12}
                      fontWeight="$bold"
                    >
                      Marketplace
                    </Text>
                    <Text
                      color="#FFFFFF"
                      fontSize={10}
                      fontWeight="$normal"
                      lineHeight={14}
                    >
                      Lorem ipsum dolor sit amet, consectetur adipiscin
                    </Text>
                  </VStack>
                </Box>
              </Box>

            </VStack>
            {/* Category Tabs */}
            <VStack bg={isDark ? '#000' : '#FFF'}>
              <HStack borderBottomWidth={1} borderColor="#E9E9E9" p={0} m={0}>
                <Pressable
                  onPress={() => setActiveCategory('hottest')}
                  flex={1}
                  alignItems="center"
                  pb="$1"
                  position="relative"
                >
                  <VStack alignItems="center" space="xs">
                    <Text
                      fontSize={12}
                      fontWeight="$bold"
                      color={activeCategory === 'hottest' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
                    >
                      Hottest
                    </Text>
                  </VStack>
                  <Box
                    position="absolute"
                    bottom={-1}
                    left="25%"
                    height={2}
                    width="50%"
                    borderRadius={999}
                    bg={activeCategory === 'hottest' ? (isDark ? '#FFF' : '#000') : 'transparent'}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setActiveCategory('news')}
                  flex={1}
                  alignItems="center"
                  pb="$1"
                  position="relative"
                >
                  <VStack alignItems="center" space="xs">
                    <Text
                      fontSize={12}
                      fontWeight="$bold"
                      color={activeCategory === 'news' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
                    >
                      What's News
                    </Text>
                  </VStack>
                  <Box
                    position="absolute"
                    bottom={-1}
                    left="20%"
                    height={2}
                    width="60%"
                    borderRadius={999}
                    bg={activeCategory === 'news' ? (isDark ? '#FFF' : '#000') : 'transparent'}
                  />
                </Pressable>
              </HStack>
            </VStack>

              {/* Content based on active tab */}
              {activeCategory === 'hottest' && (
                <Box mb="$4" px="$4" flex={1}>
                  {isLoading ? (
                    <Box py="$8" alignItems="center">
                      <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    </Box>
                  ) : error ? (
                    <Box py="$8" alignItems="center">
                      <Text color={isDark ? '#FFFFFF' : '#000000'}>
                        Bir hata oluştu. Lütfen tekrar deneyin.
                      </Text>
                    </Box>
                  ) : hottestItems.length === 0 ? (
                    <Box py="$8" alignItems="center">
                      <Text color={isDark ? '#FFFFFF' : '#000000'}>
                        Henüz içerik bulunmuyor.
                      </Text>
                    </Box>
                  ) : (
                    <FlatList
                      data={hottestItems}
                      renderItem={({ item }) => renderHottestItem(item)}
                      keyExtractor={(item) => item.data.id}
                      onEndReached={handleLoadMore}
                      onEndReachedThreshold={0.1}
                      removeClippedSubviews={false}
                      ListFooterComponent={
                        isFetchingNextPage ? (
                          <Box py="$4" alignItems="center">
                            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                          </Box>
                        ) : null
                      }
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <Box height={16} />}
                    />
                  )}
                </Box>
              )}

              {activeCategory === 'news' && (
                <VStack space="md" mb="$4">
                  {/* New Community Events Section */}
                  <Box pl="$4">
                    <VStack space="sm" mb="$4">
                      <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
                        <Text
                          color={isDark ? '#FFFFFF' : '#B9B9B9'}
                          fontSize={14}
                          fontWeight="$bold"
                        >
                          New Community Events
                        </Text>
                        <Pressable onPress={handleSeeAllEvents}>
                          <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$medium"
                            textDecorationLine="underline"
                          >
                            See All Event Catalog
                          </Text>
                        </Pressable>
                      </HStack>
                      <FlatList
                        data={mock_community_events.activeEvents}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <Box width={12} />}
                        renderItem={({ item }) => (
                          <EventCard
                            data={item}
                            isGrid={false}
                            onPress={() => handleEventPress(item.id)}
                          />
                        )}
                        keyExtractor={(item) => item.id}
                      />
                    </VStack>
                  </Box>

                  {/* New Brands Section */}
                  <Box pl="$4">
                    <VStack space="sm" mb="$4">
                      <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
                        <Text
                          color={isDark ? '#FFFFFF' : '#B9B9B9'}
                          fontSize={14}
                          fontWeight="$bold"
                        >
                          New Brands
                        </Text>
                        <Pressable onPress={handleSeeAllBrands}>
                          <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$medium"
                            textDecorationLine="underline"
                          >
                            See Brand Catalog
                          </Text>
                        </Pressable>
                      </HStack>
                      <FlatList
                        data={mockBrands}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <Box width={12} />}
                        renderItem={({ item }) => (
                          <BrandCard
                            data={item}
                            onPress={() => handleBrandPress(item.id)}
                          />
                        )}
                        keyExtractor={(item) => item.id}
                      />
                    </VStack>
                  </Box>

                  {/* New Products Section */}
                  <Box pl="$4">
                    <VStack space="sm">
                      <HStack justifyContent="space-between" alignItems="center" mt="$2" pr="$4">
                        <Text
                          color={isDark ? '#FFFFFF' : '#B9B9B9'}
                          fontSize={14}
                          fontWeight="$bold"
                        >
                          New Products
                        </Text>
                        <Pressable onPress={handleSeeAllProducts}>
                          <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$medium"
                            textDecorationLine="underline"
                          >
                            See Product Catalog
                          </Text>
                        </Pressable>
                      </HStack>
                      <FlatList
                        data={mockProducts}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <Box width={12} />}
                        renderItem={({ item }) => (
                          <ProductCard
                            data={item}
                            onPress={() => handleProductPress(item.id)}
                          />
                        )}
                        keyExtractor={(item) => item.id}
                      />
                    </VStack>
                  </Box>
                </VStack>
              )}
          </VStack>
        </ScrollView>

        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={handleSearchClose}
        />
      </Box>
    </SafeAreaView>
  );
};

ExploreScreen.displayName = 'ExploreScreen';

export default ExploreScreen;