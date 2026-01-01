import React from 'react';
import { Dimensions } from 'react-native';
import { Box, VStack, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

const { width } = Dimensions.get('window');

export const LimitedTimeEventSkeleton: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const shimmerColor = isDark ? '#2A2A2A' : '#E9E9E9';

  return (
    <Box
      width={width - 32}
      height={230}
      borderRadius={10}
      overflow="hidden"
      position="relative"
      mt="$4"
      bg={shimmerColor}
    >
      {/* Dark overlay */}
      <Box
        width="100%"
        height="100%"
        bg="rgba(0, 0, 0, 0.8)"
        borderRadius={10}
        position="relative"
      >
        {/* Content */}
        <VStack flex={1} p="$3" space="md">
          {/* 1. HStack: Limited Time Badge and Timer */}
          <HStack justifyContent="space-between" alignItems="flex-start">
            {/* Badge skeleton */}
            <Box
              bg={shimmerColor}
              borderRadius={8}
              width={100}
              height={24}
            />
            {/* Timer skeleton */}
            <Box
              bg={shimmerColor}
              borderRadius={5}
              width={60}
              height={20}
            />
          </HStack>

          {/* 2. HStack: Event Image, Title and Description */}
          <HStack space="md" alignItems="flex-start">
            {/* Event Image skeleton */}
            <Box
              width={60}
              height={60}
              borderRadius={5}
              bg={shimmerColor}
            />

            {/* Title and Description skeleton */}
            <VStack space="xs" flex={1}>
              <Box
                width="80%"
                height={14}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="100%"
                height={10}
                borderRadius={3}
                bg={shimmerColor}
              />
              <Box
                width="70%"
                height={10}
                borderRadius={3}
                bg={shimmerColor}
              />
            </VStack>
          </HStack>

          {/* 3. HStack: User Avatar, Score and Rank */}
          <Box
            bg="rgba(223, 223, 223, 0.2)"
            borderRadius={4}
            p="$2"
          >
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                {/* Avatar skeleton */}
                <Box
                  width={34}
                  height={34}
                  borderRadius={17}
                  bg={shimmerColor}
                />
                <VStack space="xs">
                  <Box
                    width={60}
                    height={10}
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
              {/* Rank skeleton */}
              <Box
                width={30}
                height={14}
                borderRadius={3}
                bg={shimmerColor}
              />
            </HStack>
          </Box>

          {/* 4. HStack: Other Users and View Detail Button */}
          <HStack justifyContent="space-between" alignItems="center">
            {/* Other Users skeleton */}
            <HStack space="xs" alignItems="flex-end">
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  width={26}
                  height={26}
                  borderRadius={13}
                  bg={shimmerColor}
                  style={{
                    marginLeft: i > 0 ? -12 : 0,
                  }}
                />
              ))}
            </HStack>
            {/* Button skeleton */}
            <Box
              bg="rgba(223, 223, 223, 0.2)"
              borderRadius={8}
              width={80}
              height={28}
            />
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

