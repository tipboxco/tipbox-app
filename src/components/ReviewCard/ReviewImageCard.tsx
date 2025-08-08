import React from 'react';
import { Box, HStack, Image, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

import type { ReviewImageCardProps } from './types';

export const ReviewImageCard = ({
  title,
  content,
  mainImage,
  productName,
  likes,
  comments,
  shares,
  bookmarks,
  rating,
  usageDuration,
  experience,
  userImage,
  userName,
  userBadge,
  userAction,
  onPress,
}: ReviewImageCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={() => onPress?.({
      title,
      content,
      mainImage,
      productName,
      likes,
      comments,
      shares,
      bookmarks,
      rating,
      usageDuration,
      experience,
      userImage,
      userName,
      userBadge,
      userAction,
    })}>
      <Box
        borderWidth={1}
        borderColor={isDark ? '$backgroundDark200' : '$borderLight200'}
        rounded="$lg"
        bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
        overflow="hidden"
        mb="$4"
      >
      {/* User Info */}
      <HStack p="$4" space="md" alignItems="center">
        <Image
          source={userImage}
          alt={userName}
          w={46}
          h={46}
          rounded="$full"
        />
        <VStack flex={1}>
          <HStack space="sm" alignItems="center">
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$sm"
              fontWeight="$bold"
            >
              {userName}
            </Text>
            <Box
              px="$2"
              py="$1"
              bg="#E95E8C"
              borderWidth={1}
              borderColor="#E3306B"
              rounded="$lg"
            >
              <Text color="#6A0023" fontSize="$2xs" fontWeight="$semibold">
                {userBadge}
              </Text>
            </Box>
          </HStack>
          <HStack space="sm" alignItems="center">
            <FeatherIcon
              name="arrow-up-circle"
              size={14}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$2xs">
              {userAction}
            </Text>
          </HStack>
        </VStack>
        <Pressable p="$2">
          <FeatherIcon
            name="more-vertical"
            size={20}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
        </Pressable>
      </HStack>

      {/* Content */}
      <Box px="$4" mb="$4">
        <VStack space="sm">
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$sm"
            fontWeight="$semibold"
          >
            {title}
          </Text>
          <Text
            color={isDark ? '$textDark400' : '$textLight500'}
            fontSize="$xs"
            numberOfLines={3}
          >
            {content}
          </Text>
        </VStack>
      </Box>

      {/* Main Image Container */}
      <Box px="$4" mb="$4">
        {/* Image Wrapper with Relative Position */}
        <Box position="relative" w="100%" h={330}>
          <Image
            source={mainImage}
            alt={title}
            w="100%"
            h="100%"
            resizeMode="cover"
          />
          {/* Rating Overlay */}
          <Box
            position="absolute"
            top={4}
            left={4}
            px="$3"
            py="$2"
            bg="rgba(0, 0, 0, 0.6)"
            rounded="$lg"
          >
            <HStack space="sm">
              {Array.from({ length: 5 }).map((_, index) => (
                <FeatherIcon
                  key={index}
                  name="star"
                  size={14}
                  color={index < rating ? '#C2E607' : '#3B3B3B'}
                  style={{ marginRight: 2 }}
                />
              ))}
            </HStack>
          </Box>
          {/* Tags Overlay */}
          <HStack
            position="absolute"
            bottom={4}
            right={4}
            space="sm"
          >
            <Box
              px="$3"
              py="$1"
              bg="rgba(62, 62, 62, 0.8)"
              borderWidth={1}
              borderColor="#545454"
              rounded="$lg"
            >
              <Text color="#C7C7C7" fontSize="$2xs">
                {usageDuration}
              </Text>
            </Box>
            <Box
              px="$3"
              py="$1"
              bg="rgba(62, 62, 62, 0.8)"
              borderWidth={1}
              borderColor="#545454"
              rounded="$lg"
            >
              <Text color="#C7C7C7" fontSize="$2xs">
                {experience}
              </Text>
            </Box>
          </HStack>
        </Box>
      </Box>

      {/* Divider */}
      <Box h={1} bg={isDark ? '$backgroundDark800' : '$backgroundLight100'} />

      {/* Actions */}
      <HStack p="$4" justifyContent="space-between">
        <HStack space="lg">
          <HStack space="sm" alignItems="center">
            <Pressable>
              <FeatherIcon
                name="heart"
                size={20}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </Pressable>
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
              {likes}
            </Text>
          </HStack>
          <HStack space="sm" alignItems="center">
            <Pressable>
              <FeatherIcon
                name="message-circle"
                size={20}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </Pressable>
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
              {comments}
            </Text>
          </HStack>
          <HStack space="sm" alignItems="center">
            <Pressable>
              <FeatherIcon
                name="send"
                size={20}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </Pressable>
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
              {shares}
            </Text>
          </HStack>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Pressable>
            <FeatherIcon
              name="bookmark"
              size={20}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </Pressable>
          <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
            {bookmarks}
          </Text>
        </HStack>
      </HStack>
    </Box>
    </Pressable>
  );
};
