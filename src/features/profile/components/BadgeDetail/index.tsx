import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useClaimAchievementBadge } from '@/src/features/profile/api/hooks';
import type { Badge, BadgeRarity } from '@/src/mock/profile/badges/types';

interface BadgeDetailProps {
  badge: Badge;
  onClose: () => void;
  hideHeader?: boolean;
  userId?: string;
}

const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'Usual':
      return '#6B7280';
    case 'Rare':
      return '#EC4899';
    case 'Epic':
      return '#8B5CF6';
    case 'Legendary':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const BadgeDetail: React.FC<BadgeDetailProps> = ({ badge, onClose, hideHeader = false }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const claimMutation = useClaimAchievementBadge();
  const [claimed, setClaimed] = useState(badge.isClaimed ?? false);

  const tasks = badge.tasks ?? [];
  const earnedDate = formatDate(badge.earnedDate);
  const totalEarned = badge.totalEarned ?? 0;

  const handleClaim = () => {
    claimMutation.mutate(badge.id, {
      onSuccess: () => {
        setClaimed(true);
      },
    });
  };

  return (
    <VStack space="lg" p={15}>
      {/* Header - Conditionally Rendered */}
      {!hideHeader && (
      <HStack alignItems="center" mb={10}>
        <Pressable
          onPress={onClose}
          hitSlop={20}
        >
          <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text
          flex={1}
          textAlign="center"
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '#000000'}
          mr={24}
        >
          {badge.title}
        </Text>
      </HStack>
      )}

      {/* Large Badge Icon */}
      <VStack space="xs" alignItems="center" mb={10}>
        <Box
          width={250}
          height={250}
          justifyContent="center"
          alignItems="center"
        >
          <Image
            source={badge.icon}
            alt="Badge"
            style={{
              width: 250,
              height: 250,
            }}
            resizeMode="contain"
          />
        </Box>

        {/* Claim NFT Button — only shown when badge is not yet claimed */}
        {!claimed && (
          <Pressable
            bg={claimMutation.isPending ? '#d4e85e' : '#E8FF6B'}
            px="$8"
            py="$3"
            borderRadius="$full"
            opacity={claimMutation.isPending ? 0.7 : 1}
            onPress={handleClaim}
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <HStack space="sm" alignItems="center">
                <ActivityIndicator size="small" color="#000000" />
                <Text fontSize={16} fontWeight="$bold" color="#000000">
                  Claiming...
                </Text>
              </HStack>
            ) : (
              <Text
                fontSize={16}
                fontWeight="$bold"
                color="#000000"
              >
                Claim NFT
              </Text>
            )}
          </Pressable>
        )}

        {/* Claimed state */}
        {claimed && (
          <HStack space="xs" alignItems="center" mt={4}>
            <Text fontSize={14} fontWeight="$semibold" color="#3CA241">
              NFT Claimed
            </Text>
          </HStack>
        )}
      </VStack>

      {/* Details Section */}
      <VStack space="sm">
        <Text
          fontSize={14}
          fontWeight="$bold"
          color={isDark ? '$textDark200' : '#000000'}
        >
          Details
        </Text>

        {/* Details Card */}
        <Box
          bg={isDark ? '#1A1A1A' : '#F7F7F7'}
          borderRadius={8}
          overflow="hidden"
        >
          {/* Kazanma Tarihi */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderBottomColor="#EBEBEB"
          >
            <Text fontSize={13} color="#8A8A8A">
              Kazanma Tarihi
            </Text>
            <Text fontSize={13} fontWeight="$semibold" color="#000000">
              {earnedDate}
            </Text>
          </HStack>

          {/* Enderlik */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderBottomColor="#EBEBEB"
          >
            <Text fontSize={13} color="#8A8A8A">
              Enderlik
            </Text>
            <HStack space="xs" alignItems="center">
              <Text fontSize={13} color={getRarityColor(badge.rarity)}>
                ◆
              </Text>
              <Text fontSize={13} fontWeight="$semibold" color="#000000">
                {badge.rarity}
              </Text>
            </HStack>
          </HStack>

          {/* Sahip */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
          >
            <Text fontSize={13} color="#8A8A8A">
              Sahip
            </Text>
            <Text fontSize={13} fontWeight="$semibold" color="#000000">
              {totalEarned > 0 ? totalEarned.toLocaleString() : '—'}
            </Text>
          </HStack>
        </Box>
      </VStack>

      {/* Tasks Section */}
      {tasks.length > 0 && (
        <VStack space="md">
          <Text color="#8A8A8A" fontSize={12} fontWeight="$bold">
            Tasks
          </Text>
          {tasks.map((task) => {
            const progress = task.total > 0 ? Math.min(task.current / task.total, 1) : 0;
            const progressPercent: `${number}%` = `${Math.round(progress * 100)}%`;
            return (
              <Box
                key={task.id}
                bg={isDark ? '$backgroundDark900' : '$white'}
                borderWidth={1}
                borderColor="#E2E2E2"
                p={12}
              >
                <HStack space="md" alignItems="center">
                  <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
                  <VStack flex={1} space="sm">
                    <Text fontSize={10} fontWeight="$semibold">
                      {task.title}
                    </Text>
                    <View style={{ width: '100%', height: 6, backgroundColor: isDark ? '#333333' : '#F7F7F7', borderRadius: 10, overflow: 'hidden' }}>
                      <View
                        style={{ width: progressPercent, height: '100%', backgroundColor: task.isCompleted ? '#3CA241' : '#686868' }}
                      />
                    </View>
                  </VStack>
                  {task.isCompleted && (
                    <Box w={14} h={14} borderRadius={7} bg="#3CA241" />
                  )}
                </HStack>
              </Box>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};

export default BadgeDetail;
