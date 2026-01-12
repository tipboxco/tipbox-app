import React from 'react';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const shimmerColor = isDark ? '#2A2A2A' : '#E9E9E9';

  return (
    <VStack flex={1}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          bg={skeletonColor}
          p="$3"
          borderBottomWidth={1}
          borderColor={isDark ? '#333' : '#E9E9E9'}
        >
          <HStack space="md" alignItems="center">
            {/* Avatar */}
            <Box
              width={48}
              height={48}
              borderRadius={24}
              bg={shimmerColor}
            />

            {/* Message Content */}
            <VStack flex={1} space="xs">
              {/* Sender Name */}
              <Box
                width={120}
                height={11}
                borderRadius={3}
                bg={shimmerColor}
              />
              
              {/* Last Message - 2 lines */}
              <Box
                width="100%"
                height={9}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="75%"
                height={9}
                borderRadius={3}
                bg={shimmerColor}
              />
            </VStack>
          </HStack>

          {/* Timestamp - Position Absolute */}
          <HStack
            position="absolute"
            top="$3"
            right="$3"
            space="xs"
            alignItems="center"
          >
            <Box
              width={40}
              height={9}
              borderRadius={3}
              bg={shimmerColor}
            />
            {/* Unread Badge (randomly show) */}
            {index % 3 === 0 && (
              <Box
                width={8}
                height={8}
                borderRadius={4}
                bg={shimmerColor}
              />
            )}
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};
