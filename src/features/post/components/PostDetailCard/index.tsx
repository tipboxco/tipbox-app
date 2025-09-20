import React from 'react';
import { VStack, Text, Image, HStack, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import CardImageCarousel from '@/src/components/CardImageCarousel';

import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Post } from '@/src/mock/profile/posts/types';

interface PostDetailCardProps {
    data: Post;
}

export const PostDetailCard = ({ data }: PostDetailCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <VStack bg={isDark ? '$backgroundDark900' : '$white'}>
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

            {/* Product */}
            {
                data.category && data.category.product ? (
                    <HStack px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9" alignItems="center">
                        <Image
                            width={42}
                            height={42}
                            mr={8}
                            source={data.category.product.image}
                            alt={data.category.product.name}
                            borderRadius={5}
                        />
                        <VStack flex={1}>
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$xs"
                                numberOfLines={2}
                            >
                                {data.category.product.name}
                            </Text>
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$xs"
                            >
                                {data.category.product.subName}
                            </Text>
                        </VStack>
                        {data.category.product.hasDiscount && (
                            <Image
                                source={require('@/assets/common/percentage_01.png')}
                                alt={'percentage'}
                                width={30}
                                height={30}
                            />
                        )}
                    </HStack>
                ) : (
                    <Pressable onPress={() => { console.log('Category sayfasına yönlendir'); }}>
                        <HStack px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9" alignItems="center">
                            <Image
                                width={42}
                                height={42}
                                mr={8}
                                source={data.category.image}
                                alt={data.category.name}
                                borderRadius={5}
                            />
                            <VStack flex={1}>
                                <Text
                                    color={isDark ? '#A3A3A3' : '#A3A3A3'}
                                    fontSize="$xs"
                                    fontWeight="$bold"
                                >
                                    {data.category.name}
                                </Text>
                                <Text
                                    color={isDark ? '#A3A3A3' : '#A3A3A3'}
                                    fontSize="$xs"
                                >
                                    {data.category.subCategory}
                                </Text>
                            </VStack>
                            <Feather name="chevron-right" size={24} color={isDark ? '#fff' : '#A3A3A3'} />
                        </HStack>
                    </Pressable>
                )
            }

            {/* Content */}
            <VStack px={12} pb={8} borderColor="#E9E9E9">
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={config.tokens.fontSizes['2xs'] as number}
                >
                    {data.content}
                </Text>
            </VStack>

            {/* Images */}
            {
                data.images && data.images?.length > 0 && (
                    <VStack px={12}>
                        <CardImageCarousel images={data.images} paddingHorizontal={12} />
                    </VStack>
                )
            }

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
