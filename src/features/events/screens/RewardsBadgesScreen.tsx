import React, { useState } from 'react';
import { Dimensions, FlatList } from 'react-native';
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
import { see_all_reward_mock } from '@/src/mock/events/communityEvents';
import BadgeCard from '../components/BadgeCard';
import BadgeDetailModal from '../components/BadgeDetailModal';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';

const { width } = Dimensions.get('window');

type RewardsBadgesScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'RewardsBadges'>;

const RewardsBadgesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<RewardsBadgesScreenNavigationProp>();
    const [selectedReward, setSelectedReward] = useState<SeeAllReward | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleRewardPress = (reward: SeeAllReward) => {
        setSelectedReward(reward);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedReward(null);
    };

    return (
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            <Header
                title="Rewards & Badges"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <FlatList
                data={see_all_reward_mock}
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
            />

            {/* Badge Detail Modal */}
            <BadgeDetailModal
                isVisible={isModalVisible}
                onClose={handleCloseModal}
                data={selectedReward}
            />
        </Box>
    );
};

export default RewardsBadgesScreen;
