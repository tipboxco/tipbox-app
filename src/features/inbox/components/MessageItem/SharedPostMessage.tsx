import React from 'react';
import { Pressable } from 'react-native';
import { Box, VStack, HStack, Text, Image, Button, ButtonText } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { MessageItemProps } from './types';

interface SharedPostMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params'> {
  isFirstInGroup: boolean;
}

/**
 * Paylaşılan post mesajı (type sharedpost) - Figma tasarımına uygun.
 * Başlık: avatar + yazar adı + zaman + subtitle.
 * Post kartı: ürün görseli + başlık + açıklama + status (Owned).
 * Buton: "See Experience Post" -> Post detay ekranına gider.
 */
export const SharedPostMessage: React.FC<SharedPostMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
}) => {
  const sharedPost = item.sharedPost;
  if (!sharedPost) return null;

  const authorName = sharedPost.authorName || params.senderName || 'Unknown';
  const authorTitle = sharedPost.authorTitle ?? params.senderTitle ?? '';
  const authorAvatar = sharedPost.authorAvatar ?? item.senderAvatar ?? params.senderAvatar;
  const productName = sharedPost.productName || '';
  const productDescription = sharedPost.productDescription || '';
  const productImageUrl = sharedPost.productImageUrl;
  const status = sharedPost.status;
  const postId = sharedPost.postId;

  const handleSeeExperiencePost = () => {
    if (postId) {
      navigateToSharedScreenWithPruning(ROOT_ROUTES.POST, { postId });
    }
  };

  return (
    <VStack
      space="xs"
      alignItems="flex-start"
      px="$4"
      py="$2"
    >
      {isFirstInGroup && (
        <HStack space="sm" alignItems="center" mb="$1">
          <Image
            source={toImageSource(authorAvatar) || DEFAULT_USER_AVATAR}
            alt={authorName}
            width={32}
            height={32}
            borderRadius={16}
          />
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$sm"
            fontWeight="$bold"
          >
            {authorName}
          </Text>
          <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize="$2xs" fontWeight="$normal">
            {item.timestamp}
          </Text>
        </HStack>
      )}
      {authorTitle ? (
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize="$xs"
          fontWeight="$normal"
          numberOfLines={1}
          mb="$1"
        >
          {authorTitle}
        </Text>
      ) : null}

      <Box
        bg={isDark ? '#1A1A1A' : '#F2F2F2'}
        borderRadius={16}
        borderTopLeftRadius={isFirstInGroup ? 16 : 4}
        borderTopRightRadius={16}
        overflow="hidden"
        maxWidth="85%"
        alignSelf="flex-start"
      >
        <VStack space="sm" p="$3">
          {/* Post kartı: ürün görseli + başlık + açıklama + status */}
          <HStack space="sm" alignItems="flex-start">
            {productImageUrl ? (
              <Image
                source={toImageSource(productImageUrl)}
                alt={productName}
                width={56}
                height={56}
                borderRadius={8}
              />
            ) : (
              <Box
                width={56}
                height={56}
                borderRadius={8}
                bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                alignItems="center"
                justifyContent="center"
              >
                <Feather name="image" size={24} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
              </Box>
            )}
            <VStack flex={1} space="2xs">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$sm"
                fontWeight="$bold"
                numberOfLines={1}
              >
                {productName}
              </Text>
              {productDescription ? (
                <Text
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  fontSize="$xs"
                  fontWeight="$normal"
                  numberOfLines={2}
                >
                  {productDescription}
                </Text>
              ) : null}
              {status ? (
                <HStack space="xs" alignItems="center" mt="$1">
                  <Feather
                    name="monitor"
                    size={12}
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  />
                  <Text
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    fontSize="$2xs"
                    fontWeight="$medium"
                  >
                    {status}
                  </Text>
                </HStack>
              ) : null}
            </VStack>
          </HStack>

          {/* See Experience Post butonu */}
          <Button
            onPress={handleSeeExperiencePost}
            bg={isDark ? '#2A2A2A' : '#E5E5E5'}
            borderRadius={8}
            py="$2"
            alignSelf="center"
            size="sm"
          >
            <ButtonText color={isDark ? '#FFFFFF' : '#000000'} fontSize="$xs" fontWeight="$semibold">
              See Experience Post
            </ButtonText>
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};
