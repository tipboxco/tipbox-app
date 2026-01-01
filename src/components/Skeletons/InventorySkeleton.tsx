import React from 'react';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface InventorySkeletonProps {
  count?: number;
  cardWidth: number;
}

export const InventorySkeleton: React.FC<InventorySkeletonProps> = ({ count = 9, cardWidth }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '$backgroundDark800' : '$white';
  const shimmerColor = isDark ? '#404040' : '#E9E9E9';

  return (
    <VStack space="md" px={15}>
      {Array.from({ length: Math.ceil(count / 3) }).map((_, rowIndex) => (
        <HStack key={`row-${rowIndex}`} space={6} justifyContent="flex-start">
          {[0, 1, 2].map((colIndex) => {
            const index = rowIndex * 3 + colIndex;
            if (index >= count) {
              return <Box key={colIndex} flex={1} />;
            }
            return (
              <Box
                key={colIndex}
                bg={skeletonColor}
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
                borderRadius={5}
                w={cardWidth}
                h={175}
                mb={10}
                overflow="hidden"
              >
                <Box
                  flex={1}
                  p={15}
                  alignItems="center"
                  justifyContent="center"
                >
                  {/* Image skeleton */}
                  <Box
                    width={100}
                    height={100}
                    borderRadius={5}
                    bg={shimmerColor}
                  />
                </Box>
                <VStack p={8} space="xs">
                  {/* Text skeleton */}
                  <Box
                    width="100%"
                    height={12}
                    borderRadius={3}
                    bg={shimmerColor}
                  />
                  <Box
                    width="80%"
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
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

