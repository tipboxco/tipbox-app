import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { formatRelativeTime } from '@/src/utils';
import type { InboxMessage } from '../../types';

interface MessageCardProps {
  data: InboxMessage;
  onPress?: (messageId: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ data, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handlePress = () => {
    if (onPress) {
      onPress(data.id);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
      p="$3"
      position="relative"
      borderBottomWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
    >
      <HStack space="md" alignItems="center">
        {/* Avatar */}
        <Image
          source={
            data.senderAvatar
              ? { uri: data.senderAvatar }
              : require('@/assets/avatar/ozan.png')
          }
          alt={data.senderName}
          width={48}
          height={48}
          borderRadius={24}
        />

        {/* Message Content */}
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={11}
            fontWeight="$semibold"
          >
            {data.senderName}
          </Text>
          
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize={9}
            fontWeight={data.isUnread ? '$semibold' : '$normal'}
            numberOfLines={2}
          >
            {data.lastMessage}
          </Text>
        </VStack>
      </HStack>

      {/* Timestamp and Unread Badge - Position Absolute */}
      <HStack
        position="absolute"
        top="$3"
        right="$3"
        space="xs"
        alignItems="center"
      >
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize={9}
          fontWeight="$medium"
        >
          {formatRelativeTime(data.timestamp)}
        </Text>
        {data.isUnread && (
          <Box
            width={8}
            height={8}
            borderRadius={4}
            bg="#E8FF6B"
            alignItems="center"
            justifyContent="center"
          />
        )}
      </HStack>
    </Pressable>
  );
};

export default MessageCard;
