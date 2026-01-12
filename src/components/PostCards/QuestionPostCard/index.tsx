import React, { useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Platform } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
} from 'react-native-heroicons/outline';
import { PostContextMenu } from '@/src/components/PostContextMenu';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
import { QuestionPost } from '@/src/mock/profile/questions/types';
import type { QuestionCardData } from '@/src/types/QuestionCard';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
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
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

interface QuestionPostCardProps {
  data: QuestionPost | QuestionCardData; // Accept both types for compatibility
  hideProduct?: boolean;
}

export const QuestionPostCard = ({ data, hideProduct = false }: QuestionPostCardProps) => {
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
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { postData: data, type: 'question' },
    });
  };

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
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
          <PostContextMenu
            postId={data.id}
            postContent={data.content}
            postAuthorName={data.user.name}
          >
            <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
          </PostContextMenu>
        </HStack>
      </VStack>

      {/* Product */}
      {
        !hideProduct && data.category && data.category.product ? (
          <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <ProductInfoCard
              size="small"
              type={ProductInfoType.PRODUCT}
              image={toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png')}
              title={data.category.product.name}
              subName={data.category.product.subName}
              onPress={() => {
                // Product için BrandProductDetailScreen'e navigate et
                if (data.category?.product?.id) {
                  navigationService.navigateNested(TAB_ROUTES.CATALOG, 'BrandProductDetailScreen', { 
                    productId: data.category.product.id 
                  });
                }
              }}
            />
          </Box>
        ) : !hideProduct && data.category ? (
          <Box px={12} py={8} borderTopWidth={1} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <ProductInfoCard
              size="small"
              type={ProductInfoType.SUB_CATEGORY}
              image={toImageSource(data.category.image) || require('@/assets/inventory/product_01.png')}
              title={data.category.name}
              subName={data.category.subCategory}
              onPress={() => {
                // Category için CatalogScreen'e navigate et
                navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen', undefined);
              }}
            />
          </Box>
        ) : null
      }

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={2}
          borderColor="#B8CC04"
          bgColor="#758600"
          borderRadius={20}
          width={90}
          px={10}
          py={6}
          mr={16}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <QuestionMarkCircleIcon width={12} height={12} color={'#fff'} />
          <Text
            fontSize={8}
            fontWeight="$semibold"
            ml={5}
            color={'#fff'}
          >
            Question
          </Text>
        </Box>

        {data.isBoosted && (
          <Box
            bgColor="#E0195B"
            borderWidth={2}
            borderColor="#EF4D81"
            borderRadius={20}
            width={90}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-evenly"
          >
            <PaperAirplaneIcon width={12} height={12} color="#fff" />
            <Text
              fontSize={8}
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
      <Pressable onPress={() => {
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'question' }
        });
      }}>
        <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$xs"
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <Pressable
          onPress={() => {
            navigationService.navigate(ROOT_ROUTES.POST, {
              screen: 'PostDetailScreen',
              params: { postData: data, type: 'question' }
            });
          }}
        >
          <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <CardImageCarousel 
              images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} 
            />
          </VStack>
        </Pressable>
      )}

      {/* Stats */}
      <HStack
        px={12}
        py={10}
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
              {isLiked ? (
                <HeartIconSolid width={24} height={24} color="#FF3040" />
              ) : (
                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
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
            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
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
            <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
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
export default React.memo(QuestionPostCard);

