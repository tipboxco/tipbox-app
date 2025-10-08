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
import { Message } from '@/src/mock/inbox/messages/types';

interface MessageCardProps {
  data: Message;
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
          source={data.senderAvatar}
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
            fontWeight="$medium"
            numberOfLines={1}
          >
            {data.senderTitle}
          </Text>
          
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize={9}
            fontWeight="$normal"
            numberOfLines={2}
          >
            {data.lastMessage}
          </Text>
        </VStack>
      </HStack>

      {/* Timestamp and Status Indicator - Position Absolute */}
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
          {data.timestamp}
        </Text>
        <Box
          width={8}
          height={8}
          borderRadius={4}
          bg="#C2E607"
        />
      </HStack>
    </Pressable>
  );
};

export default MessageCard;
