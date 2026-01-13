import React, { useState, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Pressable, Text, Box } from '@gluestack-ui/themed';
import { FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { UserNFTCard } from '../components/UserNFTCard';
import { Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAvailableNFTs } from '../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { marketplaceKeys } from '../api/hooks';
import type { UserNFTApiItem } from '../types';
import type { UserNFTCardData } from '../types';
import { toImageSource } from '@/src/utils';

const SelectNFTScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with 16px padding on each side
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);

  // Available NFTs API hook (new endpoint - only non-listed NFTs)
  const {
    data: nftListings,
    isLoading,
    error,
    refetch,
  } = useAvailableNFTs(50);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[SelectNFTScreen] Screen focused, refetching NFTs...');
      refetch();
    }, [refetch])
  );

  // Agresif Pull to refresh - Tüm cache'i bypass et
  const onRefresh = useCallback(async () => {
    console.log('[SelectNFTScreen] Pull to refresh triggered, bypassing ALL cache...');
    setRefreshing(true);
    try {
      // 1. Tüm marketplace cache'ini sil
      await queryClient.resetQueries({ 
        queryKey: ['marketplace'],
        exact: false,
      });
      
      // 2. Query state'i tamamen sıfırla
      queryClient.removeQueries({
        queryKey: marketplaceKeys.availableNFTs()
      });
      
      // 3. Fresh data fetch
      await refetch();
      
      console.log('[SelectNFTScreen] Refresh completed successfully');
    } catch (error) {
      console.error('[SelectNFTScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetch]);

  // Debug: Log API response to check listing field
  React.useEffect(() => {
    if (nftListings && nftListings.length > 0) {
      console.log('🔍 [SelectNFTScreen] Available NFTs from API:', {
        totalCount: nftListings.length,
        firstItem: nftListings[0],
      });
    }
  }, [nftListings]);

  // Map API response to UserNFTCardData
  const mapListingToCardData = useCallback((listing: UserNFTApiItem): UserNFTCardData => {
    const imageSource = toImageSource(listing.image);
    
    // Available NFTs endpoint returns listing = null (no active listing)
    const isListed = false; // Always false for available NFTs
    const price = undefined;
    
    return {
      id: listing.id,
      title: listing.title,
      username: listing.username,
      image: imageSource || require('@/assets/inventory/product_01.png'),
      isListed: isListed,
      price: price,
      rarity: listing.rarity,
    };
  }, []);

  // Flatten and map all pages into a single array, remove duplicates by ID
  const userNFTData = useMemo(() => {
    if (!nftListings || nftListings.length === 0) return [];
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, UserNFTApiItem>();
    for (const item of nftListings) {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    }
    
    const mappedData = Array.from(uniqueItemsMap.values()).map(mapListingToCardData);
    
    // No need to sort - available-nfts endpoint only returns non-listed NFTs
    console.log('🗺️ [SelectNFTScreen] Mapped Available NFTs:', {
      count: mappedData.length,
      sampleData: mappedData.slice(0, 3).map(item => ({
        id: item.id,
        title: item.title,
        isListed: item.isListed, // Always false
      })),
    });
    
    return mappedData;
  }, [nftListings, mapListingToCardData]);

  // Group NFTs into rows of 2
  const groupedNFTs = useMemo(() => {
    const rows: UserNFTCardData[][] = [];
    for (let i = 0; i < userNFTData.length; i += 2) {
      rows.push(userNFTData.slice(i, i + 2));
    }
    return rows;
  }, [userNFTData]);

  // Item sayısı değiştiğinde ref'i güncelle
  React.useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [userNFTData.length]);

  const handleNFTPress = useCallback((nft: UserNFTCardData) => {
    // Available NFTs endpoint only returns NFTs without active listing
    // So no need to check if already listed
    
    // Navigate to NFT Sell Screen with nftId
    (navigation as any).navigate('NFTSellScreen', { nftId: nft.id });
  }, [navigation]);

  const handleContinue = useCallback(() => {
    console.log('Selected NFTs:', selectedNFTs);
    // Burada seçilen NFT'ler ile devam etme işlemi yapılabilir
  }, [selectedNFTs]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <VStack flex={1} bg="#FFFFFF">
        {/* Header */}
        <Header
          title="Select NFT"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* NFT Grid */}
        <Box flex={1}>
          {isLoading ? (
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
                        onPress={() => handleNFTPress(nft)}
                      />
                    </VStack>
                  ))}
                  {/* If odd number of items, add empty space */}
                  {item.length < 2 && <VStack width={cardWidth} />}
                </HStack>
              )}
              keyExtractor={(item, index) => `row-${index}`}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={isDark ? '#FFFFFF' : '#000000'}
                  colors={['#C2E607']}
                  progressBackgroundColor="#FFFFFF"
                />
              }
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
