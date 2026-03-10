import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import {
  EllipsisHorizontalIcon,
  TagIcon,
  CubeIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { useColorMode } from '@/src/hooks/useColorMode';
import { PostCard as PostCardType } from '@/src/mock/profile/feed/types';
import { Dimensions } from 'react-native';
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
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';

interface ExperiencePostCardDetailProps {
    data: PostCardType;
    onCommentPress?: () => void;
}

export const ExperiencePostCardDetail = ({ data, onCommentPress }: ExperiencePostCardDetailProps) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const deviceLocale = useDeviceLocale();
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);

    // Combine all content texts for translation
    const allContentText = data.content?.map(item => item.text).join(' ') || '';

    // Translation hook
    const {
        translatedContent,
        isTranslating,
        showTranslation,
        toggleTranslation,
        shouldTranslate,
    } = usePostTranslation({
        postId: data.id,
        originalContent: allContentText,
        originalLocale: data.locale || 'en',
        targetLocale: deviceLocale,
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
            {/* Action Button */}
            <Pressable
                position="absolute"
                top={12}
                right={15}
                zIndex={1}
            >
                <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
            </Pressable>

            {/* Header */}
            {data.user && (
                <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                    <HStack alignItems="center" space="xs">
                        <Image
                            source={toImageSource(data.user?.avatar)!}
                            alt={t('altTexts.userPostImage')}
                            mr={8}
                            width={42}
                            height={42}
                            borderRadius={100}
                        />
                        <VStack flex={1}>
                            <Text
                                color={isDark ? '$textDark400' : '#C7C7C7'}
                                fontSize="$xs"
                                fontWeight="$semibold"
                            >
                                {data.user?.action}
                            </Text>
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize='$xs'
                                fontWeight="$bold"
                            >
                                {data.user?.name}
                            </Text>
                            <Text
                                color={isDark ? '$textDark400' : '#787878'}
                                fontSize="$xs"
                                numberOfLines={1}
                                maxWidth={250}
                            >
                                {data.user?.title}
                            </Text>
                        </VStack>
                    </HStack>
                </VStack>
            )}

            {/* Product */}
            {data.product && (
                <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                    <ProductInfoCard
                        size="small"
                        type={ProductInfoType.PRODUCT}
                        image={data.product?.image}
                        title={data.product?.name}
                        subName={data.product?.subName}
                    />
                </Box>
            )}

            {/* Content */}
            {data.content && data.content.length > 0 && (
                <VStack px={12} pb={8}>
                    {data.content.map((item, index) => (
                        <VStack key={index} py={8}>
                            <HStack space="sm" alignItems="center">
                                {item.tag?.icon === 'tag' ? (
                                    <TagIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                                ) : (
                                    <CubeIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                                )}
                                <Text
                                    color={isDark ? '$textDark50' : '#000'}
                                    fontSize={'$xs'}
                                    fontWeight="$bold"
                                >
                                    {item.tag?.title}
                                </Text>
                            </HStack>
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$sm"
                                ml={26}
                            >
                                {item.text}
                            </Text>
                            {item.rating && item.rating.length > 0 && (
                                <HStack ml={26} mt={8} space="xs">
                                    {item.rating.map((star, idx) => (
                                        star ? (
                                            <StarIconSolid
                                                key={idx}
                                                width={16}
                                                height={16}
                                                color="#829905"
                                            />
                                        ) : (
                                            <StarIcon
                                                key={idx}
                                                width={16}
                                                height={16}
                                                color={isDark ? '#7E7E7E' : '#D4D4D4'}
                                            />
                                        )
                                    ))}
                                </HStack>
                            )}
                        </VStack>
                    ))}

                    {/* Translated Content */}
                    {showTranslation && translatedContent && (
                        <VStack space="xs" mt="$2" ml={26}>
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

                    {/* Translate Button */}
                    {shouldTranslate && (
                        <Pressable onPress={toggleTranslation} mt="$2" ml={26}>
                            <HStack alignItems="center" space="xs">
                                <Image
                                    source={require('@/assets/translate.png')}
                                    alt={t('altTexts.translate')}
                                    width={16}
                                    height={16}
                                />
                                <Text
                                    color={isDark ? '$textDark300' : '#787878'}
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                >
                                    {isTranslating
                                        ? t('post:translate.translating')
                                        : showTranslation
                                        ? t('post:translate.hideTranslation')
                                        : t('post:translate.translate')}
                                </Text>
                            </HStack>
                        </Pressable>
                    )}
                </VStack>
            )}

            {/* Usage Context: Duration, Condition, Frequency - padding 6x12, gap 10 */}
            {data.tags && data.tags.length > 0 && (
                <HStack
                    px={12}
                    py={6}
                    flexDirection="row"
                    flexWrap="wrap"
                    justifyContent="flex-start"
                    alignItems="center"
                    gap={10}
                >
                    {data.tags.slice(0, 3).map((value, index) => {
                        if (value == null || value === '') return null;
                        return (
                            <HStack
                                key={index}
                                rounded="$full"
                                px={12}
                                py={6}
                                bg={isDark ? 'rgba(255,255,255,0.15)' : '#FFFFFF'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                            >
                                <Text
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize="$xs"
                                    fontWeight="$semibold"
                                >
                                    {value}
                                </Text>
                            </HStack>
                        );
                    })}
                </HStack>
            )}

            {data.images?.length > 0 && (
                <VStack px={12} >
                    <CardImageCarousel images={data.images} paddingHorizontal={12} />
                </VStack>
            )}

            {/* Stats */}
            {data.stats && (
                <HStack px={12} py={8}borderBottomWidth={1} borderColor="#E9E9E9">
                    <Pressable onPress={handleLike}>
                        <HStack mr={10} alignItems="center">
                            {isLiked ? (
                                <HeartIconSolid width={24} height={24} color="#FF3040" />
                            ) : (
                                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                                {data.stats?.likes || 0}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable 
                        onPress={onCommentPress || undefined}
                        disabled={!onCommentPress}
                        opacity={onCommentPress ? 1 : 0.5}
                    >
                        <HStack mr={10} alignItems="center">
                            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                                {data.stats?.comments || 0}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                        <HStack mr={10} alignItems="center">
                            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                                {data.stats?.shares || 0}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleBookmark}>
                        <HStack mr={10} alignItems="center">
                            {isBookmarked ? (
                                <BookmarkIconSolid width={24} height={24} color="#829905" />
                            ) : (
                                <BookmarkIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                                {data.stats?.bookmarks || 0}
                            </Text>
                        </HStack>
                    </Pressable>
                </HStack>
            )}
        </VStack>
    );
};
