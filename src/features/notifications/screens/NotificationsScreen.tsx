import React, { useState, useEffect } from 'react';
import { Dimensions, ScrollView, RefreshControl } from 'react-native';
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

const { width } = Dimensions.get('window');

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

    const userAvatar = notification.metadata?.userAvatar 
        ? toImageSource(notification.metadata.userAvatar)
        : require('@/assets/avatar/ozan.png');
    const userName = notification.metadata?.userName || 'Kullanıcı';

    return (
        <Pressable onPress={handlePress}>
            <HStack space="md" alignItems="flex-start" mb="$4" opacity={notification.read ? 0.7 : 1}>
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
                            fontWeight={notification.read ? '$normal' : '$semibold'}
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

    const handleNotificationPress = (notification: Notification) => {
        if (notification.navigation) {
            navigation.navigate(
                notification.navigation.screen as any,
                notification.navigation.params
            );
        }
    };

    const handleMarkAsRead = () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handleDelete = () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

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

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '#000000' : '#FAFAFA'}>
            {/* Header */}
            <Header 
                title="Notifications"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            
            {/* Search and Filter Section */}
            <VStack space="md" pb="$4" px="$4">
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
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                >
                    <VStack space="md">
                        {filteredNotifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onPress={() => handleNotificationPress(notification)}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        ))}
                    </VStack>
                </ScrollView>
            )}
        </Box>
        </SafeAreaView>
    );
};

export default NotificationsScreen;
