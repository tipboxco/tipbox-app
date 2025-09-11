import React from 'react';
import { VStack, HStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { PostCard as PostCardType } from '@/src/mock/profile/feed/types';

interface PostCardProps {
  data: PostCardType;
}

export const PostCard = ({ data }: PostCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack
      bg={isDark ? '$backgroundDark900' : '$white'}
      borderWidth={1}
      borderColor={isDark ? '$borderDark800' : '#E9E9E9'}
      borderRadius={5}
      my={8}
    >
      {/* Action Button */}
      <Pressable
        position="absolute"
        top={12}
        right={15}
        zIndex={1}
      >
        <Feather name="more-horizontal" size={16} color={isDark ? '#fff' : '#A3A3A3'} />
      </Pressable>

      {/* Header */}
      <VStack px={15} py={12} mb={15} space="sm" borderBottomWidth={1} borderBottomColor={isDark ? '$borderDark800' : '#E9E9E9'}>
        <HStack alignItems="center" space="xs">
          <Image
            source={data.user.avatar}
            alt={data.user.name}
            size="sm"
            borderRadius={100}
          />
          <VStack>
            <Text
              color={isDark ? '$textDark400' : '#C7C7C7'}
              fontSize={10}
              fontWeight="$semibold"
            >
              {data.user.action}
            </Text>
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={14}
              fontWeight="$bold"
            >
              {data.user.name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '#787878'}
              fontSize={12}
              numberOfLines={1}
              maxWidth={250}
            >
              {data.user.title}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      {/* Product */}
      <HStack px={15} mb={15} space="md" alignItems="center">
        <Image
          source={data.product.image}
          alt={data.product.name}
          size="sm"
          borderRadius={5}
        />
        <Text
          flex={1}
          color={isDark ? '$textDark50' : '#000'}
          fontSize={16}
          numberOfLines={2}
        >
          {data.product.name}
        </Text>
        <Feather name="clock" size={20} color={isDark ? '#fff' : '#A3A3A3'} />
      </HStack>

      {/* Content */}
      <VStack px={15} mt={4} space="md">
        {data.content.map((item, index) => (
          <VStack key={index} space="xs">
            <HStack space="sm" alignItems="center">
              <Feather name={item.tag.icon === 'tag' ? 'tag' : 'package'} size={18} color={isDark ? '#fff' : '#000'} fill={isDark ? '#fff' : '#000'} />
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize={14}
                fontWeight="$semibold"
              >
                {item.tag.title}
              </Text>
            </HStack>
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={13}
              lineHeight={20}
              ml={26}
            >
              {item.text}
            </Text>
            <HStack space="sm" ml={26}>
              {item.rating.map((star, idx) => (
                <Feather
                  key={idx}
                  name={star ? 'star' : 'star'}
                  size={18}
                  color={star ? (isDark ? '#fff' : '#829905') : (isDark ? '#7E7E7E' : '#E8E8E8')}
                  fill={star ? (isDark ? '#fff' : '#829905') : 'transparent'}
                />
              ))}
            </HStack>
          </VStack>
        ))}
      </VStack>

      {/* Tags */}
      <HStack px={15} mt={15} space="sm" flexWrap="wrap">
        {data.tags.map((tag, index) => (
          <HStack
            key={index}
            bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark800' : '#EFEFEF'}
            borderRadius={16}
            px={16}
            py={6}
          >
            <Text
              color={isDark ? '$textDark50' : '#000'}
              fontSize={12}
              fontWeight="$medium"
            >
              {tag}
            </Text>
          </HStack>
        ))}
      </HStack>

      {/* Stats */}
      <HStack
        px={15}
        mt={4}
        py={8}
        space="xl"
      >
        <HStack space="xs" alignItems="center">
          <Feather name="heart" size={20} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} fontSize={14}>{data.stats.likes}</Text>
        </HStack>
        <HStack space="xs" alignItems="center">
          <Feather name="message-circle" size={20} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} fontSize={14}>{data.stats.comments}</Text>
        </HStack>
        <HStack space="xs" alignItems="center">
          <Feather name="send" size={20} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} fontSize={14}>{data.stats.shares}</Text>
        </HStack>
        <HStack space="xs" alignItems="center" ml="auto">
          <Feather name="bookmark" size={20} color={isDark ? '#fff' : '#000'} />
          <Text color={isDark ? '$textDark50' : '#000'} fontSize={14}>{data.stats.bookmarks}</Text>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default PostCard;