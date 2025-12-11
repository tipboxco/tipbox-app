import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScrollView, FlatList, ActivityIndicator, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchModal } from '@/src/components/SearchModal';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useNavigation } from '@react-navigation/native';
import { HottestTab, NewsTab } from '../components';
import { useMarketplaceBanners } from '../api/hooks';
import type { MarketplaceBanner } from '../types';

// Banner Carousel Component (CardImageCarousel style)
interface BannerCarouselProps {
  banners: MarketplaceBanner[];
  isDark: boolean;
}

const BannerCarouselComponent: React.FC<BannerCarouselProps> = ({ banners, isDark }) => {
  // Render sayısını takip et
  const renderCountRef = React.useRef(0);
  const prevValuesRef = React.useRef<any>({});

  const carouselRef = useRef<ICarouselInstance>(null);
  // progress shared value kaldırıldı - pagination kullanılmadığı için gereksiz ve Reanimated uyarısına neden oluyor
  
  // banners array referansını stabilize et
  const bannersLength = banners?.length ?? 0;
  
  React.useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      bannersCount: bannersLength,
      isDark,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[BannerCarousel] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  }, [bannersLength, isDark]); // bannersLength kullanıldı
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
              width={itemWidth}
              height={carouselHeight}
              borderRadius={12}
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
                    width={itemWidth - itemSpacing}
                    height={carouselHeight}
                    borderRadius={12}
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

// React.memo ile sarmalayarak gereksiz re-render'ları önle
const BannerCarousel = React.memo(BannerCarouselComponent, (prevProps, nextProps) => {
  // Sadece banners array'inin uzunluğu veya isDark değiştiğinde re-render
  // banners array referansı aynıysa re-render yapma
  if (prevProps.banners === nextProps.banners && prevProps.isDark === nextProps.isDark) {
    return true; // Re-render yapma
  }
  return false; // Re-render yap
});

const ExploreScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'hottest' | 'news'>('hottest');
  const bottomInset = useSafeAreaValues('bottom');
  const [searchBarHeight, setSearchBarHeight] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);

  // Render sayısını takip et
  const renderCountRef = useRef(0);
  const prevValuesRef = useRef<any>({});

  // Marketplace Banners API hook
  const {
    data: banners,
    isLoading: isLoadingBanners,
  } = useMarketplaceBanners();

  React.useEffect(() => {
    renderCountRef.current += 1;
    const currentValues = {
      colorMode,
      activeCategory,
      bannersCount: banners?.length,
      isLoadingBanners,
    };
    
    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
      }
    });
    
    console.log(`[ExploreScreen] Render #${renderCountRef.current}`, {
      changed: changedValues.length > 0 ? changedValues : ['No changes detected'],
      current: currentValues,
    });
    
    prevValuesRef.current = currentValues;
  }, [colorMode, activeCategory, banners?.length, isLoadingBanners]); // Dependency array eklendi

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  // Callback fonksiyonlarını useCallback ile sarmalayarak referanslarını stabilize et
  const handleEventPress = useCallback((eventId: string) => {
    console.log('Event pressed:', eventId);
  }, []);

  const handleSeeAllEvents = useCallback(() => {
    console.log('See All Event Catalog pressed');
  }, []);

  const handleBrandPress = useCallback((brandId: string) => {
    console.log('Brand pressed:', brandId);
  }, []);

  const handleSeeAllBrands = useCallback(() => {
    console.log('See Brand Catalog pressed');
  }, []);

  const handleProductPress = useCallback((productId: string) => {
    console.log('Product pressed:', productId);
  }, []);

  const handleSeeAllProducts = useCallback(() => {
    console.log('See Product Catalog pressed');
  }, []);



  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title="Explore"
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset }}
          nestedScrollEnabled={true}
        >
          <VStack space="md">
            {/* Search Bar - Trust_TrusterListScreen style */}
            <VStack
              px="$4"
              py="$2"
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                if (searchBarHeight === 0) {
                  setSearchBarHeight(height);
                }
              }}
            >
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
              <Box
                mb="$4"
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  if (bannerHeight === 0) {
                    setBannerHeight(height);
                  }
                }}
              >
                <BannerCarousel banners={banners} isDark={isDark} />
              </Box>
            )}

            {/* Category Tabs */}
            <VStack
              bg={isDark ? '#000' : '#FFF'}
              pt={0}
              mt={0}
              mb={0}
              pb={0}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                if (tabsHeight === 0) {
                  setTabsHeight(height);
                }
              }}
            >
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
            {activeCategory === 'hottest' && <HottestTab />}
            {activeCategory === 'news' && (
              <NewsTab
                onEventPress={handleEventPress}
                onBrandPress={handleBrandPress}
                onProductPress={handleProductPress}
                onSeeAllEvents={handleSeeAllEvents}
                onSeeAllBrands={handleSeeAllBrands}
                onSeeAllProducts={handleSeeAllProducts}
              />
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