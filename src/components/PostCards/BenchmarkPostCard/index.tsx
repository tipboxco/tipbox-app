import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { useNavigation } from '@react-navigation/native';
import { toImageSource } from '@/src/utils';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

interface BenchmarkPostCardProps {
    data: BenchmarkCardData;
}

const renderProduct = ({ product, isDark }: { product: BenchmarkProduct; isDark: boolean; }) => {
    const productImageSource = toImageSource(product.image);
    return (
    <HStack flex={1} borderWidth={1} borderColor={product.choice ? '#87BB33' : '#E9E9E9'} borderRadius={10} position="relative">
        <VStack padding={6} flex={1} >
            <Box position="relative" w={'$full'} overflow='hidden'>
                {productImageSource && (
                <Image
                    w={'$full'}
                    h={'$full'}
                    aspectRatio={1}
                    borderRadius={10}
                    source={productImageSource}
                    alt={product.name}
                    resizeMode='cover'
                />
                )}
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
                    fontSize={9}
                    fontWeight="$bold"
                >
                    {product.name}
                </Text>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={8}
                    fontWeight="$semibold"
                >
                    {product.subName}
                </Text>
            </VStack>
        </VStack>
    </HStack>
    );
};

export const BenchmarkPostCard = ({ data }: BenchmarkPostCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<any>();
    const [isTranslated, setIsTranslated] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    // Animated counter states
    const [likesCount, setLikesCount] = useState(data.stats.likes);
    const [commentsCount, setCommentsCount] = useState(data.stats.comments);
    const [sharesCount, setSharesCount] = useState(data.stats.shares);
    const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);

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

    // Sync stats with data prop changes
    useEffect(() => {
        setLikesCount(data.stats.likes);
        setCommentsCount(data.stats.comments);
        setSharesCount(data.stats.shares);
        setBookmarksCount(data.stats.bookmarks);
    }, [data.stats.likes, data.stats.comments, data.stats.shares, data.stats.bookmarks]);

    // Action handlers
    const handleLike = () => {
        if (isLiked) {
            setIsLiked(false);
            setLikesCount(prev => Math.max(0, prev - 1));
            unlikePostMutation.mutate(data.id);
        } else {
            setIsLiked(true);
            setLikesCount(prev => prev + 1);
            likePostMutation.mutate(data.id);
        }
    };

    const handleBookmark = () => {
        if (isBookmarked) {
            setIsBookmarked(false);
            setBookmarksCount(prev => Math.max(0, prev - 1));
            unbookmarkPostMutation.mutate(data.id);
        } else {
            setIsBookmarked(true);
            setBookmarksCount(prev => prev + 1);
            bookmarkPostMutation.mutate(data.id);
        }
    };

    const handleShare = () => {
        // Zaten paylaşılmışsa tekrar paylaşma
        if (isShared) return;
        
        setIsShared(true);
        setSharesCount(prev => prev + 1);
        sharePostMutation.mutate({
            postId: data.id,
            shareType: 'INTERNAL_REPOST',
        });
    };

    const handleComment = () => {
        navigation.navigate('Post', {
            screen: 'PostDetailScreen',
            params: { postData: data, type: 'benchmark' },
        });
    };

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Header */}
            <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                <HStack alignItems="center" space="xs">
                    {toImageSource(data.user.avatar) && (
                        <Image
                            source={toImageSource(data.user.avatar)!}
                            alt={data.user.name}
                            mr={8}
                            width={42}
                            height={42}
                            borderRadius={100}
                        />
                    )}
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
                            fontSize={9}
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
            <Pressable onPress={() => {
                navigation.navigate('Post', {
                    screen: 'PostDetailScreen',
                    params: { postData: data, type: 'benchmark' }
                });
            }}>
                <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderColor="#E9E9E9">
                    <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize={10}
                        numberOfLines={3}
                    >
                        {data.content}
                    </Text>
                </VStack>
            </Pressable>

            {/* Translate Button */}
            <Box pb="$3" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
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
                            fontSize={10}
                            textDecorationLine="underline"
                        >
                            {isTranslated ? 'Automatically translated from English.' : 'Translate'}
                        </Text>
                    </HStack>
                </Pressable>
            </Box>

            {/* Product Comparison */}
            <Pressable onPress={() => {
                navigation.navigate('Post', {
                    screen: 'PostDetailScreen',
                    params: { postData: data, type: 'benchmark' }
                });
            }}>
                <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
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
            </Pressable>

            {/* Stats */}
            <HStack
                px={12}
                py={8}
                borderRightWidth={1}
                borderLeftWidth={1}
                borderBottomWidth={1}
                borderBottomRightRadius={5}
                borderBottomLeftRadius={5}
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
                            <AnimatedCounter
                                value={likesCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$2xs"
                                ml={4}
                            />
                    </HStack>
                    </Pressable>
                    <Pressable onPress={handleComment}>
                    <HStack mr={10} alignItems="center">
                        <Feather name="message-circle" size={24} color={isDark ? '#fff' : '#000'} />
                            <AnimatedCounter
                                value={commentsCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$2xs"
                                ml={4}
                            />
                    </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                    <HStack mr={10} alignItems="center">
                        <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                            <AnimatedCounter
                                value={sharesCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$2xs"
                                ml={4}
                            />
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
                            <AnimatedCounter
                                value={bookmarksCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$2xs"
                                ml={4}
                            />
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
// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
export default React.memo(BenchmarkPostCard);

