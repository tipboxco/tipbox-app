import React from 'react';
import { HStack, VStack, Text, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { TrophyIcon } from 'react-native-heroicons/outline';

interface PointsHistoryItem {
  id: string;
  title: string;
  points: number;
}

interface PointsHistoryCardProps {
  item: PointsHistoryItem;
}

const PointsHistoryCard: React.FC<PointsHistoryCardProps> = ({ item }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFD'}
      borderWidth={1}
      borderColor={isDark ? '#333333' : '#E9E9E9'}
      borderRadius={5}
      p="$3"
    >
      <HStack alignItems="center" space="md">
        {/* Icon */}
        <Box
          width={32}
          height={32}
          bg={isDark ? '#444444' : '#D9D9D9'}
          borderRadius={6}
          alignItems="center"
          justifyContent="center"
        >
          <TrophyIcon width={16} height={16} color="#9B9B9B" />
        </Box>

        {/* Content */}
        <VStack flex={1}>
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={10}
            fontWeight="$semibold"
          >
            {item.title}
          </Text>
        </VStack>

        {/* Points */}
        <VStack alignItems="center">
          <Text
            color="#3CA241"
            fontSize={12}
            fontWeight="$bold"
            textAlign="center"
          >
            {item.points}
          </Text>
          <Text
            color="#3CA241"
            fontSize={10}
            fontWeight="$bold"
            textAlign="center"
          >
            Points
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

export default PointsHistoryCard;
