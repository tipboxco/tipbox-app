import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Text, Pressable, Image, ActivityIndicator } from '@gluestack-ui/themed';
import {
  ChevronDownIcon,
  TrophyIcon,
} from 'react-native-heroicons/outline';
import { Header } from '@/src/components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';
import { WalletCardInfo } from '../components/WalletCardInfo';
import { useMyNFTs } from '@/src/features/marketplace/api/hooks';
import { toImageSource } from '@/src/utils';

interface NftItem {
  id: string;
  name: string;
  rarity: 'Usual' | 'Rare';
  rarityColor: string;
  rarityBorderColor: string;
  rarityTextColor?: string;
  image: any;
}

export const NftAssetsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // API hook
  const { data: nftsData, isLoading: isLoadingNFTs, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyNFTs(12);

  // Transform API NFTs data
  const nfts: NftItem[] = useMemo(() => {
    if (!nftsData?.pages) {
      return [];
    }
    // Flatten all pages
    const allNFTs = nftsData.pages.flat();
    return allNFTs.map((nft: any) => ({
      id: nft.id || nft.nftId || String(Math.random()),
      name: nft.title || nft.name || 'Unnamed NFT',
      rarity: (nft.rarity === 'Rare' || nft.rarity === 'EPIC' ? 'Rare' : 'Usual') as 'Usual' | 'Rare',
      rarityColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? 'rgba(255, 8, 152, 0.4)' 
        : 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? '#EF4F75' 
        : '#D4D4D4',
      rarityTextColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? '#AB2847' 
        : undefined,
      image: nft.image ? toImageSource(nft.image) : require('@/assets/defaultImages/default-badge.png'),
    }));
  }, [nftsData]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
      <Header title="Varlıklar" showBackButton onBackPress={() => navigation.goBack()} />
      
      {/* Tabs */}
      <VStack px="$4" py="$2" space="xs">
        <HStack justifyContent="center" alignItems="center" space="lg">
          <Pressable onPress={() => navigation.navigate('WalletScreen')}>
            <VStack alignItems="center" space="xs">
              <Text fontSize={12} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                TIPS
              </Text>
              <Box w={72} h={2} bg="transparent" />
            </VStack>
          </Pressable>

          <Pressable>
            <VStack alignItems="center" space="xs">
              <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                NFT Assets
              </Text>
              <Box w={86} h={2} bg="$backgroundLight300" $dark-bg="$backgroundDark600" rounded={2} />
            </VStack>
          </Pressable>
        </HStack>
        {/* Divider under tabs */}
        <Box h={2} bg="#ECECEC" />
      </VStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack px="$4" py="$4" space="lg">
          {/* Wallet Card */}
          <WalletCardInfo />

          {/* NFT Assets Header */}
          <VStack space="md">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize={14} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
                NFT Assets
              </Text>
              <HStack space="xs" alignItems="center">
                {/* Filtrele Button */}
                <Pressable
                  bg="$backgroundLight0"
                  $dark-bg="$backgroundDark800"
                  borderWidth={1}
                  borderColor="#EFEFEF"
                  $dark-borderColor="$borderDark600"
                  rounded={20}
                  px="$3"
                  py="$1"
                >
                  <HStack alignItems="center" space="xs">
                    <Text fontSize={9} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      Filtrele
                    </Text>
                    <ChevronDownIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
                  </HStack>
                </Pressable>
                {/* Sırala Button */}
                <Pressable
                  bg="$backgroundLight0"
                  $dark-bg="$backgroundDark800"
                  borderWidth={1}
                  borderColor="#EFEFEF"
                  $dark-borderColor="$borderDark600"
                  rounded={20}
                  px="$3"
                  py="$1"
                >
                  <HStack alignItems="center" space="xs">
                    <Text fontSize={9} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      Sırala
                    </Text>
                    <ChevronDownIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
                  </HStack>
                </Pressable>
              </HStack>
            </HStack>

            {/* NFT Grid */}
            {isLoadingNFTs ? (
              <VStack alignItems="center" py="$8">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  Loading NFTs...
                </Text>
              </VStack>
            ) : nfts.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  No NFTs found
                </Text>
              </VStack>
            ) : (
              <VStack space="md">
                {nfts.reduce((rows: NftItem[][], nft, index) => {
                  if (index % 2 === 0) {
                    rows.push([nft]);
                  } else {
                    rows[rows.length - 1].push(nft);
                  }
                  return rows;
                }, []).map((row, rowIndex) => (
                  <HStack key={rowIndex} space="md" justifyContent="space-between">
                    {row.map((nft) => (
                      <Box key={nft.id} flex={1}>
                        <Pressable onPress={() => navigation.navigate('NftAssetDetailScreen', { nft })}>
                          <Box
                            bg="$backgroundLight0"
                            $dark-bg="$backgroundDark800"
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            $dark-borderColor="$borderDark600"
                            rounded={5}
                            overflow="hidden"
                          >
                            {/* NFT Image */}
                            <Box
                              w="100%"
                              h={190}
                              bg="$backgroundLight0"
                              $dark-bg="$backgroundDark800"
                              alignItems="center"
                              justifyContent="center"
                              p="$4"
                            >
                              <Image
                                source={nft.image}
                                alt={nft.name}
                                w={135}
                                h={135}
                                resizeMode="contain"
                              />
                            </Box>
                            
                            {/* NFT Info */}
                            <VStack p="$4" space="sm" alignItems="center">
                              {/* NFT Name - Above Badge */}
                              <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="center">
                                {nft.name}
                              </Text>
                              {/* Rarity Badge */}
                              <HStack
                                bg={nft.rarityColor}
                                $dark-bg={nft.rarityColor}
                                borderWidth={1}
                                borderColor={nft.rarityBorderColor}
                                rounded={10}
                                px="$4"
                                py="$1"
                                alignItems="center"
                                space="xs"
                              >
                                <TrophyIcon width={10} height={10} color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text 
                                  fontSize={9} 
                                  fontWeight="$medium" 
                                  color={nft.rarityTextColor || "$textLight900"} 
                                  $dark-color={nft.rarityTextColor || "$textDark50"}
                                >
                                  {nft.rarity}
                                </Text>
                              </HStack>
                            </VStack>
                          </Box>
                        </Pressable>
                      </Box>
                    ))}
                    {/* Fill empty space if odd number of items */}
                    {row.length === 1 && <Box flex={1} />}
                  </HStack>
                ))}
                {/* Load More Button */}
                {hasNextPage && (
                  <Pressable
                    onPress={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    mt="$4"
                    alignItems="center"
                  >
                    {isFetchingNextPage ? (
                      <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                    ) : (
                      <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        Load More
                      </Text>
                    )}
                  </Pressable>
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

