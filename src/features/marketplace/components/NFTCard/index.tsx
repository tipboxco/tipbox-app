import React from 'react';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SellNFT } from '@/src/mock/marketplace/SellList/types';

interface NFTCardProps {
    data: SellNFT;
}

export const NFTCard = ({ data }: NFTCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderRadius={10}
            borderWidth={1}
            borderColor={isDark ? '$backgroundDark200' : '#E9E9E9'}
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
                    source={data.image}
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
                    px={5}
                    py={2}
                >
                    <Text
                        color="#FFFFFF"
                        fontSize={10}
                        fontWeight="$bold"
                    >
                        {data.price}
                    </Text>
                </Box>
            </Box>

            {/* Divider */}
            <Box
                height={1}
                bg={isDark ? '$backgroundDark200' : '#D9D9D9'}
                mb={8}
            />

            {/* Content Section */}
            <VStack space="xs" px='$2' mb={8}>
                <Text
                    color={isDark ? '$textDark50' : '#000000'}
                    fontSize={10}
                    fontWeight="$bold"
                    numberOfLines={1}
                >
                    {data.title}
                </Text>
                <Text
                    color={isDark ? '$textDark400' : '#808080'}
                    fontSize={9}
                    fontWeight="$semibold"
                    numberOfLines={1}
                >
                    {data.username}
                </Text>
            </VStack>

            {/* Action Buttons */}
            <HStack space="sm" justifyContent="space-between" px='$2' pb={'$2'}>
                <Pressable
                    bg={isDark ? '$backgroundDark700' : '#F7F7F7'}
                    borderRadius={10}
                    px={'$5'}
                    py={'$2'}
                    flex={1}
                    mr={2}
                >
                    <Text
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                        fontSize={8}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        View
                    </Text>
                </Pressable>

                <Pressable
                    bg={isDark ? '$backgroundDark600' : '#E8FF6B'}
                    borderRadius={10}
                    borderWidth={1}
                    borderColor={isDark ? '$backgroundDark500' : '#D8FF08'}
                    px={'$5'}
                    py={'$2'}
                    flex={1}
                >
                    <Text
                        color={isDark ? '$textDark50' : '#000000'}
                        fontSize={8}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        Quick Buy
                    </Text>
                </Pressable>
            </HStack>
        </Pressable>
    );
};
