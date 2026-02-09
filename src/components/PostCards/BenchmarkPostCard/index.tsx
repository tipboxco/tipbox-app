import React, { useState, useEffect, useRef } from 'react';
import { VStack, HStack, Text, Image, Pressable, Box, Divider } from '@gluestack-ui/themed';
import { Platform, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet, InteractionManager, Keyboard } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
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
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { useNavigation } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
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
import { usePostShare } from '@/src/features/post/components/PostShareBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeviceLocale } from '@/src/hooks/useDeviceLocale';
import { usePostTranslation } from '@/src/hooks/usePostTranslation';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';

interface BenchmarkPostCardProps {
    data: BenchmarkCardData;
    onCommentPress?: () => void;
    isDetailMode?: boolean;
}

const ProductCard = ({ 
    product, 
    isDark, 
    isDetailMode = false,
    isNameExpanded,
    isSubNameExpanded,
    onNameToggle,
    onSubNameToggle
}: { 
    product: BenchmarkProduct; 
    isDark: boolean; 
    isDetailMode?: boolean;
    isNameExpanded: boolean;
    isSubNameExpanded: boolean;
    onNameToggle: () => void;
    onSubNameToggle: () => void;
}) => {
    const productImageSource = product.image 
        ? toImageSource(product.image) || require('@/assets/inventory/product_01.png')
        : require('@/assets/inventory/product_01.png');
    
    return (
    <HStack flex={1} borderWidth={1} borderColor={product.choice ? '#87BB33' : '#E9E9E9'} borderRadius={10} position="relative">
        <VStack padding={6} flex={1} >
            <Box position="relative" w={'$full'} justifyContent="center" alignItems="center" overflow='hidden' aspectRatio={1}>
                <Image
                    width={140}
                    height={130}
                    
                    borderRadius={10}
                    source={productImageSource}
                    alt={product.name}
                    resizeMode='contain'
                />
                {product.isOwned && (
                    <Box
                        position="absolute"
                        top={8}
                        right={8}
                        width={24}
                        height={24}
                    >
                        <Image
                            source={require('@/assets/common/inventory.png')}
                            alt="inventory"
                            width={24}
                            height={24}
                        />
                    </Box>
                )}
            </Box>
            <VStack flex={1} pt={8}>
                <Pressable onPress={onNameToggle}>
                    <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize={isDetailMode ? "$xs" : 9}
                        fontWeight="$bold"
                        numberOfLines={isNameExpanded ? undefined : 2}
                    >
                        {product.name}
                    </Text>
                </Pressable>
                <Pressable onPress={onSubNameToggle}>
                    <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize={isDetailMode ? "$xs" : 8}
                        fontWeight="$semibold"
                        numberOfLines={isSubNameExpanded ? undefined : 2}
                    >
                        {product.subName}
                    </Text>
                </Pressable>
            </VStack>
        </VStack>
    </HStack>
    );
};

export const BenchmarkPostCard = ({ data, onCommentPress, isDetailMode = false }: BenchmarkPostCardProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<any>();
    const { user } = useAppStore();
    const targetUserId = data.user.id;
    const isPostOwner = user?.id && targetUserId && user.id === targetUserId;
    
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isShared, setIsShared] = useState(false);
    
    // Animated counter states
    const [likesCount, setLikesCount] = useState(data.stats.likes);
    const [commentsCount, setCommentsCount] = useState(data.stats.comments);
    const [sharesCount, setSharesCount] = useState(data.stats.shares);
    const [bookmarksCount, setBookmarksCount] = useState(data.stats.bookmarks);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuTriggerRef = useRef<View>(null);
    const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    
    // Product text expansion states - tüm ürünler için ortak
    const [isNameExpanded, setIsNameExpanded] = useState(false);
    const [isSubNameExpanded, setIsSubNameExpanded] = useState(false);
    const { openBottomSheet } = useGlobalBottomSheet();
    const { openPostShareSheet } = usePostShare();

    // Translation hooks (only in detail mode)
    const deviceLocale = useDeviceLocale();
    const {
        translatedContent,
        isTranslating,
        showTranslation,
        toggleTranslation,
        shouldTranslate,
    } = usePostTranslation({
        postId: data.id,
        originalContent: data.content,
        targetLanguage: deviceLocale,
        sourceLanguage: 'en',
        enabled: isDetailMode, // Only enable translation in detail mode
    });

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

    const handleShare = React.useCallback(() => {
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
        if (isDetailMode && onCommentPress) {
            onCommentPress();
        } else {
            navigationService.navigate(ROOT_ROUTES.POST, {
                screen: 'PostDetailScreen',
                params: { postData: data, type: 'benchmark' },
            });
        }
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
        // Context bilgilerini data'dan al
        const contextType = (data as any).contextType;
        const contextId = (data as any).contextId || (data as any).product?.id;
        
        // PostOptionsMenu'yu bottom sheet olarak aç
        openBottomSheet(
            <PostOptionsMenu
                postId={data.id}
                postContent={data.content}
                postAuthorName={data.user.name}
                postAuthorId={data.user.id}
                postType="benchmark"
                postContextType={contextType}
                postContextId={contextId}
            />
        );
    }, [data, openBottomSheet]);

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
            <VStack px={12} py={8} borderRightWidth={isDetailMode ? 0 : 1} borderLeftWidth={isDetailMode ? 0 : 1} borderTopWidth={1} borderTopRightRadius={5} borderTopLeftRadius={5} borderColor="#E9E9E9">
                <HStack alignItems="center" space="xs">
                    <Pressable onPress={handleViewProfile}>
                        <Image
                            source={toImageSource(data.user?.avatar) || DEFAULT_USER_AVATAR}
                            alt={data.user?.name || 'User'}
                            mr={8}
                            width={42}
                            height={42}
                            borderRadius={100}
                        />
                    </Pressable>
                    <Pressable flex={1} onPress={handleViewProfile}>
                        <VStack 
                            flex={1}
                            justifyContent={data.user?.title ? 'flex-start' : 'center'}
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
                                    fontSize={isDetailMode ? "$sm" : 11}
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

            {/* Content */}
            {isDetailMode ? (
                <VStack px={12} py={8} borderTopWidth={1} borderColor="#E9E9E9" space="sm">
                    {/* Original Content */}
                    <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize="$sm"
                        lineHeight={18}
                    >
                        {data.content}
                    </Text>
                    
                    {/* Translated Content */}
                    {showTranslation && translatedContent && (
                        <VStack space="xs" mt="$2">
                            <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} />
                            <Text
                                color={isDark ? '$textDark200' : '#666'}
                                fontSize="$sm"
                                fontStyle="italic"
                            >
                                {translatedContent}
                            </Text>
                        </VStack>
                    )}
                </VStack>
            ) : (
                <Pressable onPress={() => {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: { postData: data, type: 'benchmark' }
                    });
                }}>
                    <VStack px={12} py={8} borderRightWidth={1} borderLeftWidth={1} borderTopWidth={1} borderColor="#E9E9E9">
                        <Text
                            color={isDark ? '$textDark50' : '#000'}
                            fontSize="$sm"
                            lineHeight={18}
                            numberOfLines={3}
                        >
                            {data.content}
                        </Text>
                    </VStack>
                </Pressable>
            )}

            {/* Translate Button (only in detail mode) */}
            {isDetailMode && shouldTranslate && (
                <Box pb="$3" px="$3">
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
                                    ? 'Çeviriliyor...'
                                    : showTranslation
                                    ? 'Hide Translation'
                                    : 'Translate'}
                            </Text>
                        </HStack>
                    </Pressable>
                </Box>
            )}

            {/* Product Benchmark */}
            {isDetailMode ? (
                <VStack px={12} pb={8}>
                    <Box position="relative" width="100%">
                        <HStack justifyContent="space-between" width="100%">
                            {data.products.map((product, index) => (
                                <Box key={product.id} flex={1} mx={4}>
                                    <ProductCard 
                                        product={product} 
                                        isDark={isDark} 
                                        isDetailMode={isDetailMode}
                                        isNameExpanded={isNameExpanded}
                                        isSubNameExpanded={isSubNameExpanded}
                                        onNameToggle={() => setIsNameExpanded(!isNameExpanded)}
                                        onSubNameToggle={() => setIsSubNameExpanded(!isSubNameExpanded)}
                                    />
                                </Box>
                            ))}
                        </HStack>
                        <Box
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform={[{ translateX: -20 }, { translateY: -20 }]}
                            width={40}
                            height={40}
                        >
                            <Image
                                source={require('@/assets/common/benchmarks.png')}
                                alt="benchmarks"
                                width={40}
                                height={40}
                            />
                        </Box>
                    </Box>
                </VStack>
            ) : (
                <Pressable onPress={() => {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: { postData: data, type: 'benchmark' }
                    });
                }}>
                    <VStack px={12} pb={8} borderRightWidth={1} borderLeftWidth={1} borderColor="#E9E9E9">
                        <Box position="relative" width="100%">
                            <HStack justifyContent="space-between" width="100%">
                                {data.products.map((product, index) => (
                                    <Box key={product.id} flex={1} mx={4}>
                                        <ProductCard 
                                            product={product} 
                                            isDark={isDark} 
                                            isDetailMode={isDetailMode}
                                            isNameExpanded={isNameExpanded}
                                            isSubNameExpanded={isSubNameExpanded}
                                            onNameToggle={() => setIsNameExpanded(!isNameExpanded)}
                                            onSubNameToggle={() => setIsSubNameExpanded(!isSubNameExpanded)}
                                        />
                                    </Box>
                                ))}
                            </HStack>
                            <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                transform={[{ translateX: -20 }, { translateY: -20 }]}
                                width={40}
                                height={40}
                            >
                                <Image
                                    source={require('@/assets/common/benchmarks.png')}
                                    alt="benchmarks"
                                    width={40}
                                    height={40}
                                />
                            </Box>
                        </Box>
                    </VStack>
                </Pressable>
            )}

            {/* Stats */}
            <HStack
                px={12}
                py={isDetailMode ? 8 : 16}
                borderRightWidth={isDetailMode ? 0 : 1}
                borderLeftWidth={isDetailMode ? 0 : 1}
                borderBottomWidth={1}
                borderBottomRightRadius={isDetailMode ? 0 : 5}
                borderBottomLeftRadius={isDetailMode ? 0 : 5}
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
                                value={isDetailMode ? data.stats.likes : likesCount}
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize={10}
                                ml={4}
                            />
                        </HStack>
                    </Pressable>
                    <Pressable 
                        onPress={handleComment}
                        disabled={isDetailMode && !onCommentPress}
                        opacity={isDetailMode && !onCommentPress ? 0.5 : 1}
                    >
                        <HStack mr={10} alignItems="center">
                            <ChatBubbleLeftIcon width={24} height={24} color={isDark ? '#fff' : '#000'} />
                            <AnimatedCounter
                                value={isDetailMode ? data.stats.comments : commentsCount}
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
                                value={isDetailMode ? data.stats.shares : sharesCount}
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
                                value={isDetailMode ? data.stats.bookmarks : bookmarksCount}
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
// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders in feed lists
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

export default React.memo(BenchmarkPostCard);

