import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { EventSkeleton } from './EventSkeleton';
import { LimitedTimeEventSkeleton } from './LimitedTimeEventSkeleton';
import { BadgeSkeleton } from './BadgeSkeleton';

export const EventsScreenSkeleton: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const backgroundColor = isDark ? '$backgroundDark950' : '#FFFFFF';
  const headerBgColor = isDark ? '#000000' : '#FFFFFF';
  const tabHeaderBgColor = '#FFFFFF';
  const shimmerColor = isDark ? '#2A2A2A' : '#E9E9E9';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        {/* Header Skeleton */}
        <Box
          bg={headerBgColor}
          px="$4"
          justifyContent="center"
          minHeight={56}
        >
          <HStack space="md" alignItems="center">
            {/* Sol kısım - Menu Icon skeleton */}
            <Box flex={1} alignItems="flex-start" justifyContent="center">
              <Box
                width={22}
                height={22}
                bg={shimmerColor}
                borderRadius={4}
              />
            </Box>

            {/* Orta kısım - Title skeleton */}
            <Box flex={3} alignItems="center" justifyContent="center">
              <Box
                width={60}
                height={16}
                bg={shimmerColor}
                borderRadius={4}
              />
            </Box>

            {/* Sağ kısım - Boş */}
            <Box flex={1} />
          </HStack>
        </Box>

        <VStack flex={1}>
          {/* Search Bar Skeleton */}
          <VStack
            space="md"
            pb="$4"
            px="$4"
            bg={backgroundColor}
          >
            <HStack
              alignItems="center"
              bg={isDark ? '#2A2A2A' : '#F2F2F2'}
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              borderRadius={20}
              px={14}
              py={12}
            >
              <Box
                width={24}
                height={24}
                bg={shimmerColor}
                borderRadius={4}
              />
              <Box
                flex={1}
                ml={8}
                height={16}
                bg={shimmerColor}
                borderRadius={4}
              />
            </HStack>
          </VStack>

          {/* Tab Header Skeleton */}
          <VStack pt={0} pb="$4" bg={tabHeaderBgColor}>
            <HStack
              borderBottomWidth={1}
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              p={0}
              m={0}
              position="relative"
            >
              {/* Community Tab Label skeleton */}
              <Box flex={1} alignItems="center" pb={8}>
                <Box
                  width={120}
                  height={16}
                  bg={shimmerColor}
                  borderRadius={4}
                />
              </Box>

              {/* Achievement Tab Label skeleton */}
              <Box flex={1} alignItems="center" pb={8}>
                <Box
                  width={130}
                  height={16}
                  bg={shimmerColor}
                  borderRadius={4}
                />
              </Box>

              {/* Indicator skeleton */}
              <Box
                position="absolute"
                bottom={0}
                left="10%"
                width="30%"
                height={2}
                bg={shimmerColor}
              />
            </HStack>
          </VStack>

          {/* Tab Content Skeleton - Community Tab için */}
          <VStack flex={1} px="$4" py="$4" space="md">
            {/* Active Events Section Skeleton */}
            <VStack space="sm">
              <Box
                bg={shimmerColor}
                width={100}
                height={16}
                borderRadius={4}
              />
              <EventSkeleton count={3} isHorizontal={true} />
            </VStack>

            {/* Upcoming Events Section Skeleton */}
            <VStack space="sm">
              <Box
                bg={shimmerColor}
                width={120}
                height={16}
                borderRadius={4}
              />
              <EventSkeleton count={4} isGrid={true} />
            </VStack>
          </VStack>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};
