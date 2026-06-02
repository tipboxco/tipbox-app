import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { Image } from 'expo-image';
import { useColorMode } from '@/src/hooks/useColorMode';
import { DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTranslation } from 'react-i18next';
import type { SupportRequest } from '@/src/features/inbox/api/messagesApi';

interface SupportRequestCardProps {
  data: SupportRequest;
  onPress?: (requestId: string) => void;
  onAccept?: (requestId: string) => void;
}

// Status color helper
const getStatusColor = (status: SupportRequest['status']) => {
  switch (status) {
    case 'pending': return '#FFA500';
    case 'active': return '#4CAF50';
    case 'awaiting_completion': return '#2196F3';
    case 'completed': return '#4CAF50';
    case 'finalized': return '#9E9E9E';
    case 'reported': return '#F44336';
    default: return '#9E9E9E';
  }
};

// Status i18n key helper
const getStatusKey = (status: SupportRequest['status']) => {
  switch (status) {
    case 'pending': return 'supportRequests.status.pending';
    case 'active': return 'supportRequests.status.active';
    case 'awaiting_completion': return 'supportRequests.status.awaitingCompletion';
    case 'completed': return 'supportRequests.status.completed';
    case 'finalized': return 'supportRequests.status.finalized';
    case 'reported': return 'supportRequests.status.reported';
    default: return 'supportRequests.status.unknown';
  }
};

// Button i18n key helper
const getButtonKey = (status: SupportRequest['status']) => {
  switch (status) {
    case 'pending': return 'supportRequests.buttons.accept';
    case 'active': return 'supportRequests.buttons.message';
    case 'awaiting_completion': return 'supportRequests.buttons.complete';
    case 'completed': return 'supportRequests.buttons.view';
    default: return 'supportRequests.buttons.details';
  }
};

export const SupportRequestCard: React.FC<SupportRequestCardProps> = ({ data, onPress, onAccept }) => {
  const { t } = useTranslation('inbox');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const statusColor = getStatusColor(data.status);
  const statusText = t(getStatusKey(data.status));
  const buttonText = t(getButtonKey(data.status));
  const [avatarError, setAvatarError] = useState(false);

  const handlePress = () => {
    if (data.status === 'pending') {
      return;
    }

    if (onPress) {
      onPress(data.id);
    }
  };

  const handleButtonPress = (e: any) => {
    e.stopPropagation();
    if (data.status === 'pending' && onAccept) {
      onAccept(data.id);
    } else if (onPress) {
      onPress(data.id);
    }
  };

  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  const hasAvatar = !!data.userAvatar && !avatarError;

  return (
    <Pressable
      onPress={handlePress}
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor={isDark ? '#333333' : '#E9E9E9'}
      borderRadius={10}
      p="$3"
      mb="$2"
    >
      <VStack space="md">
        {/* Header with Avatar and User Info */}
        <HStack space="md" alignItems="center">
          {/* Avatar – expo-image with memory-disk cache */}
          <Image
            source={hasAvatar ? { uri: data.userAvatar! } : DEFAULT_USER_AVATAR}
            placeholder={DEFAULT_USER_AVATAR}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={{ duration: 200 }}
            recyclingKey={`support-avatar-${data.id}`}
            onError={hasAvatar ? handleAvatarError : undefined}
          />

          {/* User Info */}
          <VStack flex={1} space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$xs"
              fontWeight="$semibold"
            >
              {data.userName}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
              fontWeight="$medium"
              numberOfLines={1}
            >
              {data.userTitle}
            </Text>
          </VStack>

          {/* Action Button */}
          <Pressable
            bg="#E8FF6B"
            borderWidth={1}
            borderColor="#D8FF08"
            borderRadius={20}
            px="$2"
            py="$1.5"
            onPress={handleButtonPress}
          >
            <Text
              color="#000000"
              fontSize="$xs"
              fontWeight="$semibold"
            >
              {buttonText}
            </Text>
          </Pressable>
        </HStack>

        {/* Request Content */}
        <VStack space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$xs"
            fontWeight="$normal"
            lineHeight={16}
            numberOfLines={3}
          >
            {data.message || data.requestDescription}
          </Text>

          {/* Status */}
          <HStack alignItems="center" space="xs">
            <Box
              width={10}
              height={10}
              borderRadius={5}
              bg={statusColor}
            />
            <Text
              color={statusColor}
              fontSize="$xs"
              fontWeight="$semibold"
            >
              {statusText}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Pressable>
  );
};

export default SupportRequestCard;
