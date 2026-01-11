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
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';

interface NftItem {
    id: string;
    name: string;
    rarity: 'Usual' | 'Rare';
    rarityColor: string;
    rarityBorderColor: string;
    rarityTextColor?: string;
    image: any;
}

type RouteParams = {
    nft: NftItem;
};

export const NftAssetDetailScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Get NFT data from route params
    const { nft } = (route.params as RouteParams) || {
        nft: {
            id: '1',
            name: 'Everyday Consumer',
            rarity: 'Usual',
            rarityColor: 'rgba(211, 211, 211, 0.4)',
            rarityBorderColor: '#D4D4D4',
            image: require('@/assets/badges/badge_01.png'),
        },
    };

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
                        borderColor="#E9E9E9"
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

                        {/* Transfer Et Button (White) */}
                        <Pressable
                            bg="$backgroundLight0"
                            $dark-bg="$backgroundDark800"
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            $dark-borderColor="$borderDark600"
                            rounded={5}
                            flex={1}
                            h={46}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <HStack alignItems="center" space="xs">
                                <ArrowTopRightOnSquareIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    Transfer Et
                                </Text>
                            </HStack>
                        </Pressable>

                        {/* Sat Button (Yellow) */}
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
                                // Convert wallet NFT to UserNFT format and navigate to NFTDetailScreen
                                const userNFT = {
                                    id: nft.id,
                                    title: nft.name,
                                    username: '@user', // Default username
                                    image: nft.image,
                                    isSelected: false,
                                };
                                // Navigate to Marketplace NFTDetailScreen (sale page)
                                navigation.navigate('Marketplace' as never, {
                                    screen: 'NFTDetailScreen',
                                    params: {
                                        nftData: userNFT,
                                    },
                                } as never);
                            }}
                        >
                            <HStack alignItems="center" space="xs">
                                <ShoppingBagIcon width={24} height={24} color="#000000" />
                                <Text fontSize={11} fontWeight="$semibold" color="#000000">
                                    Sat
                                </Text>
                            </HStack>
                        </Pressable>
                    </HStack>

                    {/* Details Card */}
                    <Box
                        bg="$backgroundLight0"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        $dark-borderColor="$borderDark600"
                        rounded={5}
                    >
                        <VStack space="md" py="$4">
                            {/* Kazanma Tarihi */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    Kazanma Tarihi
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    11 July 2025
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                            {/* Enderlik */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    Enderlik
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    {nft.rarity}
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                            {/* Sahip */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    Sahip
                                </Text>
                                <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                                    11049
                                </Text>
                            </HStack>

                            {/* Divider */}
                            <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />


                            {/* Ortalama Fiyat */}
                            <HStack justifyContent="space-between" alignItems="center" px="$4">
                                <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                                    Ortalama Fiyat
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

