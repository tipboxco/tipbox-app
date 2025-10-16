import React from 'react';
import { VStack, ScrollView, SafeAreaView, HStack, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchFilter } from '../components/SearchFilter';
import { NFTCard } from '../components/NFTCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { sellNFTList } from '@/src/mock/marketplace/SellList';
import { SellNFT } from '@/src/mock/marketplace/SellList/types';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MarketPlaceScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with 16px padding on each side
  const navigation = useNavigation();

  // Use mock data from SellList
  const nftData: SellNFT[] = sellNFTList;

  return (
    <SafeAreaView flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        {/* Header */}
        <Header
          title="Marketplace"
          showBackButton={true}
          onBackPress={() => {}}
        />

        {/* Search Filter */}
        <VStack px={16} py={8}>
          <SearchFilter />
        </VStack>

        {/* NFT Grid */}
        <ScrollView 
          flex={1} 
          px={16} 
          showsVerticalScrollIndicator={false}
        >
          <VStack space="md" pb={20}>
            {/* First Row */}
            <HStack space="sm" justifyContent="space-between">
              {nftData.slice(0, 2).map((nft) => (
                <VStack key={nft.id} width={cardWidth}>
                  <NFTCard data={nft} />
                </VStack>
              ))}
            </HStack>

            {/* Second Row */}
            <HStack space="sm" justifyContent="space-between">
              {nftData.slice(2, 4).map((nft) => (
                <VStack key={nft.id} width={cardWidth}>
                  <NFTCard data={nft} />
                </VStack>
              ))}
            </HStack>

            {/* Third Row */}
            <HStack space="sm" justifyContent="space-between">
              {nftData.slice(4, 6).map((nft) => (
                <VStack key={nft.id} width={cardWidth}>
                  <NFTCard data={nft} />
                </VStack>
              ))}
            </HStack>
          </VStack>
        </ScrollView>

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
