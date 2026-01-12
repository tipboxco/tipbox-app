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
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type NotificationsScreenNavigationProp = NativeStackNavigationProp<NotificationsStackParamList, 'NotificationsScreen'>;

const NotificationCard: React.FC<{ 
    notification: Notification;
    onPress?: () => void;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
    hasNavigationAction?: boolean; // Navigation action var mı?
}> = ({ notification, onPress, onMarkAsRead, onDelete, hasNavigationAction = false }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const markAsReadMutation = useMarkNotificationAsRead();
    const deleteMutation = useDeleteNotification();

    const getIconComponent = (type: NotificationType): React.ComponentType<{ width?: number; height?: number; color?: string }> => {
        switch (type) {
            case 'POST_LIKED':
            case 'COMMENT_LIKED':
                return HeartIcon;
            case 'TIPS_RECEIVED':
            case 'TIPS_SENT':
            case 'REWARD_EARNED':
                return GiftIcon;
            case 'POST_COMMENTED':
            case 'COMMENT_REPLIED':
            case 'NEW_MESSAGE':
                return ChatBubbleLeftIcon;
            case 'NEW_TRUSTER':
            case 'NEW_TRUSTED_BY':
                return UserPlusIcon;
            case 'NEW_BADGE':
            case 'ACHIEVEMENT_UNLOCKED':
                return TrophyIcon;
            case 'EVENT_STARTED':
            case 'EVENT_ENDING_SOON':
            case 'EVENT_REWARD_AVAILABLE':
                return CalendarIcon;
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

    const userAvatar = notification.metadata?.userAvatar 
        ? toImageSource(notification.metadata.userAvatar)
        : DEFAULT_USER_AVATAR;
    const userName = notification.metadata?.userName || 'Kullanıcı';

    return (
        <Pressable onPress={handlePress}>
            <HStack space="md" alignItems="flex-start" mb="$4">
                {/* Avatar */}
                <Box position="relative">
                    <Box
                        width={48}
                        height={48}
                        borderRadius={24}
                        bg="#F400FF"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Image
                            source={userAvatar}
                            alt="User avatar"
                            width={42}
                            height={42}
                            borderRadius={21}
                        />
                    </Box>
                    {!notification.read && (
                        <Box
                            position="absolute"
                            top={0}
                            right={0}
                            width={12}
                            height={12}
                            borderRadius={6}
                            bg="#E8FF6B"
                            borderWidth={2}
                            borderColor={isDark ? '#000000' : '#FFFFFF'}
                        />
                    )}
                </Box>

                {/* Content */}
                <VStack flex={1} space="xs">
                    {/* Message and Time */}
                    <HStack justifyContent="space-between" alignItems="flex-start">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={11}
                            fontWeight="$normal"
                            flex={1}
                            mr="$2"
                        >
                            {notification.message}
                        </Text>

                        <HStack alignItems="center" space="xs">
                            <Text
                                color="#8C8C8C"
                                fontSize="$xs"
                                fontWeight="$medium"
                            >
                                {formatRelativeTime(notification.createdAt)}
                            </Text>
                            {(() => {
                                const IconComponent = getIconComponent(notification.type);
                                return <IconComponent width={14} height={14} color="#7D7D7D" />;
                            })()}
                            <Pressable onPress={handleDelete} ml="$2">
                                <XMarkIcon width={14} height={14} color="#7D7D7D" />
                            </Pressable>
                        </HStack>
                    </HStack>

                    {/* Navigation Action Button */}
                    {/* Backend'den navigation data varsa veya NotificationService'den action varsa göster */}
                    {(notification.navigation || hasNavigationAction) && (
                        <Pressable
                            onPress={handlePress}
                            bg="#E8FF6B"
                            borderWidth={1}
                            borderColor="#D8FF08"
                            borderRadius={20}
                            px="$2"
                            py="$1.5"
                            alignSelf="flex-start"
                            mt="$2"
                        >
                            <Text
                                color="#000000"
                                fontSize="$xs"
                                fontWeight="$bold"
                            >
                                Görüntüle
                            </Text>
                        </Pressable>
                    )}
                </VStack>
            </HStack>
        </Pressable>
    );
};


const NotificationsScreenComponent: React.FC = () => {
    const navigation = useNavigation<NotificationsScreenNavigationProp>();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAppStore();
    const pagerRef = useRef<PagerView>(null);
    const tabContainerRef = useRef<any>(null);
    const [tabContainerWidth, setTabContainerWidth] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters] = useState<NotificationFilter[]>(notification_filters);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    
    // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
    const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);
    
    useFocusEffect(
        useCallback(() => {
            // Ekran focus aldığında drawer gesture'ı disable et
            setGestureEnabled(false);
            return () => {
                // Ekran blur olduğunda drawer gesture'ı tekrar enable et
                setGestureEnabled(true);
            };
        }, [setGestureEnabled])
    );
    
    // PERFORMANCE FIX: Memoize background colors to prevent re-renders
    const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '#FFFFFF', [isDark]);
    const tabHeaderBgColor = useMemo(() => '#FFFFFF', []); // Tab header her zaman beyaz
    
    // 🎯 CORE: Shared progress value (0 = All, 1 = Replies, 2 = Trust, 3 = Tips)
    const progress = useSharedValue(0);

    // Debounce search query for API calls
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery.trim());
      }, 500);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get active filter based on current page
    const activeFilter = filters[currentPage] || filters[0];
    
    // API hooks
    const unreadOnly = activeFilter?.id === 'unread';
    const { data: notificationsResponse, isLoading, error, refetch } = useNotifications({
        limit: 50,
        offset: 0,
        unreadOnly: unreadOnly,
        search: debouncedSearchQuery || undefined,
    }, isAuthenticated); // Sadece authenticated olduğunda query çalışsın

    // SAFETY FIX: Ensure notifications is always an array
    const notifications = Array.isArray(notificationsResponse?.data) 
        ? notificationsResponse.data 
        : [];
    
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

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
    const getFilteredNotificationsForFilter = useCallback((filter: NotificationFilter): Notification[] => {
        // SAFETY FIX: Ensure notifications is always an array before filtering
        if (!Array.isArray(notifications)) {
            console.warn('[NotificationsScreen] ⚠️ notifications is not an array:', notifications);
            return [];
        }

        let filtered = notifications;

        if (filter.id !== 'all' && filter.id !== 'unread') {
            filtered = notifications.filter(notification => {
                // SAFETY FIX: Ensure notification is valid
                if (!notification || typeof notification !== 'object') {
                    return false;
                }
                
                switch (filter.id) {
                    case 'replies':
                        return notification.type === 'POST_COMMENTED' || 
                               notification.type === 'COMMENT_REPLIED' ||
                               notification.type === 'COMMENT_LIKED';
                    case 'trust':
                        return notification.type === 'NEW_TRUSTER' || 
                               notification.type === 'NEW_TRUSTED_BY';
                    case 'tips':
                        return notification.type === 'TIPS_RECEIVED' || 
                               notification.type === 'TIPS_SENT';
                    default:
                        return true;
                }
            });
        }

        if (searchQuery && Array.isArray(filtered)) {
            filtered = filtered.filter(notification => {
                // SAFETY FIX: Ensure notification properties exist before accessing
                if (!notification || typeof notification !== 'object') {
                    return false;
                }
                
                const message = notification.message?.toLowerCase() || '';
                const title = notification.title?.toLowerCase() || '';
                const userName = notification.metadata?.userName?.toLowerCase() || '';
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
        // Notification için navigation action var mı kontrol et
        const navigationAction = getNavigationAction(item);
        const hasNavigationAction = navigationAction !== null;

        return (
            <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                hasNavigationAction={hasNavigationAction}
            />
        );
    }, [handleNotificationPress, handleMarkAsRead, handleDelete, getNavigationAction]);
    
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
        
        return (
            <FlashList
                data={filtered}
                renderItem={renderNotificationItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ 
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: 20,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                    />
                }
                style={{ flex: 1 }}
            />
        );
    }, [isLoading, notifications.length, error, searchQuery, isDark, renderNotificationItem, keyExtractor, refreshing, handleRefresh, refetch, filters, getFilteredNotificationsForFilter]);

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
