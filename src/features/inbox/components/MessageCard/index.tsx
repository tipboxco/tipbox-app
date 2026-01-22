import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { formatRelativeTime, toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';
import type { InboxMessage } from '../../types';

interface MessageCardProps {
  data: InboxMessage;
  onPress?: (messageId: string) => void;
  isTyping?: boolean; // Kullanıcı typing yapıyor mu?
  typingUserName?: string; // Typing yapan kullanıcının adı (opsiyonel)
}

export const MessageCard: React.FC<MessageCardProps> = ({ data, onPress, isTyping = false, typingUserName }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handlePress = () => {
    if (onPress) {
      onPress(data.id);
    }
  };

  // Avatar yoksa default avatar kullan
  const avatarSource = data.senderAvatar 
    ? (toImageSource(data.senderAvatar) || DEFAULT_USER_AVATAR)
    : DEFAULT_USER_AVATAR;

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
        {/* Avatar */}
        <CachedImage
          source={avatarSource}
          placeholder={DEFAULT_USER_AVATAR}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
        />

        {/* Message Content */}
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$xs"
            fontWeight="$semibold"
          >
            {data.senderName || 'Unknown'}
          </Text>
          
          {isTyping ? (
            <HStack space="xs" alignItems="center">
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$sm"
                fontWeight="$normal"
                fontStyle="italic"
              >
                {typingUserName || data.senderName || 'Kullanıcı'} yazıyor
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
                    return 'Yeni mesajlar var';
                  }
                  // Thread'de mesaj yoksa "Mesaj yok" göster
                  return 'Mesaj yok';
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

export default MessageCard;
