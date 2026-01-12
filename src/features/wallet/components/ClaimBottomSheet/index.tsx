import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { RewardCard, RewardCardProps } from '../RewardCard';

interface ClaimBottomSheetProps {
  onClose: () => void;
}

interface RewardItem extends RewardCardProps {
  details?: Array<{
    date: string;
    name: string;
    amount: number;
  }>;
}

export const ClaimBottomSheet: React.FC<ClaimBottomSheetProps> = ({
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Mock reward data
  const [rewards, setRewards] = useState<RewardItem[]>([
    {
      id: '1',
      title: 'Ladder Rewards',
      amount: 370,
      claimed: false,
      details: [
        { date: '11 July 2025', name: 'Ömer Faruk Demiral', amount: 20 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
      ],
    },
    {
      id: '2',
      title: 'Tips',
      amount: 370,
      claimed: false,
      details: [
        { date: '11 July 2025', name: 'Ömer Faruk Demiral', amount: 20 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
      ],
    },
    {
      id: '3',
      title: 'Support Rewards',
      amount: 370,
      claimed: false,
      details: [
        { date: '11 July 2025', name: 'Ömer Faruk Demiral', amount: 20 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
        { date: '07 July 2025', name: 'Mehmet Koç', amount: 35 },
      ],
    },
  ]);

  const handleClaimItem = (id: string) => {
    setRewards(prev => prev.map(reward => 
      reward.id === id ? { ...reward, claimed: true } : reward
    ));
  };

  const handleClaimAll = () => {
    setRewards(prev => prev.map(reward => ({ ...reward, claimed: true })));
    // Close after claiming all
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const totalAvailable = rewards.filter(r => !r.claimed).reduce((sum, r) => sum + r.amount, 0);

  return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header */}
      <HStack justifyContent="center" alignItems="center" mb="$2">
        <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
          Rewards
        </Text>
      </HStack>

      {/* Reward Cards */}
      <VStack space="md">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            id={reward.id}
            title={reward.title}
            amount={reward.amount}
            claimed={reward.claimed}
            details={reward.details}
            onClaim={handleClaimItem}
          />
        ))}
      </VStack>

      {/* Claim All Button */}
      <Pressable
        onPress={handleClaimAll}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
        disabled={totalAvailable === 0}
        opacity={totalAvailable === 0 ? 0.5 : 1}
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" $dark-color="#111111" textAlign="center">
          Claim All
        </Text>
      </Pressable>
    </VStack>
  );
};

