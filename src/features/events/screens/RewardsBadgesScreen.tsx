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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { useAchievements } from '../api/hooks';
import type { AchievementApiItem } from '../types';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { toImageSource } from '@/src/utils';

const { width } = Dimensions.get('window');

type RewardsBadgesScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'RewardsBadges'>;

const RewardsBadgesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<RewardsBadgesScreenNavigationProp>();
    const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // API hook
    const { data: achievementsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAchievements(20);

    // Transform API achievements data to SeeAllReward format
    const rewards = useMemo(() => {
        if (!achievementsData?.pages) {
            return [];
        }
        const allAchievements: SeeAllReward[] = [];
        achievementsData.pages.forEach((page) => {
            if (page.items) {
                page.items.forEach((item: AchievementApiItem) => {
                    // Map AchievementApiItem to SeeAllReward format
                    // AchievementApiItem has: id, title, image, description, current, total, status
                    // SeeAllReward needs: id, title, description, image, category, isUnlocked, completed, task
                    const reward: SeeAllReward = {
                        id: item.id,
                        title: item.title || '',
                        description: item.description || '',
                        image: toImageSource(item.image) || require('@/assets/avatar/default-useravatar.png'),
                        category: '', // API'den gelmiyor, boş string
                        isUnlocked: item.status === 'completed',
                        completed: item.current,
                        task: item.total,
                    };
                    allAchievements.push(reward);
                });
            }
        });
        return allAchievements;
    }, [achievementsData]);

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
