import React, { useState, useCallback, useRef } from 'react';
import { ScrollView, FlatList, ActivityIndicator, Dimensions } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
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
import { useHottest, useMarketplaceBanners } from '../api/hooks';
import type { MarketplaceBanner } from '../types';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';

// Banner Carousel Component (CardImageCarousel style)
interface BannerCarouselProps {
  banners: MarketplaceBanner[];
  isDark: boolean;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, isDark }) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const carouselPadding = 16; // Sağdan soldan padding
  const itemSpacing = 12; // Görseller arası boşluk
  const carouselWidth = Dimensions.get('window').width;
  const carouselHeight = 200; // Banner için sabit yükseklik
  const itemWidth = carouselWidth - (carouselPadding * 2); // Her item'ın genişliği
  const autoPlayInterval = 5000; // 5 saniye

  if (!banners?.length) return null;

  // Tek banner varsa sadece göster, carousel kullanma
  if (banners.length === 1) {
    const imageSource = toImageSource(banners[0].imageUrl);
    return (
      <Box
        w={carouselWidth}
        h={carouselHeight}
        px={carouselPadding}
        overflow="hidden"
        position="relative"
        alignSelf="center"
      >
        {imageSource && (
          <Pressable
            onPress={() => {
              console.log('Banner pressed:', banners[0].linkUrl);
            }}
            style={{
              position: 'relative',
            }}
          >
            <Image
              source={imageSource}
              alt={banners[0].title}
              resizeMode="cover"
              style={{
                width: itemWidth,
                height: carouselHeight,
                borderRadius: 12,
              }}
            />
            {/* Gradient Overlay */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              height={80}
              overflow="hidden"
              style={{
                width: itemWidth,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  justifyContent: 'flex-end',
                  paddingBottom: 12,
                  paddingHorizontal: 16,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                }}
              >
                <VStack space="xs">
                  <Text
                    color="#FFFFFF"
                    fontSize={14}
                    fontWeight="$bold"
                    numberOfLines={1}
                  >
                    {banners[0].title}
                  </Text>
                  <Text
                    color="#FFFFFF"
                    fontSize={12}
                    numberOfLines={2}
                    opacity={0.9}
                  >
                    {banners[0].description}
                  </Text>
                </VStack>
              </LinearGradient>
            </Box>
          </Pressable>
        )}
      </Box>
    );
  }

  return (
    <Box
      w={carouselWidth}
      h={carouselHeight}
      overflow="hidden"
      position="relative"
      alignSelf="center"
    >
      <Carousel
        ref={carouselRef}
        width={carouselWidth}
        height={carouselHeight}
        data={banners}
        onProgressChange={progress}
        autoPlay={banners.length > 1}
        autoPlayInterval={autoPlayInterval}
        loop={true}
        renderItem={({ index }) => {
          const item = banners[index];
          const imageSource = toImageSource(item.imageUrl);
          return (
            <Box
              width={carouselWidth}
              alignItems="center"
              justifyContent="center"
            >
              <Pressable
                onPress={() => {
                  console.log('Banner pressed:', item.linkUrl);
                }}
                style={{
                  width: itemWidth - itemSpacing,
                  marginHorizontal: itemSpacing / 2,
                  position: 'relative',
                }}
              >
                {imageSource && (
                  <Image
                    source={imageSource}
                    alt={item.title}
                    resizeMode="cover"
                    style={{
                      width: itemWidth - itemSpacing,
                      height: carouselHeight,
                      borderRadius: 12,
                    }}
                  />
                )}
                {/* Gradient Overlay */}
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  height={80}
                  overflow="hidden"
                  style={{
                    width: itemWidth - itemSpacing,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                >
                <LinearGradient
                  colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    justifyContent: 'flex-end',
                    paddingBottom: 12,
                    paddingHorizontal: 16,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                >
                  <VStack space="xs">
                    <Text
                      color="#FFFFFF"
                      fontSize={14}
                      fontWeight="$bold"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      color="#FFFFFF"
                      fontSize={12}
                      numberOfLines={2}
                      opacity={0.9}
                    >
                      {item.description}
                    </Text>
                  </VStack>
                </LinearGradient>
              </Box>
              </Pressable>
            </Box>
          );
        }}
      />

    </Box>
  );
};

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

  // Marketplace Banners API hook
  const {
    data: banners,
    isLoading: isLoadingBanners,
  } = useMarketplaceBanners();

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

        {/* Marketplace Banners Carousel - Full Width (CardImageCarousel style) */}
        {!isLoadingBanners && banners && banners.length > 0 && (
          <Box mb="$4">
            <BannerCarousel banners={banners} isDark={isDark} />
          </Box>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          <VStack py={'$2'} space="md">
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