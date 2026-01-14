import React from 'react';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { TouchableOpacity } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NFTCardData } from '../../types';

interface NFTCardProps {
    data: NFTCardData;
    showQuickBuy?: boolean; // Optional prop to hide Quick Buy button
}

export const NFTCard = ({ data, showQuickBuy = true }: NFTCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();

    console.log('NFTCard mounted for NFT:', data.id, data.title);

    const handleCardPress = () => {
        console.log('🎯 NFTCard pressed, navigating to NFTDetailScreen with nftId:', data.id);
        try {
            navigation.navigate('NFTDetailScreen' as never, { nftId: data.id, mode: 'buy' } as never);
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    };

    const handleViewPress = (e: any) => {
        e?.stopPropagation?.(); // Prevent parent Pressable from triggering
        console.log('👁️ View button pressed, navigating to NFTDetailScreen with nftId:', data.id);
        try {
            navigation.navigate('NFTDetailScreen' as never, { nftId: data.id, mode: 'view' } as never);
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    };

    const handleQuickBuyPress = (e: any) => {
        e?.stopPropagation?.(); // Prevent parent Pressable from triggering
        console.log('💰 Quick Buy button pressed for NFT:', data.id);
        try {
            navigation.navigate('NFTDetailScreen' as never, { nftId: data.id, mode: 'buy' } as never);
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleCardPress}
            activeOpacity={0.7}
            onPressIn={() => console.log('👇 Press IN detected on card:', data.id)}
            onPressOut={() => console.log('👆 Press OUT detected on card:', data.id)}
            style={{
                backgroundColor: isDark ? '#1A1A1A' : '#FDFDFD',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isDark ? '#2A2A2A' : '#E9E9E9',
            }}
        >
            {/* Image Section */}
            <Box
                borderRadius={5}
                height={157}
                width="100%"
                position="relative"
                overflow="hidden"
                p='$2'
            >
                <Image
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    source={data.image || require('@/assets/defaultImages/default-marketplace.png')}
                    alt={data.title}
                    borderRadius={5}
                    resizeMode="cover"
                />

                {/* Price Badge */}
                <Box
                    position="absolute"
                    top={15}
                    left={15}
                    bg="rgba(0, 0, 0, 0.7)"
                    borderRadius={10}
                    px={'$2'}
                    py={'$1'}
                >
                    <Text
                        color="#FFFFFF"
                        fontSize={10}
                        fontWeight="$bold"
                    >
                        {Math.floor(parseFloat(data.price) || 0)} TIPS
                    </Text>
                </Box>
            </Box>

            {/* Divider */}

            {/* Content Section */}
            <VStack space="xs" px='$2' mb={8}>
                <Text
                    color={isDark ? '$textDark50' : '#000000'}
                    fontSize={12}
                    fontWeight="$bold"
                    numberOfLines={1}
                >
                    {data.title}
                </Text>
                <Text
                    color={isDark ? '$textDark400' : '#808080'}
                    fontSize={10}
                    fontWeight="$semibold"
                    numberOfLines={1}
                >
                    @{data.username}
                </Text>
            </VStack>

            <Box
                height={1}
                bg={isDark ? '$backgroundDark200' : '#D9D9D9'}
                mb={8}
            />

            {/* Action Buttons */}
            <HStack space="sm" justifyContent="space-between" px='$2' pb={'$2'}>
                <Pressable
                    onPress={handleViewPress}
                    bg={isDark ? '$backgroundDark700' : '#F7F7F7'}
                    borderRadius={10}
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    py={'$3'}
                    minHeight={36}
                >
                    <Text
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                        fontSize={11}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        View
                    </Text>
                </Pressable>

                {showQuickBuy && (
                    <Pressable
                        onPress={handleQuickBuyPress}
                        bg={isDark ? '$backgroundDark600' : '#E8FF6B'}
                        justifyContent="center"
                        alignItems="center"
                        borderRadius={10}
                        borderWidth={1}
                        borderColor={isDark ? '$backgroundDark500' : '#D8FF08'}
                        py={'$3'}
                        flex={1}
                        minHeight={36}
                    >
                        <Text
                            color={isDark ? '$textDark50' : '#000000'}
                            fontSize={11}
                            fontWeight="$bold"
                            textAlign="center"
                        >
                            Quick Buy
                        </Text>
                    </Pressable>
                )}
            </HStack>
        </TouchableOpacity>
    );
};
