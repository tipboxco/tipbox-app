import React from 'react';
import { TouchableOpacity } from 'react-native';
import { VStack, Text, Image, Box } from '@gluestack-ui/themed';
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
        w="100%"
        overflow="hidden"
        py="$4"
        px="$3"
      >
        <Image
          source={data.image || require('@/assets/defaultImages/default-badge.png')}
          alt={data.title}
          h={150}
          w={150}
          resizeMode="contain"
          alignSelf="center"
        />

        <VStack space="xs" mt="$3" alignItems="center">
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize={14}
            numberOfLines={2}
            fontWeight="$bold"
            textAlign="center"
          >
            {data.title}
          </Text>

          <Text
            color={isDark ? '$textDark400' : '#575757'}
            fontSize={11}
            lineHeight={14}
            textAlign="center"
            numberOfLines={2}
          >
            {data.description}
          </Text>

          {data.category ? (
            <Text
              color={isDark ? '$textDark400' : '#797979'}
              fontSize={12}
              textAlign="center"
              mt="$2"
            >
              {data.category}
            </Text>
          ) : null}
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default BadgeCard;
