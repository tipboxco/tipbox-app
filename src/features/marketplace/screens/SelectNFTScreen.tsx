import React, { useState, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Pressable, Text, Box } from '@gluestack-ui/themed';
import { FlatList, ActivityIndicator } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { UserNFTCard } from '../components/UserNFTCard';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyNFTs } from '../api/hooks';
import type { UserNFTApiItem } from '../types';
import type { UserNFTCardData } from '../types';
import { toImageSource } from '@/src/utils';

const SelectNFTScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 3; // 3 cards per row with 16px padding on each side
  const navigation = useNavigation();
  
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // My NFTs API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useMyNFTs(12);

  // Flatten all pages into a single array
  const nftListings = data?.pages?.flatMap((page) => page) ?? [];

  // Map API response to UserNFTCardData
  const mapListingToCardData = useCallback((listing: UserNFTApiItem): UserNFTCardData => {
    const imageSource = toImageSource(listing.image);
    return {
      id: listing.id,
      title: listing.title,
      username: listing.username,
      image: imageSource || require('@/assets/inventory/product_01.png'), // Fallback if image is null
    };
  }, []);

  // Flatten and map all pages into a single array, remove duplicates by ID
  const userNFTData = useMemo(() => {
    if (!nftListings.length) return [];
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, UserNFTApiItem>();
    for (const item of nftListings) {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values()).map(mapListingToCardData);
  }, [nftListings, mapListingToCardData]);

  // Group NFTs into rows of 3
  const groupedNFTs = useMemo(() => {
    const rows: UserNFTCardData[][] = [];
    for (let i = 0; i < userNFTData.length; i += 3) {
      rows.push(userNFTData.slice(i, i + 3));
    }
    return rows;
  }, [userNFTData]);

  // Item sayısı değiştiğinde ref'i güncelle
  React.useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [userNFTData.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }

    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    isLoadingMoreRef.current = true;

    fetchNextPage()
      .finally(() => {
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNFTPress = useCallback((nftId: string) => {
    // Find the NFT data
    const nftData = userNFTData.find(nft => nft.id === nftId);
    if (nftData) {
      // Navigate to NFT detail screen
      (navigation as any).navigate('NFTDetailScreen', { nftData });
    }
  }, [userNFTData, navigation]);

  const handleContinue = useCallback(() => {
    console.log('Selected NFTs:', selectedNFTs);
    // Burada seçilen NFT'ler ile devam etme işlemi yapılabilir
  }, [selectedNFTs]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        {/* Header */}
        <Header
          title="Select NFT"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* NFT Grid */}
        <Box flex={1}>
          {isLoading && !nftListings.length ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color="#CE4A4A" fontSize="$sm">
                NFT'ler yüklenirken bir hata oluştu: {error.message}
              </Text>
            </Box>
          ) : userNFTData.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$4">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                No NFTs found yet.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={groupedNFTs}
              renderItem={({ item }) => (
                <HStack space="sm" justifyContent="space-between" mb="$3" px={15}>
                  {item.map((nft) => (
                    <VStack key={nft.id} width={cardWidth}>
                      <UserNFTCard 
                        data={nft} 
                        isSelected={selectedNFTs.includes(nft.id)}
                        onPress={() => handleNFTPress(nft.id)}
                      />
                    </VStack>
                  ))}
                  {/* If odd number of items, add empty space */}
                  {item.length < 3 && <VStack width={cardWidth} />}
                </HStack>
              )}
              keyExtractor={(item, index) => `row-${index}`}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <Box py={20} alignItems="center">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </Box>
                ) : null
              }
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
            />
          )}
        </Box>

        {/* Continue Button */}
        {selectedNFTs.length > 0 && (
          <VStack px={16} py={16} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
            <Pressable
              bg="#C2E607"
              borderRadius={10}
              py={12}
              onPress={handleContinue}
            >
              <Text
                color="#596B00"
                fontSize={14}
                fontWeight="$bold"
                textAlign="center"
              >
                Continue ({selectedNFTs.length} selected)
              </Text>
            </Pressable>
          </VStack>
        )}
      </VStack>
    </SafeAreaView>
  );
};

export default SelectNFTScreen;
