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

const { width } = Dimensions.get('window');

type NotificationsScreenNavigationProp = NativeStackNavigationProp<NotificationsStackParamList, 'NotificationsScreen'>;

// Instagram benzeri gruplanmış avatar component
const GroupedAvatars: React.FC<{
    users: Array<{ userId: string; userName: string; userAvatar?: string }>;
    count: number;
    isDark: boolean;
}> = ({ users, count, isDark }) => {
    const maxAvatars = 2; // Instagram'da genellikle 2 avatar gösterilir
    const avatarsToShow = users.slice(0, maxAvatars);
    const remainingCount = count - avatarsToShow.length;

    return (
        <Box position="relative" width={48} height={48}>
            {avatarsToShow.map((user, index) => {
                const userAvatar = user.userAvatar 
                    ? toImageSource(user.userAvatar)
                    : require('@/assets/avatar/ozan.png');
                
                return (
                    <Box
                        key={user.userId}
                        position="absolute"
                        left={index * 20}
                        top={0}
                        width={48}
                        height={48}
                        borderRadius={24}
                        bg="#F400FF"
                        justifyContent="center"
                        alignItems="center"
                        borderWidth={2}
                        borderColor={isDark ? '#000000' : '#FAFAFA'}
                        zIndex={maxAvatars - index}
                    >
                        <Image
                            source={userAvatar}
                            alt={user.userName}
                            width={42}
                            height={42}
                            borderRadius={21}
                        />
                    </Box>
                );
            })}
            {remainingCount > 0 && (
                <Box
                    position="absolute"
                    left={20}
                    top={0}
                    width={48}
                    height={48}
                    borderRadius={24}
                    bg={isDark ? '#1A1A1A' : '#F1F1F1'}
                    justifyContent="center"
                    alignItems="center"
                    borderWidth={2}
                    borderColor={isDark ? '#000000' : '#FAFAFA'}
                    zIndex={0}
                >
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={12}
                        fontWeight="$bold"
                    >
                        +{remainingCount}
                    </Text>
                </Box>
            )}
        </Box>
    );
};

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

    // Instagram benzeri gruplama kontrolü
    const isGrouped = notification.metadata?.groupedUsers && notification.metadata.groupedUsers.length > 0;
    const groupedUsers = notification.metadata?.groupedUsers || [];
    const groupedCount = notification.metadata?.groupedCount || groupedUsers.length;
    
    // Tek kullanıcı için avatar
    const userAvatar = notification.metadata?.userAvatar 
        ? toImageSource(notification.metadata.userAvatar)
        : require('@/assets/avatar/ozan.png');
    const userName = notification.metadata?.userName || 'Kullanıcı';

    // Post preview kontrolü
    const hasPostPreview = notification.metadata?.postPreview?.image || notification.metadata?.postId;

    return (
        <Pressable onPress={handlePress}>
            <HStack space="md" alignItems="flex-start" mb="$4" px="$4" opacity={notification.read ? 0.7 : 1}>
                {/* Avatar - Gruplanmış veya tek */}
                <Box position="relative">
                    {isGrouped && groupedUsers.length > 0 ? (
                        <GroupedAvatars 
                            users={groupedUsers} 
                            count={groupedCount}
                            isDark={isDark}
                        />
                    ) : (
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
                    )}
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
                    <HStack justifyContent="space-between" alignItems="flex-start" flex={1}>
                        <VStack flex={1} mr="$2" space="xs">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={11}
                                fontWeight={notification.read ? '$normal' : '$semibold'}
                                lineHeight={16}
                            >
                                {notification.message}
                            </Text>
                            <Text
                                color="#8C8C8C"
                                fontSize={9}
                                fontWeight="$medium"
                            >
                                {formatRelativeTime(notification.createdAt)}
                            </Text>
                        </VStack>

                        <HStack alignItems="flex-start" space="xs">
                            {/* Post Preview Image - Instagram benzeri */}
                            {hasPostPreview && notification.metadata?.postPreview?.image && (
                                <Box
                                    width={44}
                                    height={44}
                                    borderRadius={4}
                                    overflow="hidden"
                                    mr="$2"
                                >
                                    <Image
                                        source={toImageSource(notification.metadata.postPreview.image)}
                                        alt="Post preview"
                                        width={44}
                                        height={44}
                                        style={{ resizeMode: 'cover' }}
                                    />
                                </Box>
                            )}
                            <Feather
                                name={getIconName(notification.type) as any}
                                size={14}
                                color="#7D7D7D"
                            />
                            <Pressable onPress={handleDelete} ml="$1">
                                <Feather name="x" size={14} color="#7D7D7D" />
                            </Pressable>
                        </HStack>
                    </HStack>

                    {/* Navigation Action */}
                    {notification.navigation && (
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

// Instagram benzeri filtre butonu
const FilterButton: React.FC<{
    filter: NotificationFilter;
    onPress: (filter: NotificationFilter) => void;
}> = ({ filter, onPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Pressable onPress={() => onPress(filter)}>
            <Box
                bg={filter.isActive ? (isDark ? '#2A2A2A' : '#F1F1F1') : 'transparent'}
                borderWidth={filter.isActive ? 0 : 1}
                borderColor={isDark ? '#3A3A3A' : '#EFEFEF'}
                borderRadius={20}
                px="$4"
                py="$2"
                minHeight={32}
                justifyContent="center"
                alignItems="center"
            >
                <Text
                    color={filter.isActive 
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : (isDark ? '#8C8C8C' : '#8C8C8C')
                    }
                    fontSize={11}
                    fontWeight={filter.isActive ? '$semibold' : '$normal'}
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
    const [filters, setFilters] = useState<NotificationFilter[]>(notification_filters);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // API hooks
    const activeFilter = filters.find(f => f.isActive);
    const unreadOnly = activeFilter?.id === 'unread';
    const { data: notificationsResponse, isLoading, error, refetch } = useNotifications({
        limit: 50,
        offset: 0,
        unreadOnly: unreadOnly,
    });

    const notifications = notificationsResponse?.data || [];
    
    // Debug: Notification data kontrolü ve API isteği kontrolü
    useEffect(() => {
        console.log('[NotificationsScreen] 📋 Notifications API called:', {
            endpoint: '/notifications',
            params: { limit: 50, offset: 0, unreadOnly },
            count: notifications.length,
            isLoading,
            error: error?.message,
            hasData: !!notificationsResponse,
            responseSuccess: notificationsResponse?.success,
        });
        if (notifications.length > 0) {
            console.log('[NotificationsScreen] 📋 First notification:', JSON.stringify(notifications[0], null, 2));
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

    const handleNotificationPress = useCallback(async (notification: Notification) => {
        try {
            // NotificationNavigationService kullanarak navigate et (async - post data fetch edebilir)
            const success = await NotificationNavigationService.navigate(notification);
            
            if (!success) {
                console.warn('[NotificationsScreen] ⚠️ Navigation failed for notification:', notification.id);
            }
        } catch (error) {
            console.error('[NotificationsScreen] ❌ Navigation error:', error);
        }
    }, []);

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

                {/* Filter Buttons - Instagram benzeri horizontal scroll */}
                <HStack space="sm" justifyContent="flex-start" alignItems="center">
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
                    ItemSeparatorComponent={() => (
                        <Box 
                            height={1} 
                            bg={isDark ? '#1A1A1A' : '#F5F5F5'} 
                            mx="$4"
                        />
                    )}
                />
            )}
        </Box>
        </SafeAreaView>
    );
};

export default NotificationsScreen;
