import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { Image } from 'expo-image';
import { useColorMode } from '@/src/hooks/useColorMode';
import { formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { InboxMessage } from '../../types';

const AVATAR_BG_COLORS = [
  '#5B4FE9', '#E9694F', '#4FB5E9', '#4FE96B', '#E9C84F',
  '#E94F9A', '#4FE9D8', '#9A4FE9', '#E9834F', '#4F7AE9',
];

function getAvatarBgColor(name: string): string {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_BG_COLORS[code % AVATAR_BG_COLORS.length];
}

export interface MessageCardProps {
  data: InboxMessage;
  onPress?: (messageId: string) => void;
  isTyping?: boolean; // Kullanıcı typing yapıyor mu?
  typingUserName?: string; // Typing yapan kullanıcının adı (opsiyonel)
}

function messageCardPropsAreEqual(prev: MessageCardProps, next: MessageCardProps): boolean {
  const a = prev.data;
  const b = next.data;
  return (
    a.id === b.id &&
    a.lastMessage === b.lastMessage &&
    a.timestamp === b.timestamp &&
    a.isUnread === b.isUnread &&
    (a.unreadCount ?? 0) === (b.unreadCount ?? 0) &&
    a.senderName === b.senderName &&
    a.senderAvatar === b.senderAvatar &&
    prev.isTyping === next.isTyping &&
    prev.typingUserName === next.typingUserName &&
    prev.onPress === next.onPress
  );
}

const MessageCardInner: React.FC<MessageCardProps> = ({ data, onPress, isTyping = false, typingUserName }) => {
  const { t } = useTranslation('inbox');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [avatarError, setAvatarError] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress(data.id);
    }
  };

  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  const hasAvatar = !!data.senderAvatar && !avatarError;
  const senderInitial = (data.senderName || '?').charAt(0).toUpperCase();
  const avatarBg = getAvatarBgColor(data.senderName || '?');

  return (
    <Pressable
      onPress={handlePress}
      bg={isDark ? '#1A1A1A' : '#FFFFFF'}
      p="$3"
      position="relative"
      borderBottomWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
    >
      <HStack space="md" alignItems="center">
        {/* Avatar – expo-image with memory-disk cache */}
        {hasAvatar ? (
          <Image
            source={{ uri: data.senderAvatar! }}
            placeholder={DEFAULT_USER_AVATAR}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={{ duration: 200 }}
            recyclingKey={`avatar-${data.id}`}
            onError={handleAvatarError}
          />
        ) : data.senderAvatar && avatarError ? (
          <Image
            source={DEFAULT_USER_AVATAR}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
          />
        ) : (
          <Box
            width={48}
            height={48}
            borderRadius={24}
            bg={avatarBg}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#FFFFFF" fontSize={18} fontWeight="$bold">
              {senderInitial}
            </Text>
          </Box>
        )}

        {/* Message Content */}
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$xs"
            fontWeight="$semibold"
          >
            {data.senderName || t('messages.fallback.unknown')}
          </Text>
          
          {isTyping ? (
            <HStack space="xs" alignItems="center">
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$sm"
                fontWeight="$normal"
                fontStyle="italic"
              >
                {t('messages.typing', { name: typingUserName || data.senderName || t('messages.fallback.unknown') })}
              </Text>
              <HStack space="xs" alignItems="center">
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.4 }}
                />
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.6 }}
                />
                <Box
                  width={4}
                  height={4}
                  borderRadius={2}
                  bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{ opacity: 0.8 }}
                />
              </HStack>
            </HStack>
          ) : (
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$sm"
              fontWeight={(data.isUnread || (data.unreadCount && data.unreadCount > 0)) ? '$bold' : '$normal'}
              numberOfLines={2}
            >
              {(() => {
                // Eğer lastMessage null/empty ise
                if (!data.lastMessage || data.lastMessage.trim() === '') {
                  const hasUnreadMessages = data.isUnread || (data.unreadCount && data.unreadCount > 0);
                  // Eğer thread'de mesaj varsa ama lastMessage null ise, bu backend sorunu
                  // Geçici çözüm: "Yeni mesajlar var" göster
                  if (hasUnreadMessages) {
                    // 🔍 DEBUG: Backend sorunu logla
                    if (__DEV__) {
                      console.warn('[MessageCard] ⚠️ Backend sorunu: lastMessage null ama thread\'de mesaj var!', {
                        threadId: data.id,
                        senderName: data.senderName,
                        isUnread: data.isUnread,
                        unreadCount: data.unreadCount,
                      });
                    }
                    return t('messages.fallback.newMessages');
                  }
                  // Thread'de mesaj yoksa "Mesaj yok" göster
                  return t('messages.fallback.noMessages');
                }
                return data.lastMessage;
              })()}
            </Text>
          )}
        </VStack>
      </HStack>

      {/* Timestamp and Unread Badge - Position Absolute */}
      <HStack
        position="absolute"
        top="$3"
        right="$3"
        space="xs"
        alignItems="center"
      >
        {/* Okunmayan mesaj sayısı badge'i - Timestamp'ten önce göster */}
        {(() => {
          const unreadCount = data.unreadCount || 0;
          const hasUnread = data.isUnread || unreadCount > 0;
          
          if (!hasUnread) {
            return null;
          }
          
          if (unreadCount > 0) {
            // Sayı varsa badge göster
            return (
              <Box
                minWidth={22}
                height={22}
                borderRadius={11}
                bg="#E8FF6B"
                alignItems="center"
                justifyContent="center"
                px={unreadCount > 9 ? 5 : 6}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 1 }}
                shadowOpacity={0.2}
                shadowRadius={2}
                elevation={3}
              >
                <Text
                  color="#000000"
                  fontSize={11}
                  fontWeight="$bold"
                  lineHeight={13}
                >
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </Box>
            );
          } else {
            // Sayı yoksa küçük yeşil nokta göster
            return (
              <Box
                width={10}
                height={10}
                borderRadius={5}
                bg="#E8FF6B"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 1 }}
                shadowOpacity={0.2}
                shadowRadius={2}
                elevation={3}
              />
            );
          }
        })()}
        
        {data.timestamp && (
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize="$xs"
            fontWeight="$medium"
          >
            {formatRelativeTime(data.timestamp)}
          </Text>
        )}
      </HStack>
    </Pressable>
  );
};

export const MessageCard = React.memo(MessageCardInner, messageCardPropsAreEqual);
MessageCard.displayName = 'MessageCard';

export default MessageCard;
