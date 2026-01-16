import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dimensions, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolateColor,
    withTiming,
} from 'react-native-reanimated';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
    Input,
    InputField,
    Spinner,
} from '@gluestack-ui/themed';
import {
  XMarkIcon,
  HeartIcon,
  GiftIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  TrophyIcon,
  CalendarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { notification_filters } from '@/src/mock/notifications';
import { NotificationFilter } from '@/src/mock/notifications/types';
import { Header } from '@/src/components/Header';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import {
    useNotifications,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    useDeleteNotification,
    notificationKeys,
} from '../api/hooks';
import type { Notification, NotificationType } from '../api/types';
import { useQueryClient } from '@tanstack/react-query';
import { notificationAssetCache } from '@/src/services/NotificationAssetCache';
import { navigationService } from '@/src/services/NavigationService';
import { notificationService } from '@/src/services/NotificationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { useAppStore } from '@/src/store/appStore';
import { useDrawerStore } from '@/src/store/drawerStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/src/providers/AuthProvider';

const { width } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type NotificationsScreenNavigationProp = NativeStackNavigationProp<NotificationsStackParamList, 'NotificationsScreen'>;

const NotificationCard: React.FC<{ 
    notification: Notification;
    onPress?: () => void;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
}> = ({ notification, onPress, onMarkAsRead, onDelete }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const markAsReadMutation = useMarkNotificationAsRead();
    const deleteMutation = useDeleteNotification();

    const getIconComponent = (type: NotificationType): React.ComponentType<{ width?: number; height?: number; color?: string }> => {
        switch (type) {
            // Post ile ilgili
            case 'POST_LIKED':
                return HeartIcon;
            case 'POST_COMMENTED':
                return ChatBubbleLeftIcon;
            case 'POST_SHARED':
                return ArrowTopRightOnSquareIcon;
            case 'POST_FAVORITED':
                return BookmarkIcon;

            // Yorum ile ilgili
            case 'COMMENT_LIKED':
                return HeartIcon;
            case 'COMMENT_REPLIED':
                return ChatBubbleLeftRightIcon;

            // Trust/Follow ile ilgili
            case 'NEW_TRUSTER':
            case 'NEW_TRUSTED_BY':
                return UserPlusIcon;

            // Mesajlaşma ile ilgili
            case 'NEW_MESSAGE':
                return ChatBubbleLeftIcon;
            case 'DM_REQUEST_RECEIVED':
                return EnvelopeIcon;
            case 'DM_REQUEST_ACCEPTED':
                return CheckCircleIcon;

            // Gamification ile ilgili
            case 'NEW_BADGE':
            case 'ACHIEVEMENT_UNLOCKED':
                return TrophyIcon;
            case 'REWARD_EARNED':
                return GiftIcon;

            // Expert ile ilgili
            case 'EXPERT_REQUEST_AVAILABLE':
            case 'EXPERT_REQUEST_ANSWERED':
                return AcademicCapIcon;

            // Sistem/Tips ile ilgili
            case 'SYSTEM_ANNOUNCEMENT':
                return BellIcon;
            case 'TIPS_RECEIVED':
                return GiftIcon;
            case 'TIPS_SENT':
                return PaperAirplaneIcon;

            // Event ile ilgili
            case 'EVENT_STARTED':
                return CalendarIcon;
            case 'EVENT_ENDING_SOON':
                return ClockIcon;
            case 'EVENT_REWARD_AVAILABLE':
                return GiftIcon;

            default:
                return BellIcon;
        }
    };

    const handlePress = () => {
        if (!notification.read && onMarkAsRead) {
            markAsReadMutation.mutate(notification.id, {
                onSuccess: () => {
                    onMarkAsRead();
                },
            });
        }
        if (onPress) {
            onPress();
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            deleteMutation.mutate(notification.id, {
                onSuccess: () => {
                    onDelete();
                },
            });
        }
    };

    // Backend formatına göre: avatar direkt olarak geliyor, data objesi içinde ek bilgiler var
    const userAvatar = notification.avatar 
        ? toImageSource(notification.avatar)
        : DEFAULT_USER_AVATAR;
    
    // data veya metadata'dan kullanıcı adını al (backward compatibility)
    const userName = notification.data?.userName || 
                     notification.data?.likerName || 
                     notification.data?.commenterName || 
                     notification.data?.senderName ||
                     notification.metadata?.userName || 
                     'Kullanıcı';
    
    const IconComponent = getIconComponent(notification.type);
    
    // Backend'den gelen data objesinden veya metadata'dan ekstra içerikleri al (backward compatibility)
    const data = notification.data || notification.metadata || {};
    const postId = data.postId;
    const commentId = data.commentId;
    const eventId = data.eventId;
    const eventName = data.eventName;
    const commentContent = data.messagePreview || data.commentContent || data.commentText;
    const tipsAmount = data.amount || data.rewardAmount;
    
    // imageUrl varsa göster (event veya post görseli için)
    const showImageUrl = notification.imageUrl;
    
    // Post card gösterimi için kontrol
    const showPostCard = (notification.type === 'POST_LIKED' || 
                         notification.type === 'POST_COMMENTED' || 
                         notification.type === 'POST_FAVORITED' || 
                         notification.type === 'POST_SHARED') && 
                         (postId || showImageUrl);
    
    // Tips badge gösterimi
    const showTipsBadge = (notification.type === 'TIPS_RECEIVED' || notification.type === 'TIPS_SENT') && tipsAmount;
    
    // Yorum metni veya mesaj önizlemesi gösterimi
    const showCommentText = ((notification.type === 'POST_COMMENTED' || 
                              notification.type === 'COMMENT_REPLIED' || 
                              notification.type === 'NEW_MESSAGE') && commentContent);
    
    // Trust butonu gösterimi
    const showTrustButton = (notification.type === 'NEW_TRUSTER' || notification.type === 'NEW_TRUSTED_BY');
    
    // Event bilgisi gösterimi
    const showEventInfo = (notification.type === 'EVENT_STARTED' || 
                          notification.type === 'EVENT_ENDING_SOON' || 
                          notification.type === 'EVENT_REWARD_AVAILABLE') && 
                          (eventName || showImageUrl);

    return (
        <Pressable 
            onPress={handlePress}
            py={12}
            px={16}
            borderBottomWidth={1}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
        >
            <VStack space="xs">
                {/* Main Notification Row */}
                <HStack space="md" alignItems="flex-start">
                    {/* Avatar - Mor/pembe border ile */}
                    <Box position="relative">
                        <Box
                            width={48}
                            height={48}
                            borderRadius={24}
                            borderWidth={2.5}
                            borderColor="#C084FC"
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Image
                                source={userAvatar}
                                alt="User avatar"
                                width={44}
                                height={44}
                                borderRadius={22}
                            />
                        </Box>
                        {!notification.read && (
                            <Box
                                position="absolute"
                                top={-2}
                                right={-2}
                                width={12}
                                height={12}
                                borderRadius={6}
                                bg="#E8FF6B"
                                borderWidth={2}
                                borderColor={isDark ? '#000000' : '#FFFFFF'}
                            />
                        )}
                    </Box>

                    {/* Content - Ortada */}
                    <VStack flex={1} space="xs" mr="$2">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$sm"
                            fontWeight="$normal"
                        >
                            {notification.message}
                        </Text>
                    </VStack>

                    {/* Time and Icon - Sağda */}
                    <VStack alignItems="flex-end" space="xs" justifyContent="flex-start">
                        <Text
                            color="#8C8C8C"
                            fontSize="$xs"
                            fontWeight="$medium"
                        >
                            {formatRelativeTime(notification.createdAt)}
                        </Text>
                        <IconComponent width={20} height={20} color="#7D7D7D" />
                    </VStack>
                </HStack>

                {/* Extra Content - Altında */}
                {showTipsBadge && (
                    <Box ml={56} mt="$1">
                        <Box
                            bg="#E8FF6B"
                            borderRadius={20}
                            px="$3"
                            py="$1"
                            alignSelf="flex-start"
                        >
                            <Text
                                color="#000000"
                                fontSize="$xs"
                                fontWeight="$bold"
                            >
                                +{tipsAmount} TIPS
                            </Text>
                        </Box>
                    </Box>
                )}

                {showCommentText && (
                    <Box ml={56} mt="$1" mr="$2">
                        <Text
                            color={isDark ? '#B9B9B9' : '#666666'}
                            fontSize="$xs"
                            fontWeight="$normal"
                        >
                            {commentContent}
                        </Text>
                    </Box>
                )}

                {showPostCard && (
                    <Box ml={56} mt="$2" mr="$2">
                        <Box
                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                            borderRadius={8}
                            p="$3"
                        >
                            {showImageUrl && (
                                <Image
                                    source={toImageSource(notification.imageUrl!)}
                                    alt="Post image"
                                    style={{ width: '100%' }}
                                    height={120}
                                    borderRadius={8}
                                    mb="$2"
                                    resizeMode="cover"
                                />
                            )}
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize="$sm"
                                fontWeight="$bold"
                            >
                                {notification.title}
                            </Text>
                        </Box>
                    </Box>
                )}

                {showEventInfo && (
                    <Box ml={56} mt="$2" mr="$2">
                        <Box
                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                            borderRadius={8}
                            p="$3"
                        >
                            {showImageUrl && (
                                <Image
                                    source={toImageSource(notification.imageUrl!)}
                                    alt="Event image"
                                    style={{ width: '100%' }}
                                    height={120}
                                    borderRadius={8}
                                    mb="$2"
                                    resizeMode="cover"
                                />
                            )}
                            {eventName && (
                                <Text
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize="$sm"
                                    fontWeight="$bold"
                                    
                                >
                                    {eventName}
                                </Text>
                            )}
                            <Text
                                color={isDark ? '#B9B9B9' : '#666666'}
                                fontSize="$xs"
                                fontWeight="$normal"
                            >
                                {notification.message}
                            </Text>
                        </Box>
                    </Box>
                )}

                {showTrustButton && (
                    <Box ml={56} mt={-10}>
                        <Pressable
                            bg="#E8FF6B"
                            borderRadius={20}
                            px="$4"
                            py="$2"
                            alignSelf="flex-start"
                            onPress={onPress}
                        >
                            <Text
                                color="#000000"
                                fontSize="$xs"
                                fontWeight="$semibold"
                            >
                                Profili Görüntüle
                            </Text>
                        </Pressable>
                    </Box>
                )}
            </VStack>
        </Pressable>
    );
};


const NotificationsScreenComponent: React.FC = () => {
    const navigation = useNavigation<NotificationsScreenNavigationProp>();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAppStore();
    const { isAuthReady } = useAuth();
    const pagerRef = useRef<PagerView>(null);
    const tabContainerRef = useRef<any>(null);
    const [tabContainerWidth, setTabContainerWidth] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters] = useState<NotificationFilter[]>(notification_filters);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    
    // CRITICAL: Mark all as read işleminin sadece bir kez çalışması için ref
    const hasMarkedAllAsReadRef = useRef(false);

    // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
    const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);

    // Get active filter based on current page
    const activeFilter = filters[currentPage] || filters[0];

    // API hooks - shouldFetchNotifications tanımı useFocusEffect'ten önce olmalı
    const shouldFetchNotifications = isAuthenticated && isAuthReady;
    const unreadOnly = activeFilter?.id === 'unread';
    
    // CRITICAL FIX: Backend API formatına göre type parametresini map et
    // Backend: type=all, type=tips, type=truster, type=replies
    const notificationType: 'all' | 'tips' | 'truster' | 'replies' | undefined = useMemo(() => {
      if (!activeFilter || activeFilter.id === 'all' || activeFilter.id === 'unread') {
        return undefined; // Backend'de type parametresi gönderme (tüm bildirimler)
      }
      // Filter ID'leri backend formatına göre map et
      return activeFilter.id as 'all' | 'tips' | 'truster' | 'replies';
    }, [activeFilter]);

    // Debounce search query for API calls
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery.trim());
      }, 500);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    // API hooks - useNotifications hook'unu useFocusEffect'ten önce çağır (infinite query)
    const { 
        data: notificationsResponse, 
        isLoading, 
        error, 
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useNotifications({
        limit: 20, // Backend default limit
        unreadOnly: unreadOnly,
        type: notificationType, // CRITICAL FIX: Backend API formatına göre type parametresi
        search: debouncedSearchQuery || undefined,
    }, shouldFetchNotifications); // Sadece authenticated ve auth ready olduğunda query çalışsın

    // Mark all notifications as read mutation
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    // DEBUG: API response formatını kontrol et
    useEffect(() => {
        if (notificationsResponse) {
            const pages = notificationsResponse.pages;
            const firstPage = pages?.[0];
            console.log('[NotificationsScreen] 📦 API Response:', {
                hasResponse: !!notificationsResponse,
                hasPages: !!pages,
                pagesCount: pages?.length || 0,
                hasData: !!firstPage?.data,
                dataType: Array.isArray(firstPage?.data) ? 'array' : typeof firstPage?.data,
                dataLength: Array.isArray(firstPage?.data) ? firstPage.data.length : 'N/A',
                success: firstPage?.success,
                fullResponse: notificationsResponse,
            });
        }
    }, [notificationsResponse]);

    // CRITICAL FIX: refetch ve markAllAsReadMutation'ı useRef ile wrap et - stable referans için
    const refetchRef = useRef(refetch);
    const markAllAsReadMutationRef = useRef(markAllAsReadMutation);
    
    // Ref'leri güncelle
    useEffect(() => {
        refetchRef.current = refetch;
        markAllAsReadMutationRef.current = markAllAsReadMutation;
    }, [refetch, markAllAsReadMutation]);

    // CRITICAL FIX: Tab değiştiğinde query'yi invalidate et ve refetch et - önceki tab'ın verilerini göstermemek için
    useEffect(() => {
        if (shouldFetchNotifications) {
            // Tab değiştiğinde önceki query'yi invalidate et (cache'den temizle)
            // Bu sayede yeni tab için doğru veriler çekilir
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            // Yeni filtreye göre verileri çek
            refetch();
        }
    }, [currentPage, shouldFetchNotifications, refetch, queryClient]);

    useFocusEffect(
        useCallback(() => {
            // Ekran focus aldığında drawer gesture'ı disable et
            setGestureEnabled(false);
            
            // Ekran focus aldığında tüm bildirimleri okunmuş olarak işaretle
            // CRITICAL: Sadece bir kez çalışması için ref kontrolü (sonsuz döngü önleme)
            if (shouldFetchNotifications && !hasMarkedAllAsReadRef.current) {
                hasMarkedAllAsReadRef.current = true;
                
                // Optimistic update: Unread count'u 0'a düşür (anında görünsün)
                const notificationStore = useNotificationStore.getState();
                
                // Store'daki unread count'u 0'a düşür
                notificationStore.setUnreadCountCache(0);
                
                // React Query cache'deki unread count'u da 0'a düşür
                queryClient.setQueryData(notificationKeys.unreadCount(), {
                    success: true,
                    data: { count: 0 },
                });
                
                // Tüm bildirimleri okunmuş olarak işaretle (optimistic update)
                const queryCache = queryClient.getQueryCache();
                const listQueries = queryCache.findAll({ queryKey: notificationKeys.lists() });
                
                listQueries.forEach((query) => {
                    const cachedData = query.state.data as { success: boolean; data: Notification[] } | undefined;
                    
                    if (cachedData && Array.isArray(cachedData.data)) {
                        const updatedData = cachedData.data.map((notification) => ({
                            ...notification,
                            read: true,
                        }));
                        
                        queryClient.setQueryData(query.queryKey, {
                            ...cachedData,
                            data: updatedData,
                        });
                    }
                });
                
                // API'ye istek gönder (background'da)
                // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı
                markAllAsReadMutationRef.current.mutate(undefined, {
                    onError: (error) => {
                        // Hata durumunda cache'i geri yükle (refetch yapacak)
                        console.warn('[NotificationsScreen] ⚠️ Failed to mark all as read:', error);
                        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
                        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
                    },
                });
                
                // Bildirimleri refetch et (yeni bildirimler için)
                // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı
                refetchRef.current();
            }
            
            return () => {
                // Ekran blur olduğunda drawer gesture'ı tekrar enable et
                setGestureEnabled(true);
                // CRITICAL: Ref'i resetle - bir sonraki focus'ta tekrar çalışsın
                hasMarkedAllAsReadRef.current = false;
            };
        }, [setGestureEnabled, shouldFetchNotifications, queryClient])
        // CRITICAL FIX: refetch ve markAllAsReadMutation dependency'den kaldırıldı
        // useRef ile wrap edildi, callback içinde ref.current ile çağrılıyor
    );
    
    // PERFORMANCE FIX: Memoize background colors to prevent re-renders
    const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);
    const tabHeaderBgColor = useMemo(() => '#FFFFFF', []); // Tab header her zaman beyaz
    
    // 🎯 CORE: Shared progress value (0 = All, 1 = Replies, 2 = Trust, 3 = Tips)
    const progress = useSharedValue(0);

    // SAFETY FIX: Ensure notifications is always an array
    // Infinite query response format: { pages: Array<{ success, data: Notification[], pagination }>, pageParams }
    const notifications = useMemo(() => {
        if (!notificationsResponse) {
            console.log('[NotificationsScreen] ⚠️ No notificationsResponse');
            return [];
        }
        
        // Infinite query format: { pages: [...], pageParams: [...] }
        // ÖNEMLİ: pages undefined olabilir, bu yüzden güvenli kontrol yap
        const pages = notificationsResponse.pages;
        if (pages && Array.isArray(pages) && pages.length > 0) {
            // Tüm sayfalardaki bildirimleri birleştir
            // Güvenli kontrol: Her page'in data'sı olmalı ve array olmalı
            const allNotifications = pages.flatMap((page: any) => {
                // Page undefined veya null olabilir
                if (!page) {
                    return [];
                }
                // Page.data undefined veya array değilse boş array döndür
                if (page.data && Array.isArray(page.data)) {
                    return page.data;
                }
                return [];
            });
            
            console.log('[NotificationsScreen] ✅ Found notifications from infinite query:', {
                totalPages: pages.length,
                totalCount: allNotifications.length,
                hasNextPage: hasNextPage,
                firstItem: allNotifications[0] ? {
                    id: allNotifications[0].id,
                    type: allNotifications[0].type,
                    title: allNotifications[0].title,
                } : null,
            });
            
            return allNotifications;
        }
        
        // Fallback: Eski format (backward compatibility) - InfiniteData'da data property yok
        // Bu durum zaten yukarıda pages kontrolü ile ele alınıyor
        
        console.warn('[NotificationsScreen] ⚠️ Unexpected response format:', {
            response: notificationsResponse,
            type: typeof notificationsResponse,
            isArray: Array.isArray(notificationsResponse),
            hasPages: !!(notificationsResponse as any)?.pages,
            hasData: !!(notificationsResponse as any)?.data,
        });
        
        return [];
    }, [notificationsResponse, hasNextPage]);
    
    // Tab press handler - PagerView native animasyonu ile geçiş
    const handleTabPress = useCallback((index: number) => {
        pagerRef.current?.setPage(index);
    }, []);

    // PagerView scroll handler - realtime progress güncelleme
    const handlePageScroll = useCallback(
        (e: any) => {
            'worklet';
            const { position, offset } = e.nativeEvent;
            progress.value = position + offset;
        },
        [progress]
    );

    // PagerView page selected handler - snap sonrası progress'i sync et
    const handlePageSelected = useCallback(
        (e: any) => {
            const position = e.nativeEvent.position;
            progress.value = withTiming(position, { duration: 0 });
            setCurrentPage(position);
        },
        [progress]
    );

    // CRITICAL FIX: handleRefresh'i useCallback ile memoize et - sonsuz döngü önleme
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]); // refetch React Query'den geldiği için genellikle stable, ama dependency'de tutuyoruz

    /**
     * Notification'a tıklandığında navigation action'ı al
     * NotificationService kullanarak domain logic'i merkezi hale getiriyoruz
     */
    const getNavigationAction = useCallback((notification: Notification) => {
        // NotificationService'den navigation action'ı al
        // Bu sayede navigation logic tek bir yerde (domain service) tutuluyor
        return notificationService.getNavigationAction(notification);
    }, []);

    /**
     * Notification'a tıklandığında navigation yap
     * Yeni hibrit mimariye göre NavigationService kullanır
     * 
     * Navigation Flow:
     * 1. NotificationService'den navigation action al
     * 2. Global screens (Post, Profile, Wallet, vb.) → Root'tan açılır
     * 3. Tab screens (Feed, Explore, vb.) → Nested navigation ile açılır
     */
    const handleNotificationPress = useCallback((notification: Notification) => {
        try {
            const action = getNavigationAction(notification);
            
            if (!action) {
                return;
            }

            const { route, params } = action;

            // Global screens (RootStackParamList) → NavigationService.navigate()
            // Bu ekranlar GlobalStackGroup'ta tanımlı: Post, Profile, Wallet, MessageDetail, vb.
            const rootRouteValues = Object.values(ROOT_ROUTES) as string[];
            if (rootRouteValues.includes(route)) {
                navigationService.navigate(route as any, params, {
                    priority: 'high', // Kullanıcı tıklaması yüksek öncelikli
                    force: false, // App State Awareness kontrolü yapılır
                });
                return;
            }

            // Tab screens (MainStackParamList) → NavigationService.navigateNested()
            // Bu ekranlar TabNavigator içinde: Feed, Explore, Catalog, Events, vb.
            const tabRouteValues = Object.values(TAB_ROUTES) as string[];
            if (tabRouteValues.includes(route)) {
                const tabRoute = route as keyof typeof TAB_ROUTES;
                const screenName = params?.screen || 'FeedScreen';
                const screenParams = params?.params || {};
                
                navigationService.navigateNested(tabRoute as any, screenName as any, {
                    params: screenParams,
                    priority: 'high', // Kullanıcı tıklaması yüksek öncelikli
                    force: false, // App State Awareness kontrolü yapılır
                });
                return;
            }

            // Fallback: Bilinmeyen route (backward compatibility)
            console.warn('[NotificationsScreen] ⚠️ Unknown route, using fallback navigation:', route);
            navigation.navigate(route as any, params);
        } catch (error) {
            console.error('[NotificationsScreen] ❌ Navigation error:', error);
            console.error('[NotificationsScreen] Notification:', notification);
        }
    }, [getNavigationAction, navigation]);

    const handleMarkAsRead = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }, [queryClient]);

    const handleDelete = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    }, [queryClient]);

    // Get filtered notifications for a specific filter
    // CRITICAL FIX: Backend filtering yapıldığı için client-side filtering sadece fallback olarak kullanılıyor
    const getFilteredNotificationsForFilter = useCallback((filter: NotificationFilter): Notification[] => {
        // SAFETY FIX: Ensure notifications is always an array before filtering
        if (!Array.isArray(notifications)) {
            console.warn('[NotificationsScreen] ⚠️ notifications is not an array:', notifications);
            return [];
        }

        // Backend'den zaten filtrelenmiş data geldiği için direkt kullan
        // Sadece search query için client-side filtering yap
        let filtered = notifications;

        // CRITICAL FIX: Backend filtering yapıldığı için type-based filtering kaldırıldı
        // Backend'den gelen data zaten filtrelenmiş (type parametresi ile)
        // Sadece search query için client-side filtering yapılıyor

        if (searchQuery && Array.isArray(filtered)) {
            filtered = filtered.filter(notification => {
                // SAFETY FIX: Ensure notification properties exist before accessing
                if (!notification || typeof notification !== 'object') {
                    return false;
                }
                
                const message = notification.message?.toLowerCase() || '';
                const title = notification.title?.toLowerCase() || '';
                // Backend formatına göre: userName data veya metadata içinde olabilir
                const userName = (notification.data?.userName || 
                                 notification.data?.likerName || 
                                 notification.data?.commenterName || 
                                 notification.data?.senderName ||
                                 notification.metadata?.userName || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                
                return message.includes(query) || 
                       title.includes(query) || 
                       userName.includes(query);
            });
        }

        // SAFETY FIX: Ensure return value is always an array
        return Array.isArray(filtered) ? filtered : [];
    }, [notifications, searchQuery]);

    // Asset pre-caching - notifications yüklendiğinde images'ı cache'le
    useEffect(() => {
        if (notifications.length > 0) {
            notificationAssetCache.cacheBatchNotifications(notifications);
        }
    }, [notifications.length]);

    // Tab label color animations - her tab için ayrı style
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';

    // Tab 0 (All Notifications)
    const tab0Style = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [-0.5, 0, 0.5],
            [activeColor, activeColor, inactiveColor]
        );
        return { color };
    }, [isDark]);

    // Tab 1 (Replies)
    const tab1Style = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [0.5, 1, 1.5],
            [inactiveColor, activeColor, inactiveColor]
        );
        return { color };
    }, [isDark]);

    // Tab 2 (Trust)
    const tab2Style = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [1.5, 2, 2.5],
            [inactiveColor, activeColor, inactiveColor]
        );
        return { color };
    }, [isDark]);

    // Tab 3 (Tips)
    const tab3Style = useAnimatedStyle(() => {
        const color = interpolateColor(
            progress.value,
            [2.5, 3, 3.5],
            [inactiveColor, activeColor, activeColor]
        );
        return { color };
    }, [isDark]);

    const getTabStyle = (index: number) => {
        switch (index) {
            case 0: return tab0Style;
            case 1: return tab1Style;
            case 2: return tab2Style;
            case 3: return tab3Style;
            default: return tab0Style;
        }
    };

    // Indicator position animation
    const tabWidth = tabContainerWidth / filters.length || 0;
    const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
    const indicatorStyle = useAnimatedStyle(() => {
        const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
        return {
            transform: [{ translateX }],
        };
    });

    // FlatList renderItem - useCallback ile memoize et
    const renderNotificationItem = React.useCallback(({ item }: { item: Notification }) => {
        return (
            <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
            />
        );
    }, [handleNotificationPress, handleMarkAsRead, handleDelete]);
    
    // Key extractor - unique ID kullan
    const keyExtractor = React.useCallback((item: Notification) => item.id, []);

    // Render notifications list for a specific filter
    const renderNotificationsList = useCallback((filterIndex: number) => {
        const filter = filters[filterIndex];
        const filtered = getFilteredNotificationsForFilter(filter);
        
        // SAFETY FIX: Ensure filtered is always an array
        if (!Array.isArray(filtered)) {
            console.warn('[NotificationsScreen] ⚠️ filtered is not an array:', filtered);
            return (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        Bildirimler yüklenirken bir hata oluştu.
                    </Text>
                </Box>
            );
        }
        
        if (isLoading && !notifications.length) {
            return (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Spinner size="large" />
                </Box>
            );
        }
        
        if (error) {
            return (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        Bildirimler yüklenirken bir hata oluştu.
                    </Text>
                    <Pressable onPress={() => refetch()} mt="$4" bg="#E8FF6B" px="$4" py="$2" borderRadius={10}>
                        <Text color="#000000" fontSize={12} fontWeight="$semibold">
                            Tekrar Dene
                        </Text>
                    </Pressable>
                </Box>
            );
        }
        
        if (filtered.length === 0) {
            return (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        {searchQuery ? 'No search results found.' : 'No notifications yet.'}
                    </Text>
                </Box>
            );
        }
        
        // Estimated item height: avatar (48px) + content + extra content (post card, comment, etc.) + margins (~150px)
        const estimatedItemHeight = 150;
        
        return (
            <FlashList
                data={filtered}
                renderItem={renderNotificationItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ 
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: estimatedItemHeight, // 1 item boyutu kadar padding
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                    />
                }
                onEndReached={() => {
                    // Daha fazla sayfa varsa yükle
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <Box py="$4" alignItems="center">
                            <Spinner size="small" />
                        </Box>
                    ) : null
                }
                style={{ flex: 1 }}
            />
        );
    }, [
        isLoading, 
        notifications.length, 
        error, 
        searchQuery, 
        isDark, 
        renderNotificationItem, 
        keyExtractor, 
        refreshing, 
        handleRefresh, 
        filters, 
        getFilteredNotificationsForFilter, 
        hasNextPage, 
        isFetchingNextPage, 
        fetchNextPage
    ]);
    // CRITICAL FIX: refetch dependency'den kaldırıldı - handleRefresh zaten refetch'i kullanıyor

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Box flex={1} bg={backgroundColor}>
            {/* Header */}
            <Header 
                title="Notifications"
                leftAction="menu"
            />
            
            {/* Search Bar - Fixed at top */}
            <VStack
                space="md"
                pb="$4"
                px="$4"
                bg={backgroundColor}
            >
                <HStack
                    alignItems="center"
                    bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    borderRadius={20}
                    px={14}
                    space="sm"
                >
                    <MagnifyingGlassIcon
                        width={24}
                        height={24}
                        color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                    />
                    <Input flex={1} borderWidth={0} bg="transparent">
                        <InputField
                            placeholder="Search in notifications"
                            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                            color={isDark ? '#000' : '#000'}
                            fontSize="$xs"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </Input>
                </HStack>
            </VStack>

            {/* Tab Header */}
            <VStack pt={0} bg={tabHeaderBgColor}>
                <HStack
                    ref={tabContainerRef}
                    borderBottomWidth={1}
                    borderColor="#E9E9E9"
                    p={0}
                    mb="$2"
                    position="relative"
                    onLayout={(event) => {
                        const width = event.nativeEvent.layout.width;
                        setTabContainerWidth(width);
                    }}
                >
                    {filters.map((filter, index) => {
                        const tabStyle = getTabStyle(index);
                        return (
                            <Pressable
                                key={filter.id}
                                flex={1}
                                onPress={() => handleTabPress(index)}
                                alignItems="center"
                                pb={8}
                                px="$1"
                            >
                                <VStack alignItems="center" space="xs">
                                    <Animated.Text
                                        style={[
                                            {
                                                fontSize: 14,
                                                fontWeight: 'bold',
                                            },
                                            tabStyle,
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {filter.label}
                                    </Animated.Text>
                                </VStack>
                            </Pressable>
                        );
                    })}

                    {/* Animated Indicator */}
                    {tabWidth > 0 && (
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    width: indicatorWidth,
                                    height: 2,
                                    backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                },
                                indicatorStyle,
                            ]}
                        />
                    )}
                </HStack>
            </VStack>

            {/* PagerView - Native swipe tab switching */}
            <AnimatedPagerView
                ref={pagerRef}
                style={{ flex: 1 }}
                initialPage={0}
                onPageScroll={handlePageScroll}
                onPageSelected={handlePageSelected}
            >
                {filters.map((filter, index) => (
                    <Box key={filter.id} flex={1}>
                        {renderNotificationsList(index)}
                    </Box>
                ))}
            </AnimatedPagerView>
        </Box>
        </SafeAreaView>
    );
};

// PERFORMANCE FIX: Memoize NotificationsScreen to prevent unnecessary re-renders during tab transitions
const NotificationsScreen = React.memo(NotificationsScreenComponent);

NotificationsScreen.displayName = 'NotificationsScreen';

export default NotificationsScreen;
