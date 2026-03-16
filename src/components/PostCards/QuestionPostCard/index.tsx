import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Divider, Switch } from '@gluestack-ui/themed';
import { Platform, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager, Keyboard } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
  RocketLaunchIcon,
} from 'react-native-heroicons/outline';
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
import { toImageSource, formatRelativeTime } from '@/src/utils';
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
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useUpdatePost, useDeletePost, useTogglePostBoost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useTranslation } from '@/src/hooks/useTranslation';

interface QuestionPostCardProps {
  data: QuestionPost | QuestionCardData; // Accept both types for compatibility
  hideProduct?: boolean;
  isDetailMode?: boolean;
}

export const QuestionPostCard = ({ data, hideProduct = false, isDetailMode = false }: QuestionPostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const { t, i18n } = useTranslation('post');
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  // Boost state (backend bazen is_boosted/boosted_until snake_case döner)
  const resolvedIsBoosted = data.isBoosted ?? (data as { is_boosted?: boolean }).is_boosted ?? false;
  const resolvedBoostedUntil = data.boostedUntil ?? (data as { boosted_until?: string }).boosted_until;
  const [isBoosted, setIsBoosted] = useState(resolvedIsBoosted);
  const [boostedUntil, setBoostedUntil] = useState<string | undefined>(resolvedBoostedUntil);
  const [boostPrice, setBoostPrice] = useState(data.boostPrice);
  // Boost badge sadece süre dolmamışsa gösterilir
  const isBoostActive = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();
  
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
  const insets = useSafeAreaInsets();
  const { mutate: reportUser } = useReportUser();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const toggleBoostMutation = useTogglePostBoost();

  // Sync with post status from API
  useEffect(() => {
    if (postStatus) {
      setIsLiked(postStatus.liked);
      setIsBookmarked(postStatus.favorited);
      setIsShared(postStatus.shared);
    }
  }, [postStatus]);

  // Sync boost state with data prop changes (isBoosted, boostedUntil, snake_case fallback)
  useEffect(() => {
    const v = data.isBoosted ?? (data as { is_boosted?: boolean }).is_boosted ?? false;
    const until = data.boostedUntil ?? (data as { boosted_until?: string }).boosted_until;
    setIsBoosted(v);
    setBoostedUntil(until);
    setBoostPrice(data.boostPrice);
  }, [data]);

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

  const handleShare = useCallback(() => {
    openBottomSheet(
      <ShareToTrustedBottomSheet
        postId={data.id}
        postContent={data.content}
        postAuthorName={data.user?.name}
        onShareSuccess={() => {
          setIsShared(true);
          setSharesCount((prev) => prev + 1);
        }}
        onClose={closeBottomSheet}
      />,
      {
        snapPoints: ['65%', '90%'],
        keyboardBehavior: 'interactive',
        keyboardBlurBehavior: 'restore',
        android_keyboardInputMode: 'adjustResize',
      }
    );
  }, [data.id, data.content, data.user?.name, openBottomSheet, closeBottomSheet]);

  const handleComment = () => {
    if (isDetailMode) return; // Detay modunda navigation yapma
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'PostDetailScreen',
      params: { postData: data, type: 'question' },
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
    { value: 'SPAM', label: t('report.categories.spam') },
    { value: 'HARASSMENT', label: t('report.categories.harassment') },
    { value: 'SCAM', label: t('report.categories.scam') },
    { value: 'INAPPROPRIATE_CONTENT', label: t('report.categories.inappropriateContent') },
    { value: 'FAKE_ACCOUNT', label: t('report.categories.fakeAccount') },
    { value: 'OTHER', label: t('report.categories.other') },
  ], [t]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
    const username = data.user?.name || t('card.unknownUser');

    Alert.alert(
      t('report.title'),
      t('report.message', { username }),
      [
        ...reportCategories.map((category) => ({
          text: category.label,
          onPress: () => {
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
                  Alert.alert(t('report.successTitle'), t('report.successMessage'));
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || t('report.errorDefault');
                  Alert.alert(t('report.errorTitle'), errorMessage);
                },
              }
            );
          },
        })),
        {
          text: t('report.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, targetUserId, reportUser, reportCategories, data.user?.name, t]);

  // Post owner actions
  const handleUpdate = useCallback(() => {
    // Context bilgilerini data'dan al
    const contextType = (data as any).contextType;
    const contextId = (data as any).contextId || data.category?.product?.id;
    
    // PostOptionsMenu'yu bottom sheet olarak aç
    openBottomSheet(
      <PostOptionsMenu
        postId={data.id}
        postContent={data.content || (data as any).description}
        postAuthorName={data.user.name}
        postAuthorId={data.user.id}
        postType="question"
        postContextType={contextType}
        postContextId={contextId}
      />
    );
  }, [data, openBottomSheet]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t('delete.confirmTitle'),
      t('delete.confirmMessage'),
      [
        {
          text: t('report.cancel'),
          style: 'cancel',
        },
        {
          text: t('menu.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              Alert.alert(t('delete.successTitle'), t('delete.successMessage'));
            } catch (error: any) {
              Alert.alert(
                t('delete.errorTitle'),
                error.response?.data?.message || t('delete.errorMessage')
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation, t]);

  // Boost toggle handler
  const handleBoostToggle = useCallback((value: boolean) => {
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
            t('card.boost.success'),
            value
              ? (response.boostPrice ? t('card.boost.activatedWithCost', { price: response.boostPrice }) : t('card.boost.activated'))
              : t('card.boost.deactivated')
          );
        },
        onError: (error: any) => {
          // Hata durumunda geri al
          setIsBoosted(!value);

          const errorMessage = error?.response?.data?.message || error?.message || t('card.boost.errorMessage');
          Alert.alert(t('card.boost.errorTitle'), errorMessage);
        },
      }
    );
  }, [data.id, toggleBoostMutation]);

  // CRITICAL FIX: onLayout ile pozisyonu sürekli güncelle
  // FlatList scroll edildiğinde pozisyon değişir, onLayout her değişiklikte çağrılır
  const handleTriggerLayout = useCallback(() => {
    if (menuTriggerRef.current) {
      // measureInWindow: Window koordinatları (ekranın en üst soluna göre, scroll dahil)
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          triggerPositionRef.current = { x, y, width, height };
          console.log('📍 [QuestionPostCard] onLayout - measureInWindow:', {
            x,
            y,
            width,
            height,
            reference: 'Window coordinates (top-left of screen, scroll included)',
          });
        }
      });
      
      // measure: Parent container'a göre koordinatlar
      menuTriggerRef.current.measure((fx, fy, w, h, px, py) => {
        console.log('📍 [QuestionPostCard] onLayout - measure (parent relative):', {
          fx, // Frame X (relative to parent)
          fy, // Frame Y (relative to parent)
          width: w,
          height: h,
          px, // Page X (absolute position in parent)
          py, // Page Y (absolute position in parent)
          reference: 'Parent container coordinates',
        });
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
      // Menu'yu trigger button'ın sağında konumlandır, daha sola kaydır
      let left = x + width - menuWidth - 20;
      let top = y + height - 16;
      
      console.log(`📐 [QuestionPostCard] Position calculation (${source}):`, {
        triggerPosition: { x, y, width, height },
        calculatedMenuPosition: { left, top },
        screenDimensions: { screenWidth, screenHeight },
        menuDimensions: { menuWidth, menuHeight },
      });
      
      // Ekran sınırları kontrolü
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
        // Eğer altında yer yoksa, üstünde göster
        top = y - menuHeight - 8;
        if (top < 12) {
          top = 12;
        }
      }
      
      return { top, left };
    };

    // ÖNCELİK 1: Event'ten gelen koordinatları kullan (en güvenilir)
    if (event?.nativeEvent?.pageX !== undefined && event?.nativeEvent?.pageY !== undefined) {
      const pageX = event.nativeEvent.pageX;
      const pageY = event.nativeEvent.pageY;
      
      // Trigger button'ın yaklaşık boyutları (24x24 icon + padding)
      const triggerWidth = 44;
      const triggerHeight = 44;
      
      // Event koordinatları button'ın merkezine yakın, sağ üst köşesini hesapla
      const triggerX = pageX - triggerWidth / 2;
      const triggerY = pageY - triggerHeight / 2;
      
      const position = calculatePosition(triggerX, triggerY, triggerWidth, triggerHeight, 'event-coordinates');
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 2: Stored position'ı kullan (onLayout'dan gelen)
    if (triggerPositionRef.current) {
      const stored = triggerPositionRef.current;
      console.log('💾 [QuestionPostCard] Using stored position from onLayout:', stored);
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height, 'stored');
      console.log('✅ [QuestionPostCard] Final menu position (stored):', {
        top: position.top,
        left: position.left,
        reference: 'Modal uses position: absolute with top/left (relative to window/screen)',
      });
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 3: measureInWindow ile ölç (ref varsa)
    InteractionManager.runAfterInteractions(() => {
      if (menuTriggerRef.current) {
        menuTriggerRef.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0 && x >= 0 && y >= 0) {
            // Stored position'ı güncelle
            triggerPositionRef.current = { x, y, width, height };
            const position = calculatePosition(x, y, width, height, 'measureInWindow');
            setMenuPosition(position);
            setIsMenuOpen(true);
          } else {
            // Invalid position - fallback kullan
            setMenuPosition({ top: 40, left: screenWidth - 152 });
            setIsMenuOpen(true);
          }
        });
      } else {
        // Ref yok - fallback kullan
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
      <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
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
              <HStack alignItems="center">
                <Text
                  color={isDark ? '$textDark50' : '#000'}
                  fontSize="$sm"
                  fontWeight="$bold"
                >
                  {data.user?.name || t('card.unknownUser')}
                </Text>
                {data.createdAt ? (
                  <Text
                    color={isDark ? '$textDark400' : '#A3A3A3'}
                    fontSize={11}
                  >
                    {`  •  ${formatRelativeTime(data.createdAt, i18n.language)}`}
                  </Text>
                ) : null}
              </HStack>
              {data.user?.title ? (
                <Text
                  color={isDark ? '$textDark400' : '#787878'}
                  fontSize="$xs"
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
              style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
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
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                console.log('🎯 [QuestionPostCard] Modal opened at position:', {
                  styleTop: menuPosition.top,
                  styleLeft: menuPosition.left,
                  actualLayout: { x, y, width, height },
                  screenWidth: Dimensions.get('window').width,
                  screenHeight: Dimensions.get('window').height,
                  reference: 'Modal View uses position: absolute (relative to window/screen)',
                });
              }}
            >
              <RNPressable 
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
                <VStack px={8} pl={12} py={2} width="100%">
                  {isPostOwner ? (
                    <>
                      <Pressable py={8} onPress={() => setIsMenuOpen(false)}>
                        <HStack alignItems="center" justifyContent="space-between">
                          <HStack alignItems="center" space="xs" flex={1}>
                            <Image
                              source={require('@/assets/boost.svg')}
                              alt="boost"
                              width={20}
                              height={20}
                            />
                            <Text
                              color={isDark ? '#FFFFFF' : '#000000'}
                              fontSize="$sm"
                              fontWeight="$medium"
                            >
                              {isBoosted ? t('card.boost.disableBoost') : t('card.boost.boostPost')}
                            </Text>
                          </HStack>
                          <Switch
                            value={isBoosted}
                            onValueChange={(v) => { setIsMenuOpen(false); handleBoostToggle(v); }}
                            trackColor={{
                              false: isDark ? '#333333' : '#E9E9E9',
                              true: '#829905',
                            }}
                            thumbColor={isBoosted ? '#B8CC04' : (isDark ? '#666666' : '#FFFFFF')}
                            disabled={toggleBoostMutation.isPending}
                          />
                        </HStack>
                      </Pressable>
                      <Divider bg={isDark ? '#333333' : '#E9E9E9'} mx={0} />
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
                            {t('menu.delete')}
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
                            {t('menu.viewProfile')}
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
                            {t('menu.report')}
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
                // Product için PostsScreen'e navigate et
                if (!data.category?.product?.id) return;
                
                navigationService.navigate(ROOT_ROUTES.POST, {
                  screen: 'PostsScreen',
                  params: {
                    stage: 'Product',
                    name: data.category.product.name,
                    productInfo: {
                      image: toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png'),
                      title: data.category.product.name,
                      subName: data.category.product.subName,
                    },
                    selectedProduct: {
                      id: data.category.product.id,
                      name: data.category.product.name,
                      description: data.category.product.subName,
                      image: toImageSource(data.category.product.image) || require('@/assets/inventory/product_01.png'),
                    },
                    contextType: ProductInfoType.PRODUCT,
                    contextId: data.category.product.id,
                  },
                });
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
                // SubCategory için PostsScreen'e navigate et
                if (!data.category?.id) return;
                
                navigationService.navigate(ROOT_ROUTES.POST, {
                  screen: 'PostsScreen',
                  params: {
                    stage: 'SubCategories',
                    name: data.category.name,
                    productInfo: {
                      image: toImageSource(data.category.image) || require('@/assets/inventory/product_01.png'),
                      title: data.category.name,
                      subName: data.category.subCategory,
                    },
                    contextType: ProductInfoType.SUB_CATEGORY,
                    contextId: data.category.id,
                  },
                });
              }}
            />
          </Box>
        ) : null
      }

      {/* Badges */}
      <HStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9" space={8} alignItems="center">
          <Box
            borderWidth={2}
            borderColor="#B8CC04"
            bgColor="#758600"
            borderRadius={20}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
          >
            <QuestionMarkCircleIcon width={12} height={12} color={'#fff'} />
            <Text
              fontSize={8}
              fontWeight="$semibold"
              ml={5}
              color={'#fff'}
            >
              {t('card.badges.question')}
            </Text>
          </Box>

          {isBoostActive && (
            <Box
              borderWidth={2}
              borderColor="#EF4D81"
              bgColor="#E0195B"
              borderRadius={20}
              px={10}
              py={6}
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
            >
              <RocketLaunchIcon width={12} height={12} color="#fff" />
              <Text fontSize={8} fontWeight="$semibold" ml={5} color="#fff">
                {t('card.badges.boosted')}
              </Text>
            </Box>
          )}
      </HStack>

      {/* Content - Boost Post sadece 3 nokta menüde (doğru tasarım: badge ile içerik arasında değil) */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'question' }
        });
      }}>
        <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
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
                params: { postData: data, type: 'question' }
              });
            }}
          >
            <VStack px={12} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
              <CardImageCarousel images={validImages} isDetailMode={isDetailMode} />
            </VStack>
          </Pressable>
        );
      })()}

      {/* Stats */}
      <HStack
        px={12}
        py={12}
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

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
export default React.memo(QuestionPostCard);

