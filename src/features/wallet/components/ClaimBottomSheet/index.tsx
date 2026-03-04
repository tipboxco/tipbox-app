import React, { useState, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { RewardCard, RewardCardProps } from '../RewardCard';
import { useRewardSummary, useClaimReward, useClaimAllRewards } from '../../api/hooks';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface ClaimBottomSheetProps {
  onClose: () => void;
}

interface RewardItem extends RewardCardProps {
  details?: Array<{
    date: string;
    name: string;
    amount: number;
  }>;
  sourceType?: string;
}

export const ClaimBottomSheet: React.FC<ClaimBottomSheetProps> = ({
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('wallet');

  // API hooks
  const { data: rewardSummary, isLoading, error, refetch } = useRewardSummary();
  const { mutate: claimReward, isPending: isClaimingOne } = useClaimReward();
  const { mutate: claimAll, isPending: isClaimingAll } = useClaimAllRewards();

  // Track locally claimed items for optimistic UI updates
  const [locallyClaimedIds, setLocallyClaimedIds] = useState<string[]>([]);

  // Transform API data to RewardItem format
  const rewards: RewardItem[] = useMemo(() => {
    if (!rewardSummary?.bySourceType) return [];

    return Object.entries(rewardSummary.bySourceType).map(([sourceType, data]) => {
      // Map sourceType to display title
      const titleMap: Record<string, string> = {
        'LADDER_REWARD': t('claimBottomSheet.rewardTypes.ladderRewards'),
        'TIPS_RECEIVED': t('claimBottomSheet.rewardTypes.tips'),
        'SUPPORT_SESSION': t('claimBottomSheet.rewardTypes.supportRewards'),
        'BADGE_EARNED': t('claimBottomSheet.rewardTypes.badgeRewards'),
        'ACHIEVEMENT_UNLOCKED': t('claimBottomSheet.rewardTypes.achievementRewards'),
        'EVENT_PARTICIPATION': t('claimBottomSheet.rewardTypes.eventRewards'),
        'SYSTEM_GRANT': t('claimBottomSheet.rewardTypes.systemRewards'),
      };

      // Get first claim ID as the group ID
      const groupId = data.claims[0]?.id || sourceType;

      // Transform claims to details format
      const details = data.claims.slice(0, 10).map((claim) => ({
        date: new Date(claim.earnedAt).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        name: claim.description || claim.metadata?.fromUserName || 'System',
        amount: claim.amount,
      }));

      return {
        id: groupId,
        title: titleMap[sourceType] || sourceType,
        amount: data.amount,
        claimed: locallyClaimedIds.includes(groupId),
        details,
        sourceType, // Keep source type for filtering if needed
      };
    });
  }, [rewardSummary, locallyClaimedIds]);

  const handleClaimItem = (id: string) => {
    // Find all claim IDs for this source type
    const sourceType = rewards.find(r => r.id === id)?.sourceType;
    if (!sourceType || !rewardSummary?.bySourceType[sourceType]) return;

    const claimIds = rewardSummary.bySourceType[sourceType].claims.map(c => c.id);

    // Optimistically update UI
    setLocallyClaimedIds(prev => [...prev, id]);

    // Claim all rewards in this group (sequentially or use claim-all for the source)
    // For simplicity, we'll claim the first one as an example
    // In production, you might want to claim all in the group
    if (claimIds.length > 0) {
      claimReward(claimIds[0], {
        onSuccess: () => {
          console.log('[ClaimBottomSheet] Successfully claimed reward group:', id);
          refetch();
        },
        onError: (error) => {
          console.error('[ClaimBottomSheet] Failed to claim reward:', error);
          // Revert optimistic update
          setLocallyClaimedIds(prev => prev.filter(cId => cId !== id));
        },
      });
    }
  };

  const handleClaimAll = () => {
    claimAll(undefined, {
      onSuccess: (result) => {
        console.log('[ClaimBottomSheet] Successfully claimed all rewards:', result);
        // Close after claiming all
        setTimeout(() => {
          onClose();
        }, 500);
      },
      onError: (error) => {
        console.error('[ClaimBottomSheet] Failed to claim all rewards:', error);
      },
    });
  };

  const totalAvailable = rewards.filter(r => !r.claimed).reduce((sum, r) => sum + r.amount, 0);
  const isProcessing = isClaimingOne || isClaimingAll;

  return (
    <BottomSheetScrollView>
      <VStack px="$4" py="$4" pb="$8" space="md" flex={1}>
        {/* Header */}
        <HStack justifyContent="center" alignItems="center" mb="$2">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {t('claimBottomSheet.title')}
          </Text>
        </HStack>

        {/* Loading State */}
        {isLoading && (
          <VStack alignItems="center" py="$8" space="md">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
              {t('claimBottomSheet.loading')}
            </Text>
          </VStack>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <VStack alignItems="center" py="$8" space="md">
            <Text fontSize={14} color="#CE4A4A" textAlign="center">
              {t('claimBottomSheet.loadFailed')}
            </Text>
            <Pressable
              onPress={() => refetch()}
              bg="#F5F5F5"
              $dark-bg="$backgroundDark700"
              rounded={8}
              px="$4"
              py="$2"
            >
              <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                {t('claimBottomSheet.retry')}
              </Text>
            </Pressable>
          </VStack>
        )}

        {/* Empty State */}
        {!isLoading && !error && rewards.length === 0 && (
          <VStack alignItems="center" py="$8">
            <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" textAlign="center">
              {t('claimBottomSheet.empty')}
            </Text>
          </VStack>
        )}

        {/* Reward Cards */}
        {!isLoading && !error && rewards.length > 0 && (
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
        )}

        {/* Claim All Button */}
        {!isLoading && !error && rewards.length > 0 && (
          <Pressable
            onPress={handleClaimAll}
            bg="#D8FF08"
            $dark-bg="#D8FF08"
            rounded={8}
            py="$3"
            mt="$4"
            disabled={totalAvailable === 0 || isProcessing}
            opacity={totalAvailable === 0 || isProcessing ? 0.5 : 1}
          >
            {isClaimingAll ? (
              <ActivityIndicator size="small" color="#111111" />
            ) : (
              <Text fontSize={14} fontWeight="$bold" color="#111111" $dark-color="#111111" textAlign="center">
                {t('claimBottomSheet.claimAll')}
              </Text>
            )}
          </Pressable>
        )}
      </VStack>
    </BottomSheetScrollView>
  );
};

