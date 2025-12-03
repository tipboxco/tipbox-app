import React from 'react';
import { TouchableOpacity } from 'react-native';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';

interface BadgeCardProps {
  data: SeeAllReward;
  onPress?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ data, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box
        bg={isDark ? '$backgroundDark800' : '$white'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
        borderRadius={10}
        minHeight={200}
        w="100%"
        overflow="hidden"
        position="relative"
        shadowColor={isDark ? '$backgroundDark950' : '#000'}
        shadowOffset={{ width: 0, height: 0 }}
        shadowOpacity={0.25}
        shadowRadius={3}
      >
        <Image
          source={data.image}
          alt={data.title}
          h={150}
          w={150}
          resizeMode="contain"
          alignSelf="center"
          p='$4'
        />

        <VStack space="xs" px={'$4'} flex={1} justifyContent="space-between">
          <VStack space="xs" flexShrink={1}>
            <HStack space="sm" alignItems="flex-start" minHeight={18}>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize={12}
                numberOfLines={2}
                fontWeight="$bold"
                textAlign="center"
                w="100%"
                flexWrap="wrap"
              >
                {data.title} 
              </Text>
            </HStack>

            <Text
              color={isDark ? '$textDark400' : '#575757'}
              fontSize={9}
              lineHeight={11}
              textAlign="center"
              w="100%"
              numberOfLines={2}
              minHeight={33}
            >
              {data.description}
            </Text>
          </VStack>

          <VStack space="xs" my={'$3'}>
            <Box
              w="100%"
              h={5}
              bg={isDark ? '$backgroundDark700' : '#E0E0E0'}
              borderRadius={10}
              overflow="hidden"
            >
              <Box
                w={`${((data.completed || 0) / (data.task || 1)) * 100}%`}
                h="100%"
                bg={data.isUnlocked ? '#0C7A24' : '#686868'}
              />
            </Box>
            <Text
              color={isDark ? '$textDark400' : '#797979'}
              fontSize={9}
              textAlign="center"
            >
              {data.isUnlocked ? 'Completed' : `${data.completed || 0}/${data.task || 1}`}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default BadgeCard;
