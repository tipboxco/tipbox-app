import React, { useState, useMemo } from 'react';
import { Dimensions, FlatList, ActivityIndicator } from 'react-native';
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
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { useEventBadges } from '../api/hooks';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { toImageSource } from '@/src/utils';

const { width } = Dimensions.get('window');

type RewardsBadgesScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'RewardsBadges'>;
type RewardsBadgesScreenRouteProp = RouteProp<EventsStackParamList, 'RewardsBadges'>;

const RewardsBadgesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<RewardsBadgesScreenNavigationProp>();
    const route = useRoute<RewardsBadgesScreenRouteProp>();
    const { eventId } = route.params;
    const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // API hook - event-specific badges
    const { data: badgesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useEventBadges(eventId, 20);

    // Transform API badges data to SeeAllReward format
    const rewards = useMemo(() => {
        if (!badgesData?.pages) {
            return [];
        }
        const allBadges: SeeAllReward[] = [];
        badgesData.pages.forEach((page) => {
            if (page.items) {
                page.items.forEach((item) => {
                    // Map EventBadgeApiItem to SeeAllReward format
                    // EventDetailScreen'de de aynı default görsel kullanılıyor
                    const imageSource = item.image ? toImageSource(item.image) : require('@/assets/defaultImages/default-badge.png');
                    
                    const reward: SeeAllReward = {
                        id: item.id,
                        title: item.title || '',
                        description: '', // Badge API'sinde description yok
                        image: imageSource,
                        category: '', // Badge API'sinde category yok
                        isUnlocked: true, // Badge görünüyorsa unlocked kabul ediyoruz
                        completed: 0, // Badge API'sinde progress yok
                        task: 0, // Badge API'sinde task yok
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
            />
        </Box>
        </SafeAreaView>
    );
};

export default RewardsBadgesScreen;
