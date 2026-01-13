import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Platform } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import { PostContextMenu } from '@/src/components/PostContextMenu';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
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
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';

interface BenchmarkPostCardProps {
    data: BenchmarkCardData;
    onCommentPress?: () => void;
    isDetailMode?: boolean;
}

const renderProduct = ({ product, isDark, isDetailMode = false }: { product: BenchmarkProduct; isDark: boolean; isDetailMode?: boolean; }) => {
    const productImageSource = product.image 
        ? toImageSource(product.image) || require('@/assets/inventory/product_01.png')
        : require('@/assets/inventory/product_01.png');
    
    return (
    <HStack flex={1} borderWidth={1} borderColor={product.choice ? '#87BB33' : '#E9E9E9'} borderRadius={10} position="relative">
        <VStack padding={6} flex={1} >
            <Box position="relative" w={'$full'} overflow='hidden'>
                <Image
                    w={'$full'}
                    h={'$full'}
                    aspectRatio={1}
                    borderRadius={10}
                    source={productImageSource}
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
                    fontSize={isDetailMode ? "$xs" : 9}
                    fontWeight="$bold"
                >
                    {product.name}
                </Text>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={isDetailMode ? "$xs" : 8}
                    fontWeight="$semibold"
                >
                    {product.subName}
                </Text>
            </VStack>
        </VStack>
    </HStack>
    );
};

export const BenchmarkPostCard = ({ data, onCommentPress, isDetailMode = false }: BenchmarkPostCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<any>();
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    // Animated counter states
    const [likesCount, setLikesCount] = useState(data.stats.likes);
    const [commentsCount, setCommentsCount] = useState(data.stats.comments);
    const [sharesCount, setSharesCount] = useState(data.stats.shares);
    const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);

    // Translation hooks (only in detail mode)
    const deviceLocale = useDeviceLocale();
    const {
        translatedContent,
        isTranslating,
        showTranslation,
        toggleTranslation,
        shouldTranslate,
    } = usePostTranslation({
        postId: data.id,
        originalContent: data.content,
        targetLanguage: deviceLocale,
        sourceLanguage: 'en',
        enabled: isDetailMode, // Only enable translation in detail mode
    });

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
        if (isDetailMode && onCommentPress) {
            onCommentPress();
        } else {
            navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'benchmark' },
            });
        }
    };

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Header */}
            <VStack px={12} py={8} borderRightWidth={isDetailMode ? 0 : 1} borderLeftWidth={isDetailMode ? 0 : 1} borderTopWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                <HStack alignItems="center" space="xs">
                    <Image
                        source={toImageSource(data.user.avatar) || DEFAULT_USER_AVATAR}
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
                            fontSize={isDetailMode ? "$xs" : 9}
                            numberOfLines={1}
                            maxWidth={250}
                        >
                            {data.user.title}
                        </Text>
                    </VStack>
                    <PostContextMenu
                        postId={data.id}
                        postContent={data.content}
                        postAuthorName={data.user.name}
                    >
                        <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
                    </PostContextMenu>
                </HStack>
            </VStack>

            {/* Content */}
            {isDetailMode ? (
                <VStack px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9" space="sm">
                    {/* Original Content */}
                    <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize="$sm"
                    >
                        {data.content}
                    </Text>
                    
                    {/* Translated Content */}
                    {showTranslation && translatedContent && (
                        <VStack space="xs" mt="$2">
                            <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} />
                            <Text
                                color={isDark ? '$textDark200' : '#666'}
                                fontSize="$sm"
                                fontStyle="italic"
                            >
                                {translatedContent}
                            </Text>
                        </VStack>
                    )}
                </VStack>
            ) : (
                <Pressable onPress={() => {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: { postData: data, type: 'benchmark' }
                    });
                }}>
                    <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderColor="#E9E9E9">
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize="$xs"
                            numberOfLines={3}
                        >
                            {data.content}
                        </Text>
                    </VStack>
                </Pressable>
            )}

            {/* Translate Button (only in detail mode) */}
            {isDetailMode && shouldTranslate && (
                <Box pb="$3" px="$3">
                    <Pressable onPress={toggleTranslation}>
                        <HStack alignItems="center" space="xs">
                            <Image
                                source={require('@/assets/translate.png')}
                                alt="translate"
                                width={16}
                                height={16}
                            />
                            <Text
                                color="#829905"
                                fontSize="$sm"
                                textDecorationLine="underline"
                            >
                                {isTranslating
                                    ? 'Çeviriliyor...'
                                    : showTranslation
                                    ? 'Hide Translation'
                                    : 'Translate'}
                            </Text>
                        </HStack>
                    </Pressable>
                </Box>
            )}

            {/* Product Comparison */}
            {isDetailMode ? (
                <VStack px={12} pb={8}>
                    <Box position="relative" width="100%">
                        <HStack justifyContent="space-between" width="100%">
                            {data.products.map((product, index) => (
                                <Box key={product.id} flex={1} mx={4}>
                                    {renderProduct({ product, isDark, isDetailMode })}
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
            ) : (
                <Pressable onPress={() => {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: { postData: data, type: 'benchmark' }
                    });
                }}>
                    <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                        <Box position="relative" width="100%">
                            <HStack justifyContent="space-between" width="100%">
                                {data.products.map((product, index) => (
                                    <Box key={product.id} flex={1} mx={4}>
                                        {renderProduct({ product, isDark, isDetailMode })}
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
            )}

            {/* Stats */}
            <HStack
                px={12}
                py={isDetailMode ? 8 : 16}
                borderRightWidth={isDetailMode ? 0 : 1}
                borderLeftWidth={isDetailMode ? 0 : 1}
                borderBottomWidth={1}
                borderBottomRightRadius={isDetailMode ? 0 : 5}
                borderBottomLeftRadius={isDetailMode ? 0 : 5}
                borderColor="#E9E9E9"
                justifyContent="space-between"
            >
                <HStack>
                    <Pressable onPress={handleLike}>
                        <HStack mr={10} alignItems="center">
                            {isLiked ? (
                                <HeartIconSolid width={24} height={24} color="#FF3040" />
                            ) : (
                                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            {isDetailMode ? (
                                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                    {data.stats.likes}
                                </Text>
                            ) : (
                                <AnimatedCounter
                                    value={likesCount}
                                    color={isDark ? '$textDark50' : '#000'}
                                    fontSize={10}
                                    ml={4}
                                />
                            )}
                        </HStack>
                    </Pressable>
                    <Pressable 
                        onPress={handleComment}
                        disabled={isDetailMode && !onCommentPress}
                        opacity={isDetailMode && !onCommentPress ? 0.5 : 1}
                    >
                        <HStack mr={10} alignItems="center">
                            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            {isDetailMode ? (
                                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                    {data.stats.comments}
                                </Text>
                            ) : (
                                <AnimatedCounter
                                    value={commentsCount}
                                    color={isDark ? '$textDark50' : '#000'}
                                    fontSize={10}
                                    ml={4}
                                />
                            )}
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                        <HStack mr={10} alignItems="center">
                            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            {isDetailMode ? (
                                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                    {data.stats.shares}
                                </Text>
                            ) : (
                                <AnimatedCounter
                                    value={sharesCount}
                                    color={isDark ? '$textDark50' : '#000'}
                                    fontSize={10}
                                    ml={4}
                                />
                            )}
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleBookmark}>
                        <HStack mr={10} alignItems="center">
                            {isBookmarked ? (
                                <BookmarkIconSolid width={24} height={24} color="#829905" />
                            ) : (
                                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            {isDetailMode ? (
                                <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                    {data.stats.bookmarks}
                                </Text>
                            ) : (
                                <AnimatedCounter
                                    value={bookmarksCount}
                                    color={isDark ? '$textDark50' : '#000'}
                                    fontSize={10}
                                    ml={4}
                                />
                            )}
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

