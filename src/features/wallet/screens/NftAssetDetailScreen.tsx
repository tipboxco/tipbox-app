import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Text, Pressable, Image } from '@gluestack-ui/themed';
import {
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
  ShoppingBagIcon,
} from 'react-native-heroicons/outline';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { ScrollView } from 'react-native';
import { useNftTransferFlowStore } from '../store/nft-transfer-flow-store';

interface NftItem {
    id: string;
    name: string;
    username?: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    rarityColor: string;
    rarityBorderColor: string;
    rarityTextColor?: string;
    image: any;
    listing?: {
        id: string;
        price: number;
        listedAt: string;
        status: string;
    };
}

type RouteParams = {
    nft: NftItem;
};

export const NftAssetDetailScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { t } = useTranslation('wallet');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const setTransferNft = useNftTransferFlowStore((s) => s.setTransferNft);
    const clearTransferFlow = useNftTransferFlowStore((s) => s.clear);

    // Get NFT data from route params
    const { nft } = (route.params as RouteParams) || {
        nft: {
            id: '1',
            name: 'Everyday Consumer',
            rarity: 'Common',
            rarityColor: 'rgba(211, 211, 211, 0.4)',
            rarityBorderColor: '#D4D4D4',
            image: require('@/assets/badges/badge_01.png'),
        },
    };

    // Check if NFT is currently listed for sale
    const isListed = nft.listing?.status === 'ACTIVE';
    const listingPrice = nft.listing?.price;

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
            <Header title={nft.name} showBackButton onBackPress={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <VStack px="$4" py="$4" space="lg">
                    {/* NFT Image Card - Outer Box */}
                    <Box
                        bg="$backgroundLight0"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#E9E9E9'}
                        $dark-borderColor="$borderDark600"
                        rounded={20}
                        overflow="hidden"
                        w="100%"
                        p="$2"
                    >
                        <VStack space="md" alignItems="center">
                            {/* Image */}
                            <Box
                                w={315}
                                h={315}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Image
                                    source={nft.image}
                                    alt={nft.name}
                                    w={315}
                                    h={315}
                                    resizeMode="contain"
                                />
                            </Box>
                            
                            {/* Rarity Badge - Below image, inside outer box */}
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

                    {/* Action Buttons */}
                    <HStack space="md" justifyContent="space-between">

                        {/* Transfer Button (White) */}
                        <Pressable
                            bg="$backgroundLight0"
                            $dark-bg="$backgroundDark800"
                            borderWidth={1}
                            borderColor={isDark ? '#333333' : '#E9E9E9'}
                            $dark-borderColor="$borderDark600"
                            rounded={5}
                            flex={1}
                            h={46}
                            alignItems="center"
                            justifyContent="center"
                            onPress={() => {
                                clearTransferFlow();
                                setTransferNft({
                                    nftId: nft.id,
                                    listingId: nft.listing?.id,
                                    listingStatus: nft.listing?.status,
                                });
                                navigation.navigate('NftTransferScreen');
                            }}
                        >
                            <HStack alignItems="center" space="xs">
                                <ArrowTopRightOnSquareIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    {t('nftDetail.transfer')}
                                </Text>
                            </HStack>
                        </Pressable>

                        {/* Sell / View Listing Button (Yellow) */}
                        <Pressable
                            bg="#D8FF08"
                            $dark-bg="#D8FF08"
                            borderWidth={1}
                            borderColor="#B5D701"
                            rounded={5}
                            flex={1}
                            h={46}
                            alignItems="center"
                            justifyContent="center"
                            onPress={() => {
                                if (isListed) {
                                    // If already listed, navigate to NFTDetailScreen to view listing
                                    navigationService.navigate(ROOT_ROUTES.MARKETPLACE, {
                                        screen: 'NFTDetailScreen',
                                        params: {
                                            nftId: nft.id,
                                            mode: 'view',
                                        },
                                    });
                                } else {
                                    // If not listed, navigate to NFTSellScreen to create listing
                                    navigationService.navigate(ROOT_ROUTES.MARKETPLACE, {
                                        screen: 'NFTSellScreen',
                                        params: {
                                            nftId: nft.id,
                                        },
                                    });
                                }
                            }}
                        >
                            <HStack alignItems="center" space="xs">
                                <ShoppingBagIcon width={24} height={24} color="#000000" />
                                <Text fontSize={11} fontWeight="$semibold" color="#000000">
                                    {isListed ? t('nftDetail.viewListing') : t('nftDetail.sell')}
                                </Text>
                            </HStack>
                        </Pressable>
                    </HStack>

                    {/* Details Card */}
                    <Box
                        bg="$backgroundLight0"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor={isDark ? '#333333' : '#E9E9E9'}
                        $dark-borderColor="$borderDark600"
                        rounded={5}
                    >
                        <VStack space="md" py="$4">
                            {/* Acquisition Date */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    {t('nftDetail.acquisitionDate')}
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    11 July 2025
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                            {/* Rarity */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    {t('nftDetail.rarity')}
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    {nft.rarity}
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                            {/* Listing Price (only if listed) */}
                            {isListed && listingPrice && (
                                <>
                                    <HStack justifyContent="space-between" alignItems="center" px="$4">
                                        <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                            {t('nftDetail.listedPrice')}
                                        </Text>
                                        <HStack alignItems="center" space="xs">
                                            <Text fontSize={11} fontWeight="$bold" color="#C2E607" $dark-color="#C2E607">
                                                {Math.floor(listingPrice)} {t('nft.tips')}
                                            </Text>
                                            <Box
                                                bg="rgba(194, 230, 7, 0.15)"
                                                borderRadius={4}
                                                px="$2"
                                                py="$1"
                                            >
                                                <Text fontSize={8} fontWeight="$bold" color="#596B00">
                                                    {t('nft.onSale')}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    </HStack>

                                    {/* Divider */}
                                    <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />
                                </>
                            )}

                            {/* Owners */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    {t('nftDetail.owners')}
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    {nft.username ? `@${nft.username}` : '-'}
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />


                            {/* Average Price */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    {t('nftDetail.averagePrice')}
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    $0.495
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>
                </VStack>
            </ScrollView>
            </Box>
        </SafeAreaView>
    );
};

