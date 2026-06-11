import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Platform, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager, Keyboard } from 'react-native';
import { VStack, HStack, Text, Image, Pressable, Box, Divider } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
// Heroicons imports
import {
  EllipsisHorizontalIcon,
  TagIcon,
  CubeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  FlagIcon,
  ArrowUpCircleIcon,
} from 'react-native-heroicons/outline';
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
import { toImageSource, formatRelativeTime } from '@/src/utils';
import type { ExperiencePostCardData } from '@/src/types/ExperienceCard';
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
import { PostOptionsMenu } from '@/src/components/PostOptionsMenu';
import { ShareToTrustedBottomSheet } from '@/src/features/post/components/ShareToTrustedBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { useTranslation } from '@/src/hooks/useTranslation';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';


interface PostCardProps {
  data: ExperiencePostCardData;
  hideProduct?: boolean;
  isDetailMode?: boolean;
  /** When provided, card content tap calls this instead of navigating to PostDetailScreen (e.g. select-for-update flow) */
  onCardPress?: () => void;
  /** Hide user header (avatar, name, menu). Used when card is embedded as "Related Post" in update detail. */
  showHeader?: boolean;
  /** Hide action bar (like, comment, share, bookmark). Used when card is embedded as "Related Post" in update detail. */
  showActions?: boolean;
}

// Map known content tag titles to translation keys
const CONTENT_TAG_TITLE_KEYS: Record<string, string> = {
  'Price and Shopping Experience': 'post:create.experience.step3.priceAndShopping',
  'Product and Usage Experience': 'post:create.experience.step3.productAndUsage',
};

export const ExperiencePostCard = ({ data, hideProduct = false, isDetailMode = false, onCardPress, showHeader = true, showActions = true }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const isDark = colorMode === 'dark';

  // Translation hooks - content array'den text'leri birleştir
  const contentText = Array.isArray(data.content)
    ? data.content.map(item => item.text).join('\n\n')
    : '';
  const {
    translatedContent,
    isTranslating,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  } = usePostTranslation({
    postId: data.id,
    originalContent: contentText,
  });

  // Translate content tag title (e.g. "Price and Shopping Experience" → TR)
  const translateTagTitle = useCallback((title: string) => {
    const key = CONTENT_TAG_TITLE_KEYS[title];
    if (key) return t(key);
    return title;
  }, [t]);

  // Translate usage context tags (e.g. "3-6 months", "Other", "Personal use" → TR)
  const translateTag = useCallback((tag: string) => {
    const key = `post:create.experience.step1.optionNames.${tag}`;
    const keyWithoutNs = `create.experience.step1.optionNames.${tag}`;
    const translated = t(key);
    // If translation key not found, t() may return key with or without namespace prefix
    if (translated === key || translated === keyWithoutNs) return tag;
    return translated;
  }, [t]);
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const targetUserId = data.user.id;
  const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = React.useRef<View>(null);
  const triggerPositionRef = React.useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
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

  const handleShare = useCallback(() => {
    // Share işlemini her zaman aç - kullanıcı istediği kadar share edebilsin
    openBottomSheet(
      <ShareToTrustedBottomSheet
        postId={data.id}
        postContent={data.content?.[0]?.content ?? ''}
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

  // Report categories with labels
  const reportCategories = React.useMemo<Array<{ value: UserReportCategory; label: string }>>(() => [
    { value: 'SPAM', label: t('common:report.categories.spam') },
    { value: 'HARASSMENT', label: t('common:report.categories.harassment') },
    { value: 'SCAM', label: t('common:report.categories.scam') },
    { value: 'INAPPROPRIATE_CONTENT', label: t('common:report.categories.inappropriate') },
    { value: 'FAKE_ACCOUNT', label: t('common:report.categories.fakeAccount') },
    { value: 'OTHER', label: t('common:report.categories.other') },
  ], [t]);

  const handleReport = React.useCallback(() => {
    if (!user?.id || !targetUserId) return;

    const username = data.user?.name || 'User';

    // Report category seçimi için alert
    Alert.alert(
      t('common:report.reportUserTitle'),
      t('common:report.reasonQuestion', { username }),
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
                  Alert.alert(t('common:report.successTitle'), t('common:report.successMessage'));
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || t('post:report.errorDefault');
                  Alert.alert(t('common:report.errorTitle'), errorMessage);
                },
              }
            );
          },
        })),
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [user?.id, targetUserId, reportUser, reportCategories, data.user?.name, t]);

  // Post owner actions
  const handleUpdate = React.useCallback(() => {
    // CreateUpdatePostScreen'e yönlendir - experience post bilgileriyle
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateUpdatePostScreen',
      params: {
        experiencePostId: data.id, // Experience post ID (update bu post'a bağlanacak)
        experiencePost: {
          id: data.id,
          content: data.content,
          images: data.images,
          product: {
            id: data.contextData?.id || '',
            name: data.contextData?.name || '',
            subName: data.contextData?.subName || '',
            image: data.contextData?.image,
          },
        },
        product: data.contextData ? {
          id: data.contextData.id,
          name: data.contextData.name,
          description: data.contextData.subName,
          image: data.contextData.image,
        } : undefined,
      },
    });
  }, [data]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      t('post:delete.confirmTitle'),
      t('post:delete.confirmMessage'),
      [
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(data.id);
              Alert.alert(t('post:delete.successTitle'), t('post:delete.successMessage'));
            } catch (error: any) {
              Alert.alert(
                t('post:delete.errorTitle'),
                error.response?.data?.message || t('post:delete.errorMessage')
              );
            }
          },
        },
      ]
    );
  }, [data.id, deletePostMutation, t]);

  // CRITICAL FIX: onLayout ile pozisyonu sürekli güncelle
  // FlatList scroll edildiğinde pozisyon değişir, onLayout her değişiklikte çağrılır
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
    const menuWidth = 160;
    const menuHeight = isPostOwner ? 80 : 80;
    
    const calculatePosition = (x: number, y: number, width: number, height: number, source: string) => {
      // Menu'yu trigger button'ın sağında konumlandır, daha sola kaydır
      let left = x + width - menuWidth - 20;
      let top = y + height - 16;
      
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
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height, 'stored');
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
      {/* Header - hidden when embedded as Related Post in update detail */}
      {showHeader && (
        <VStack px={12} py={8} borderWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor={isDark ? '#333333' : '#E9E9E9'}>
          <HStack alignItems="center" space="xs">
            {data.user && toImageSource(data.user.avatar) && (
              <Pressable onPress={handleViewProfile}>
                <Image
                  source={toImageSource(data.user.avatar)!}
                  alt={data.user?.name || 'User'}
                  mr={8}
                  width={48}
                  height={48}
                  borderRadius={100}
                />
              </Pressable>
            )}
            <Pressable flex={1} onPress={handleViewProfile}>
              <VStack
                flex={1}
                justifyContent="center"
              >
                {data.user?.action ? (
                  <HStack alignItems="center" space="xs" mb={1}>
                    <ArrowUpCircleIcon width={14} height={14} color={isDark ? '$textDark400' : '#C7C7C7'} />
                    <Text
                      color={isDark ? '$textDark400' : '#C7C7C7'}
                      fontSize={9}
                      fontWeight="$semibold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      flex={1}
                    >
                      {data.user.action}
                    </Text>
                  </HStack>
                ) : null}
                <HStack alignItems="center">
                  <Text
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize='$sm'
                    fontWeight="$bold"
                  >
                    {data.user?.name || t('post:card.unknownUser')}
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
                    fontSize={11}
                    numberOfLines={1}
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
      )}

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
                      handleUpdate();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <PencilIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('post:menu.update')}
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
                      handleDelete();
                    }}
                    py={8}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      <TrashIcon width={18} height={18} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('post:menu.delete')}
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
                      <UserIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('common:menu.viewProfile')}
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
                      <FlagIcon width={18} height={18} color="#FF3040" />
                      <Text
                        color="#FF3040"
                        fontSize="$sm"
                        fontWeight="$medium"
                      >
                        {t('common:menu.report')}
                      </Text>
                    </HStack>
                  </Pressable>
                </>
              )}
            </VStack>
          </RNPressable>
        </View>
      </Modal>

      {/* Content */}
      <Pressable onPress={() => {
        if (isDetailMode) return; // Detay modunda navigation yapma
        if (onCardPress) {
          onCardPress();
          return;
        }
        navigationService.navigate(ROOT_ROUTES.POST, {
          screen: 'PostDetailScreen',
          params: { postData: data, type: 'experience' }
        });
      }}>
        <VStack
          px={12}
          pb={8}
          pt={8}
          borderRightWidth={1}
          borderLeftWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          {...(!showHeader && !data.contextData && { borderTopWidth: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5 })}
          {...(!data.tags || data.tags.length === 0) && !data.images && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
        >
          {Array.isArray(data.content) && data.content.length > 0 ? (
            isDetailMode ? (
              // Detail mode: segmented view with icons, titles and ratings
              data.content.map((item, index) => (
                <VStack key={index} py={10} space="xs">
                  <HStack space="sm" alignItems="center">
                    {item.tag.icon === 'package' ? (
                      <CubeIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                    ) : (
                      <TagIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                    )}
                    <Text
                      color={isDark ? '$textDark50' : '#000'}
                      fontSize="$sm"
                      fontWeight="$bold"
                    >
                      {translateTagTitle(item.tag.title)}
                    </Text>
                  </HStack>
                  <Text
                    color={isDark ? '$textDark50' : '#343434'}
                    fontSize="$sm"
                    lineHeight={18}
                    ml={26}
                  >
                    {item.text}
                  </Text>
                  <HStack ml={26} mt={6} space="xs">
                    {item.rating.map((star, idx) => (
                      <StarIconSolid
                        key={idx}
                        width={16}
                        height={16}
                        color={star ? '#829905' : (isDark ? '#7E7E7E' : '#D4D4D4')}
                      />
                    ))}
                  </HStack>
                </VStack>
              ))
            ) : (
              // Feed mode: plain concatenated text (original reading experience)
              <Text
                color={isDark ? '$textDark50' : '#343434'}
                fontSize="$sm"
                lineHeight={18}
                py={10}
                numberOfLines={data.images && data.images.length > 0 ? 3 : 6}
              >
                {data.content.map(item => item.text).filter(Boolean).join('\n\n')}
              </Text>
            )
          ) : null}
        </VStack>
      </Pressable>

      {/* Translated Content */}
      {showTranslation && translatedContent && (
        <VStack px={12} pb={4} borderRightWidth={1} borderLeftWidth={1} borderColor={isDark ? '#333333' : '#E9E9E9'} space="xs">
          <Text
            color={isDark ? '$textDark200' : '#666'}
            fontSize="$sm"
            fontStyle="italic"
          >
            {translatedContent}
          </Text>
        </VStack>
      )}

      {/* Translate Button */}
      {shouldTranslate && (
        <Box pb="$2" px="$3" borderRightWidth={1} borderLeftWidth={1} borderColor={isDark ? '#333333' : '#E9E9E9'}>
          <Pressable onPress={toggleTranslation}>
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
                {isTranslating
                  ? t('post:card.translate.translating')
                  : showTranslation
                  ? t('post:card.translate.hideTranslation')
                  : t('post:card.translate.translate')}
              </Text>
            </HStack>
          </Pressable>
        </Box>
      )}

      {/* Product */}
      {
        !hideProduct && data.contextData && (
          <Box
            px={12}
            py={8}
            borderRightWidth={1}
            borderLeftWidth={1}
            borderColor={isDark ? '#333333' : '#E9E9E9'}
            borderTopWidth={1}
            borderTopColor={isDark ? '#1A1A1A' : '#F0F0F0'}
            bg={isDark ? '#0A0A0A' : '#FAFAFA'}
          >
            <VStack space="xs">
              <ProductInfoCard
                size="small"
                type={ProductInfoType.PRODUCT}
                image={toImageSource(data.contextData.image)}
                title={data.contextData.name}
                subName={data.contextData.subName && !/^Status:\s*(tested|own)$/i.test(String(data.contextData.subName)) ? data.contextData.subName : undefined}
                ownershipLabel={data.contextData?.isOwned ? 'Owned' : 'Tried'}
                onPress={() => {
                  if (!data.contextData?.id) return;
                  const contextType = data.contextType || ProductInfoType.PRODUCT;
                  navigationService.navigate(ROOT_ROUTES.POST, {
                    screen: 'PostsScreen',
                    params: {
                      stage: 'Product',
                      name: data.contextData.name,
                      productInfo: {
                        image: toImageSource(data.contextData.image),
                        title: data.contextData.name,
                        subName: data.contextData.subName,
                      },
                      selectedProduct: {
                        id: data.contextData.id,
                        name: data.contextData.name,
                        description: data.contextData.subName,
                        image: toImageSource(data.contextData.image),
                      },
                      contextType,
                      contextId: data.contextData.id,
                    },
                  });
                }}
              />
            </VStack>
          </Box>
        )
      }

      {/* Usage Context: Duration, Condition, Purpose - Owned/Tried sadece product (ProductInfoCard) içinde. */}
      {data.tags && data.tags.length > 0 && (
        <HStack
          px={12}
          py={5}
          borderRightWidth={1}
          borderLeftWidth={1}
          borderBottomWidth={(!data.images || data.images.length === 0) && !showActions ? 1 : 0}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          {...((!data.images || data.images.length === 0) && !showActions && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 })}
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start"
          alignItems="center"
          gap={8}
        >
          {data.tags.slice(0, 3).map((value, index) => {
            if (value == null || value === '') return null;
            return (
              <Box
                key={index}
                borderRadius="$full"
                px={8}
                py={3}
                bg={isDark ? 'rgba(255,255,255,0.15)' : '#FFFFFF'}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E9E9E9'}
              >
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={10}
                  fontWeight="$semibold"
                >
                  {translateTag(value)}
                </Text>
              </Box>
            );
          })}
        </HStack>
      )}

      {(() => {
        const validImages = data.images?.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) || [];
        if (validImages.length === 0) return null;
        return (
          <Pressable
            onPress={() => {
              if (isDetailMode) return; // Detay modunda navigation yapma
              navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'experience' }
              });
            }}
          >
            <VStack
              px={12}
              borderRightWidth={1}
              borderLeftWidth={1}
              borderBottomWidth={!showActions ? 1 : 0}
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              {...(!showActions && { borderBottomLeftRadius: 5, borderBottomRightRadius: 5 })}
            >
              <CardImageCarousel images={validImages} isDetailMode={isDetailMode} />
            </VStack>
          </Pressable>
        );
      })()}
      {/* Stats - hidden when embedded as Related Post in update detail */}
      {showActions && (
        <HStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderBottomWidth={1} borderBottomRightRadius={5} borderBottomLeftRadius={5} borderColor={isDark ? '#333333' : '#E9E9E9'} justifyContent="space-between" alignItems="center"
        >
          <HStack flex={1} justifyContent="space-between" alignItems="center">
            <HStack alignItems="center" style={{ gap: 5 }}>
              <Pressable onPress={handleLike}>
                <HStack alignItems="center">
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
                <HStack alignItems="center">
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
                <HStack alignItems="center">
                  <PaperAirplaneIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                  <AnimatedCounter
                    value={sharesCount}
                    color={isDark ? '$textDark50' : '#000'}
                    fontSize={10}
                    ml={4}
                  />
                </HStack>
              </Pressable>
            </HStack>
            <Pressable onPress={handleBookmark}>
              <HStack alignItems="center">
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    width: 160,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    overflow: 'hidden',
  },
});

export default ExperiencePostCard;
