import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BenchmarkPost, BenchmarkProduct } from '@/src/mock/profile/benchmark/types';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
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

interface BenchmarkPostCardDetailProps {
    data: BenchmarkPost;
    onCommentPress?: () => void;
}

const renderProduct = ({ product, isDark }: { product: BenchmarkProduct; isDark: boolean; }) => {
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
                    fontSize="$xs"
                    fontWeight="$bold"
                >
                    {product.name}
                </Text>
                <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize="$xs"
                    fontWeight="$semibold"
                >
                    {product.subName}
                </Text>
            </VStack>
        </VStack>
    </HStack>
    );
};

export const BenchmarkPostCardDetail = ({ data, onCommentPress }: BenchmarkPostCardDetailProps) => {
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
                            fontSize="$xs"
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

            {/* Product Comparison */}
            <VStack px={12} pb={8} >
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
