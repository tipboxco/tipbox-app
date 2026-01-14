import React, { useEffect } from 'react';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface ProductSkeletonProps {
  count?: number;
}

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 6 }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#2A2A2A' : '#E9E9E9';

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
              <SkeletonItem key={colIndex} skeletonColor={skeletonColor} />
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

const SkeletonItem: React.FC<{ skeletonColor: string }> = ({ skeletonColor }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3]
    );
    return {
      opacity,
    };
  });

  return (
    <Box
      width={114}
      height={132}
      borderRadius={5}
      bg={skeletonColor}
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
    >
      <VStack alignItems="center" space="sm" flex={1} justifyContent="center">
        {/* Image skeleton */}
        <AnimatedBox
          width={86}
          height={86}
          borderRadius={5}
          bg={skeletonColor}
          style={animatedStyle}
        />
        {/* Text skeleton */}
        <AnimatedBox
          width={70}
          height={20}
          borderRadius={3}
          bg={skeletonColor}
          style={animatedStyle}
        />
      </VStack>
    </Box>
  );
};

