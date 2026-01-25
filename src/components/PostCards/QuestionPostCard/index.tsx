import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box } from '@gluestack-ui/themed';
import { Platform, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ChevronDoubleUpIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
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
import { toImageSource } from '@/src/utils';
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
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useUpdatePost, useDeletePost } from '@/src/features/post/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

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
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const { openBottomSheet } = useGlobalBottomSheet();
  
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
                description: 'User reported',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

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

  // Calculate menu position - stored position'ı öncelikli kullan
  const handleMenuOpen = useCallback((event?: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    // DEBUG: Tıklama event'inden koordinat al (eğer varsa)
    let clickX = 0;
    let clickY = 0;
    if (event?.nativeEvent) {
      clickX = event.nativeEvent.pageX || event.nativeEvent.locationX || 0;
      clickY = event.nativeEvent.pageY || event.nativeEvent.locationY || 0;
      console.log('🖱️ [QuestionPostCard] Click event coordinates:', {
        pageX: event.nativeEvent.pageX,
        pageY: event.nativeEvent.pageY,
        locationX: event.nativeEvent.locationX,
        locationY: event.nativeEvent.locationY,
        clickX,
        clickY,
        reference: 'Touch event coordinates (page = window, location = relative to element)',
      });
    }
    
    const calculatePosition = (x: number, y: number, width: number, height: number, source: string) => {
      const menuWidth = 180;
      const menuHeight = isPostOwner ? 100 : 100;
      
      // Menu'yu trigger button'ın sağında konumlandır
      let left = x + width - menuWidth + 10;
      let top = y + height + 8;
      
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
      
      console.log(`✅ [QuestionPostCard] Final menu position (${source}):`, {
        top,
        left,
        reference: 'Modal uses position: absolute with top/left (relative to window/screen)',
      });
      
      return { top, left };
    };

    // CRITICAL: Önce stored position'ı kontrol et (onLayout'dan gelen, daha güvenilir)
    if (triggerPositionRef.current) {
      const stored = triggerPositionRef.current;
      console.log('💾 [QuestionPostCard] Using stored position from onLayout:', stored);
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height, 'stored');
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // Stored position yoksa, measureInWindow ile ölç
    // CRITICAL: requestAnimationFrame ile bir frame bekle - layout'un tamamlanmasını garanti et
    requestAnimationFrame(() => {
      if (menuTriggerRef.current) {
        // measureInWindow: Window koordinatları (ekranın en üst soluna göre, scroll dahil)
        menuTriggerRef.current.measureInWindow((x, y, width, height) => {
          console.log('📏 [QuestionPostCard] measureInWindow (on click):', {
            x,
            y,
            width,
            height,
            reference: 'Window coordinates (top-left of screen, scroll included)',
            isValid: width > 0 && height > 0 && x >= 0 && y >= 0,
          });
          
          // measure: Parent container'a göre koordinatlar
          menuTriggerRef.current?.measure((fx, fy, w, h, px, py) => {
            console.log('📏 [QuestionPostCard] measure (on click, parent relative):', {
              fx, // Frame X (relative to parent)
              fy, // Frame Y (relative to parent)
              width: w,
              height: h,
              px, // Page X (absolute position in parent)
              py, // Page Y (absolute position in parent)
              reference: 'Parent container coordinates',
            });
          });
          
          // measureInWindow window koordinatlarını verir (ekranın en üst soluna göre)
          // FlatList scroll pozisyonu otomatik olarak dahil edilir
          if (width > 0 && height > 0 && x >= 0 && y >= 0) {
            // Stored position'ı güncelle
            triggerPositionRef.current = { x, y, width, height };
            
            const position = calculatePosition(x, y, width, height, 'measureInWindow');
            setMenuPosition(position);
            setIsMenuOpen(true);
          } else {
            // Invalid position - fallback kullan
            console.warn('⚠️ [QuestionPostCard] Invalid measureInWindow result, using fallback');
            setMenuPosition({ top: 60, left: screenWidth - 192 });
            setIsMenuOpen(true);
          }
        });
      } else {
        // Ref yok - fallback kullan
        console.warn('⚠️ [QuestionPostCard] menuTriggerRef.current is null, using fallback');
        setMenuPosition({ top: 60, left: screenWidth - 192 });
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
            <VStack flex={1}>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {data.user?.name || 'Unknown User'}
              </Text>
              <Text
                color={isDark ? '$textDark400' : '#787878'}
                fontSize={11}
                numberOfLines={1}
                maxWidth={250}
              >
                {data.user?.title || ''}
              </Text>
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
            onRequestClose={() => setIsMenuOpen(false)}
          >
            <RNPressable
              style={{ flex: 1 }}
              onPress={() => setIsMenuOpen(false)}
            />
            <View
              style={[
                styles.menuContainer,
                {
                  top: menuPosition.top,
                  left: menuPosition.left,
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
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
              {isPostOwner ? (
                <>
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleUpdate();
                    }}
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <PencilIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Güncelle
                      </Text>
                    </HStack>
                  </Pressable>
                  <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E9E9E9' }]} />
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <TrashIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Sil
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
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <UserIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Profili Görüntüle
                      </Text>
                    </HStack>
                  </Pressable>
                  <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E9E9E9' }]} />
                  <Pressable
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleReport();
                    }}
                    px={16}
                    py={12}
                  >
                    <HStack alignItems="center" space="md">
                      <FlagIcon width={20} height={20} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        Raporla
                      </Text>
                    </HStack>
                  </Pressable>
                </>
              )}
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
      <HStack px={12} pb={8} pt={hideProduct ? 8 : 0} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
        <Box
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
            borderWidth={2}
            borderColor="#EF4D81"
            bgColor="#E0195B"
            borderRadius={20}
            width={90}
            px={10}
            py={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-evenly"
          >
            <Image
              source={require('@/assets/boost.svg')}
              alt="boost"
              width={12}
              height={12}
            />
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
        if (isDetailMode) return; // Detay modunda navigation yapma
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'question' }
        });
      }}>
        <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$xs"
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
              <CardImageCarousel images={validImages} />
            </VStack>
          </Pressable>
        );
      })()}

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
        {data.isBoosted && (
          <Box>
            <ChevronDoubleUpIcon
              width={24}
              height={24}
              color="#22C55E"
            />
          </Box>
        )}
      </HStack>

    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    width: 180,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
  },
});

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
export default React.memo(QuestionPostCard);

