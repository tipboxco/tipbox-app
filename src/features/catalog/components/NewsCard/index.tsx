import React from 'react';
import { Box, HStack, VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import {
  BookOpenIcon,
  ChevronRightIcon,
} from 'react-native-heroicons/outline';

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
        overflow="hidden"
      >
        <HStack space="sm" alignItems="flex-start" flex={1}>
          {/* News Image */}
          <Box
            width={64}
            height={64}
            borderRadius={5}
            bg="rgba(0, 0, 0, 0.2)"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            flexShrink={0}
          >
            <Image
              source={image}
              alt={title}
              style={{
                width: 64,
                height: 64,
              }}
              resizeMode="cover"
            />
          </Box>

          {/* News Content - VStack: kart içine sığacak şekilde taşma önlenir */}
          <VStack
            flex={1}
            flexShrink={1}
            minWidth={0}
            pr="$2"
            space="xs"
            justifyContent="flex-start"
          >
            {/* Source and Date */}
            <HStack alignItems="center" space="xs" flexShrink={0}>
              <BookOpenIcon width={12} height={12} color="#B9B9B9" />
              <Text
                color="#B9B9B9"
                fontSize="$2xs"
                fontWeight="$medium"
                numberOfLines={1}
                flexShrink={1}
                minWidth={0}
              >
                {source} - {date}
              </Text>
            </HStack>

            {/* Title - tek satır, ellipsis */}
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize="$sm"
              fontWeight="$bold"
              numberOfLines={1}
              ellipsizeMode="tail"
              flexShrink={1}
              minWidth={0}
            >
              {title}
            </Text>

            {/* Description - 2 satır, ellipsis; kartın içinde kalır */}
            <Text
              color={isDark ? '#FFFFFF' : '#343434'}
              fontSize="$2xs"
              lineHeight="$sm"
              numberOfLines={2}
              ellipsizeMode="tail"
              flexShrink={1}
              minWidth={0}
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
            flexShrink={0}
          >
            <ChevronRightIcon width={24} height={24} color="#B9B9B9" />
          </Box>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default NewsCard;
