import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Pressable } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface SharedPostMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params'> {
  isFirstInGroup: boolean;
}

const SEPARATOR_COLOR_LIGHT = '#E5E5E5';
const SEPARATOR_COLOR_DARK = '#333333';
const SCREEN_WIDTH = Dimensions.get('window').width;

const POST_TYPE_BUTTON_LABELS: Record<string, string> = {
  QUESTION: 'See Question Post',
  UPDATE: 'See Update Post',
  EXPERIENCE: 'See Experience Post',
  COMPARE: 'See Compare Post',
  TIPS: 'See Tips Post',
  FREE: 'See Post',
};

/**
 * Paylaşılan post mesajı (type sharedpost) – Kart tasarımı:
 * 1. Header: avatar + ad, alt satırda unvan (ince ayırıcı)
 * 2. İçerik: imageUrl/contextData görseli + başlık (contextData.name veya COMPARE'da products; yoksa "Shared post")
 * 3. Buton: postType'a göre / "See Post"
 * 4. Optional text bubble BELOW the card
 * 5. Timestamp + ticks below
 */
export const SharedPostMessage: React.FC<SharedPostMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
}) => {
  const sharedPost = item.sharedPost;
  if (!sharedPost) return null;

  const authorName = sharedPost.authorName || 'Unknown';
  const authorTitle = sharedPost.authorTitle ?? '';
  const authorAvatar = sharedPost.authorAvatar ?? null;
  const contextData = sharedPost.contextData;
  const products = sharedPost.products;
  const postId = sharedPost.postId;
  const postType = sharedPost.postType ?? null;
  const buttonLabel =
    (postType && POST_TYPE_BUTTON_LABELS[postType]) || 'See Post';

  const contentTitle =
    contextData?.name ??
    ((products?.length ? products.map((p) => p.name).join(' vs ') : '') || 'Shared post');

  const thumbnailSource = sharedPost.imageUrl ?? contextData?.image ?? null;
  const contentImageSource = thumbnailSource ? toImageSource(thumbnailSource) : null;

  const handleSeePost = () => {
    if (postId) {
      navigateToSharedScreenWithPruning(ROOT_ROUTES.POST, {
        screen: 'PostDetailScreen',
        params: { postId },
      });
    }
  };

  const isSent = item.isSent;
  const separatorColor = isDark ? SEPARATOR_COLOR_DARK : SEPARATOR_COLOR_LIGHT;
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#2A2A2A' : '#F0F0F0';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#8C8C8C' : '#6B7280';
  const buttonBg = '#C2E607';
  const buttonTextColor = '#111827';

  const messageText = (item.text || '').trim();
  const bubbleBg = isSent ? '#6366F1' : (isDark ? '#1A1A1A' : '#F2F2F2');
  const bubbleTextColor = isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000');
  const cardMaxWidth = SCREEN_WIDTH * 0.7;

  return (
    <VStack alignItems={isSent ? 'flex-end' : 'flex-start'} py="$1">
      <VStack
        width={cardMaxWidth}
        alignSelf={isSent ? 'flex-end' : 'flex-start'}
      >
        {/* Post card */}
        <Box
          bg={cardBg}
          borderRadius={16}
          borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
          borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
          overflow="hidden"
          borderWidth={1}
          borderColor={borderColor}
        >
          {/* 1. Header */}
          <Box px="$3" pt="$3" pb="$2" borderBottomWidth={1} borderBottomColor={separatorColor}>
            <HStack space="sm" alignItems="center">
              <Image
                source={toImageSource(authorAvatar) || DEFAULT_USER_AVATAR}
                alt={authorName}
                width={36}
                height={36}
                borderRadius={18}
              />
              <VStack flex={1} space="2xs">
                <Text color={textPrimary} fontSize="$sm" fontWeight="$bold" numberOfLines={1}>
                  {authorName}
                </Text>
                {authorTitle ? (
                  <Text
                    color={textSecondary}
                    fontSize="$xs"
                    fontWeight="$normal"
                    numberOfLines={1}
                  >
                    {authorTitle}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
          </Box>

          {/* 2. Content */}
          <Box px="$3" py="$3" borderBottomWidth={1} borderBottomColor={separatorColor}>
            <HStack space="sm" alignItems="flex-start">
              {contentImageSource ? (
                <Image
                  source={contentImageSource}
                  alt={contentTitle}
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
                  <Feather name="file-text" size={24} color={textSecondary} />
                </Box>
              )}
              <VStack flex={1} space="2xs" minWidth={0}>
                <Text
                  color={textPrimary}
                  fontSize="$sm"
                  fontWeight="$semibold"
                  numberOfLines={2}
                >
                  {contentTitle}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* 3. Button */}
          <Box px="$3" py="$3">
            <Pressable
              onPress={handleSeePost}
              style={[styles.button, { backgroundColor: buttonBg }]}
            >
              <Text style={[styles.buttonText, { color: buttonTextColor }]}>{buttonLabel}</Text>
            </Pressable>
          </Box>
        </Box>

        {/* 4. Optional text bubble BELOW the post card */}
        {messageText ? (
          <Box
            alignSelf={isSent ? 'flex-end' : 'flex-start'}
            mt="$1"
            px={12}
            py={8}
            borderRadius={16}
            bg={bubbleBg}
            maxWidth="80%"
          >
            <Text fontSize="$sm" fontWeight="$normal" color={bubbleTextColor}>
              {messageText}
            </Text>
          </Box>
        ) : null}

        {/* 5. Timestamp + Ticks BELOW */}
        <HStack
          space="xs"
          alignItems="center"
          mt={2}
          alignSelf={isSent ? 'flex-end' : 'flex-start'}
        >
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize={10}
            fontWeight="$normal"
          >
            {formatMessageTime(item.timestamp)}
          </Text>
          {isSent && (
            <View style={{ width: 16, height: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {item.isRead ? (
                <>
                  <Feather
                    name="check"
                    size={12}
                    color="#4CAF50"
                    style={{ position: 'absolute', left: 0, top: 0 }}
                  />
                  <Feather
                    name="check"
                    size={12}
                    color="#4CAF50"
                    style={{ position: 'absolute', left: 4, top: 0 }}
                  />
                </>
              ) : (
                <Feather
                  name="check"
                  size={11}
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                />
              )}
            </View>
          )}
        </HStack>
      </VStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
