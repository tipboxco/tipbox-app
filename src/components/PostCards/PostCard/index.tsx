import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Divider } from '@gluestack-ui/themed';
import { Alert, Platform, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager, Keyboard } from 'react-native';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
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
  usePostStatus,
} from '@/src/features/interactions/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import {
  useReportUser,
} from '@/src/features/profile/api/hooks';
import type { UserReportCategory } from '@/src/features/profile/api/profileApi';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { usePostShare } from '@/src/features/post/components/PostShareBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PostCardProps {
  data: PostCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
}

const PostCard = ({ data, hideProduct = false, isDetailMode = false }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  
  const [isLiked, setIsLiked] = useState(data.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(data.isBookmarked ?? false);
  const [isShared, setIsShared] = useState(data.isShared ?? false);
  
  // Animated counter states
  const [likesCount, setLikesCount] = useState(data.stats.likes);
  const [commentsCount, setCommentsCount] = useState(data.stats.comments);
  const [sharesCount, setSharesCount] = useState(data.stats.shares);
  const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // User profile check
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  
  // Interaction hooks
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const unbookmarkPostMutation = useUnbookmarkPost();
  const { data: postStatus } = usePostStatus(data.id);
  
  // User action hooks
  const { mutate: reportUser } = useReportUser();
  const { openBottomSheet } = useGlobalBottomSheet();
  const insets = useSafeAreaInsets();
  const { openPostShareSheet } = usePostShare();
  
  // Post owner actions
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

  const handleShare = useCallback(() => {
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
  }, [data.id, data.content, data.user?.name, openPostShareSheet]);

  const handleComment = () => {
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
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

  const handleReport = useCallback(() => {
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

  const handleBlock = useCallback(() => {
    if (!targetUserId) return;
    
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
          },
        },
      ]
    );
  }, [targetUserId]);

  // Post owner actions
  const handleUpdate = useCallback(() => {
    // Context bilgilerini data'dan al
    const contextType = (data as any).contextType;
    const contextId = (data as any).contextId || (data.contextData?.id);
    const postType = (data as any).type || 'post';
    
    // PostOptionsMenu'yu bottom sheet olarak aç
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content || (data as any).description}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType={postType}
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  }, [data, openBottomSheet]);

  const handleDelete = useCallback(() => {
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

  // Calculate menu position
  // CRITICAL FIX: onLayout ile pozisyonu sürekli güncelle
  const handleTriggerLayout = useCallback(() => {
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          triggerPositionRef.current = { x, y, width, height };
        }
      });
    }
  }, []);

  // Calculate menu position - event koordinatlarını öncelikli kullan
  const handleMenuOpen = useCallback((event?: any) => {
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

  const hasContextData = !!data.contextType && !!data.contextData;
  const isProductContext = hasContextData && data.contextType === ProductInfoType.PRODUCT;
  const isGroupOrSubCategoryContext =
    hasContextData &&
    (data.contextType === ProductInfoType.PRODUCT_GROUP ||
      data.contextType === ProductInfoType.SUB_CATEGORY);

  const isBoosted = data.source === 'BOOSTED';

  return (
    <View
      style={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        marginBottom: 16,
        position: 'relative',
      }}
    >
      {/* Header */}
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
        <HStack alignItems="center" space="xs">
          {avatarSource && (
            <Pressable onPress={handleAvatarPress}>
              <Image
                source={avatarSource}
                alt={data.user?.name || 'User'}
                mr={8}
                width={42}
                height={42}
                borderRadius={100}
              />
            </Pressable>
          )}
          <Pressable flex={1} onPress={handleAvatarPress}>
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

          {/* Menu Modal */}
          <Modal
            visible={isMenuOpen}
            transparent={true}
            animationType="fade"
            presentationStyle="overFullScreen"
            onRequestClose={() => setIsMenuOpen(false)}
          >
            <RNPressable
              style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
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
                      {/* Update butonu kaldırıldı - Sadece experience post'larda update var */}
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
        </HStack>
      </VStack>

      {/* Product / Context Info */}
      {!hideProduct && isProductContext && data.contextData ? (
        (() => {
          const context = data.contextData;
          // Güvenli image source - undefined ise ProductInfoCard kendi default'unu kullanacak
          const imageSource = context.image || require('@/assets/product/product_01.png');
          return (
            <Box px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.PRODUCT}
                image={imageSource}
                title={context.name}
                subName={context.subName}
                onPress={() => {
                  // Product için PostsScreen'e navigate et
                  if (!context.id || !data.contextType) {
                    return;
                  }
                  
                  navigationService.navigate(ROOT_ROUTES.POST, {
                    screen: 'PostsScreen',
                    params: {
                      stage: 'Product',
                      name: context.name,
                      productInfo: {
                        image: imageSource,
                        title: context.name,
                        subName: context.subName,
                      },
                      selectedProduct: {
                        id: context.id,
                        name: context.name,
                        description: context.subName,
                        image: imageSource,
                      },
                      contextType: data.contextType,
                      contextId: context.id,
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
          // Güvenli image source - undefined ise ProductInfoCard kendi default'unu kullanacak
          const imageSource = context.image || require('@/assets/product/product_01.png');
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
                  // ProductGroup veya SubCategory için PostsScreen'e navigate et
                  if (!context.id || !data.contextType) {
                    return;
                  }
                  
                  const stage = data.contextType === ProductInfoType.PRODUCT_GROUP 
                    ? 'ProductGroup' 
                    : 'SubCategories';
                  
                  navigationService.navigate(ROOT_ROUTES.POST, {
                    screen: 'PostsScreen',
                    params: {
                      stage,
                      name: context.name,
                      productInfo: {
                        image: imageSource,
                        title: context.name,
                        subName: context.subName,
                      },
                      contextType: data.contextType,
                      contextId: context.id,
                    },
                  });
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
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'post' }
        });
      }}>
        <VStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$sm"
            lineHeight={18}
            numberOfLines={isDetailMode ? undefined : (data.images && data.images.length > 0 ? 3 : 6)}
          >
            {data.content}
          </Text>
        </VStack>
      </Pressable>

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
                params: { postData: data, type: 'post' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} />
            </VStack>
          </Pressable>
        );
      })()}

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
      
      {/* Boosted Icon - Card'ın sağ alt köşesi */}
      {isBoosted && (
        <Box
          position="absolute"
          bottom={8}
          right={12}
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={require('@/assets/boost.svg')}
            alt="boosted"
            width={24}
            height={24}
          />
        </Box>
      )}

    </View>
  );
};

const MemoizedPostCard = memo(PostCard);
MemoizedPostCard.displayName = 'PostCard';
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

export default MemoizedPostCard;

