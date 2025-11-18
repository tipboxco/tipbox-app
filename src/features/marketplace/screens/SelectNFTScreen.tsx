import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, ScrollView, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { UserNFTCard } from '../components/UserNFTCard';
import { userNFTList } from '@/src/mock/marketplace/NFTList';
import { UserNFT } from '@/src/mock/marketplace/NFTList/types';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SelectNFTScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 3; // 3 cards per row with 16px padding on each side
  const navigation = useNavigation();
  
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);

  const handleNFTPress = (nftId: string) => {
    // Find the NFT data
    const nftData = userNFTList.find(nft => nft.id === nftId);
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
          onBackPress={() => {}}
        />

        {/* NFT Grid */}
        <ScrollView 
          flex={1} 
          px={15} 
          showsVerticalScrollIndicator={false}
        >
          <VStack space="md" pb={20}>
            {/* Render NFTs in rows of 3 */}
            {Array.from({ length: Math.ceil(userNFTList.length / 3) }, (_, rowIndex) => (
              <HStack key={rowIndex} space="sm" justifyContent="space-between">
                {userNFTList.slice(rowIndex * 3, (rowIndex + 1) * 3).map((nft) => (
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
