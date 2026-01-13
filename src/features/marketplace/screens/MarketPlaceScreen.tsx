import React, { useCallback, useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Box, Text, Pressable } from '@/src/components/ui';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchFilter } from '../components/SearchFilter';
import { NFTCard } from '../components/NFTCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { Dimensions } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useMarketplaceListings, useMyListings, marketplaceKeys } from '../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { MarketplaceListingApiItem, UserNFTApiItem } from '../types';
import type { NFTCardData } from '../types';
import { toImageSource } from '@/src/utils';
import { useAppStore } from '@/src/store/appStore';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const MarketPlaceScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with 16px padding on each side
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user);
  
  // Get initial tab from route params (if navigating from delist)
  const initialTab = (route.params as any)?.initialTab || 'all';
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'myListings'>(initialTab);
  const [currentPage, setCurrentPage] = useState(initialTab === 'myListings' ? 1 : 0);
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  
  // Shared progress value for realtime tab animations (0 = All NFT's, 1 = My Listings)
  const progress = useSharedValue(initialTab === 'myListings' ? 1 : 0);

  // Set initial page on mount
  React.useEffect(() => {
    if (initialTab === 'myListings' && pagerRef.current) {
      setTimeout(() => {
        pagerRef.current?.setPage(1);
      }, 100);
    }
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search query for API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Tab width calculation
  const tabWidth = tabContainerWidth / 2;
  const indicatorWidth = tabWidth * 0.5; // Indicator is 50% of tab width
  const indicatorOffset = (tabWidth - indicatorWidth) / 2; // Center the indicator

  // All NFT's - Marketplace API hook with infinite scroll
  const {
    data: allData,
    fetchNextPage: fetchNextAll,
    hasNextPage: hasNextAll,
    isFetchingNextPage: isFetchingNextAll,
    isLoading: isLoadingAll,
    error: errorAll,
    refetch: refetchAll,
  } = useMarketplaceListings({ 
    limit: 8,
    search: debouncedSearchQuery || undefined,
  });

  // My Listings - Use useMyListings hook (new endpoint)
  const {
    data: myListingsData,
    isLoading: isLoadingMy,
    error: errorMy,
    refetch: refetchMy,
  } = useMyListings(50);

  // Tab press handler
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index === 0 ? 'all' : 'myListings');
  }, []);

  // Page scroll handler for realtime animation
  const handlePageScroll = useCallback((e: any) => {
    const { position, offset } = e.nativeEvent;
    progress.value = position + offset;
  }, [progress]);

  // Page selected handler
  const handlePageSelected = useCallback((e: any) => {
    const page = e.nativeEvent.position;
    setCurrentPage(page);
    setActiveTab(page === 0 ? 'all' : 'myListings');
  }, []);

  // Animated styles for tabs
  const tab1Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [isDark ? '#FFFFFF' : '#000000', isDark ? '#666666' : '#999999']
    );
    return { color };
  });

  const tab2Style = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [isDark ? '#666666' : '#999999', isDark ? '#FFFFFF' : '#000000']
    );
    return { color };
  });

  // Animated indicator style
  const indicatorStyle = useAnimatedStyle(() => {
    // Tab'ların ortasına indicator yerleştir
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  // Enable/disable navigation gesture based on current page
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: currentPage === 0,
    });
  }, [currentPage, navigation]);

  // Refetch marketplace listings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[MarketPlaceScreen] Screen focused, refetching listings...');
      refetchAll();
      refetchMy();
    }, [refetchAll, refetchMy])
  );

  // Agresif Pull to refresh - Tüm cache'i bypass et
  const onRefresh = useCallback(async () => {
    console.log('[MarketPlaceScreen] Pull to refresh triggered, bypassing ALL cache...');
    setRefreshing(true);
    try {
      // 1. Tüm marketplace cache'ini tamamen sıfırla
      await queryClient.resetQueries({ 
        queryKey: ['marketplace'],
        exact: false,
      });
      
      // 2. Her iki tab için de cache'i sil
      queryClient.removeQueries({
        queryKey: marketplaceKeys.all
      });
      
      // 3. Fresh data fetch - Her iki tab için
      await Promise.all([
        refetchAll(),
        refetchMy(),
      ]);
      
      console.log('[MarketPlaceScreen] Refresh completed successfully');
    } catch (error) {
      console.error('[MarketPlaceScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetchAll, refetchMy]);

  // Flatten all pages into a single array
  const allNFTListings = allData?.pages.flatMap((page) => page) ?? [];
  
  // My Listings - filter only ACTIVE status for display
  const myListedNFTs = (myListingsData || []).filter(nft => nft.listing?.status === 'ACTIVE');

  // Map API response to NFTCardData
  const mapListingToCardData = (listing: MarketplaceListingApiItem): NFTCardData => {
    const imageSource = toImageSource(listing.image);
    return {
      id: listing.id,
      title: listing.title,
      username: listing.username,
      price: listing.price,
      image: imageSource || require('@/assets/defaultImages/default-marketplace.png'),
      userAvatar: listing.userAvatar,
    };
  };

  // Map UserNFTApiItem (My NFTs) to NFTCardData
  const mapMyNFTToCardData = (nft: UserNFTApiItem): NFTCardData => {
    const imageSource = toImageSource(nft.image);
    const price = nft.listing?.price?.toString() || '0';
    
    return {
      id: nft.listing?.id || nft.id, // Use listing ID for proper navigation
      title: nft.title,
      username: nft.username,
      price: price,
      image: imageSource || require('@/assets/defaultImages/default-marketplace.png'),
      userAvatar: '', // User avatar not needed for own listings
    };
  };

  const allNFTData: NFTCardData[] = allNFTListings.map(mapListingToCardData);
  const myNFTData: NFTCardData[] = myListedNFTs.map(mapMyNFTToCardData);

  // Group NFTs into rows of 2
  const groupedAllNFTs: NFTCardData[][] = [];
  for (let i = 0; i < allNFTData.length; i += 2) {
    groupedAllNFTs.push(allNFTData.slice(i, i + 2));
  }
  
  const groupedMyNFTs: NFTCardData[][] = [];
  for (let i = 0; i < myNFTData.length; i += 2) {
    groupedMyNFTs.push(myNFTData.slice(i, i + 2));
  }

  const handleLoadMore = useCallback((tab: 'all') => {
    if (tab === 'all' && hasNextAll && !isFetchingNextAll) {
      fetchNextAll();
    }
    // My Listings için pagination yok (useQuery kullanıyor)
  }, [hasNextAll, isFetchingNextAll, fetchNextAll]);

  const renderFooter = (isFetching: boolean) => {
    if (!isFetching) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  };

  const renderRow = (info: { item: NFTCardData[]; index: number }, tab: 'all' | 'my') => {
    const { item } = info;
    return (
      <HStack space="sm" justifyContent="space-between" mb="$3">
        {item.map((nft) => (
          <VStack 
            key={nft.id} 
            width={cardWidth}
          >
            <NFTCard data={nft} showQuickBuy={tab === 'all'} />
          </VStack>
        ))}
        {item.length === 1 && <VStack width={cardWidth} />}
      </HStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <VStack flex={1} bg="#FFFFFF">
        {/* Header */}
        <Header
          title="Marketplace"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Tabs */}
        <VStack pt={0} pb="$0" bg="#FFFFFF">
          <HStack 
            ref={tabContainerRef}
            borderBottomWidth={1} 
            borderColor="#E9E9E9" 
            p={0} 
            m={0}
            position="relative"
            bg="#FFFFFF"
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setTabContainerWidth(width);
            }}
          >
            <Pressable
              onPress={() => handleTabPress(0)}
              flex={1}
              alignItems="center"
              pb={8}
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Animated.Text
                  style={[
                    {
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    tab1Style,
                  ]}
                >
                  All NFT's
                </Animated.Text>
              </VStack>
            </Pressable>
            <Pressable
              onPress={() => handleTabPress(1)}
              flex={1}
              alignItems="center"
              pb={8}
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Animated.Text
                  style={[
                    {
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    tab2Style,
                  ]}
                >
                  My Listings
                </Animated.Text>
              </VStack>
            </Pressable>
            
            {/* Animated Indicator */}
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                  width: indicatorWidth,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: '#000000',
                  },
                  indicatorStyle,
                ]}
              />
            )}
          </HStack>
        </VStack>

        {/* Search Filter */}
        <VStack px={16} py={8} bg="#FFFFFF">
          <SearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </VStack>

        {/* PagerView - Native swipe tab switching */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
          scrollEnabled={true}
          overScrollMode="never"
        >
          {/* All NFT's Tab */}
          <Box key="0" flex={1} bg="#FFFFFF">
            {isLoadingAll && !Array.isArray(allData) && !allData?.[0] ? (
              <Box flex={1} justifyContent="center" alignItems="center" bg="#FFFFFF">
                <ActivityIndicator size="large" color="#000000" />
              </Box>
            ) : errorAll ? (
              <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                <Text color="#CE4A4A" fontSize="$sm">
                  An error occurred while loading NFTs: {errorAll.message}
                </Text>
              </Box>
            ) : allNFTData.length === 0 ? (
              <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                  No NFTs for sale yet.
                </Text>
              </Box>
            ) : (
              <FlatList<NFTCardData[]>
                data={groupedAllNFTs}
                renderItem={(info) => renderRow(info, 'all')}
                keyExtractor={(item, index) => {
                  const ids = item.map(nft => nft.id).join('-');
                  return `all-row-${index}-${ids}`;
                }}
                onEndReached={() => handleLoadMore('all')}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter(isFetchingNextAll)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                style={{ flex: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#000000"
                    colors={['#C2E607']}
                    progressBackgroundColor="#FFFFFF"
                  />
                }
              />
            )}
          </Box>

          {/* My Listings Tab */}
          <Box key="1" flex={1} bg="#FFFFFF">
            {isLoadingMy ? (
              <Box flex={1} justifyContent="center" alignItems="center" bg="#FFFFFF">
                <ActivityIndicator size="large" color="#000000" />
              </Box>
            ) : errorMy ? (
              <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                <Text color="#CE4A4A" fontSize="$sm">
                  An error occurred while loading your listings: {errorMy.message}
                </Text>
              </Box>
            ) : myNFTData.length === 0 ? (
              <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                  You don't have any active listings yet.
                </Text>
              </Box>
            ) : (
              <FlatList<NFTCardData[]>
                data={groupedMyNFTs}
                renderItem={(info) => renderRow(info, 'my')}
                keyExtractor={(item, index) => {
                  const ids = item.map(nft => nft.id).join('-');
                  return `my-row-${index}-${ids}`;
                }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                style={{ flex: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#000000"
                    colors={['#C2E607']}
                    progressBackgroundColor="#FFFFFF"
                  />
                }
              />
            )}
          </Box>
        </AnimatedPagerView>

        {/* Floating Action Button */}
        <FloatingActionButton 
          onPress={() => {
            navigation.navigate('SelectNFTScreen' as never);
          }}
        />
      </VStack>
    </SafeAreaView>
  );
};

export default MarketPlaceScreen;
