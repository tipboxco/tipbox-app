import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dimensions, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/src/features/notifications/navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { notification_filters } from '@/src/mock/notifications';
import { NotificationFilter } from '@/src/mock/notifications/types';
import { Header } from '@/src/components/Header';
import { toImageSource, formatRelativeTime } from '@/src/utils';
import {
    useNotifications,
    useMarkNotificationAsRead,
    useDeleteNotification,
    notificationKeys,
} from '../api/hooks';
import type { Notification, NotificationType } from '../api/types';
import { useQueryClient } from '@tanstack/react-query';
import { notificationAssetCache } from '@/src/services/NotificationAssetCache';
import { NotificationNavigationService } from '@/src/services/NotificationNavigationService';
import { useAppStore } from '@/src/store/appStore';

const { width } = Dimensions.get('window');

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

    const getIconName = (type: NotificationType): string => {
        switch (type) {
            case 'POST_LIKED':
            case 'COMMENT_LIKED':
                return 'heart';
            case 'TIPS_RECEIVED':
            case 'TIPS_SENT':
            case 'REWARD_EARNED':
                return 'gift';
            case 'POST_COMMENTED':
            case 'COMMENT_REPLIED':
            case 'NEW_MESSAGE':
                return 'message-circle';
            case 'NEW_TRUSTER':
            case 'NEW_TRUSTED_BY':
                return 'user-check';
            case 'NEW_BADGE':
            case 'ACHIEVEMENT_UNLOCKED':
                return 'award';
            case 'EVENT_STARTED':
            case 'EVENT_ENDING_SOON':
            case 'EVENT_REWARD_AVAILABLE':
                return 'calendar';
            default:
                return 'bell';
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
        : require('@/assets/avatar/ozan.png');
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
                                fontSize={9}
                                fontWeight="$medium"
                            >
                                {formatRelativeTime(notification.createdAt)}
                            </Text>
                            <Feather
                                name={getIconName(notification.type) as any}
                                size={14}
                                color="#7D7D7D"
                            />
                            <Pressable onPress={handleDelete} ml="$2">
                                <Feather name="x" size={14} color="#7D7D7D" />
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
                                fontSize={9}
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

const FilterButton: React.FC<{
    filter: NotificationFilter;
    onPress: (filter: NotificationFilter) => void;
}> = ({ filter, onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={() => onPress(filter)}>
            <Box
                bg={filter.isActive ? '#F1F1F1' : 'transparent'}
                borderWidth={1}
                borderColor="#EFEFEF"
                borderRadius={10}
                px="$3"
                py="$1"
                minHeight={28}
                justifyContent="center"
                alignItems="center"
            >
                <Text
                    color="#000000"
                    fontSize={9}
                    fontWeight="$semibold"
                    textAlign="center"
                >
                    {filter.label}
                </Text>
            </Box>
        </Pressable>
    );
};

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<NotificationsScreenNavigationProp>();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAppStore();
    const [filters, setFilters] = useState<NotificationFilter[]>(notification_filters);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // API hooks - sadece authenticated olduğunda çalışır
    const activeFilter = filters.find(f => f.isActive);
    const unreadOnly = activeFilter?.id === 'unread';
    const { data: notificationsResponse, isLoading, error, refetch } = useNotifications({
        limit: 50,
        offset: 0,
        unreadOnly: unreadOnly,
    }, isAuthenticated);

    const notifications = notificationsResponse?.data || [];
    
    // Debug: Notification data kontrolü ve API isteği kontrolü
    useEffect(() => {
        console.log('[NotificationsScreen] 📋 Notifications API Status:', {
            endpoint: '/notifications',
            params: { limit: 50, offset: 0, unreadOnly },
            isLoading,
            hasResponse: !!notificationsResponse,
            responseSuccess: notificationsResponse?.success,
            dataCount: notifications.length,
            error: error ? {
                message: error.message,
                status: (error as any)?.response?.status,
                data: (error as any)?.response?.data,
            } : null,
        });
        
        if (notifications.length > 0) {
            console.log('[NotificationsScreen] ✅ Notifications loaded:', {
                count: notifications.length,
                firstNotification: {
                    id: notifications[0].id,
                    type: notifications[0].type,
                    title: notifications[0].title,
                    message: notifications[0].message,
                    read: notifications[0].read,
                },
            });
        } else if (!isLoading && notificationsResponse) {
            console.log('[NotificationsScreen] ⚠️ No notifications found:', {
                responseSuccess: notificationsResponse.success,
                dataArray: notificationsResponse.data,
            });
        }
    }, [notifications.length, isLoading, error, notificationsResponse, unreadOnly]);

    const handleFilterPress = (selectedFilter: NotificationFilter) => {
        setFilters(prev =>
            prev.map(filter => ({
                ...filter,
                isActive: filter.id === selectedFilter.id
            }))
        );
    };

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
                console.log('[NotificationsScreen] ℹ️ No navigation action for notification:', notification.type);
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
                console.log('[NotificationsScreen] ✅ Navigated to global screen:', route, params);
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
                console.log('[NotificationsScreen] ✅ Navigated to tab screen:', tabRoute, screenName, screenParams);
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

    const getFilteredNotifications = (): Notification[] => {
        let filtered = notifications;

        if (activeFilter?.id !== 'all' && activeFilter?.id !== 'unread') {
            filtered = notifications.filter(notification => {
                switch (activeFilter?.id) {
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

        if (searchQuery) {
            filtered = filtered.filter(notification =>
                notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notification.metadata?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredNotifications = getFilteredNotifications();

    // Asset pre-caching - notifications yüklendiğinde images'ı cache'le
    useEffect(() => {
        if (filteredNotifications.length > 0) {
            notificationAssetCache.cacheBatchNotifications(filteredNotifications);
        }
    }, [filteredNotifications.length]);

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

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '#000000' : '#FAFAFA'}>
            {/* Header */}
            <Header 
                title="Notifications"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            
            {/* Search and Filter Section */}
            <VStack space="md" pb="$4" px="$4" bg={isDark ? '#000000' : '#FAFAFA'}>
                {/* Search Bar */}
                <HStack
                    alignItems="center"
                    bg={isDark ? '#1A1A1A' : '#F2F2F2'}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    borderRadius={20}
                    px={14}
                    space="sm"
                >
                    <Feather
                        name="search"
                        size={24}
                        color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                    />
                    <Input flex={1} borderWidth={0} bg="transparent">
                        <InputField
                            placeholder="Bildirimlerde Ara"
                            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                            color={isDark ? '#000' : '#000'}
                            fontSize={9}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </Input>
                </HStack>

                {/* Filter Buttons */}
                <HStack space="xs" justifyContent="flex-start">
                    {filters.map((filter) => (
                        <FilterButton
                            key={filter.id}
                            filter={filter}
                            onPress={handleFilterPress}
                        />
                    ))}
                </HStack>
            </VStack>

            {/* Notifications List */}
            {isLoading && !notifications.length ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Spinner size="large" />
                </Box>
            ) : error ? (
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
            ) : filteredNotifications.length === 0 ? (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize={14} textAlign="center">
                        {searchQuery ? 'Arama sonucu bulunamadı.' : 'Henüz bildirim yok.'}
                    </Text>
                </Box>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ 
                        paddingHorizontal: 16,
                        paddingTop: 8,
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
                    // Performance optimizations
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    initialNumToRender={10}
                    windowSize={10}
                    style={{ flex: 1 }}
                />
            )}
        </Box>
        </SafeAreaView>
    );
};

export default NotificationsScreen;
