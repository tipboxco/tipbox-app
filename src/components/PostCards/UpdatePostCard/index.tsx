import React, { memo, useState, useEffect } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { UpdateCardData } from '@/src/types/UpdateCard';
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

interface UpdatePostCardProps {
  data: UpdateCardData;
  hideProduct?: boolean;
}

const UpdatePostCard = ({ data, hideProduct = false }: UpdatePostCardProps) => {
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

  // Product'ı relatedPost.product'tan al
  const product = data.relatedPost.product;
  
  // ContextType'a göre ProductInfoType belirle
  const productInfoType = data.contextType || ProductInfoType.PRODUCT;

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
      params: { postData: data, type: 'update' },
    });
  };

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Header */}
      <VStack 
        px={12} 
        py={8} 
        borderWidth={1} 
        borderTopRightRadius={5} 
        borderTopLeftRadius={5} 
        borderColor="#E9E9E9"
      >
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

      {/* Product */}
      {!hideProduct && product && (
        <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <ProductInfoCard
            size="small"
            type={productInfoType}
            image={toImageSource(product.image)}
            title={product.name}
            subName={product.subName}
            isOwned={product.isOwned}
            onPress={() => {
              navigation.navigate('Post', {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'update' }
              });
            }}
          />
        </Box>
      )}

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 10 : 2} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" justifyContent="space-between" alignItems="center">
        <Box
          borderWidth={1}
          borderColor="#9672FA"
          bgColor="#571FDD"
          borderRadius={20}
          flexDirection="row"
          justifyContent="center"
          px='$3'
          py='$2'
        >
          <Feather name="info" size={12} color={'#fff'} />
          <Text
            fontSize={9}
            fontWeight="$bold"
            ml={5}
            color={'#fff'}
          >
            Update
          </Text>
        </Box>
      </HStack>

      {/* Content */}
      <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Pressable onPress={() => {
          // Navigate to PostDetailScreen
          navigation.navigate('Post', {
            screen: 'PostDetailScreen',
            params: { 
              postData: data, 
              type: 'update',
            }
          });
        }}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={10}
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </Pressable>

        {/* See Related Post Button - Detay sayfasına yönlendirir */}
        {data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Detay sayfasına yönlendir (related post detay sayfasında açılacak)
              navigation.navigate('Post', {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                }
              });
            }} 
            mt={10}
          >
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize={10}
              textDecorationLine="underline"
              fontWeight="$bold"
            >
              See Related Post {'>'}
            </Text>
          </Pressable>
        )}
      </VStack>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <Pressable
          onPress={() => {
            navigation.navigate('Post', {
              screen: 'PostDetailScreen',
              params: { postData: data, type: 'update' }
            });
          }}
        >
          <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <CardImageCarousel images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} />
          </VStack>
        </Pressable>
      )}

      {/* Related Post Details - Sadece detay sayfasında gösterilecek, burada render edilmiyor */}

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

export default memo(UpdatePostCard);

