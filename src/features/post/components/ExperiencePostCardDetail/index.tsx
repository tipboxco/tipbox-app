import React, { useState } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { PostCard as PostCardType } from '@/src/mock/profile/feed/types';
import { Dimensions } from 'react-native';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '@/src/components/CardImageCarousel';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';

interface ExperiencePostCardDetailProps {
    data: PostCardType;
}

export const ExperiencePostCardDetail = ({ data }: ExperiencePostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isTranslated, setIsTranslated] = useState(false);

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Action Button */}
            <Pressable
                position="absolute"
                top={12}
                right={15}
                zIndex={1}
            >
                <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
            </Pressable>

            {/* Header */}
            <VStack px={12} py={8}>
                <HStack alignItems="center" space="xs">
                    <Image
                        source={toImageSource(data.user.avatar)!}
                        alt={data.user.name}
                        mr={8}
                        width={42}
                        height={42}
                        borderRadius={100}
                    />
                    <VStack flex={1}>
                        <Text
                            color={isDark ? '$textDark400' : '#C7C7C7'}
                            fontSize={config.tokens.fontSizes['4xs'] as number}
                            fontWeight="$semibold"
                        >
                            {data.user.action}
                        </Text>
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize='$xs'
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
                </HStack>
            </VStack>

            {/* Product */}
            <Box px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9">
                <ProductInfoCard
                    size="small"
                    type={ProductInfoType.PRODUCT}
                    image={data.product.image}
                    title={data.product.name}
                    subName={data.product.subName}
                />
            </Box>

            {/* Content */}
            <VStack px={12} pb={8}>
                {data.content.map((item, index) => (
                    <VStack key={index} py={8}>
                        <HStack space="sm" alignItems="center">
                            <Feather name={item.tag.icon === 'tag' ? 'tag' : 'package'} size={18} color={isDark ? '#fff' : '#000'} fill={isDark ? '#fff' : '#000'} />
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={'$xs'}
                                fontWeight="$bold"
                            >
                                {item.tag.title}
                            </Text>
                        </HStack>
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize={'$2xs'}
                            ml={26}
                        >
                            {item.text}
                        </Text>
                        <HStack ml={26} mt={8}>
                            {item.rating.map((star, idx) => (
                                <Feather
                                    key={idx}
                                    name={star ? 'star' : 'star'}
                                    size={12}
                                    color={star ? (isDark ? '#fff' : '#829905') : (isDark ? '#7E7E7E' : '#E8E8E8')}
                                    fill={star ? (isDark ? '#fff' : '#829905') : 'transparent'}
                                />
                            ))}
                        </HStack>
                    </VStack>
                ))}
            </VStack>

            {/* Tags */}
            <HStack px={12} py={8} flexWrap="wrap">
                {data.tags.map((tag, index) => (
                    <HStack
                        key={index}
                        bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
                        borderWidth={1}
                        borderColor={'#E9E9E9'}
                        rounded={'$full'}
                        px={16}
                        py={6}
                        mr={4}
                    >
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize={config.tokens.fontSizes['4xs'] as number}
                            fontWeight="$semibold"
                        >
                            {tag}
                        </Text>
                    </HStack>
                ))}
            </HStack>

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

            {data.images?.length > 0 && (
                <VStack px={12} >
                    <CardImageCarousel images={data.images} paddingHorizontal={12} />
                </VStack>
            )}

            {/* Stats */}
            <HStack px={12} py={8}borderBottomWidth={1} borderColor="#E9E9E9">
                <HStack mr={10} alignItems="center">
                    <Feather name="heart" size={24} color={isDark ? '#fff' : '#000'} />
                    <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.likes}</Text>
                </HStack>
                <HStack mr={10} alignItems="center">
                    <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
                    <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.comments}</Text>
                </HStack>
                <HStack mr={10} alignItems="center">
                    <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                    <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.shares}</Text>
                </HStack>
                <HStack mr={10} alignItems="center">
                    <Feather name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
                    <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>{data.stats.bookmarks}</Text>
                </HStack>
            </HStack>
        </VStack>
    );
};
