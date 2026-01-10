import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';
import type { SupportRequest } from '@/src/features/inbox/api/messagesApi';

// Default user avatar
const DEFAULT_USER_AVATAR = require('@/assets/avatar/default-useravatar.png');

interface SupportRequestCardProps {
  data: SupportRequest;
  onPress?: (requestId: string) => void;
  onAccept?: (requestId: string) => void;
}

// Status mapping helper
const getStatusInfo = (status: SupportRequest['status']) => {
  switch (status) {
    case 'pending':
      return { text: 'Pending', color: '#FFA500' };
    case 'active':
      return { text: 'Active', color: '#4CAF50' };
    case 'awaiting_completion':
      return { text: 'Awaiting Completion', color: '#2196F3' };
    case 'completed':
      return { text: 'Completed', color: '#4CAF50' };
    case 'finalized':
      return { text: 'Finalized', color: '#9E9E9E' };
    case 'reported':
      return { text: 'Reported', color: '#F44336' };
    default:
      return { text: 'Unknown', color: '#9E9E9E' };
  }
};

// Button text helper
const getButtonText = (status: SupportRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'Accept';
    case 'active':
      return 'Message';
    case 'awaiting_completion':
      return 'Complete';
    case 'completed':
      return 'View';
    default:
      return 'Details';
  }
};

export const SupportRequestCard: React.FC<SupportRequestCardProps> = ({ data, onPress, onAccept }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const statusInfo = getStatusInfo(data.status);
  const buttonText = getButtonText(data.status);

  // Avatar source state - görsel yüklenemezse default avatar'a geçiş için
  const initialAvatarSource = data.userAvatar 
    ? (toImageSource(data.userAvatar) || DEFAULT_USER_AVATAR)
    : DEFAULT_USER_AVATAR;
  const [avatarSource, setAvatarSource] = React.useState(initialAvatarSource);

  // Avatar değiştiğinde state'i güncelle
  React.useEffect(() => {
    const newSource = data.userAvatar 
      ? (toImageSource(data.userAvatar) || DEFAULT_USER_AVATAR)
      : DEFAULT_USER_AVATAR;
    setAvatarSource(newSource);
  }, [data.userAvatar]);

  const handlePress = () => {
    // Pending durumunda card'a tıklandığında hiçbir şey yapma
    // Sadece "Kabul Et" butonuna tıklandığında işlem yapılacak
    if (data.status === 'pending') {
      return;
    }
    
    if (onPress) {
      onPress(data.id);
    }
  };

  const handleButtonPress = (e: any) => {
    e.stopPropagation();
    // Eğer status 'pending' ise ve onAccept varsa, onAccept çağrılır
    // Aksi halde onPress çağrılır
    if (data.status === 'pending' && onAccept) {
      onAccept(data.id);
    } else if (onPress) {
      onPress(data.id);
    }
  };

  // Avatar yüklenme hatası durumunda default avatar'a geçiş
  const handleAvatarError = (error: Error) => {
    console.log('[SupportRequestCard] Avatar load error, using default avatar:', {
      requestId: data.id,
      userName: data.userName,
      error: error.message,
      attemptedSource: avatarSource,
    });
    setAvatarSource(DEFAULT_USER_AVATAR);
  };

  // Avatar URL logları
  React.useEffect(() => {
    console.log('[SupportRequestCard] Avatar URLs:', {
      requestId: data.id,
      userName: data.userName,
      rawUserAvatar: data.userAvatar,
      userAvatarType: typeof data.userAvatar,
      userAvatarAfterToImageSource: data.userAvatar ? toImageSource(data.userAvatar) : null,
      finalAvatarSource: avatarSource,
    });
  }, [data.id, data.userName, data.userAvatar, avatarSource]);

  return (
    <Pressable
      onPress={handlePress}
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={10}
      p="$3"
      mb="$2"
    >
      <VStack space="md">
        {/* Header with Avatar and User Info */}
        <HStack space="md" alignItems="center">
          {/* Avatar */}
          <Box
            width={48}
            height={48}
            borderRadius={24}
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
          >
            <CachedImage
              source={avatarSource}
              placeholder={DEFAULT_USER_AVATAR}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              onError={handleAvatarError}
            />
          </Box>

          {/* User Info */}
          <VStack flex={1} space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={11}
              fontWeight="$semibold"
            >
              {data.userName}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={9}
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
              fontSize={9}
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
            fontSize={11}
            fontWeight="$normal"
            lineHeight={13}
            numberOfLines={3}
          >
            {data.requestDescription}
          </Text>

          {/* Status */}
          <HStack alignItems="center" space="xs">
            <Box
              width={10}
              height={10}
              borderRadius={5}
              bg={statusInfo.color}
            />
            <Text
              color={statusInfo.color}
              fontSize={9}
              fontWeight="$semibold"
            >
              {statusInfo.text}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Pressable>
  );
};

export default SupportRequestCard;
