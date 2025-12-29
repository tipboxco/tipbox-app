import React, { useState, useEffect } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { ReviewCardData } from '@/src/types/ReviewsCard';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';


interface PostCardProps {
  data: ReviewCardData;
  hideProduct?: boolean;
}

export const ExperiencePostCard = ({ data, hideProduct = false }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const [isTranslated, setIsTranslated] = useState(false);
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

  const handleComment = () => {
    navigation.navigate('Post', {
      screen: 'PostDetailScreen',
      params: { postData: data, type: 'experience' },
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
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={config.tokens.radii['postcard'] as number} borderTopLeftRadius={config.tokens.radii['postcard'] as number} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {toImageSource(data.user.avatar) && (
            <Image
              source={toImageSource(data.user.avatar)!}
              alt={data.user.name}
              mr={8}
              width={48}
              height={48}
              borderRadius={100}
            />
          )}
          <VStack flex={1}>
            <Text
              color={isDark ? '$textDark400' : '#C7C7C7'}
              fontSize={config.tokens.fontSizes['4xs'] as number}
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
              fontSize={config.tokens.fontSizes['3xs'] as number}
              numberOfLines={1}
              maxWidth={250}
            >
              {data.user.title}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      {/* Product */}
      {
        !hideProduct && data.contextData && (
          <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <ProductInfoCard
              size="small"
              type={ProductInfoType.PRODUCT}
              image={toImageSource(data.contextData.image)}
              title={data.contextData.name}
              subName={data.contextData.subName}
              onPress={() => {
                navigation.navigate('Post', {
                  screen: 'PostDetailScreen',
                  params: { postData: data, type: 'experience' }
                });
              }}
            />
          </Box>
        )
      }

      {/* Content */}
      <Pressable onPress={() => {
        navigation.navigate('Post', {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'experience' }
        });
      }}>
        <VStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
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
                numberOfLines={data.images && data.images!.length > 0 ? 3 : 6}
                fontSize={'$2xs'}
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
      </Pressable>

      {/* Tags */}
      <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" flexWrap="wrap">
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
              fontSize={config.tokens.fontSizes['4xs'] as number}
              fontWeight="$semibold"
            >
              {tag}
            </Text>
          </HStack>
        ))}
      </HStack>

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
              fontSize={config.tokens.fontSizes['2xs'] as number}
              textDecorationLine="underline"
            >
              {isTranslated ? 'Automatically translated from English.' : 'Translate'}
            </Text>
          </HStack>
        </Pressable>
      </Box>

      {data.images && data.images.length > 0 && (
        <Pressable
          onPress={() => {
            navigation.navigate('Post', {
              screen: 'PostDetailScreen',
              params: { postData: data, type: 'experience' }
            });
          }}
        >
          <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <CardImageCarousel images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} />
          </VStack>
        </Pressable>
      )}
      {/* Stats */}
      <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderBottomWidth={1} borderBottomRightRadius={config.tokens.radii['postcard'] as number} borderBottomLeftRadius={config.tokens.radii['postcard'] as number} borderColor="#E9E9E9"
      >
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
        <Pressable onPress={handleComment}>
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

export default ExperiencePostCard;

