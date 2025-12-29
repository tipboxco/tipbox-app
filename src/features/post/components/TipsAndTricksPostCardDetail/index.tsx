import React, { useState, useEffect } from 'react';
import { VStack, Text, HStack, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { TipsAndTricksPost } from '@/src/mock/profile/tipsAndTricks/types';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '@/src/components/CardImageCarousel';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';

interface TipsAndTricksPostCardDetailProps {
    data: TipsAndTricksPost;
    onCommentPress?: () => void;
}

export const TipsAndTricksPostCardDetail = ({ data, onCommentPress }: TipsAndTricksPostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isTranslated, setIsTranslated] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);

    // Interaction hooks
    const likePostMutation = useLikePost();
    const unlikePostMutation = useUnlikePost();
    const bookmarkPostMutation = useBookmarkPost();
    const unbookmarkPostMutation = useUnbookmarkPost();
    const sharePostMutation = useSharePost();
    const { data: postStatus } = usePostStatus(data.id);

    // Sync with post status from API
    useEffect(() => {
        if (postStatus) {
            setIsLiked(postStatus.liked);
            setIsBookmarked(postStatus.favorited);
            setIsShared(postStatus.shared);
        }
    }, [postStatus]);

    // Action handlers
    const handleLike = () => {
        if (isLiked) {
            setIsLiked(false);
            unlikePostMutation.mutate(data.id);
        } else {
            setIsLiked(true);
            likePostMutation.mutate(data.id);
        }
    };

    const handleBookmark = () => {
        if (isBookmarked) {
            setIsBookmarked(false);
            unbookmarkPostMutation.mutate(data.id);
        } else {
            setIsBookmarked(true);
            bookmarkPostMutation.mutate(data.id);
        }
    };

    const handleShare = () => {
        // Zaten paylaşılmışsa tekrar paylaşma
        if (isShared) return;
        
        sharePostMutation.mutate({
            postId: data.id,
            shareType: 'INTERNAL_REPOST',
        });
    };

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
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
                    <Pressable onPress={handleLike}>
                        <HStack mr={10} alignItems="center">
                            <Feather
                                name="heart"
                                size={24}
                                color={isLiked ? '#FF3040' : isDark ? '#fff' : '#000'}
                                fill={isLiked ? '#FF3040' : 'none'}
                            />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">
                                {data.stats.likes}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={() => onCommentPress?.()}>
                        <HStack mr={10} alignItems="center">
                            <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">
                                {data.stats.comments}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                        <HStack mr={10} alignItems="center">
                            <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">
                                {data.stats.shares}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleBookmark}>
                        <HStack mr={10} alignItems="center">
                            <Feather
                                name="bookmark"
                                size={24}
                                color={isBookmarked ? '#829905' : isDark ? '#fff' : '#000'}
                                fill={isBookmarked ? '#829905' : 'none'}
                            />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize="$2xs">
                                {data.stats.bookmarks}
                            </Text>
                        </HStack>
                    </Pressable>
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
