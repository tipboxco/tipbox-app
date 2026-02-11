import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { MessageItemProps } from './types';

interface SharedPostMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params'> {
  isFirstInGroup: boolean;
}

const BULLET = ' • ';
const SEPARATOR_COLOR_LIGHT = '#E5E5E5';
const SEPARATOR_COLOR_DARK = '#333333';

const POST_TYPE_BUTTON_LABELS: Record<string, string> = {
  QUESTION: 'See Question Post',
  UPDATE: 'See Update Post',
  EXPERIENCE: 'See Experience Post',
  COMPARE: 'See Compare Post',
  TIPS: 'See Tips Post',
  FREE: 'See Post',
};

/** productName yokken kart başlığı: postType'a göre */
const POST_TYPE_TITLES: Record<string, string> = {
  QUESTION: 'Question Post',
  UPDATE: 'Update Post',
  EXPERIENCE: 'Experience Post',
  COMPARE: 'Compare Post',
  TIPS: 'Tips Post',
  FREE: 'Post',
};

/**
 * Paylaşılan post mesajı (type sharedpost) – Kart tasarımı:
 * 1. Header: avatar + ad • zaman, alt satırda unvan (ince ayırıcı)
 * 2. Ürün: thumbnail + ürün adı + açıklama + status (ince ayırıcı)
 * 3. Buton: postType'a göre veya actionButtonLabel / "See Post"
 */
export const SharedPostMessage: React.FC<SharedPostMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
}) => {
  const sharedPost = item.sharedPost;
  if (!sharedPost) return null;

  // Paylaşılan postun sahibinin bilgileri (gönderen değil)
  const authorName = sharedPost.authorName || 'Unknown';
  const authorTitle = sharedPost.authorTitle ?? '';
  const authorAvatar = sharedPost.authorAvatar ?? null;
  const productName = sharedPost.productName ?? '';
  const productGroupName = sharedPost.productGroupName ?? '';
  const productDescription = sharedPost.productDescription ?? '';
  const productImageUrl = sharedPost.productImageUrl;
  const productGroupImageUrl = sharedPost.productGroupImageUrl;
  const contextData = sharedPost.contextData;
  const status = sharedPost.status;
  const postId = sharedPost.postId;
  const postType = sharedPost.postType ?? null;
  const buttonLabel =
    sharedPost.actionButtonLabel ||
    (postType && POST_TYPE_BUTTON_LABELS[postType]) ||
    'See Post';

  /** Kart içi başlık: productName, contextData.name (contextType product), productGroupName veya "Shared post" */
  const contentTitle =
    productName || (sharedPost.contextType === 'product' ? (contextData?.name ?? '') : '') || productGroupName || 'Shared post';

  /** İçerik görseli: productImageUrl, contextData.image (product), productGroupImageUrl; avatar content'ta kullanılmaz */
  const thumbnailSource = productImageUrl ?? (sharedPost.contextType === 'product' ? (contextData?.image ?? null) : null) ?? productGroupImageUrl ?? null;
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
  const buttonBg = '#C2E607'; // Figma 6390-61042: lime green (request type green)
  const buttonTextColor = '#111827';

  const messageText = (item.text || '').trim();
  const bubbleBg = isSent ? '#6366F1' : (isDark ? '#1A1A1A' : '#F2F2F2');
  const bubbleTextColor = isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000');

  return (
    <VStack alignItems={isSent ? 'flex-end' : 'flex-start'} px={isSent ? '$2' : '$4'} py="$2">
      {messageText ? (
        <Box
          alignSelf={isSent ? 'flex-end' : 'flex-start'}
          maxWidth="60%"
          mb="$2"
          px={12}
          py={8}
          borderRadius={16}
          borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
          borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
          bg={bubbleBg}
        >
          <Text fontSize="$sm" fontWeight="$normal" color={bubbleTextColor}>
            {messageText}
          </Text>
        </Box>
      ) : null}
      <Box
        bg={cardBg}
        borderRadius={16}
        borderTopLeftRadius={isFirstInGroup ? 16 : 4}
        borderTopRightRadius={16}
        overflow="hidden"
        alignSelf={isSent ? 'flex-end' : 'flex-start'}
        width="100%"
        maxWidth="60%"
        borderWidth={1}
        borderColor={borderColor}
      >
        {/* 1. Header: avatar + ad • zaman, alt satırda unvan */}
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
              <HStack alignItems="center" flexWrap="wrap" gap={4}>
                <Text color={textPrimary} fontSize="$sm" fontWeight="$bold" numberOfLines={1}>
                  {authorName}
                </Text>
                <Text color={textSecondary} fontSize="$2xs" fontWeight="$normal">
                  {BULLET}
                </Text>
                <Text color={textSecondary} fontSize="$2xs" fontWeight="$normal">
                  {item.timestamp}
                </Text>
              </HStack>
              {authorTitle ? (
                <Text
                  color={textSecondary}
                  fontSize="$xs"
                  fontWeight="$normal"
                  numberOfLines={1}
                  mt="$0.5"
                >
                  {authorTitle}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        </Box>

        {/* 2. İçerik: thumbnail (sadece ürün/group görseli veya placeholder) + başlık + opsiyonel açıklama/status */}
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
              {productDescription ? (
                <Text
                  color={textSecondary}
                  fontSize="$xs"
                  fontWeight="$normal"
                  numberOfLines={2}
                >
                  {productDescription}
                </Text>
              ) : null}
              {status ? (
                <HStack space="xs" alignItems="center" mt="$1">
                  <Feather name="box" size={12} color={textSecondary} />
                  <Text color={textSecondary} fontSize="$2xs" fontWeight="$medium">
                    {status}
                  </Text>
                </HStack>
              ) : null}
            </VStack>
          </HStack>
        </Box>

        {/* 3. Buton */}
        <Box px="$3" py="$3">
          <Pressable
            onPress={handleSeePost}
            style={[styles.button, { backgroundColor: buttonBg }]}
          >
            <Text style={[styles.buttonText, { color: buttonTextColor }]}>{buttonLabel}</Text>
          </Pressable>
        </Box>
      </Box>
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
