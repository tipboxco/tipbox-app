import React, { useState, useEffect } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Platform } from 'react-native';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
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
import { ContextMenuReanimated } from '../PostCard/ContextMenuReanimated';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
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
import { useReportUser } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { Alert } from 'react-native';
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';


interface PostCardProps {
  data: ReviewCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
}

export const ExperiencePostCard = ({ data, hideProduct = false, isDetailMode = false }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const targetUserId = data.user.id;
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
  const { mutate: reportUser } = useReportUser();

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
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { postData: data, type: 'experience' },
    });
  };

  const handleViewProfile = React.useCallback(() => {
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  }, [data.user.id]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    Alert.alert(
      'Kullanıcıyı Raporla',
      'Bu kullanıcıyı raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => {
            reportUser({
              userId: user.id,
              targetUserId,
              data: {
                category: 'OTHER',
                description: 'Kullanıcı raporlandı',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      position="relative"
      mb={16}
    >
      {/* Action Button */}
      <Box
        position="absolute"
        top={12}
        right={15}
        zIndex={1}
      >
        <ContextMenuReanimated
          onViewProfile={handleViewProfile}
          onReport={handleReport}
        >
          <EllipsisHorizontalIcon width={20} height={20} color={isDark ? '#fff' : '#A3A3A3'} />
        </ContextMenuReanimated>
      </Box>

      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {toImageSource(data.user.avatar) && (
            <Pressable onPress={handleViewProfile}>
              <Image
                source={toImageSource(data.user.avatar)!}
                alt={data.user.name}
                mr={8}
                width={48}
                height={48}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleViewProfile}>
            <VStack flex={1}>
              <Text
                color={isDark ? '$textDark400' : '#C7C7C7'}
                fontSize={8}
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
                fontSize={9}
                numberOfLines={1}
                maxWidth={250}
              >
                {data.user.title}
              </Text>
            </VStack>
          </Pressable>
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
                // Product için BrandProductDetailScreen'e navigate et
                if (data.contextData?.id) {
                  navigationService.navigateNested(
                    TAB_ROUTES.CATALOG, 
                    'BrandProductDetailScreen' as any, 
                    { 
                      productId: data.contextData.id 
                    }
                  );
                }
              }}
            />
          </Box>
        )
      }

      {/* Content */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'experience' }
        });
      }}>
        <VStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          {data.content.map((item, index) => (
            <VStack key={index} py={8}>
              <HStack space="sm" alignItems="center">
                {item.tag.icon === 'tag' ? (
                  <TagIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                ) : (
                  <CubeIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                )}
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
                fontSize="$xs"
                ml={26}
              >
                {item.text}
              </Text>
              <HStack ml={26} mt={8}>
                {item.rating.map((star, idx) => (
                  star ? (
                    <StarIconSolid
                      key={idx}
                      width={12}
                      height={12}
                      color={isDark ? '#fff' : '#829905'}
                    />
                  ) : (
                    <StarIcon
                      key={idx}
                      width={12}
                      height={12}
                      color={isDark ? '#7E7E7E' : '#E8E8E8'}
                    />
                  )
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
              fontSize={8}
              fontWeight="$semibold"
            >
              {tag}
            </Text>
          </HStack>
        ))}
      </HStack>

      {data.images && data.images.length > 0 && (
        <Pressable
          onPress={() => {
            if (isDetailMode) return; // Detay modunda navigation yapma
            navigationService.navigate(ROOT_ROUTES.POST, {
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
      <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderBottomWidth={1} borderBottomRightRadius={5} borderBottomLeftRadius={5} borderColor="#E9E9E9"
      >
        <Pressable onPress={handleLike}>
        <HStack mr={10} alignItems="center">
            {isLiked ? (
              <HeartIconSolid width={24} height={24} color="#FF3040" />
            ) : (
              <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
            )}
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
              {likesCount}
            </Text>
        </HStack>
        </Pressable>
        <Pressable onPress={handleComment}>
        <HStack mr={10} alignItems="center">
          <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
              {commentsCount}
            </Text>
        </HStack>
        </Pressable>
        <Pressable onPress={handleShare}>
        <HStack mr={10} alignItems="center">
          <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
            <Text color={isDark ? '$textDark50' : '#000'} ml={4} fontSize={10}>
              {sharesCount}
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
              {bookmarksCount}
            </Text>
        </HStack>
        </Pressable>
      </HStack>
    </VStack>
  );
};

export default ExperiencePostCard;
