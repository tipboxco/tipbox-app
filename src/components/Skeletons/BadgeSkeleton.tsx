import React from 'react';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface BadgeSkeletonProps {
  count?: number;
}

export const BadgeSkeleton: React.FC<BadgeSkeletonProps> = ({ count = 6 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '$backgroundDark800' : '$white';
  const shimmerColor = isDark ? '#404040' : '#E9E9E9';
  const borderColor = isDark ? '$borderDark700' : '#E9E9E9';

  return (
    <VStack space={12} px={16}>
      {Array.from({ length: Math.ceil(count / 2) }).map((_, rowIndex) => (
        <HStack key={`row-${rowIndex}`} space={12} justifyContent="space-between">
          {[0, 1].map((colIndex) => {
            const index = rowIndex * 2 + colIndex;
            if (index >= count) {
              return <Box key={colIndex} flex={1} />;
            }
            return (
              <Box
                key={colIndex}
                bg={skeletonColor}
                borderWidth={1}
                borderColor={borderColor}
                borderRadius={10}
                minHeight={200}
                w="100%"
                overflow="hidden"
                position="relative"
              >
                {/* Image skeleton */}
                <Box
                  h={150}
                  w={150}
                  bg={shimmerColor}
                  borderRadius={5}
                  alignSelf="center"
                  m="$4"
                />

                <VStack space="xs" px="$4" flex={1} justifyContent="space-between">
                  <VStack space="xs" flexShrink={1}>
                    {/* Title skeleton */}
                    <Box
                      width="90%"
                      height={16}
                      borderRadius={3}
                      bg={shimmerColor}
                      alignSelf="center"
                    />
                    <Box
                      width="70%"
                      height={14}
                      borderRadius={3}
                      bg={shimmerColor}
                      alignSelf="center"
                    />

                    {/* Description skeleton */}
                    <VStack space="xs" mt="$2">
                      <Box
                        width="100%"
                        height={10}
                        borderRadius={3}
                        bg={shimmerColor}
                      />
                      <Box
                        width="85%"
                        height={10}
                        borderRadius={3}
                        bg={shimmerColor}
                        alignSelf="center"
                      />
                    </VStack>
                  </VStack>

                  <VStack space="xs" my="$3">
                    {/* Progress bar skeleton */}
                    <Box
                      w="100%"
                      h={5}
                      bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
                      borderRadius={10}
                      overflow="hidden"
                    >
                      <Box
                        w="60%"
                        h="100%"
                        bg={shimmerColor}
                      />
                    </Box>
                    {/* Progress text skeleton */}
                    <Box
                      width={60}
                      height={10}
                      borderRadius={3}
                      bg={shimmerColor}
                      alignSelf="center"
                    />
                  </VStack>
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

