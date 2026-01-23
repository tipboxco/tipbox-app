import React, { useState } from 'react';
import { Pressable, Alert, Animated } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface MessageBubbleProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params' | 'onDelete' | 'onEdit' | 'onReply' | 'onReact'> {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
  isLastInGroup,
  onDelete,
  onEdit,
  onReply,
  onReact,
}) => {
  const isSent = item.isSent;
  const isDeleted = item.isDeleted;
  const reactions = item.reactions || [];
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const widthAnim = React.useRef(new Animated.Value(24)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  // Reaction animasyonları için ref'ler
  const reactionAnimsRef = React.useRef<{ [key: string]: Animated.Value }>({});
  const reactionAnims = reactionAnimsRef.current;

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  // Her reaction için animasyon değeri oluştur (sadece yoksa)
  React.useEffect(() => {
    reactions.forEach((reaction) => {
      const key = `${reaction.emoji}-${item.id}`;
      if (!reactionAnims[key]) {
        reactionAnims[key] = new Animated.Value(1);
      }
    });
  }, [reactions.length, item.id]);

  const openEmojiPicker = () => {
    setIsEmojiPickerOpen(true);
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 200,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeEmojiPicker = () => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: 24,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsEmojiPickerOpen(false);
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact?.(item.id, emoji);
    closeEmojiPicker();
  };

  const handleReactionPress = (emoji: string) => {
    const key = `${emoji}-${item.id}`;
    let animValue = reactionAnims[key];
    
    // Eğer animasyon değeri yoksa, oluştur
    if (!animValue) {
      animValue = new Animated.Value(1);
      reactionAnims[key] = animValue;
    }
    
    // Scale animasyonu: basıldığında küçül, sonra büyü
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onReact?.(item.id, emoji);
  };

  return (
    <VStack
      space="xs"
      alignItems={isSent ? 'flex-end' : 'flex-start'}
      px="$4"
      py="$2"
    >
      {!isSent && isFirstInGroup && (
        <HStack space="sm" alignItems="center" mb="$1">
          <Image
            source={
              toImageSource(item.senderAvatar || params.senderAvatar) ||
              DEFAULT_USER_AVATAR
            }
            alt={item.senderName || params.senderName || 'User'}
            width={24}
            height={24}
            borderRadius={12}
          />
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize="$xs"
            fontWeight="$medium"
          >
            {item.senderName || params.senderName || 'Unknown User'}
          </Text>
        </HStack>
      )}

      <Pressable
        onLongPress={() => {
          if (isSent && !isDeleted && item.type === 'message') {
            Alert.alert(
              'Mesaj İşlemleri',
              'Ne yapmak istersiniz?',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Yanıtla',
                  onPress: () => onReply?.(item),
                },
                {
                  text: 'Düzenle',
                  onPress: () => onEdit?.(item.id, item.text),
                },
                {
                  text: 'Sil',
                  style: 'destructive',
                  onPress: () => onDelete?.(item.id),
                },
              ]
            );
          } else if (isSent && !isDeleted) {
            onDelete?.(item.id);
          }
        }}
        delayLongPress={500}
      >
        <HStack
          space="sm"
          alignItems="flex-end"
          maxWidth="80%"
          flexDirection={isSent ? 'row-reverse' : 'row'}
        >
          <Box
            bg={
              isDeleted
                ? (isDark ? '#2A2A2A' : '#E5E5E5')
                : isSent
                ? (isDark ? '#6366F1' : '#6366F1')
                : (isDark ? '#1A1A1A' : '#F2F2F2')
            }
            px="$3"
            py="$2"
            borderRadius={16}
            borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
            borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
            opacity={isDeleted ? 0.6 : 1}
          >
            <Text
              color={
                isDeleted
                  ? (isDark ? '#8C8C8C' : '#8C8C8C')
                  : isSent
                  ? '#FFFFFF'
                  : (isDark ? '#FFFFFF' : '#000000')
              }
              fontSize="$xs"
              fontWeight="$normal"
              fontStyle={isDeleted ? 'italic' : 'normal'}
            >
              {isDeleted ? 'Bu mesaj silindi' : (item.text || '(Mesaj içeriği yok)')}
            </Text>
          </Box>

          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$2xs"
              fontWeight="$normal"
            >
              {formatMessageTime(item.timestamp)}
            </Text>
            {isSent && (
              <Box position="relative" width={16} height={14} alignItems="center" justifyContent="center">
                {item.isRead ? (
                  <>
                    <Feather
                      name="check"
                      size={14}
                      color="#4CAF50"
                      style={{ position: 'absolute', left: 0, top: 0 }}
                    />
                    <Feather
                      name="check"
                      size={14}
                      color="#4CAF50"
                      style={{ position: 'absolute', left: 4, top: 0 }}
                    />
                  </>
                ) : (
                  <Feather
                    name="check"
                    size={12}
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  />
                )}
              </Box>
            )}
          </VStack>
        </HStack>
      </Pressable>

      {/* Reaction Button and Reactions */}
      <HStack
        space="xs"
        alignItems="center"
        mt="$1"
        flexWrap="wrap"
        justifyContent={isSent ? 'flex-end' : 'flex-start'}
      >
        {/* Reactions */}
        {reactions.length > 0 && (
          <>
            {reactions.map((reaction, index) => {
              const key = `${reaction.emoji}-${item.id}`;
              const scaleAnim = reactionAnims[key] || new Animated.Value(1);
              
              return (
                <Animated.View
                  key={`${reaction.emoji}-${index}`}
                  style={{
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <Pressable
                    onPress={() => handleReactionPress(reaction.emoji)}
                  >
                    <Box
                      bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                      px="$2"
                      py="$1"
                      borderRadius={12}
                      borderWidth={1}
                      borderColor={isDark ? '#333' : '#E5E5E5'}
                    >
                      <HStack space="xs" alignItems="center">
                        <Text fontSize={12}>{reaction.emoji}</Text>
                        {reaction.count > 0 && (
                          <Text
                            fontSize={10}
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontWeight="$medium"
                          >
                            {reaction.count}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* Add Reaction Button / Emoji Picker */}
        {!isDeleted && item.type === 'message' && (
          <Animated.View
            style={{
              width: widthAnim,
              height: 24,
              overflow: 'hidden',
            }}
          >
            {isEmojiPickerOpen ? (
              <Box
                height={24}
                borderRadius={12}
                borderWidth={1}
                borderStyle="dashed"
                borderColor={isDark ? '#666' : '#999'}
                bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                flexDirection="row"
                alignItems="center"
                px="$2"
              >
                <HStack space="sm" alignItems="center" flex={1}>
                  {emojis.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => handleEmojiSelect(emoji)}
                    >
                      <Text fontSize={16}>{emoji}</Text>
                    </Pressable>
                  ))}
                </HStack>
                <Pressable onPress={closeEmojiPicker}>
                  <Feather
                    name="x"
                    size={14}
                    color={isDark ? '#666' : '#999'}
                  />
                </Pressable>
              </Box>
            ) : (
              <Pressable onPress={openEmojiPicker}>
                <Box
                  width={24}
                  height={24}
                  borderRadius={12}
                  borderWidth={1}
                  borderStyle="dashed"
                  borderColor={isDark ? '#666' : '#999'}
                  alignItems="center"
                  justifyContent="center"
                  bg="transparent"
                >
                  <Feather
                    name="plus"
                    size={14}
                    color={isDark ? '#666' : '#999'}
                  />
                </Box>
              </Pressable>
            )}
          </Animated.View>
        )}
      </HStack>
    </VStack>
  );
};
