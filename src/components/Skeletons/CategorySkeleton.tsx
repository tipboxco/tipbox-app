import React from 'react';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface CategorySkeletonProps {
  count?: number;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ count = 6 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#2A2A2A' : '#E9E9E9';
  const shimmerColor = isDark ? '#404040' : '#F5F5F5';

  return (
    <VStack space="md" px="$4">
      {Array.from({ length: Math.ceil(count / 3) }).map((_, rowIndex) => (
        <HStack key={`row-${rowIndex}`} space="md" justifyContent="space-between">
          {[0, 1, 2].map((colIndex) => {
            const index = rowIndex * 3 + colIndex;
            if (index >= count) {
              return <Box key={colIndex} flex={1} />;
            }
            return (
              <Box
                key={colIndex}
                width={114}
                height={132}
                borderRadius={5}
                bg={skeletonColor}
                borderWidth={1}
                borderColor={isDark ? '#404040' : '#E9E9E9'}
                justifyContent="center"
                alignItems="center"
                overflow="hidden"
              >
                <VStack alignItems="center" space="sm" flex={1} justifyContent="center">
                  {/* Image skeleton */}
                  <Box
                    width={86}
                    height={86}
                    borderRadius={5}
                    bg={shimmerColor}
                  />
                  {/* Text skeleton */}
                  <Box
                    width={70}
                    height={20}
                    borderRadius={3}
                    bg={shimmerColor}
                  />
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

