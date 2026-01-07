import React, { memo, useState, useEffect, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Divider } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { LegacyPostUser, PostCardData } from '@/src/types/PostCard';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  useSharePost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useAppStore } from '@/src/store/appStore';
import {
  useAddToTrustList,
  useRemoveFromTrustList,
  useReportUser,
  useUserProfile,
} from '@/src/features/profile/api/hooks';

interface PostCardProps {
  data: PostCardData;
  hideProduct?: boolean;
}

const PostCard = ({ data, hideProduct = false }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const [isTranslated, setIsTranslated] = useState(false);
  const [isLiked, setIsLiked] = useState(data.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(data.isBookmarked ?? false);
  const [isShared, setIsShared] = useState(data.isShared ?? false);
  
  // Animated counter states
  const [likesCount, setLikesCount] = useState(data.stats.likes);
  const [commentsCount, setCommentsCount] = useState(data.stats.comments);
  const [sharesCount, setSharesCount] = useState(data.stats.shares);
  const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);

  // User profile check
  const targetUserId = data.user.id;
  const isOwnProfile = user?.id === targetUserId;
  
  // User profile query (for trust status)
  const { data: userProfile } = useUserProfile(isOwnProfile ? undefined : targetUserId);
  
  // Interaction hooks
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const sharePostMutation = useSharePost();
  const { data: postStatus } = usePostStatus(data.id);
  
  // User action hooks
  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  const { mutate: reportUser, isPending: isReporting } = useReportUser();

  // Sync with post status from API
  useEffect(() => {
    if (postStatus) {
      setIsLiked(postStatus.liked);
      setIsBookmarked(postStatus.favorited);
      setIsShared(postStatus.shared);
    }
  }, [postStatus]);

  // Sync with data prop changes
  useEffect(() => {
    if (data.isLiked !== undefined) setIsLiked(data.isLiked);
    if (data.isBookmarked !== undefined) setIsBookmarked(data.isBookmarked);
    if (data.isShared !== undefined) setIsShared(data.isShared);
  }, [data.isLiked, data.isBookmarked, data.isShared]);

  // Sync stats with data prop changes
  useEffect(() => {
    setLikesCount(data.stats.likes);
    setCommentsCount(data.stats.comments);
    setSharesCount(data.stats.shares);
    setBookmarksCount(data.stats.bookmarks);
  }, [data.stats.likes, data.stats.comments, data.stats.shares, data.stats.bookmarks]);

  const avatarSource = toImageSource(data.user.avatar);

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
      params: { postData: data, type: 'post' },
    });
  };

  const handleAvatarPress = () => {
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  };

  // User actions menu handlers
  const handleViewProfile = useCallback(() => {
    closeBottomSheet();
    if (data.user.id) {
      navigationService.navigate(ROOT_ROUTES.PROFILE, {
        screen: 'ProfileMain',
        params: { userId: data.user.id },
      });
    }
  }, [closeBottomSheet, data.user.id]);

  const handleTrust = useCallback(() => {
    if (!targetUserId) return;
    closeBottomSheet();
    
    if (userProfile?.isTrusted) {
      untrustUser(targetUserId);
    } else {
      trustUser(targetUserId);
    }
  }, [targetUserId, userProfile?.isTrusted, trustUser, untrustUser, closeBottomSheet]);

  const handleReport = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    closeBottomSheet();
    
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
  }, [user?.id, targetUserId, reportUser, closeBottomSheet]);

  const handleBlock = useCallback(() => {
    if (!targetUserId) return;
    closeBottomSheet();
    
    Alert.alert(
      'Kullanıcıyı Engelle',
      'Bu kullanıcıyı engellemek istediğinizden emin misiniz? Engellediğiniz kullanıcı sizinle etkileşime geçemez.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
            console.log('[PostCard] Block user:', targetUserId);
          },
        },
      ]
    );
  }, [targetUserId, closeBottomSheet]);

  const handleMenuPress = useCallback(() => {
    if (!targetUserId) return;

    const menuContent = (
      <VStack bg={isDark ? '$backgroundDark900' : '$white'} pb={20}>
        {/* Profili Görüntüle */}
        <Pressable
          onPress={handleViewProfile}
          px={20}
          py={16}
        >
          <HStack alignItems="center" space="md">
            <Feather name="user" size={20} color={isDark ? '#fff' : '#000'} />
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize="$md"
              fontWeight="$medium"
            >
              Profili Görüntüle
            </Text>
          </HStack>
        </Pressable>

        {/* Kendi profili değilse diğer seçenekleri göster */}
        {!isOwnProfile && (
          <>
            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            
            {/* Trust/UnTrust */}
            <Pressable
              onPress={handleTrust}
              px={20}
              py={16}
              disabled={isTrusting || isUntrusting}
              opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
            >
              <HStack alignItems="center" space="md">
                <Feather
                  name={userProfile?.isTrusted ? 'user-minus' : 'user-plus'}
                  size={20}
                  color={isDark ? '#fff' : '#000'}
                />
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  {isTrusting ? 'Ekleniyor...' : isUntrusting ? 'Kaldırılıyor...' : (userProfile?.isTrusted ? 'Un Trust' : 'Trust')}
                </Text>
              </HStack>
            </Pressable>

            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            
            {/* Raporla */}
            <Pressable
              onPress={handleReport}
              px={20}
              py={16}
              disabled={isReporting}
              opacity={isReporting ? 0.6 : 1}
            >
              <HStack alignItems="center" space="md">
                <Feather name="flag" size={20} color={isDark ? '#fff' : '#000'} />
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  {isReporting ? 'Raporlanıyor...' : 'Raporla'}
                </Text>
              </HStack>
            </Pressable>

            <Divider bg={isDark ? '$backgroundDark800' : '#E9E9E9'} />
            
            {/* Engelle */}
            <Pressable
              onPress={handleBlock}
              px={20}
              py={16}
            >
              <HStack alignItems="center" space="md">
                <Feather name="slash" size={20} color="#FF3040" />
                <Text
                  color="#FF3040"
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  Engelle
                </Text>
              </HStack>
            </Pressable>
          </>
        )}
      </VStack>
    );

    openBottomSheet(menuContent, {
      enablePanDownToClose: true,
      enableDynamicSizing: true,
    });
  }, [targetUserId, isOwnProfile, isDark, userProfile, isTrusting, isUntrusting, isReporting, handleViewProfile, handleTrust, handleReport, handleBlock, openBottomSheet]);

  const hasContextData = !!data.contextType && !!data.contextData;
  const isProductContext = hasContextData && data.contextType === ProductInfoType.PRODUCT;
  const isGroupOrSubCategoryContext =
    hasContextData &&
    (data.contextType === ProductInfoType.PRODUCT_GROUP ||
      data.contextType === ProductInfoType.SUB_CATEGORY);

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      mb={16}
    >
      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {avatarSource && (
            <Pressable onPress={handleAvatarPress}>
              <Image
                source={avatarSource}
                alt={data.user.name}
                mr={8}
                width={42}
                height={42}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleAvatarPress}>
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
          </Pressable>
          <Pressable onPress={handleMenuPress}>
            <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
          </Pressable>
        </HStack>
      </VStack>

      {/* Product / Context Info */}
      {!hideProduct && isProductContext && data.contextData ? (
        (() => {
          const context = data.contextData;
          const imageSource = toImageSource(context.image)!;
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.PRODUCT}
                image={imageSource}
                title={context.name}
                subName={context.subName}
                onPress={() => {
                  navigation.navigate('Post', {
                    screen: 'PostDetailScreen',
                    params: {
                      postData: data,
                      type: 'post',
                    },
                  });
                }}
              />
            </Box>
          );
        })()
      ) : !hideProduct && isGroupOrSubCategoryContext && data.contextData ? (
        (() => {
          const context = data.contextData;
          const imageSource = toImageSource(context.image)!;
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={data.contextType === ProductInfoType.PRODUCT_GROUP
                  ? ProductInfoType.PRODUCT_GROUP
                  : ProductInfoType.SUB_CATEGORY}
                image={imageSource}
                title={context.name}
                subName={context.subName}
                onPress={() => {
                  // ProductGroup veya SubCategory için CatalogScreen'e navigate et
                  navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen' as any, undefined);
                }}
              />
            </Box>
          );
        })()
      ) : !hideProduct && data.category ? (
        (() => {
          const category = data.category;
          if (!category) return null;

          if (category.product) {
            const productImageSource = toImageSource(category.product.image);
            return (
              <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                <ProductInfoCard
                  size="small"
                  type={ProductInfoType.PRODUCT}
                  image={productImageSource}
                  title={category.product.name}
                  subName={category.product.subName}
                  onPress={() => {
                    // Product için BrandProductDetailScreen'e navigate et
                    if (category.product?.id) {
                      navigationService.navigateNested(
                        TAB_ROUTES.CATALOG, 
                        'BrandProductDetailScreen' as any, 
                        { 
                        productId: category.product.id 
                        }
                      );
                    }
                  }}
                />
              </Box>
            );
          }

          const categoryImageSource = toImageSource(category.image);
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.SUB_CATEGORY}
                image={categoryImageSource}
                title={category.name}
                subName={category.subCategory}
                onPress={() => {
                  // Category için CatalogScreen'e navigate et
                  navigationService.navigateNested(TAB_ROUTES.CATALOG, 'CatalogScreen' as any, undefined);
                }}
              />
            </Box>
          );
        })()
      ) : null}

      {/* Content */}
      <Pressable onPress={() => {
        navigation.navigate('Post', {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'post' }
        });
      }}>
        <VStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$sm"
            numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

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
              fontSize="$sm"
              textDecorationLine="underline"
            >
              {isTranslated ? 'Automatically translated from English.' : 'Translate'}
            </Text>
          </HStack>
        </Pressable>
      </Box>

      {/* Images */}
      {
        data.images && data.images?.length > 0 && (
          <Pressable
            onPress={() => {
              navigation.navigate('Post', {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'post' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={data.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)} />
            </VStack>
          </Pressable>
        )
      }

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
                name={isLiked ? 'heart' : 'heart'}
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
    </VStack >
  );
};

export default memo(PostCard);

