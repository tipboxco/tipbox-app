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

  return (
    <VStack space="md">
      {Array.from({ length: Math.ceil(count / 3) }).map((_, rowIndex) => (
        <HStack key={`row-${rowIndex}`} space="md">
          {[0, 1, 2].map((colIndex) => {
            const index = rowIndex * 3 + colIndex;
            if (index >= count) {
              return <Box key={colIndex} flex={1} />;
            }
            return (
              <Box
                key={colIndex}
                flex={1}
                height={132}
                borderRadius={5}
                bg={skeletonColor}
                opacity={0.5}
              />
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

