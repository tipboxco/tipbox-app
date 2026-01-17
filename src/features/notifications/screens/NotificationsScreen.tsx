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
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { notification_filters } from '@/src/mock/notifications';
import { NotificationFilter } from '@/src/mock/notifications/types';
import { Header } from '@/src/components/Header';
import {
    useNotifications,
    useMarkAllNotificationsAsRead,
    notificationKeys,
} from '../api/hooks';
import type { Notification } from '../api/types';
import { NotificationCard } from '../components/NotificationCard';
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
import { useBottomOffset } from '@/src/utils';

const { width } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type NotificationsScreenNavigationProp = NativeStackNavigationProp<NotificationsStackParamList, 'NotificationsScreen'>;

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
    // CRITICAL FIX: Replies ve Tips tabları yer değiştirmeli
    // Yeni sıralama: All/Unread, Tips, Trust, Replies
    const [filters] = useState<NotificationFilter[]>(() => {
        const originalFilters = [...notification_filters];
        // filters[1] = Replies, filters[3] = Tips
        // Yer değiştir: Tips -> index 1, Replies -> index 3
        const [allFilter, repliesFilter, trustFilter, tipsFilter] = originalFilters;
        return [allFilter, tipsFilter, trustFilter, repliesFilter];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    
    // CRITICAL: Mark all as read işleminin sadece bir kez çalışması için ref
    const hasMarkedAllAsReadRef = useRef(false);
    
    // Bottom offset for content padding (NotificationsScreen tab bar içinde olduğu için includeTabBar: true)
    const bottomOffset = useBottomOffset({ includeTabBar: true, extraPadding: 24 });

    // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
    const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);

    // API hooks - shouldFetchNotifications tanımı useFocusEffect'ten önce olmalı
    const shouldFetchNotifications = isAuthenticated && isAuthReady;

    // Debounce search query for API calls
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery.trim());
      }, 500);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    // CRITICAL FIX: Her filter için ayrı query yap - her tab kendi verilerini çekmeli
    // PERFORMANCE FIX: Sadece aktif tab'ın query'sini enabled yap - aynı anda 4 istek atmayı önle
    // Diğer tab'lar cache'den okuyacak, tab değiştiğinde o tab'ın query'si enable olacak
    
    // Filter 0: All/Unread
    // CRITICAL FIX: İlk açılışta query'nin başlaması için ilk tab'ı her zaman enable et
    const allFilter = filters[0];
    const allUnreadOnly = allFilter?.id === 'unread';
    const allNotificationType: 'all' | 'tips' | 'truster' | 'replies' | undefined = undefined;
    // İlk tab için: auth ready ise her zaman enable et (ilk açılışta başlasın)
    // Diğer tablar için: sadece o tab aktif olduğunda enable et
    const allQueryEnabled = shouldFetchNotifications; // İlk tab için her zaman enable
    const allQuery = useNotifications({
        limit: 20,
        unreadOnly: allUnreadOnly,
        type: allNotificationType,
        search: debouncedSearchQuery || undefined,
    }, allQueryEnabled);

    // Filter 1: Tips (UI'da Tips tabı ama backend'de replies type'ı kullanılıyor)
    // CRITICAL FIX: Tips tabında Replies bildirimleri görünüyor, bu yüzden type=replies kullanıyoruz
    const tipsFilter = filters[1];
    const tipsUnreadOnly = tipsFilter?.id === 'unread';
    const tipsNotificationType: 'all' | 'tips' | 'truster' | 'replies' | undefined = 'replies';
    const tipsQueryEnabled = shouldFetchNotifications && currentPage === 1;
    const tipsQuery = useNotifications({
        limit: 10, // CRITICAL FIX: limit=10 olarak değiştirildi
        unreadOnly: tipsUnreadOnly,
        type: tipsNotificationType, // type=replies (Tips tabında Replies bildirimleri gösteriliyor)
        search: debouncedSearchQuery || undefined,
    }, tipsQueryEnabled);

    // Filter 2: Trust
    const trustFilter = filters[2];
    const trustUnreadOnly = trustFilter?.id === 'unread';
    const trustNotificationType: 'all' | 'tips' | 'truster' | 'replies' | undefined = 'truster';
    const trustQueryEnabled = shouldFetchNotifications && currentPage === 2;
    const trustQuery = useNotifications({
        limit: 20,
        unreadOnly: trustUnreadOnly,
        type: trustNotificationType,
        search: debouncedSearchQuery || undefined,
    }, trustQueryEnabled);

    // Filter 3: Replies (UI'da Replies tabı ama backend'de tips type'ı kullanılıyor)
    // CRITICAL FIX: Replies tabında Tips bildirimleri görünüyor, bu yüzden type=tips kullanıyoruz
    const repliesFilter = filters[3];
    const repliesUnreadOnly = repliesFilter?.id === 'unread';
    const repliesNotificationType: 'all' | 'tips' | 'truster' | 'replies' | undefined = 'tips';
    const repliesQueryEnabled = shouldFetchNotifications && currentPage === 3;
    const repliesQuery = useNotifications({
        limit: 20,
        unreadOnly: repliesUnreadOnly,
        type: repliesNotificationType, // type=tips (Replies tabında Tips bildirimleri gösteriliyor)
        search: debouncedSearchQuery || undefined,
    }, repliesQueryEnabled);

    // Her filter için query sonuçlarını map et - useMemo ile memoize et (sonsuz döngü önleme)
    // CRITICAL FIX: Sıralama değişti: All, Tips, Trust, Replies
    const filterQueryResults = useMemo(() => [allQuery, tipsQuery, trustQuery, repliesQuery], [allQuery, tipsQuery, trustQuery, repliesQuery]);

    // Mark all notifications as read mutation
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();
    const markAllAsReadMutationRef = useRef(markAllAsReadMutation);
    
    // Ref'i güncelle
    useEffect(() => {
        markAllAsReadMutationRef.current = markAllAsReadMutation;
    }, [markAllAsReadMutation]);

    // PERFORMANCE FIX: Tab değiştiğinde aktif tab'ın query'sini refetch et (cache invalid ise)
    // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - useRef ile wrap edildi
    const filterQueryResultsRef = useRef(filterQueryResults);
    useEffect(() => {
        filterQueryResultsRef.current = filterQueryResults;
    }, [filterQueryResults]);

    // CRITICAL FIX: İlk açılışta query'nin direkt başlaması için useEffect eklendi
    // İlk tab için query enabled olsa bile, React Query bazen query'yi başlatmıyor
    // Bu durumda manuel olarak query'yi başlatıyoruz
    useEffect(() => {
        // İlk tab için: shouldFetchNotifications true ise ve query enabled ise ama henüz başlamamışsa başlat
        if (shouldFetchNotifications && allQueryEnabled) {
            const queryStatus = allQuery.status;
            const hasNoData = !allQuery.data;
            const isNotLoading = !allQuery.isLoading && !allQuery.isFetching && !allQuery.isPending;
            
            // Query henüz başlamamışsa (pending) veya error durumunda takılı kalmışsa başlat
            // CRITICAL: Query enabled olsa bile, React Query bazen query'yi başlatmıyor
            // Bu durumda manuel olarak refetch çağırarak query'yi başlatıyoruz
            if (hasNoData && isNotLoading) {
                // Query status'u kontrol et - pending veya error ise başlat
                if (queryStatus === 'pending' || queryStatus === 'error') {
                    // Query'yi başlat - refetch çağrısı query'yi başlatacak
                    const refetchFn = (allQuery as { refetch?: () => Promise<unknown> }).refetch;
                    if (refetchFn) {
                        refetchFn().catch((error: unknown) => {
                            console.warn('[NotificationsScreen] Failed to refetch allQuery:', error);
                        });
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldFetchNotifications, allQueryEnabled]);

    // CRITICAL FIX: Tab değiştiğinde aktif tab'ın query'sini başlat
    useEffect(() => {
        if (!shouldFetchNotifications) {
            return;
        }
        
        // Aktif tab'ın query'sini al
        const activeQuery = filterQueryResultsRef.current[currentPage];
        if (!activeQuery) {
            return;
        }
        
        // Query enabled kontrolü
        const isQueryEnabled = 
            currentPage === 0 ? allQueryEnabled :
            currentPage === 1 ? tipsQueryEnabled :
            currentPage === 2 ? trustQueryEnabled :
            repliesQueryEnabled;
        
        if (!isQueryEnabled) {
            return;
        }
        
        // Query durumunu kontrol et
        const queryStatus = activeQuery.status;
        const hasNoData = !activeQuery.data;
        const isNotLoading = !activeQuery.isLoading && !activeQuery.isFetching && !activeQuery.isPending;
        
        // Query henüz başlamamışsa (pending) veya error durumunda başlat
        if (hasNoData && isNotLoading && (queryStatus === 'pending' || queryStatus === 'error')) {
            const refetchFn = (activeQuery as { refetch?: () => Promise<unknown> }).refetch;
            if (refetchFn) {
                refetchFn().catch((error: unknown) => {
                    console.warn(`[NotificationsScreen] Failed to refetch query for tab ${currentPage}:`, error);
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, shouldFetchNotifications, allQueryEnabled, tipsQueryEnabled, trustQueryEnabled, repliesQueryEnabled]);

    useFocusEffect(
        useCallback(() => {
            // Ekran focus aldığında drawer gesture'ı disable et
            setGestureEnabled(false);
            
            // CRITICAL FIX: İlk açılışta query'yi başlat
            // Query enabled olsa bile, React Query bazen query'yi başlatmıyor
            // Bu durumda manuel olarak query'yi başlatıyoruz
            if (shouldFetchNotifications && allQueryEnabled) {
                const queryStatus = allQuery.status;
                const hasNoData = !allQuery.data;
                const isNotLoading = !allQuery.isLoading && !allQuery.isFetching && !allQuery.isPending;
                
                // Query henüz başlamamışsa başlat
                if (hasNoData && isNotLoading && queryStatus === 'pending') {
                    const refetchFn = (allQuery as { refetch?: () => Promise<unknown> }).refetch;
                    if (refetchFn) {
                        refetchFn().catch((error: unknown) => {
                            console.warn('[NotificationsScreen] Failed to refetch allQuery on focus:', error);
                        });
                    }
                }
            }
            
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
                
                // PERFORMANCE FIX: Sadece aktif tab'ı refetch et (yeni bildirimler için)
                // Diğer tab'lar cache'den okuyacak, tab değiştiğinde o tab'ın query'si enable olacak
                // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı
                if (filterQueryResultsRef.current[currentPage]) {
                    filterQueryResultsRef.current[currentPage].refetch();
                }
            }
            
            return () => {
                // Ekran blur olduğunda drawer gesture'ı tekrar enable et
                setGestureEnabled(true);
                // CRITICAL: Ref'i resetle - bir sonraki focus'ta tekrar çalışsın
                // BUG FIX: currentPage dependency'den kaldırıldı - tab değişikliğinde ref resetlenmemeli
                hasMarkedAllAsReadRef.current = false;
            };
        }, [setGestureEnabled, shouldFetchNotifications, queryClient, allQueryEnabled, allQuery.status, allQuery.data])
        // BUG FIX: currentPage dependency'den kaldırıldı - tab değişikliğinde useFocusEffect tekrar çalışmamalı
        // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - useRef ile wrap edildi
        // CRITICAL FIX: allQuery objesi yerine spesifik değerleri dependency array'e ekledik (sonsuz döngü önleme)
    );
    
    // PERFORMANCE FIX: Memoize background colors to prevent re-renders
    const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);
    const tabHeaderBgColor = useMemo(() => '#FFFFFF', []); // Tab header her zaman beyaz
    
    // 🎯 CORE: Shared progress value (0 = All, 1 = Replies, 2 = Trust, 3 = Tips)
    const progress = useSharedValue(0);

    // Helper function: Infinite query response'dan notifications array'i çıkar
    const extractNotificationsFromResponse = useCallback((response: any): Notification[] => {
        if (!response) {
            return [];
        }
        
        const pages = response.pages;
        if (pages && Array.isArray(pages) && pages.length > 0) {
            const allNotifications = pages.flatMap((page: any) => {
                if (!page) {
                    return [];
                }
                if (page.data && Array.isArray(page.data)) {
                    return page.data;
                }
                return [];
            });
            return allNotifications;
        }
        
        return [];
    }, []);

    // Helper function: Bildirimleri tarihe göre grupla (Instagram benzeri)
    const groupNotificationsByDate = useCallback((notifications: Notification[]): Array<{ type: 'header' | 'notification'; data: any }> => {
        if (!notifications || notifications.length === 0) {
            return [];
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);

        const grouped: Array<{ type: 'header' | 'notification'; data: any }> = [];
        let currentGroup: string | null = null;

        notifications.forEach((notification) => {
            const notificationDate = new Date(notification.createdAt);
            const notificationDateOnly = new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate());

            let groupLabel: string;
            if (notificationDateOnly.getTime() === today.getTime()) {
                groupLabel = 'Today';
            } else if (notificationDateOnly.getTime() === yesterday.getTime()) {
                groupLabel = 'Yesterday';
            } else if (notificationDate >= thisWeek) {
                groupLabel = 'This Week';
            } else if (notificationDate >= thisMonth) {
                groupLabel = 'This Month';
            } else {
                // Month and year format: "January 2024"
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                groupLabel = `${monthNames[notificationDate.getMonth()]} ${notificationDate.getFullYear()}`;
            }

            // Yeni grup başladıysa header ekle
            if (currentGroup !== groupLabel) {
                currentGroup = groupLabel;
                grouped.push({ type: 'header', data: groupLabel });
            }

            // Bildirimi ekle
            grouped.push({ type: 'notification', data: notification });
        });

        return grouped;
    }, []);
    
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
            
            // CRITICAL FIX: Tab değiştiğinde aktif tab'ın query'sini başlat
            // Query enabled olsa bile, React Query bazen query'yi başlatmıyor
            // Bu durumda manuel olarak query'yi başlatıyoruz
            if (shouldFetchNotifications) {
                const activeQuery = filterQueryResultsRef.current[position];
                if (activeQuery) {
                    const queryStatus = activeQuery.status;
                    const hasNoData = !activeQuery.data;
                    const isNotLoading = !activeQuery.isLoading && !activeQuery.isFetching && !activeQuery.isPending;
                    
                    // Query henüz başlamamışsa (pending) veya error durumunda başlat
                    if (hasNoData && isNotLoading && (queryStatus === 'pending' || queryStatus === 'error')) {
                        const refetchFn = (activeQuery as { refetch?: () => Promise<unknown> }).refetch;
                        if (refetchFn) {
                            refetchFn().catch((error: unknown) => {
                                console.warn(`[NotificationsScreen] Failed to refetch query for tab ${position}:`, error);
                            });
                        }
                    }
                }
            }
        },
        [progress, shouldFetchNotifications]
    );


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

    // Asset pre-caching - tüm tab'lardaki notifications yüklendiğinde images'ı cache'le
    // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - her query'nin data'sını dependency olarak kullan
    useEffect(() => {
        const allNotifications = filterQueryResultsRef.current.flatMap((queryResult) => {
            return extractNotificationsFromResponse(queryResult.data);
        });
        
        if (allNotifications.length > 0) {
            notificationAssetCache.cacheBatchNotifications(allNotifications);
        }
    }, [allQuery.data, tipsQuery.data, trustQuery.data, repliesQuery.data, extractNotificationsFromResponse]);

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

    // Tab 1 (Tips - Replies ile yer değiştirildi)
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

    // Tab 3 (Replies - Tips ile yer değiştirildi)
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
    const renderNotificationItem = React.useCallback(({ item }: { item: { type: 'header' | 'notification'; data: any } }) => {
        if (item.type === 'header') {
            return (
                <Box px={16} py={12} bg={backgroundColor}>
                    <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize={13}
                        fontWeight="$semibold"
                    >
                        {item.data}
                    </Text>
                </Box>
            );
        }

        return (
            <NotificationCard
                notification={item.data}
                onPress={() => handleNotificationPress(item.data)}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
            />
        );
    }, [handleNotificationPress, handleMarkAsRead, handleDelete, isDark, backgroundColor]);
    
    // Key extractor - unique ID kullan
    const keyExtractor = React.useCallback((item: { type: 'header' | 'notification'; data: any }, index: number) => {
        if (item.type === 'header') {
            return `header-${item.data}-${index}`;
        }
        return item.data.id;
    }, []);

    // Render notifications list for a specific filter
    // CRITICAL FIX: Her tab kendi query'sini kullanır - cache invalid olana kadar backend'e istek atmaz
    const renderNotificationsList = useCallback((filterIndex: number) => {
        const filter = filters[filterIndex];
        // CRITICAL FIX: ref ile çağır - dependency array'den kaldırıldı (sonsuz döngü önleme)
        const queryResult = filterQueryResultsRef.current[filterIndex];
        
        if (!queryResult) {
            return (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        An error occurred while loading notifications.
                    </Text>
                </Box>
            );
        }

        const {
            data: notificationsResponse,
            isLoading,
            isFetching,
            error,
            refetch,
            fetchNextPage,
            hasNextPage,
            isFetchingNextPage,
            isPending,
            status,
        } = queryResult;

        // Query enabled durumunu kontrol et
        // CRITICAL FIX: İlk tab (All) için her zaman enabled, diğer tablar için sadece aktif tab enabled
        const isQueryEnabled = filterIndex === 0 ? shouldFetchNotifications :
                              filterIndex === 1 ? (shouldFetchNotifications && currentPage === 1) :
                              filterIndex === 2 ? (shouldFetchNotifications && currentPage === 2) :
                              (shouldFetchNotifications && currentPage === 3);
        
        // Loading state: 
        // CRITICAL FIX: Sadece gerçekten loading durumunda loading göster
        // 1. Query aktif olarak yükleniyor (isLoading, isFetching, isPending)
        // 2. Query enabled değilse ve data yoksa (henüz başlamamış - bu durumda loading göster)
        // 3. Auth ready değilse ve data yoksa (henüz başlamamış - bu durumda loading göster)
        // NOT: Query enabled ise ve data yoksa ama loading değilse, bu bir hata durumu olabilir - loading gösterme
        const isActuallyLoading = (isLoading || isFetching || isPending) || 
                                  (!isQueryEnabled && !notificationsResponse && shouldFetchNotifications) ||
                                  (!isAuthReady && !notificationsResponse && shouldFetchNotifications);

        // Her tab için kendi notifications'ını çıkar
        const notifications = extractNotificationsFromResponse(notificationsResponse);
        
        // SAFETY FIX: notifications her zaman array olmalı
        const safeNotifications = Array.isArray(notifications) ? notifications : [];
        
        // CRITICAL FIX: Tips tabında client-side filtering kaldırıldı
        // Backend'den zaten type=tips ile filtrelenmiş veriler geliyor
        // Endpoint: GET /notifications?limit=10&offset=0&type=tips
        let filtered = safeNotifications;
        
        // Search query için client-side filtering (backend'den zaten filtrelenmiş geliyor)
        // Minimal yapı: title ve userName field'ları kaldırıldı, sadece message var
        if (searchQuery && Array.isArray(filtered)) {
            filtered = filtered.filter(notification => {
                if (!notification || typeof notification !== 'object') {
                    return false;
                }
                
                // Minimal yapı: sadece message field'ı var
                const message = notification.message?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();
                
                return message.includes(query);
            });
        }
        
        // SAFETY FIX: Ensure filtered is always an array
        if (!Array.isArray(filtered)) {
            console.warn('[NotificationsScreen] ⚠️ filtered is not an array:', filtered);
            return (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        An error occurred while loading notifications.
                    </Text>
                </Box>
            );
        }
        
        // Loading state kontrolü - query enabled değilse veya data yoksa loading göster
        if (isActuallyLoading && filtered.length === 0) {
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
                        An error occurred while loading notifications.
                    </Text>
                    <Pressable onPress={() => refetch()} mt="$4" bg="#E8FF6B" px="$4" py="$2" borderRadius={10}>
                        <Text color="#000000" fontSize={12} fontWeight="$semibold">
                            Try Again
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
        
        // Bildirimleri tarihe göre grupla (Instagram benzeri)
        const groupedData = groupNotificationsByDate(filtered);
        
        // DEBUG: hasNextPage değerini kontrol et
        // CRITICAL FIX: hasNextPage undefined olabilir, bu durumda false olarak değerlendir
        // Backend'den pagination gelmeyebilir, bu durumda hasNextPage false olur
        // Eğer data varsa ve son sayfada limit kadar bildirim varsa, muhtemelen daha fazla sayfa var
        const currentPageData = notificationsResponse?.pages?.[notificationsResponse.pages.length - 1];
        const currentPageNotifications = currentPageData?.data || [];
        // Son sayfada limit kadar bildirim varsa, muhtemelen daha fazla sayfa var
        // Limit bilgisini query'den al (default: 20)
        const limit = filterIndex === 1 ? 10 : 20; // Tips tabında limit=10, diğerlerinde 20
        const hasMoreData = currentPageNotifications.length >= limit;
        
        // hasNextPage true ise göster, yoksa ama data limit kadar varsa da göster (backend pagination sorunu olabilir)
        const shouldShowLoadMore = hasNextPage === true || (hasNextPage !== false && hasMoreData && filtered.length > 0);
        
        // DEBUG: Console log ekle (production'da kaldırılabilir)
        if (__DEV__) {
            console.log('[NotificationsScreen] hasNextPage:', hasNextPage, 'hasMoreData:', hasMoreData, 'filtered.length:', filtered.length, 'currentPageNotifications.length:', currentPageNotifications.length, 'limit:', limit, 'shouldShowLoadMore:', shouldShowLoadMore);
        }
        
        // Estimated item height: avatar (48px) + content + extra content (post card, comment, etc.) + margins (~150px)
        const estimatedItemHeight = 150;
        
        return (
            <FlashList
                data={groupedData}
                renderItem={renderNotificationItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ 
                    paddingHorizontal: 0,
                    paddingTop: 8,
                    // paddingBottom kaldırıldı - sadece ListFooterComponent'te padding var
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            refetch().finally(() => setRefreshing(false));
                        }}
                        tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                    />
                }
                ListFooterComponent={
                    shouldShowLoadMore ? (
                        <Box px={16} py={24} pb={bottomOffset} alignItems="center">
                            <Pressable
                                onPress={() => {
                                    if (!isFetchingNextPage && hasNextPage) {
                                        fetchNextPage();
                                    }
                                }}
                                disabled={isFetchingNextPage}
                            >
                                <HStack
                                    alignItems="center"
                                    justifyContent="center"
                                    space="sm"
                                >
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={14}
                                        fontWeight="$medium"
                                    >
                                        Show More
                                    </Text>
                                    <ChevronDownIcon
                                        width={20}
                                        height={20}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                    />
                                </HStack>
                            </Pressable>
                            {isFetchingNextPage && (
                                <Box mt={8}>
                                    <Spinner size="small" />
                                </Box>
                            )}
                        </Box>
                    ) : null
                }
                style={{ flex: 1 }}
            />
        );
    }, [
        filters,
        extractNotificationsFromResponse,
        groupNotificationsByDate,
        searchQuery,
        isDark,
        renderNotificationItem,
        keyExtractor,
        refreshing,
        bottomOffset,
        isAuthReady,
        shouldFetchNotifications,
        currentPage,
        // CRITICAL FIX: filterQueryResults dependency'den kaldırıldı - useRef ile wrap edildi (sonsuz döngü önleme)
        // Query sonuçları değiştiğinde React Query otomatik olarak component'i re-render eder
        // hasNextPage, isFetchingNextPage, fetchNextPage queryResult içinde olduğu için dependency'ye eklenmez
    ]);

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
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
                            placeholder="Search notifications"
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
