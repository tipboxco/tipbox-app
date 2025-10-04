import React, { useState } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
    Input,
    InputField,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { notification_filters, notification_mock } from '@/src/mock/notifications';
import { NotificationItem, NotificationFilter } from '@/src/mock/notifications/types';
import { Header } from '@/src/components/Header';

const { width } = Dimensions.get('window');

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

const NotificationCard: React.FC<{ notification: NotificationItem }> = ({ notification }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const getIconName = () => {
        switch (notification.type) {
            case 'like':
                return 'heart';
            case 'tip':
                return 'gift';
            case 'comment':
                return 'message-circle';
            case 'trust':
                return 'user-check';
            default:
                return 'bell';
        }
    };

    return (
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
                        source={notification.user.avatar}
                        alt="User avatar"
                        width={42}
                        height={42}
                        borderRadius={21}
                    />
                </Box>
            </Box>

            {/* Content */}
            <VStack flex={1} space="xs">
                {/* Message and Time */}
                <HStack justifyContent="space-between" alignItems="flex-start">
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={11}
                        fontWeight="$semibold"
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
                            {notification.timeAgo}
                        </Text>
                        <Feather
                            name={getIconName() as any}
                            size={14}
                            color="#7D7D7D"
                        />
                    </HStack>
                </HStack>

                {/* Content Card */}
                {notification.content && (
                    <Box
                        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        borderRadius={10}
                        p="$3"
                        mt="$2"
                    >
                        <VStack>
                            {/* İpucu Badge and Category Tag - Same Row */}
                            <HStack justifyContent="space-between" alignItems="center">
                                {/* İpucu Badge */}
                                <HStack
                                    bg="rgba(62, 87, 255, 0.8)"
                                    borderWidth={1}
                                    borderColor="#BAC4FF"
                                    borderRadius={20}
                                    px={'$3'}
                                    py={'$1'}
                                    alignItems="center"
                                    space="xs"
                                >
                                    <Feather name="zap" size={12} color="#FFFFFF" />
                                    <Text
                                        color="#FFFFFF"
                                        fontSize={8}
                                        fontWeight="$semibold"
                                    >
                                        İpucu
                                    </Text>
                                </HStack>

                                {/* Category Tag */}
                                <HStack alignItems="center" space="xs">
                                    <Text
                                        color="#6D6D6D"
                                        fontSize={9}
                                        fontWeight="$medium"
                                    >
                                        {notification.content.category}
                                    </Text>
                                    <Feather name="layers" size={14} color="#536471" />
                                </HStack>
                            </HStack>

                            {/* Title */}
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                                mt="$2"
                            >
                                {notification.content.title}
                            </Text>

                            {/* Description */}
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={9}
                                lineHeight={11}
                                numberOfLines={3}
                            >
                                {notification.content.description}
                            </Text>
                        </VStack>
                    </Box>
                )}

                {/* Action Button */}
                {notification.action && (
                    <Pressable
                        onPress={notification.action.onPress}
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
                            {notification.action.text}
                        </Text>
                    </Pressable>
                )}
            </VStack>
        </HStack>
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
    const [filters, setFilters] = useState<NotificationFilter[]>(notification_filters);
    const [searchQuery, setSearchQuery] = useState('');

    const handleFilterPress = (selectedFilter: NotificationFilter) => {
        setFilters(prev =>
            prev.map(filter => ({
                ...filter,
                isActive: filter.id === selectedFilter.id
            }))
        );
    };

    const getFilteredNotifications = () => {
        const activeFilter = filters.find(f => f.isActive);
        let filtered = notification_mock;

        if (activeFilter?.id !== 'all') {
            filtered = notification_mock.filter(notification => {
                switch (activeFilter?.id) {
                    case 'replies':
                        return notification.type === 'comment';
                    case 'trust':
                        return notification.type === 'trust';
                    case 'tips':
                        return notification.type === 'tip';
                    default:
                        return true;
                }
            });
        }

        if (searchQuery) {
            filtered = filtered.filter(notification =>
                notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notification.user.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    return (
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
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                style={{ flex: 1 }}
            >
                <VStack space="md">
                    {getFilteredNotifications().map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                        />
                    ))}
                </VStack>
            </ScrollView>
        </Box>
    );
};

export default NotificationsScreen;
