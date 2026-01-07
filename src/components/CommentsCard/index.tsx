import React, { useMemo, useState } from 'react';
import { ImageSourcePropType } from 'react-native';
import { Box, HStack, VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için

export interface CommentsCardProps {
  id?: string;
  userName: string;
  userTitle: string;
  avatar: ImageSourcePropType;
  timeAgo: string;
  content: string;
}

export const CommentsCard: React.FC<CommentsCardProps> = ({
  userName,
  userTitle,
  avatar,
  timeAgo,
  content,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  // Metin uzunluğuna göre basit truncation kontrolü
  const shouldTruncate = useMemo(() => content.length > 160, [content]);

  return (
    <Box
      position="relative"
      borderBottomWidth={1}
      borderBottomColor="#E9E9E9"
      px={12}
      py={8}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <HStack alignItems="flex-start" space="sm">
        {/* Avatar */}
        <Image
          source={avatar}
          alt={userName}
          width={48}
          height={48}
          borderRadius={100}
        />

        {/* Comment Content */}
        <VStack flex={1} space="xs">
          {/* Name & Title */}
          <VStack space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$bold"
            >
              {userName}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={9}
              fontWeight="$medium"
              numberOfLines={1}
            >
              {userTitle}
            </Text>
          </VStack>

          {/* Comment Text */}
          <VStack space="xs">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              lineHeight={14}
              numberOfLines={isExpanded || !shouldTruncate ? undefined : 3}
            >
              {content}
            </Text>

            {/* Expand / Collapse - sadece metin yeterince uzunsa göster */}
            {shouldTruncate && (
              <Pressable
                alignSelf="flex-start"
                onPress={() => setIsExpanded((prev) => !prev)}
              >
                <Text
                  color="#829905"
                  fontSize={9}
                  fontWeight="$medium"
                  textDecorationLine="underline"
                >
                  {isExpanded ? 'Daha az göster' : 'Daha fazla göster'}
                </Text>
              </Pressable>
            )}
          </VStack>
        </VStack>
      </HStack>

      {/* Time */}
      <Text
        position="absolute"
        top={8}
        right={12}
        color={isDark ? '#8C8C8C' : '#8C8C8C'}
        fontSize={9}
        fontWeight="$medium"
      >
        {timeAgo}
      </Text>
    </Box>
  );
};

export default CommentsCard;


