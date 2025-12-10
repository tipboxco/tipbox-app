import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, ScrollView, HStack, Pressable, Text, Box } from '@gluestack-ui/themed';
import { ActivityIndicator } from 'react-native';
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

  // My NFTs API hook
  const {
    data: nftListings,
    isLoading,
    error,
  } = useMyNFTs();

  // Map API response to UserNFTCardData
  const mapListingToCardData = (listing: UserNFTApiItem): UserNFTCardData => {
    const imageSource = toImageSource(listing.image);
    return {
      id: listing.id,
      title: listing.title,
      username: listing.username,
      image: imageSource || require('@/assets/inventory/product_01.png'), // Fallback if image is null
    };
  };

  const userNFTData: UserNFTCardData[] = nftListings?.map(mapListingToCardData) ?? [];

  const handleNFTPress = (nftId: string) => {
    // Find the NFT data
    const nftData = userNFTData.find(nft => nft.id === nftId);
    if (nftData) {
      // Navigate to NFT detail screen
      (navigation as any).navigate('NFTDetailScreen', { nftData });
    }
  };

  const handleContinue = () => {
    console.log('Selected NFTs:', selectedNFTs);
    // Burada seçilen NFT'ler ile devam etme işlemi yapılabilir
  };

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
                Henüz NFT'niz bulunmuyor.
              </Text>
            </Box>
          ) : (
            <ScrollView 
              flex={1} 
              px={15} 
              showsVerticalScrollIndicator={false}
            >
              <VStack space="md" pb={20}>
                {/* Render NFTs in rows of 3 */}
                {Array.from({ length: Math.ceil(userNFTData.length / 3) }, (_, rowIndex) => (
                  <HStack key={rowIndex} space="sm" justifyContent="space-between">
                    {userNFTData.slice(rowIndex * 3, (rowIndex + 1) * 3).map((nft) => (
                      <VStack key={nft.id} width={cardWidth}>
                        <UserNFTCard 
                          data={nft} 
                          isSelected={selectedNFTs.includes(nft.id)}
                          onPress={() => handleNFTPress(nft.id)}
                        />
                      </VStack>
                    ))}
                  </HStack>
                ))}
              </VStack>
            </ScrollView>
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
