import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Switch } from '@gluestack-ui/themed';
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
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
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { useTogglePostBoost } from '@/src/features/post/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { Alert } from 'react-native';
import { useTranslation } from '@/src/hooks/useTranslation';

interface QuestionPostCardDetailProps {
    data: QuestionPost;
    onCommentPress?: () => void;
}

export const QuestionPostCardDetail = ({ data, onCommentPress }: QuestionPostCardDetailProps) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { user } = useAppStore();
    const targetUserId = data.user.id;
    const isPostOwner = user?.id && targetUserId && user.id === targetUserId;

    // Translation hooks
    const {
        translatedContent,
        isTranslating,
        showTranslation,
        toggleTranslation,
        shouldTranslate,
    } = usePostTranslation({
        postId: data.id,
        originalContent: data.content,
    });
    
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    // Boost state
    const [isBoosted, setIsBoosted] = useState(data.isBoosted || false);
    const [boostPrice, setBoostPrice] = useState(data.boostPrice);

    // Interaction hooks
    const likePostMutation = useLikePost();
    const unlikePostMutation = useUnlikePost();
    const bookmarkPostMutation = useBookmarkPost();
    const unbookmarkPostMutation = useUnbookmarkPost();
    const sharePostMutation = useSharePost();
    const { data: postStatus } = usePostStatus(data.id);
    const { openBottomSheet } = useGlobalBottomSheet();
    const toggleBoostMutation = useTogglePostBoost();

    // Sync with post status from API
    useEffect(() => {
        if (postStatus) {
            setIsLiked(postStatus.liked);
            setIsBookmarked(postStatus.favorited);
            setIsShared(postStatus.shared);
        }
    }, [postStatus]);

    // Sync boost state with data prop changes
    useEffect(() => {
        setIsBoosted(data.isBoosted || false);
        setBoostPrice(data.boostPrice);
    }, [data.isBoosted, data.boostPrice]);

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
        // Context bilgilerini data'dan al
        const contextType = (data as any).contextType;
        const contextId = (data as any).contextId || (data as any).product?.id;
        
        openBottomSheet(
            <PostOptionsMenu
                postId={data.id}
                postContent={data.content}
                postAuthorName={data.user.name}
                postAuthorId={data.user.id}
                postType="question"
                postContextType={contextType}
                postContextId={contextId}
            />
        );
    };

    // Boost toggle handler
    const handleBoostToggle = React.useCallback((value: boolean) => {
        // Optimistic update
        setIsBoosted(value);
        
        toggleBoostMutation.mutate(
            { postId: data.id, enabled: value },
            {
                onSuccess: (response) => {
                    // Backend'den gelen güncel değerleri ayarla
                    setIsBoosted(response.isBoosted);
                    setBoostPrice(response.boostPrice);
                    
                    Alert.alert(
                        'Başarılı',
                        value 
                            ? `Boost aktif edildi${response.boostPrice ? `. Maliyet: ${response.boostPrice} TIPS` : ''}` 
                            : 'Boost devre dışı bırakıldı.'
                    );
                },
                onError: (error: any) => {
                    // Hata durumunda geri al
                    setIsBoosted(!value);

                    const errorMessage = error?.response?.data?.message || error?.message || t('screens.posts.errors.boostError');
                    Alert.alert('Error', errorMessage);
                },
            }
        );
    }, [data.id, toggleBoostMutation]);

    return (
        <VStack
            bg={isDark ? '$backgroundDark900' : '$white'}
            mb={16}
        >
            {/* Header */}
            <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                <HStack alignItems="center" space="xs">
                    <Image
                        source={toImageSource(data.user.avatar)!}
                        alt={t('altTexts.userPostImage')}
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
                    <QuestionMarkCircleIcon width={12} height={12} color="#fff" />
                    <Text
                        fontSize="$xs"
                        fontWeight="$semibold"
                        ml={5}
                        color={'#fff'}
                    >
                        Question
                    </Text>
                </Box>

                {isBoosted && (
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
                        <Image
                            source={require('@/assets/boost.svg')}
                            alt={t('altTexts.productImage')}
                            width={12}
                            height={12}
                        />
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

            {/* Boost Switch - Sadece post owner'a göster */}
            {isPostOwner && (
                <VStack 
                    px={12} 
                    py={12} 
                    space="xs"
                >
                    <HStack alignItems="center" justifyContent="space-between">
                        <VStack flex={1} mr={12}>
                            <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$sm"
                                fontWeight="$semibold"
                                mb={4}
                            >
                                Boost Post
                            </Text>
                            <Text
                                color={isDark ? '$textDark400' : '#787878'}
                                fontSize={11}
                                lineHeight={14}
                            >
                                {isBoosted 
                                    ? `Aktif${boostPrice ? ` - ${boostPrice} TIPS` : ''}` 
                                    : 'Sorunuzun daha fazla kişiye ulaşmasını sağlayın'}
                            </Text>
                        </VStack>
                        <Switch
                            value={isBoosted}
                            onValueChange={handleBoostToggle}
                            trackColor={{ 
                                false: isDark ? '#333333' : '#E9E9E9', 
                                true: '#829905' 
                            }}
                            thumbColor={isBoosted ? '#B8CC04' : (isDark ? '#666666' : '#FFFFFF')}
                            disabled={toggleBoostMutation.isPending}
                        />
                    </HStack>
                    {boostPrice !== undefined && (
                        <Text
                            color={isDark ? '$textDark400' : '#787878'}
                            fontSize={10}
                            fontStyle="italic"
                        >
                            * Boost fiyatı platform aktivitesine göre belirlenir
                        </Text>
                    )}
                </VStack>
            )}

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
                                    ? t('card.translate.translating')
                                    : showTranslation
                                    ? t('card.translate.hideTranslation')
                                    : t('card.translate.translate')}
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
                            {isLiked ? (
                                <HeartIconSolid width={24} height={24} color="#FF3040" />
                            ) : (
                                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            )}
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
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
                            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                {data.stats.comments}
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable onPress={handleShare}>
                        <HStack mr={10} alignItems="center">
                            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                {data.stats.shares}
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
                            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
                                {data.stats.bookmarks}
                            </Text>
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
