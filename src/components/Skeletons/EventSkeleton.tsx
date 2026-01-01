import React from 'react';
import { Dimensions } from 'react-native';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface EventSkeletonProps {
  count?: number;
  isGrid?: boolean;
  isHorizontal?: boolean;
}

export const EventSkeleton: React.FC<EventSkeletonProps> = ({ 
  count = 2, 
  isGrid = false,
  isHorizontal = false 
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const skeletonColor = isDark ? '#1A1A1A' : '#FFF';
  const shimmerColor = isDark ? '#2A2A2A' : '#F5F5F5';
  const borderColor = '#E9E9E9';

  if (isHorizontal) {
    return (
      <HStack space={12}>
        {Array.from({ length: count }).map((_, index) => (
          <Box
            key={index}
            bg={skeletonColor}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius={10}
            width={CARD_WIDTH}
            overflow="hidden"
          >
            {/* Image Section */}
            <Box
              position="relative"
              height={100}
              bg={shimmerColor}
              borderRadius={5}
              mb="$2"
              overflow="hidden"
              padding="$2"
            >
              {/* Event Type Badge skeleton */}
              <Box
                position="absolute"
                top={14}
                left={14}
                bg={shimmerColor}
                borderRadius={10}
                width={60}
                height={20}
              />
            </Box>

            {/* Content Section */}
            <VStack space="xs" px="$2" pb="$2">
              {/* Title skeleton */}
              <Box
                width="80%"
                height={12}
                borderRadius={3}
                bg={shimmerColor}
              />
              
              {/* Description skeleton */}
              <VStack space="xs">
                <Box
                  width="100%"
                  height={8}
                  borderRadius={3}
                  bg={shimmerColor}
                />
                <Box
                  width="90%"
                  height={8}
                  borderRadius={3}
                  bg={shimmerColor}
                />
                <Box
                  width="85%"
                  height={8}
                  borderRadius={3}
                  bg={shimmerColor}
                />
              </VStack>

              {/* Date Range skeleton */}
              <HStack alignItems="center" space="xs" pt="$2">
                <Box
                  width={14}
                  height={14}
                  borderRadius={7}
                  bg={shimmerColor}
                />
                <Box
                  width={80}
                  height={10}
                  borderRadius={3}
                  bg={shimmerColor}
                />
              </HStack>
            </VStack>

            {/* Divider Line */}
            <Box
              height={1}
              bg="#D9D9D9"
              width="100%"
              mt="$1"
            />

            {/* Participants Section skeleton */}
            <HStack px="$2" alignItems="center" justifyContent="space-between" my="$2">
              <HStack alignItems="center" space="xs">
                {[0, 1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    width={18}
                    height={18}
                    borderRadius={9}
                    bg={shimmerColor}
                    style={{
                      marginLeft: i > 0 ? -12 : 0,
                      zIndex: 4 - i,
                    }}
                  />
                ))}
              </HStack>
              <Box
                width={60}
                height={10}
                borderRadius={3}
                bg={shimmerColor}
              />
            </HStack>
          </Box>
        ))}
      </HStack>
    );
  }

  return (
    <VStack space={12}>
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
                width={CARD_WIDTH}
                overflow="hidden"
              >
                {/* Image Section */}
                <Box
                  position="relative"
                  height={100}
                  bg={shimmerColor}
                  borderRadius={5}
                  mb="$2"
                  overflow="hidden"
                  padding="$2"
                >
                  {/* Event Type Badge skeleton */}
                  <Box
                    position="absolute"
                    top={14}
                    left={14}
                    bg={shimmerColor}
                    borderRadius={10}
                    width={60}
                    height={20}
                  />
                </Box>

                {/* Content Section */}
                <VStack space="xs" px="$2" pb="$2">
                  {/* Title skeleton */}
                  <Box
                    width="80%"
                    height={12}
                    borderRadius={3}
                    bg={shimmerColor}
                  />
                  
                  {/* Description skeleton */}
                  <VStack space="xs">
                    <Box
                      width="100%"
                      height={8}
                      borderRadius={3}
                      bg={shimmerColor}
                    />
                    <Box
                      width="90%"
                      height={8}
                      borderRadius={3}
                      bg={shimmerColor}
                    />
                    <Box
                      width="85%"
                      height={8}
                      borderRadius={3}
                      bg={shimmerColor}
                    />
                  </VStack>

                  {/* Date Range skeleton */}
                  <HStack alignItems="center" space="xs" pt="$2">
                    <Box
                      width={14}
                      height={14}
                      borderRadius={7}
                      bg={shimmerColor}
                    />
                    <Box
                      width={80}
                      height={10}
                      borderRadius={3}
                      bg={shimmerColor}
                    />
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
};

