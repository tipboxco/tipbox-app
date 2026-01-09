import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Box, Text } from '@/src/components/ui';
import { FlatList, ActivityIndicator } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchFilter } from '../components/SearchFilter';
import { NFTCard } from '../components/NFTCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMarketplaceListings } from '../api/hooks';
import type { MarketplaceListingApiItem } from '../types';
import type { NFTCardData } from '../types';
import { toImageSource } from '@/src/utils';

const MarketPlaceScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with 16px padding on each side
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query for API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Marketplace API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useMarketplaceListings({ 
    limit: 8,
    search: debouncedSearchQuery || undefined,
  });

  // Flatten all pages into a single array
  const nftListings = data?.pages.flatMap((page) => page) ?? [];

  // Map API response to NFTCardData
  const mapListingToCardData = (listing: MarketplaceListingApiItem): NFTCardData => {
    const imageSource = toImageSource(listing.image);
    return {
      id: listing.id,
      title: listing.title,
      username: listing.username,
      price: listing.price,
      image: imageSource || require('@/assets/inventory/product_01.png'), // Fallback if image is null
      userAvatar: listing.userAvatar,
    };
  };

  const nftData: NFTCardData[] = nftListings.map(mapListingToCardData);

  // Group NFTs into rows of 2
  const groupedNFTs: NFTCardData[][] = [];
  for (let i = 0; i < nftData.length; i += 2) {
    groupedNFTs.push(nftData.slice(i, i + 2));
  }

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

  const renderRow = (info: { item: NFTCardData[]; index: number }) => {
    const { item } = info;
    return (
      <HStack space="sm" justifyContent="space-between" mb="$3">
        {item.map((nft) => (
          <VStack key={nft.id} width={cardWidth}>
            <NFTCard data={nft} />
          </VStack>
        ))}
        {/* If odd number of items, add empty space */}
        {item.length === 1 && <VStack width={cardWidth} />}
      </HStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        {/* Header */}
        <Header
          title="Marketplace"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Search Filter */}
        <VStack px={16} py={8}>
          <SearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </VStack>

        {/* NFT Grid */}
        <Box flex={1}>
          {isLoading && !data?.pages?.[0] ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color="#CE4A4A" fontSize="$sm">
                An error occurred while loading NFTs: {error.message}
              </Text>
            </Box>
          ) : nftData.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                Henüz satışta NFT bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList<NFTCardData[]>
              data={groupedNFTs}
              renderItem={renderRow}
              keyExtractor={(item, index) => {
                // Her row için unique key oluştur - row içindeki NFT ID'lerini kullan
                const ids = item.map(nft => nft.id).join('-');
                return `row-${index}-${ids}`;
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              style={{ flex: 1 }}
            />
          )}
        </Box>

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
