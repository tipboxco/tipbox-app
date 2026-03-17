import React, { useState, useEffect } from 'react';
import { VStack, Text, Image, HStack, Pressable, Box } from '@gluestack-ui/themed';
import {
  EllipsisHorizontalIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import CardImageCarousel from '@/src/components/CardImageCarousel';

// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { useColorMode } from '@/src/hooks/useColorMode';
import { Post } from '@/src/mock/profile/posts/types';
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
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { useTranslation } from '@/src/hooks/useTranslation';

interface PostDetailCardProps {
    data: Post;
    onCommentPress?: () => void;
}

export const PostDetailCard = ({ data, onCommentPress }: PostDetailCardProps) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Translation hooks
    const {
        translatedContent,
        isTranslating,
        showTranslation,
        toggleTranslation,
        shouldTranslate,
    } = usePostTranslation({
        postId: data.id,
        originalContent: data.content || '',
    });
    
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    // Animated counter states
    // Optional chaining ile güvenli erişim (postData sadece ID içeriyorsa stats undefined olabilir)
    const [likesCount, setLikesCount] = useState(data.stats?.likes || 0);
    const [commentsCount, setCommentsCount] = useState(data.stats?.comments || 0);
    const [sharesCount, setSharesCount] = useState(data.stats?.shares || 0);
    const [bookmarksCount, setBookmarksCount] = useState(data.stats?.bookmarks || 0);

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
        if (data.stats) {
            setLikesCount(data.stats.likes || 0);
            setCommentsCount(data.stats.comments || 0);
            setSharesCount(data.stats.shares || 0);
            setBookmarksCount(data.stats.bookmarks || 0);
        }
    }, [data.stats?.likes, data.stats?.comments, data.stats?.shares, data.stats?.bookmarks]);

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

    return (
        <VStack bg={isDark ? '$backgroundDark900' : '$white'}>
            {/* Header */}
            <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                <HStack alignItems="center" space="xs">
                    {data.user?.avatar && (
                        <Image
                            source={toImageSource(data.user.avatar)!}
                            alt={t('altTexts.userPostImage')}
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
                            {data.user?.name || 'Kullanıcı'}
                        </Text>
                        {data.user?.title && (
                            <Text
                                color={isDark ? '$textDark400' : '#787878'}
                                fontSize="$xs"
                                numberOfLines={1}
                                maxWidth={250}
                            >
                                {data.user.title}
                            </Text>
                        )}
                    </VStack>
                    <Pressable>
                        <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
                    </Pressable>
                </HStack>
            </VStack>

            {/* Product */}
            {
                data.category && data.category.product ? (
                    <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                        <ProductInfoCard
                            size="small"
                            type={ProductInfoType.PRODUCT}
                            image={data.category.product.image}
                            title={data.category.product.name}
                            subName={data.category.product.subName}
                        />
                    </Box>
                ) : data.category ? (
                    <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
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

            {/* Content */}
            {data.content && (
                <VStack px={12} pb={8} space="sm">
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
            )}

            {/* Translate Button */}
            {shouldTranslate && (
                <Box pb="$3" px="$3">
                    <Pressable onPress={toggleTranslation}>
                        <HStack alignItems="center" space="xs">
                            <Image
                                source={require('@/assets/translate.png')}
                                alt={t('altTexts.productImage')}
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
                    <Pressable onPress={handleLike}>
                        <HStack mr={10} alignItems="center">
                            {isLiked ? (
                                <HeartIconSolid width={24} height={24} color="#FF3040" />
                            ) : (
                                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            <AnimatedCounter
                                value={likesCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={10}
                                ml={4}
                            />
                        </HStack>
                    </Pressable>
                    <Pressable 
                        onPress={onCommentPress || undefined}
                        disabled={!onCommentPress}
                        opacity={onCommentPress ? 1 : 0.5}
                    >
                        <HStack mr={10} alignItems="center">
                            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <AnimatedCounter
                                value={commentsCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={10}
                                ml={4}
                            />
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                        <HStack mr={10} alignItems="center">
                            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <AnimatedCounter
                                value={sharesCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={10}
                                ml={4}
                            />
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleBookmark}>
                        <HStack mr={10} alignItems="center">
                            {isBookmarked ? (
                                <BookmarkIconSolid width={24} height={24} color="#829905" />
                            ) : (
                                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            <AnimatedCounter
                                value={bookmarksCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={10}
                                ml={4}
                            />
                        </HStack>
                    </Pressable>
                </HStack>
                <Box>
                    <Image
                        source={require('@/assets/common/Vector.png')}
                        alt={t('altTexts.productImage')}
                        width={24}
                        height={24}
                    />
                </Box>
            </HStack>
        </VStack>
    );
};
