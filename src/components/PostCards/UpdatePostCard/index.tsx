import React, { memo, useState, useEffect, useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Divider } from '@gluestack-ui/themed';
import { View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager, Platform, Keyboard } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
} from 'react-native-heroicons/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from 'react-native-heroicons/solid';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import CardImageCarousel from '../../CardImageCarousel';
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import { toImageSource } from '@/src/utils';
import {
  useLikePost,
  useUnlikePost,
  useBookmarkPost,
  useUnbookmarkPost,
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useReportUser } from '@/src/features/profile/api/hooks';
import type { UserReportCategory } from '@/src/features/profile/api/profileApi';
import { useAppStore } from '@/src/store/appStore';
import { Alert } from 'react-native';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { usePostShare } from '@/src/features/post/components/PostShareBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

interface UpdatePostCardProps {
  data: UpdateCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
  showRelatedPost?: boolean;
  relatedPostData?: any;
}

const UpdatePostCard = ({ data, hideProduct = false, isDetailMode = false, showRelatedPost, relatedPostData }: UpdatePostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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
  const { data: postStatus } = usePostStatus(data.id);
  const { openBottomSheet } = useGlobalBottomSheet();
  const { openPostShareSheet } = usePostShare();
  const insets = useSafeAreaInsets();
  const { mutate: reportUser } = useReportUser();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

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

  // Product'ı relatedPost.product'tan al (null check ile)
  const product = data.relatedPost?.product;
  
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
    // Share işlemini her zaman aç - kullanıcı istediği kadar share edebilsin
    openPostShareSheet({
      postId: data.id,
      postContent: data.content,
      postAuthorName: data.user?.name,
      onShareSuccess: () => {
        setIsShared(true);
        setSharesCount((prev) => prev + 1);
      },
    });
  };

  const handleComment = () => {
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { 
        postData: data, 
        type: 'update',
        showRelatedPost: true,
        relatedPostData: data.relatedPost,
      },
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

  // Report categories with labels
  const reportCategories = React.useMemo<Array<{ value: UserReportCategory; label: string }>>(() => [
    { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Harassment' },
    { value: 'SCAM', label: 'Scam' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
    { value: 'FAKE_ACCOUNT', label: 'Fake Account' },
    { value: 'OTHER', label: 'Other' },
  ], []);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    const username = data.user?.name || 'User';
    
    // Report category seçimi için alert
    Alert.alert(
      'Report User',
      `Why are you reporting ${username}?`,
      [
        ...reportCategories.map((category) => ({
          text: category.label,
          onPress: () => {
            // Seçilen kategori ile raporla
            reportUser(
              {
                userId: user.id,
                targetUserId,
                data: {
                  category: category.value,
                  description: `Reported for: ${category.label}`,
                },
              },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'User reported successfully. Thank you for your review.');
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || 'Failed to report user';
                  Alert.alert('Error', errorMessage);
                },
              }
            );
          },
        })),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, targetUserId, reportUser, reportCategories, data.user?.name]);

  // Post owner actions
  const handleUpdate = React.useCallback(() => {
    // CreateUpdatePostScreen'e yönlendir - update post'u düzenleme modu
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateUpdatePostScreen',
      params: {
        postId: data.id, // Update modu için post ID
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.subName,
          image: toImageSource(product.image),
        } : undefined,
      },
    });
  }, [data, product]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      'Post\'u Sil',
      'Bu post\'u silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              Alert.alert('Success', 'Post deleted successfully.');
            } catch (error: any) {
              Alert.alert(
                'Hata',
                error.response?.data?.message || 'Post silinirken bir hata oluştu.'
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation]);

  // CRITICAL FIX: onLayout ile pozisyonu sürekli güncelle
  const handleTriggerLayout = React.useCallback(() => {
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          triggerPositionRef.current = { x, y, width, height };
        }
      });
    }
  }, []);

  // Calculate menu position - event koordinatlarını öncelikli kullan
  const handleMenuOpen = React.useCallback((event?: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const menuWidth = 140;
    const menuHeight = isPostOwner ? 80 : 80;
    
    const calculatePosition = (x: number, y: number, width: number, height: number, source: string) => {
      let left = x + width - menuWidth - 20;
      let top = y + height - 16;
      
      if (left < 12) {
        left = 12;
      }
      if (left + menuWidth > screenWidth - 12) {
        left = screenWidth - menuWidth - 12;
      }
      if (top < 12) {
        top = 12;
      }
      if (top + menuHeight > screenHeight - 12) {
        top = y - menuHeight - 8;
        if (top < 12) {
          top = 12;
        }
      }
      
      return { top, left };
    };

    // ÖNCELİK 1: Event'ten gelen koordinatları kullan
    if (event?.nativeEvent?.pageX !== undefined && event?.nativeEvent?.pageY !== undefined) {
      const pageX = event.nativeEvent.pageX;
      const pageY = event.nativeEvent.pageY;
      const triggerWidth = 44;
      const triggerHeight = 44;
      const triggerX = pageX - triggerWidth / 2;
      const triggerY = pageY - triggerHeight / 2;
      const position = calculatePosition(triggerX, triggerY, triggerWidth, triggerHeight, 'event-coordinates');
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 2: Stored position'ı kullan
    if (triggerPositionRef.current) {
      const stored = triggerPositionRef.current;
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height, 'stored');
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 3: measureInWindow ile ölç
    InteractionManager.runAfterInteractions(() => {
      if (menuTriggerRef.current) {
        menuTriggerRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0 && x >= 0 && y >= 0) {
            triggerPositionRef.current = { x, y, width, height };
            const position = calculatePosition(x, y, width, height, 'measureInWindow');
            setMenuPosition(position);
            setIsMenuOpen(true);
          } else {
            setMenuPosition({ top: 40, left: screenWidth - 152 });
            setIsMenuOpen(true);
          }
        });
      } else {
        setMenuPosition({ top: 40, left: screenWidth - 152 });
        setIsMenuOpen(true);
      }
    });
  }, [isPostOwner]);

    return (
        <View
            style={{
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                marginBottom: 16,
                position: 'relative',
            }}
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
          {data.user && toImageSource(data.user.avatar) && (
            <Pressable onPress={handleViewProfile}>
              <Image
                source={toImageSource(data.user.avatar)!}
                alt={data.user?.name || 'User'}
                mr={8}
                width={42}
                height={42}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleViewProfile}>
            <VStack
              flex={1}
              justifyContent="center"
            >
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {data.user?.name || 'Unknown User'}
              </Text>
              {data.user?.title ? (
                <Text
                  color={isDark ? '$textDark400' : '#787878'}
                  fontSize={11}
                  numberOfLines={1}
                  maxWidth={250}
                >
                  {data.user.title}
                </Text>
              ) : null}
            </VStack>
          </Pressable>
          <View 
            ref={menuTriggerRef} 
            collapsable={false}
            onLayout={handleTriggerLayout}
          >
            <Pressable onPress={(event) => handleMenuOpen(event)}>
              <EllipsisHorizontalIcon width={24} height={24} color={isDark ? '#fff' : '#A3A3A3'} />
            </Pressable>
          </View>
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
              // Context'e göre PostsScreen'e navigate et
              if (!product.id || !data.contextType) return;
              
              const stage = data.contextType === ProductInfoType.PRODUCT_GROUP 
                ? 'ProductGroup' 
                : data.contextType === ProductInfoType.SUB_CATEGORY
                ? 'SubCategories'
                : 'Product';
              
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostsScreen',
                params: {
                  stage,
                  name: product.name,
                  productInfo: {
                    image: toImageSource(product.image),
                    title: product.name,
                    subName: product.subName,
                  },
                  ...(data.contextType === ProductInfoType.PRODUCT && {
                    selectedProduct: {
                      id: product.id,
                      name: product.name,
                      description: product.subName,
                      image: toImageSource(product.image),
                    },
                  }),
                  contextType: data.contextType,
                  contextId: product.id,
                },
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
          <InformationCircleIcon width={12} height={12} color={'#fff'} />
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
          if (isDetailMode) return; // Detay modunda navigation yapma
          // Navigate to PostDetailScreen
          navigationService.navigate(ROOT_ROUTES.POST, {
            screen: 'PostDetailScreen',
            params: { 
              postData: data, 
              type: 'update',
              showRelatedPost: true,
              relatedPostData: data.relatedPost,
            }
          });
        }}>
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$sm"
            lineHeight={18}
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </Pressable>

        {/* See Related Post Button - Sadece feed'de göster (detay ekranında showRelatedPost true olduğu için gerek yok) */}
        {!isDetailMode && data.relatedPost && (
          <Pressable 
            onPress={() => {
              // Detay sayfasına yönlendir (related post detay sayfasında açılacak)
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                  showRelatedPost: true,
                  relatedPostData: data.relatedPost,
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
      {(() => {
        const validImages = data.images?.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) || [];
        if (validImages.length === 0) return null;
        return (
          <Pressable
            onPress={() => {
              if (isDetailMode) return; // Detay modunda navigation yapma
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { 
                  postData: data, 
                  type: 'update',
                  showRelatedPost: true,
                  relatedPostData: data.relatedPost,
                }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} />
            </VStack>
          </Pressable>
        );
      })()}

      {/* Related Post Details - Sadece detay sayfasında gösterilecek (showRelatedPost === true) */}
      {showRelatedPost && (data.relatedPost || relatedPostData) && (
        <>
          {/* Related Post Title */}
          <VStack px={12} pt={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
            <Text
              color={isDark ? '$textDark50' : '#A3A3A3'}
              fontSize="$sm"
              fontWeight="$bold"
              textDecorationLine="underline"
            >
              Related Post
            </Text>
          </VStack>

          {/* Product Info Card */}
          {(relatedPostData?.product || data.relatedPost?.product) && (
            <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                image={toImageSource((relatedPostData?.product || data.relatedPost?.product)?.image)}
                title={(relatedPostData?.product || data.relatedPost?.product)?.name || ''}
                subName={(relatedPostData?.product || data.relatedPost?.product)?.subName}
                size="big"
                type={ProductInfoType.PRODUCT}
                isOwned={(relatedPostData?.product || data.relatedPost?.product)?.isOwned || false}
              />
            </VStack>
          )}

          {/* Content Cards - Experience post content */}
          {((relatedPostData?.content && Array.isArray(relatedPostData.content) && relatedPostData.content.length > 0) || 
            (data.relatedPost?.content && Array.isArray(data.relatedPost.content) && data.relatedPost.content.length > 0)) && (
            <VStack px={16} space="md" borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              {(
                (Array.isArray(relatedPostData?.content) && relatedPostData.content.length > 0) 
                  ? relatedPostData.content 
                  : (Array.isArray(data.relatedPost?.content) ? data.relatedPost.content : [])
              ).map((contentItem: any, index: number) => (
                <Box
                  key={index}
                  bg={isDark ? '$backgroundDark800' : '#FAFAFA'}
                  borderRadius={10}
                  overflow="hidden"
                >
                  {/* Card Header - Başlık ve Content aynı hizada */}
                  <HStack px={16} py={8} alignItems="flex-start" space="sm">
                    <Box
                      width={18}
                      height={18}
                      borderRadius={9}
                      bg={isDark ? '#571FDD' : '#571FDD'}
                      alignItems="center"
                      justifyContent="center"
                      mt={2}
                    >
                      <Text color="#FFFFFF" fontSize={10} fontWeight="$bold">
                        {contentItem.tag?.icon === 'tag' ? 'T' : 'C'}
                      </Text>
                    </Box>
                    <VStack flex={1} space="xs">
                      <Text
                        fontSize={11}
                        fontWeight="$semibold"
                        color={isDark ? '$textDark50' : '#3B3B3B'}
                      >
                        {contentItem.tag?.title || 'Experience'}
                      </Text>
                      <Text
                        color={isDark ? '$textDark50' : '#000000'}
                        fontSize="$sm"
                        lineHeight={18}
                      >
                        {contentItem.text}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Rating Section */}
                  {contentItem.rating && Array.isArray(contentItem.rating) && (
                    <HStack px={16} pb={12} alignItems="flex-start" space="sm">
                      <Box width={18} />
                      <VStack flex={1} space="xs">
                        <Text
                          fontSize={11}
                          fontWeight="$semibold"
                          color={isDark ? '$textDark50' : '#3B3B3B'}
                        >
                          Rate Experience
                        </Text>
                        <HStack space="xs">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const rating = contentItem.rating || [];
                            const isFilled = star <= rating.filter((r: number) => r === 1).length;
                            return (
                              <Box key={star}>
                                <Text color={isFilled ? '#829905' : '#E9E9E9'} fontSize={16}>
                                  ★
                                </Text>
                              </Box>
                            );
                          })}
                        </HStack>
                      </VStack>
                    </HStack>
                  )}
                </Box>
              ))}
            </VStack>
          )}

          {/* Tags Section */}
          {((relatedPostData?.tags && Array.isArray(relatedPostData.tags) && relatedPostData.tags.length > 0) || 
            (data.relatedPost?.tags && Array.isArray(data.relatedPost.tags) && data.relatedPost.tags.length > 0)) && (
            <HStack px={16} py={10} flexWrap="wrap" gap={4} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              {(
                (Array.isArray(relatedPostData?.tags) && relatedPostData.tags.length > 0) 
                  ? relatedPostData.tags 
                  : (Array.isArray(data.relatedPost?.tags) ? data.relatedPost.tags : [])
              ).map((tag: string, index: number) => (
                <Box
                  key={index}
                  bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                  borderWidth={1}
                  borderColor="#EFEFEF"
                  borderRadius={10}
                  px={12}
                  py={3}
                >
                  <Text
                    fontSize="$xs"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark50' : '#000000'}
                  >
                    {tag}
                  </Text>
                </Box>
              ))}
            </HStack>
          )}

          {/* Related Post Images */}
          {((relatedPostData?.images && Array.isArray(relatedPostData.images) && relatedPostData.images.length > 0) ||
            (data.relatedPost?.images && Array.isArray(data.relatedPost.images) && data.relatedPost.images.length > 0)) && (
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel 
                images={(
                  (Array.isArray(relatedPostData?.images) && relatedPostData.images.length > 0)
                    ? relatedPostData.images.map((img: any) => toImageSource(img)).filter((img: any): img is NonNullable<typeof img> => !!img)
                    : (Array.isArray(data.relatedPost?.images) 
                        ? data.relatedPost.images.map((img: any) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
                        : [])
                )}
              />
            </VStack>
          )}
        </>
      )}

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
              {isLiked ? (
                <HeartIconSolid width={24} height={24} color="#FF3040" />
              ) : (
                <HeartIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              )}
              <AnimatedCounter
                value={likesCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
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
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
          <Pressable onPress={handleShare}>
            <HStack mr={10} alignItems="center">
              <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
              <AnimatedCounter
                value={sharesCount}
                color={isDark ? '$textDark50' : '#000'}
                fontSize={10}
                ml={4}
              />
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
                fontSize={10}
                ml={4}
              />
            </HStack>
          </Pressable>
        </HStack>
        </HStack>

      {/* Menu Modal - HStack dışında, diğer post tipleri gibi RN Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <RNPressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]}
          onPress={() => setIsMenuOpen(false)}
        />
        <View
          style={[
            styles.menuContainer,
            {
              top: menuPosition.top,
              left: menuPosition.left,
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#333333' : '#E9E9E9',
              shadowOpacity: isDark ? 0.3 : 0.1,
              zIndex: 1,
              elevation: 10,
            }
          ]}
        >
          <RNPressable
            onPress={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          >
            <VStack px={12} py={8} width="100%">
              {isPostOwner ? (
                <>
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <TrashIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        Delete
                      </Text>
                    </HStack>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleViewProfile();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <UserIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        View Profile
                      </Text>
                    </HStack>
                  </Pressable>
                  <Divider
                    bg={isDark ? '#333333' : '#E9E9E9'}
                    mx={0}
                  />
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleReport();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <FlagIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        Report
                      </Text>
                    </HStack>
                  </Pressable>
                </>
              )}
            </VStack>
          </RNPressable>
        </View>
      </Modal>
    </View>
    );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    width: 140,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    overflow: 'hidden',
  },
});

export default memo(UpdatePostCard);

