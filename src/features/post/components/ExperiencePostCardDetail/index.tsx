import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
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

interface ExperiencePostCardDetailProps {
    data: PostCardType;
    onCommentPress?: () => void;
}

export const ExperiencePostCardDetail = ({ data, onCommentPress }: ExperiencePostCardDetailProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
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
                            fontSize="$xs"
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
                            fontSize="$xs"
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
                            fontSize="$sm"
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
                            fontSize="$xs"
                            fontWeight="$semibold"
                        >
                            {tag}
                        </Text>
                    </HStack>
                ))}
            </HStack>

            {data.images?.length > 0 && (
                <VStack px={12} >
                    <CardImageCarousel images={data.images} paddingHorizontal={12} />
                </VStack>
            )}

            {/* Stats */}
            <HStack px={12} py={8}borderBottomWidth={1} borderColor="#E9E9E9">
                <Pressable onPress={handleLike}>
                    <HStack mr={10} alignItems="center">
                        <Feather
                            name="heart"
                            size={24}
                            color={isLiked ? '#FF3040' : isDark ? '#fff' : '#000'}
                            fill={isLiked ? '#FF3040' : 'none'}
                        />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
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
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                            {data.stats.comments}
                        </Text>
                    </HStack>
                </Pressable>
                <Pressable onPress={handleShare}>
                    <HStack mr={10} alignItems="center">
                        <Feather name="send" size={24} color={isDark ? '#fff' : '#000'} />
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
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
                        <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={'$2xs'}>
                            {data.stats.bookmarks}
                        </Text>
                    </HStack>
                </Pressable>
            </HStack>
        </VStack>
    );
};
