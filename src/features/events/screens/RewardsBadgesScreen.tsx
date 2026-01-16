import React, { useState, useMemo, useCallback } from 'react';
import { Dimensions, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventStackParamList } from '../EventNavigator';
import { Header } from '@/src/components/Header';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { useEventBadges, eventsKeys } from '../api/hooks';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { toImageSource } from '@/src/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { EventBadge, EventBadgesResponse } from '../api/communityEventsApi';

const { width } = Dimensions.get('window');

type RewardsBadgesScreenNavigationProp = NativeStackNavigationProp<EventStackParamList, 'RewardsBadgesScreen'>;
type RewardsBadgesScreenRouteProp = RouteProp<EventStackParamList, 'RewardsBadgesScreen'>;

const RewardsBadgesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<RewardsBadgesScreenNavigationProp>();
    const route = useRoute<RewardsBadgesScreenRouteProp>();
    const { eventId } = route.params;
    const queryClient = useQueryClient();
    const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // API hook - event-specific badges
    const { 
        data: badgesData, 
        isLoading, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        isRefetching,
    } = useEventBadges(eventId, 20);

    // Transform API badges data to SeeAllReward format
    const rewards = useMemo(() => {
        if (!badgesData?.pages) {
            return [];
        }
        const allBadges: SeeAllReward[] = [];
        (badgesData.pages as EventBadgesResponse[]).forEach((page) => {
            if (page.items) {
                page.items.forEach((badge: EventBadge) => {
                    // Backend'den gelen user progress'i kullan
                    const imageSource = badge.imageUrl 
                        ? toImageSource(badge.imageUrl) 
                        : require('@/assets/defaultImages/default-badge.png');
                    
                    const reward: SeeAllReward = {
                        id: badge.id,
                        title: badge.title,
                        description: badge.description,
                        image: imageSource,
                        category: badge.category,
                        
                        // User progress artık backend'den geliyor
                        isUnlocked: badge.userProgress.isCompleted,
                        completed: badge.userProgress.current,
                        task: badge.userProgress.target,
                    };
                    allBadges.push(reward);
                });
            }
        });
        return allBadges;
    }, [badgesData]);

    const handleRewardPress = (reward: SeeAllReward) => {
        setSelectedReward(reward);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedReward(null);
    };

    // Pull-to-Refresh handler - Badge listesini cache'siz fresh data ile yenile
    const handleRefresh = useCallback(async () => {
        // CRITICAL: Cache'i invalidate et, ardından fresh data fetch et (cache bypass)
        await queryClient.invalidateQueries({ 
            queryKey: eventsKeys.badges(eventId),
            refetchType: 'active',
        });
        // React Query otomatik olarak invalidate edilmiş query'leri refetch eder
    }, [queryClient, eventId]);

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            <Header
                title="Rewards & Badges"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            {isLoading ? (
                <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        Loading rewards...
                    </Text>
                </VStack>
            ) : rewards.length === 0 ? (
                <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
                    <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        No rewards found
                    </Text>
                </VStack>
            ) : (
                <FlatList
                    data={rewards}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    ItemSeparatorComponent={() => <Box height={6} />}
                    columnWrapperStyle={{ justifyContent: 'space-between', gap: 6 }}
                    renderItem={({ item }) => (
                        <Box width={(width - 38) / 2}>
                            <BadgeCard
                                data={item}
                                onPress={() => handleRewardPress(item)}
                            />
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                        />
                    }
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <VStack alignItems="center" py="$4">
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            </VStack>
                        ) : null
                    }
                />
            )}

            {/* Badge Detail Modal */}
            <BadgeDetailModal
                isVisible={isModalVisible}
                onClose={handleCloseModal}
                data={selectedReward}
                eventId={eventId}
                badgeId={selectedReward?.id}
            />
        </Box>
        </SafeAreaView>
    );
};

export default RewardsBadgesScreen;
