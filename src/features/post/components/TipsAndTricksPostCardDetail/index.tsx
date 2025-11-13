import React from 'react';
import { VStack, Text, HStack, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { TipsAndTricksPost } from '@/src/mock/profile/tipsAndTricks/types';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '@/src/components/CardImageCarousel';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';

interface TipsAndTricksPostCardDetailProps {
    data: TipsAndTricksPost;
}

export const TipsAndTricksPostCardDetail = ({ data }: TipsAndTricksPostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

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

            {/* Product */}
            {
                data.category && data.category.product ? (
                    <Box px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9">
                        <ProductInfoCard
                            size="small"
                            type={ProductInfoType.PRODUCT}
                            image={data.category.product.image}
                            title={data.category.product.name}
                            subName={data.category.product.subName}
                        />
                    </Box>
                ) : data.category ? (
                    <Box px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9">
                        <ProductInfoCard
                            size="small"
                            type={ProductInfoType.SUB_CATEGORY}
                            image={data.category.image}
                            title={data.category.name}
                            subName={data.category.subCategory}
                            onPress={() => { console.log('Category sayfasına yönlendir'); }}
                        />
                    </Box>
                ) : null
            }

            {/* Badges */}
            <HStack px={12} pb={8} justifyContent="space-between" alignItems="center">
                <Box
                    bg={isDark ? '$backgroundDark900' : '$white'}
                    borderWidth={2}
                    borderColor="#56CFE5"
                    bgColor='#059982'
                    borderRadius={20}
                    width={100}
                    px={10}
                    py={6}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-evenly"
                >
                    <Feather name="info" size={12} color={'#fff'} />
                    <Text
                        fontSize={config.tokens.fontSizes['4xs'] as number}
                        fontWeight="$semibold"
                        ml={5}
                        color={'#fff'}
                    >
                        Tips & Tricks
                    </Text>
                </Box>

                <HStack
                    alignItems="center"
                    space="xs"
                    px={8}
                >
                    <Text
                        mr={4}
                        color={isDark ? '$textDark400' : '#666'}
                        fontSize={config.tokens.fontSizes['2xs'] as number}
                    >
                        {data.tag}
                    </Text>
                    <Feather
                        name="layers"
                        size={16}
                        color={isDark ? '#fff' : '#666'}
                    />
                </HStack>
            </HStack>

            {/* Content */}
            <VStack px={12} pb={8}>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={config.tokens.fontSizes['2xs'] as number}
                >
                    {data.content}
                </Text>
            </VStack>

            {/* Images */}
            {data.images && data.images?.length > 0 && (
                <VStack px={12}>
                    <CardImageCarousel images={data.images} paddingHorizontal={12} />
                </VStack>
            )}

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
