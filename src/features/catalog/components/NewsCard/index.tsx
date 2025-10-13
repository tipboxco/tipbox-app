import React from 'react';
import { Box, HStack, VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface NewsCardProps {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  image: any;
  onPress?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  id,
  title,
  description,
  source,
  date,
  image,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={10}
        p="$3"
      >
        <HStack space="sm" alignItems="center">
          {/* News Image - 64x64 */}
          <Box
            width={92}
            height={92}
            borderRadius={5}
            bg="rgba(0, 0, 0, 0.2)"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <Image
              source={image}
              alt={title}
              style={{
                width: 92,
                height: 92,
              }}
              resizeMode="cover"
            />
          </Box>

          {/* News Content - VStack */}
          <VStack pr={'$5'} maxHeight={92} flex={1} space="xs">
            {/* Source and Date */}
            <HStack alignItems="center" space="xs">
              <Feather name="book-open" size={12} color="#B9B9B9" />
              <Text
                color="#B9B9B9"
                fontSize={9}
                fontWeight="$medium"
              >
                {source} - {date}
              </Text>
            </HStack>

            {/* Title */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$bold"
              numberOfLines={1}
            >
              {title}
            </Text>

            {/* Description */}
            <Text
              color={isDark ? '#FFFFFF' : '#343434'}
              fontSize={9}
              lineHeight={12}
              numberOfLines={4}
            >
              {description}
            </Text>
          </VStack>

          {/* Chevron Right Icon */}
          <Box
            width={24}
            height={24}
            alignItems="center"
            justifyContent="center"
          >
            <Feather name="chevron-right" size={24} color="#B9B9B9" />
          </Box>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default NewsCard;
