import React from 'react';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface FeedSkeletonProps {
  count?: number;
}

export const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ count = 3 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#2A2A2A' : '#FFFFFF';
  const shimmerColor = isDark ? '#404040' : '#E9E9E9';

  return (
    <VStack space="md" px={16} py={8}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          bg={skeletonColor}
          borderRadius={8}
          borderWidth={1}
          borderColor={isDark ? '#404040' : '#E9E9E9'}
          p={16}
        >
          <VStack space="md">
            {/* Header - Avatar + Name */}
            <HStack space="md" alignItems="center">
              <Box
                width={40}
                height={40}
                borderRadius={20}
                bg={shimmerColor}
              />
              <VStack space="xs" flex={1}>
                <Box
                  width={120}
                  height={14}
                  borderRadius={3}
                  bg={shimmerColor}
                />
                <Box
                  width={80}
                  height={12}
                  borderRadius={3}
                  bg={shimmerColor}
                />
              </VStack>
            </HStack>

            {/* Content */}
            <VStack space="xs">
              <Box
                width="100%"
                height={12}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="90%"
                height={12}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="85%"
                height={12}
                borderRadius={3}
                bg={shimmerColor}
              />
            </VStack>

            {/* Image skeleton */}
            <Box
              width="100%"
              height={200}
              borderRadius={8}
              bg={shimmerColor}
            />

            {/* Actions */}
            <HStack space="md" alignItems="center">
              <Box
                width={60}
                height={20}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width={60}
                height={20}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width={60}
                height={20}
                borderRadius={3}
                bg={shimmerColor}
              />
            </HStack>
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};

