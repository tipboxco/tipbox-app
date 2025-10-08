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
import { SupportRequest } from '@/src/mock/inbox/SupportRequests/types';

interface SupportRequestCardProps {
  data: SupportRequest;
  onPress?: (requestId: string) => void;
}

export const SupportRequestCard: React.FC<SupportRequestCardProps> = ({ data, onPress }) => {
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
            bg="#F400FF"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              source={data.userAvatar}
              alt={data.userName}
              width={42}
              height={42}
              borderRadius={21}
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
            onPress={() => data.onButtonPress?.()}
          >
            <Text
              color="#000000"
              fontSize={9}
              fontWeight="$semibold"
            >
              {data.buttonText}
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
              bg={data.statusColor}
            />
            <Text
              color={data.statusColor}
              fontSize={9}
              fontWeight="$semibold"
            >
              {data.statusText}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Pressable>
  );
};

export default SupportRequestCard;
