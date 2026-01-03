import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { formatRelativeTime, toImageSource } from '@/src/utils';
import type { InboxMessage } from '../../types';

interface MessageCardProps {
  data: InboxMessage;
  onPress?: (messageId: string) => void;
  isTyping?: boolean; // Kullanıcı typing yapıyor mu?
  typingUserName?: string; // Typing yapan kullanıcının adı (opsiyonel)
}

export const MessageCard: React.FC<MessageCardProps> = ({ data, onPress, isTyping = false, typingUserName }) => {
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
              ? toImageSource(data.senderAvatar) || require('@/assets/avatar/ozan.png')
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
          
          {isTyping ? (
            <HStack space="xs" alignItems="center">
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize={9}
                fontWeight="$normal"
                fontStyle="italic"
              >
                {typingUserName || data.senderName} yazıyor
              </Text>
              <HStack space="xs" alignItems="center">
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.4 }}
                />
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.6 }}
                />
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.8 }}
                />
              </HStack>
            </HStack>
          ) : (
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={9}
              fontWeight={data.isUnread ? '$semibold' : '$normal'}
              numberOfLines={2}
            >
              {data.lastMessage}
            </Text>
          )}
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
