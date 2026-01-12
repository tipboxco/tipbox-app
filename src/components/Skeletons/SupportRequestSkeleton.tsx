import React from 'react';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SupportRequestSkeletonProps {
  count?: number;
}

export const SupportRequestSkeleton: React.FC<SupportRequestSkeletonProps> = ({ count = 5 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#1A1A1A' : '#FDFDFD';
  const shimmerColor = isDark ? '#2A2A2A' : '#E9E9E9';

  return (
    <VStack flex={1} px="$4">
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          bg={skeletonColor}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={10}
          p="$3"
          mb="$2"
        >
          <VStack space="md">
            {/* Header with Avatar and User Info */}
            <HStack space="md" alignItems="center">
              {/* Avatar with border */}
              <Box
                width={48}
                height={48}
                borderRadius={24}
                bg={shimmerColor}
                justifyContent="center"
                alignItems="center"
              >
                <Box
                  width={42}
                  height={42}
                  borderRadius={21}
                  bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                />
              </Box>

              {/* User Info */}
              <VStack flex={1} space="xs">
                <Box
                  width={100}
                  height={11}
                  borderRadius={3}
                  bg={shimmerColor}
                />
                <Box
                  width={80}
                  height={9}
                  borderRadius={3}
                  bg={shimmerColor}
                />
              </VStack>

              {/* Action Button */}
              <Box
                width={60}
                height={24}
                borderRadius={20}
                bg={shimmerColor}
              />
            </HStack>

            {/* Request Content */}
            <VStack space="xs">
              {/* Description - 3 lines */}
              <Box
                width="100%"
                height={11}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="95%"
                height={11}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="85%"
                height={11}
                borderRadius={3}
                bg={shimmerColor}
              />

              {/* Status */}
              <HStack alignItems="center" space="xs" mt="$1">
                <Box
                  width={10}
                  height={10}
                  borderRadius={5}
                  bg={shimmerColor}
                />
                <Box
                  width={80}
                  height={9}
                  borderRadius={3}
                  bg={shimmerColor}
                />
              </HStack>
            </VStack>
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};
