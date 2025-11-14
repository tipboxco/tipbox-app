import React, { useState } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BenchmarkPost, BenchmarkProduct } from '@/src/mock/profile/benchmark/types';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';

interface BenchmarkPostCardDetailProps {
    data: BenchmarkPost;
}

const renderProduct = ({ product, isDark }: { product: BenchmarkProduct; isDark: boolean; }) => (
    <HStack flex={1} borderWidth={1} borderColor={product.choice ? '#87BB33' : '#E9E9E9'} borderRadius={10} position="relative">
        <VStack padding={6} flex={1} >
            <Box position="relative" w={'$full'} overflow='hidden'>
                <Image
                    w={'$full'}
                    h={'$full'}
                    aspectRatio={1}
                    borderRadius={10}
                    source={product.image}
                    alt={product.name}
                    resizeMode='cover'
                />
                {product.isOwned && (
                    <Box
                        position="absolute"
                        top={8}
                        right={8}
                        width={24}
                        height={24}
                    >
                        <Image
                            source={require('@/assets/common/inventory.png')}
                            alt="inventory"
                            width={24}
                            height={24}
                        />
                    </Box>
                )}
            </Box>
            <VStack flex={1} pt={8}>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={config.tokens.fontSizes['3xs'] as number}
                    fontWeight="$bold"
                >
                    {product.name}
                </Text>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={config.tokens.fontSizes['4xs'] as number}
                    fontWeight="$semibold"
                >
                    {product.subName}
                </Text>
            </VStack>
        </VStack>
    </HStack>
);

export const BenchmarkPostCardDetail = ({ data }: BenchmarkPostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isTranslated, setIsTranslated] = useState(false);

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Header */}
            <VStack px={12} py={8}>
                <HStack alignItems="center" space="xs">
                    <Image
                        source={data.user.avatar}
                        alt={data.user.name}
                        mr={8}
                        width={42}
                        height={42}
                        borderRadius={100}
                    />
                    <VStack flex={1}>
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize="$xs"
                            fontWeight="$bold"
                        >
                            {data.user.name}
                        </Text>
                        <Text
                            color={isDark ? '$textDark400' : '#787878'}
                            fontSize={config.tokens.fontSizes['3xs'] as number}
                            numberOfLines={1}
                            maxWidth={250}
                        >
                            {data.user.title}
                        </Text>
                    </VStack>
                    <Pressable>
                        <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
                    </Pressable>
                </HStack>
            </VStack>

            {/* Content */}
            <VStack px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9">
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={config.tokens.fontSizes['2xs'] as number}
                >
                    {data.content}
                </Text>
            </VStack>

            {/* Translate Button */}
            <Box pb="$3" px="$3">
                <Pressable onPress={() => setIsTranslated(!isTranslated)}>
                    <HStack alignItems="center" space="xs">
                        <Image
                            source={require('@/assets/translate.png')}
                            alt="translate"
                            width={16}
                            height={16}
                        />
                        <Text
                            color="#829905"
                            fontSize={config.tokens.fontSizes['2xs'] as number}
                            textDecorationLine="underline"
                        >
                            {isTranslated ? 'Automatically translated from English.' : 'Translate'}
                        </Text>
                    </HStack>
                </Pressable>
            </Box>

            {/* Product Comparison */}
            <VStack px={12} pb={8} >
                <Box position="relative" width="100%">
                    <HStack justifyContent="space-between" width="100%">
                        {data.products.map((product, index) => (
                            <Box key={product.id} flex={1} mx={4}>
                                {renderProduct({ product, isDark })}
                            </Box>
                        ))}
                    </HStack>
                    <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform={[{ translateX: -20 }, { translateY: -20 }]}
                        width={40}
                        height={40}
                    >
                        <Image
                            source={require('@/assets/common/benchmarks.png')}
                            alt="benchmarks"
                            width={40}
                            height={40}
                        />
                    </Box>
                </Box>
            </VStack>

            {/* Stats */}
            <HStack
                px={12}
                py={8}
                borderBottomWidth={1}
                borderColor="#E9E9E9"
                justifyContent="space-between"
            >
                <HStack>
                    <HStack mr={10} alignItems="center">
                        <Feather name="heart" size={24} color={isDark ? '#fff' : '#000'} />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.likes}</Text>
                    </HStack>
                    <HStack mr={10} alignItems="center">
                        <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.comments}</Text>
                    </HStack>
                    <HStack mr={10} alignItems="center">
                        <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.shares}</Text>
                    </HStack>
                    <HStack mr={10} alignItems="center">
                        <Feather name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">{data.stats.bookmarks}</Text>
                    </HStack>
                </HStack>
                <Box>
                    <Image
                        source={require('@/assets/common/Vector.png')}
                        alt={'vector'}
                        width={24}
                        height={24}
                    />
                </Box>
            </HStack>
        </VStack>
    );
};
