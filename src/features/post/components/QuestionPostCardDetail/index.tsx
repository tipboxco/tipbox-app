import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QuestionPost } from '@/src/mock/profile/questions/types';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
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
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';

interface QuestionPostCardDetailProps {
    data: QuestionPost;
    onCommentPress?: () => void;
}

export const QuestionPostCardDetail = ({ data, onCommentPress }: QuestionPostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    
    // Translation hooks
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
    });
    
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
    const { openBottomSheet } = useGlobalBottomSheet();

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

    const handleOptionsPress = () => {
        openBottomSheet(
            <PostOptionsMenu
                postId={data.id}
                postContent={data.content}
                postAuthorName={data.user.name}
            />
        );
    };

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Header */}
            <VStack px={12} py={8} >
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
                            fontSize="$xs"
                            numberOfLines={1}
                            maxWidth={250}
                        >
                            {data.user.title}
                        </Text>
                    </VStack>
                    <Pressable onPress={handleOptionsPress}>
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
            <HStack px={12} pb={8}>
                <Box
                    bg={isDark ? '$backgroundDark900' : '$white'}
                    borderWidth={2}
                    borderColor="#CFE556"
                    bgColor='#829905'
                    borderRadius={20}
                    flex={0}
                    flexShrink={1}
                    minWidth={70}
                    px={10}
                    py={6}
                    mr={16}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Feather name="help-circle" size={12} color={'#fff'} />
                    <Text
                        fontSize="$xs"
                        fontWeight="$semibold"
                        ml={5}
                        color={'#fff'}
                    >
                        Question
                    </Text>
                </Box>

                {data.isBoosted && (
                    <Box
                        bgColor="#99055E"
                        borderWidth={2}
                        borderColor="#E059AA"
                        borderRadius={20}
                        flex={0}
                        flexShrink={1}
                        minWidth={70}
                        px={10}
                        py={6}
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Feather name="send" size={12} color="#fff" />
                        <Text
                            fontSize="$xs"
                            fontWeight="$semibold"
                            ml={5}
                            color="#fff"
                        >
                            Boosted
                        </Text>
                    </Box>
                )}
            </HStack>

            {/* Content */}
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

            {/* Translate Button */}
            {shouldTranslate && (
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

            {/* Images */}
            {data.images && data.images?.length > 0 && (
                <VStack px={12}>
                    <CardImageCarousel images={data.images} paddingHorizontal={12} />
                </VStack>
            )}

            {/* Stats */}
            <HStack
                px={12}
                py={10}
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
                    <Pressable 
                        onPress={onCommentPress || undefined}
                        disabled={!onCommentPress}
                        opacity={onCommentPress ? 1 : 0.5}
                    >
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
