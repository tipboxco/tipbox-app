import React, { useState, useRef } from 'react';
import { Pressable, Alert, Animated, View, Text as RNText, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { WhatsAppContextMenu } from './WhatsAppContextMenu';
import { useTranslation } from 'react-i18next';

// Haptic feedback - opsiyonel
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics yoksa sessizce devam et
}
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface MessageBubbleProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params' | 'onDelete' | 'onEdit' | 'onReply' | 'onReact' | 'onContextMenuStateChange'> {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  currentUserId?: string; // ✅ FIX: isSent hesaplaması için currentUserId ekle
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
  onContextMenuStateChange,
  currentUserId,
}) => {
  const { t } = useTranslation('inbox');
  // ✅ FIX: isSent değerini yeniden hesapla - item.isSent yanlış olabilir
  // item.senderId ve currentUserId karşılaştırması yap
  const isSent = currentUserId && item.senderId
    ? String(item.senderId) === String(currentUserId)
    : item.isSent; // Fallback: item.isSent kullan
  
  // ✅ DEBUG: isSent hesaplamasını kontrol et
  if (__DEV__) {
    console.log('[MessageBubble] 🔍 isSent yeniden hesaplama:', {
      messageId: item.id,
      itemIsSent: item.isSent,
      itemSenderId: item.senderId,
      currentUserId,
      calculatedIsSent: currentUserId && item.senderId 
        ? String(item.senderId) === String(currentUserId)
        : item.isSent,
      finalIsSent: isSent,
    });
  }
  const isDeleted = item.isDeleted;
  const isDeleting = item.isDeleting; // ✅ Optimistic delete state (REST API ile silme işlemi başladığında)
  const reactions = item.reactions || [];
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [messagePosition, setMessagePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const messageRef = useRef<any>(null);
  const messageBubbleRef = useRef<any>(null); // Mesaj balonunun kendisi için ref
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Reanimated values for message bubble scale
  const messageScale = useSharedValue(1);
  
  // Message bubble'ı context menu açıkken daha görünür yap
  React.useEffect(() => {
    if (isContextMenuOpen) {
      messageScale.value = withSpring(1.05, {
        damping: 15,
        stiffness: 200,
        mass: 0.8,
      });
    } else {
      messageScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
        mass: 0.8,
      });
    }
  }, [isContextMenuOpen]);
  
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

  const handleLongPress = (event?: any) => {
    if (__DEV__) {
      console.log('[MessageBubble] 🔍 Long press detected!', {
        messageId: item.id,
        isDeleted,
        hasRef: !!messageRef.current,
        event: event?.nativeEvent,
      });
    }
    
    // ✅ FIX: Silinen mesajlar veya silme işlemi devam eden mesajlar için context menu açma
    if (isDeleted || isDeleting) {
      if (__DEV__) {
        console.log('[MessageBubble] ⚠️ Mesaj silinmiş veya siliniyor, context menu açılmıyor', {
          isDeleted,
          isDeleting,
        });
      }
      return;
    }
    
    // Haptic feedback (opsiyonel)
    if (Haptics && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Mesaj pozisyonunu ölç - Mesaj balonunun orijinal pozisyonunu al (tıklama noktasına göre değil)
    const bubbleRef = messageBubbleRef.current;
    
    // Mesaj balonunun kendisini ölç (orijinal pozisyon)
    if (bubbleRef && typeof bubbleRef.measureInWindow === 'function') {
      setTimeout(() => {
        if (messageBubbleRef.current) {
          messageBubbleRef.current.measureInWindow((x, y, width, height) => {
            if (__DEV__) {
              console.log('[MessageBubble] 📐 Message bubble original position:', { x, y, width, height });
            }
            
            if (x !== 0 || y !== 0 || width !== 0 || height !== 0) {
              // Orijinal pozisyonu kullan (tıklama noktasına göre değil)
              setMessagePosition({ x, y, width, height });
              setIsContextMenuOpen(true);
            } else {
              // Ölçüm başarısız, fallback kullan
              if (__DEV__) {
                console.log('[MessageBubble] ⚠️ Measurement returned zeros, using fallback');
              }
              handleLongPressFallback(event);
            }
          });
        } else {
          handleLongPressFallback(event);
        }
      }, 50);
    } else {
      // Mesaj balonu ref'i yok, container'ı ölç
      if (messageRef.current && typeof messageRef.current.measureInWindow === 'function') {
        setTimeout(() => {
          if (messageRef.current) {
            messageRef.current.measureInWindow((x, y, width, height) => {
              if (__DEV__) {
                console.log('[MessageBubble] 📐 Container position:', { x, y, width, height });
              }
              
              if (x !== 0 || y !== 0 || width !== 0 || height !== 0) {
                setMessagePosition({ x, y, width, height });
                setIsContextMenuOpen(true);
              } else {
                handleLongPressFallback(event);
              }
            });
          } else {
            handleLongPressFallback(event);
          }
        }, 50);
      } else {
        if (__DEV__) {
          console.log('[MessageBubble] ⚠️ Ref is null or measureInWindow not available');
        }
        handleLongPressFallback(event);
      }
    }
  };

  const handleLongPressFallback = (event?: any) => {
    // Fallback: Event'ten pozisyon al veya mesajın yaklaşık pozisyonunu kullan
    if (event?.nativeEvent) {
      const touchX = event.nativeEvent.pageX || event.nativeEvent.locationX || 0;
      const touchY = event.nativeEvent.pageY || event.nativeEvent.locationY || 0;
      
      if (touchX > 0 && touchY > 0) {
        if (__DEV__) {
          console.log('[MessageBubble] 📐 Using touch position from event:', { touchX, touchY });
        }
        // Yaklaşık boyutlar (mesaj balonu için)
        setMessagePosition({ 
          x: touchX - 100, 
          y: touchY - 20, 
          width: 200, 
          height: 40 
        });
        setIsContextMenuOpen(true);
        return;
      }
    }
    
    // Son çare: Mesajın yaklaşık pozisyonu (isSent'e göre)
    if (__DEV__) {
      console.log('[MessageBubble] ⚠️ Using approximate position');
    }
    const approximateX = isSent ? screenWidth - 250 : 16;
    const approximateY = screenHeight / 2;
    setMessagePosition({ 
      x: approximateX, 
      y: approximateY, 
      width: 200, 
      height: 40 
    });
    setIsContextMenuOpen(true);
  };

  const closeContextMenu = () => {
    setIsContextMenuOpen(false);
    setMessagePosition(null);
    messageScale.value = withSpring(1);
    onContextMenuStateChange?.(false);
  };
  
  // Context menu açıldığında parent'a bildir
  React.useEffect(() => {
    onContextMenuStateChange?.(isContextMenuOpen);
  }, [isContextMenuOpen, onContextMenuStateChange]);

  // Menu actions
  const menuActions = React.useMemo(() => {
    const actions: Array<{ id: string; label: string; icon: string; color?: string; onPress: () => void }> = [];
    
    if (__DEV__) {
      console.log('[MessageBubble] 🔍 Menu actions için kontrol:', {
        isSent,
        isDeleted,
        itemType: item.type,
        hasOnDelete: !!onDelete,
        hasOnReply: !!onReply,
        hasOnEdit: !!onEdit,
      });
    }
    
    if (!isDeleted && item.type === 'message') {
      if (onReply) {
        actions.push({
          id: 'reply',
          label: t('messageDetail.actions.reply'),
          icon: 'corner-up-left',
          onPress: () => onReply(item),
        });
      }

      if (isSent && onEdit) {
        actions.push({
          id: 'edit',
          label: t('messageDetail.actions.edit'),
          icon: 'edit',
          onPress: () => onEdit(item.id, item.text),
        });
      }
    }
    
    // ✅ DISABLED: Delete action geçici olarak devre dışı
    // // ✅ FIX: Delete action - sadece gönderilen mesajlar için (isSent === true)
    // // onDelete prop'u varsa ve mesaj gönderilmişse delete action'ı ekle
    // // Silinen veya silme işlemi devam eden mesajlar için delete action ekleme
    // if (isSent && onDelete && !isDeleted && !isDeleting) {
    //   if (__DEV__) {
    //     console.log('[MessageBubble] ✅ Delete action ekleniyor', {
    //       isSent,
    //       hasOnDelete: !!onDelete,
    //       isDeleted,
    //       itemId: item.id,
    //       itemType: item.type,
    //     });
    //   }
    //   actions.push({
    //     id: 'delete',
    //     label: 'Delete',
    //     icon: 'trash-2',
    //     color: '#F44336',
    //     onPress: () => {
    //       if (__DEV__) {
    //         console.log('[MessageBubble] 🗑️ Delete action tıklandı:', item.id);
    //       }
    //       // Delete confirmation
    //       Alert.alert(
    //         t('messageDetail.deleteConfirm.title'),
    //         t('messageDetail.deleteConfirm.message'),
    //         [
    //           {
    //             text: t('messageDetail.deleteConfirm.cancel'),
    //             style: 'cancel',
    //             onPress: () => {
    //               if (__DEV__) {
    //                 console.log('[MessageBubble] ❌ Delete iptal edildi');
    //               }
    //               closeContextMenu();
    //             },
    //           },
    //           {
    //             text: t('messageDetail.deleteConfirm.delete'),
    //             style: 'destructive',
    //             onPress: () => {
    //               if (__DEV__) {
    //                 console.log('[MessageBubble] ✅ Delete onaylandı, mesaj siliniyor:', item.id);
    //               }
    //               onDelete(item.id);
    //               closeContextMenu();
    //             },
    //           },
    //         ]
    //       );
    //     },
    //   });
    // } else {
    //   if (__DEV__) {
    //     console.log('[MessageBubble] ⚠️ Delete action eklenmedi:', {
    //       isSent,
    //       hasOnDelete: !!onDelete,
    //       isDeleted,
    //       itemId: item.id,
    //       itemType: item.type,
    //     });
    //   }
    // }
    
    if (__DEV__) {
      console.log('[MessageBubble] 📋 Menu actions:', actions.map(a => a.id));
    }
    
    return actions;
  }, [isDeleted, isDeleting, item.type, isSent, onReply, onEdit, onDelete, item, closeContextMenu]);

  const messageBubbleAnimatedStyle = useAnimatedStyle(() => {
    const scale = messageScale.value;
    
    return {
      transform: [{ scale }],
    };
  });

  const bubbleRowMaxWidth = screenWidth * 0.75;
  const bubbleMaxWidth = bubbleRowMaxWidth - 44; // Avatar (32) + gap (12)

  return (
    <VStack
      space="xs"
      alignItems={isSent ? 'flex-end' : 'flex-start'}
      py="$1"
    >
      <View
        ref={messageRef}
        collapsable={false}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          disabled={isDeleted || isDeleting}
        >
          <ReanimatedAnimated.View
            style={isContextMenuOpen ? messageBubbleAnimatedStyle : undefined}
          >
          <VStack
            maxWidth={bubbleRowMaxWidth}
            alignSelf={isSent ? 'flex-end' : 'flex-start'}
          >
            <HStack
              space="sm"
              alignItems="flex-end"
              flexDirection="row"
            >
              {/* Avatar - Karşı tarafın mesajlarında balonun solunda */}
              {!isSent && isFirstInGroup && (
                <Image
                  source={
                    toImageSource(item.senderAvatar || params.senderAvatar) ||
                    DEFAULT_USER_AVATAR
                  }
                  alt={item.senderName || params.senderName || t('messageDetail.fallback.unknown')}
                  width={32}
                  height={32}
                  borderRadius={16}
                />
              )}

              {/* Avatar placeholder for non-first messages to maintain alignment */}
              {!isSent && !isFirstInGroup && (
                <View style={{ width: 32 }} />
              )}

              <View
                ref={messageBubbleRef}
                collapsable={false}
                style={{
                  maxWidth: bubbleMaxWidth,
                  alignSelf: isSent ? 'flex-end' : 'flex-start',
                  backgroundColor: isDeleted
                    ? (isDark ? '#2A2A2A' : '#E5E5E5')
                    : isSent
                    ? (isDark ? '#6366F1' : '#6366F1')
                    : (isDark ? '#1A1A1A' : '#F2F2F2'),
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderTopLeftRadius: isSent ? 16 : (isFirstInGroup ? 16 : 4),
                  borderTopRightRadius: isSent ? (isFirstInGroup ? 16 : 4) : 16,
                  opacity: isDeleted ? 0.6 : 1,
                }}
              >
                <VStack space="xs">
                  {/* Ana mesaj */}
                  <Text
                    color={
                      isDeleted
                        ? (isDark ? '#8C8C8C' : '#8C8C8C')
                        : isSent
                        ? '#FFFFFF'
                        : (isDark ? '#FFFFFF' : '#000000')
                    }
                    fontSize="$sm"
                    fontWeight="$normal"
                    fontStyle={isDeleted ? 'italic' : 'normal'}
                  >
                    {isDeleted ? t('messageDetail.status.deleted') : (item.text || '(Mesaj içeriği yok)')}
                  </Text>

                </VStack>
              </View>
            </HStack>

            {/* Timestamp + Ticks BELOW the bubble */}
            <HStack
              space="xs"
              alignItems="center"
              mt="$0.5"
              alignSelf={isSent ? 'flex-end' : 'flex-start'}
              ml={!isSent ? 44 : 0}
            >
              {/* Sent messages: time + ticks on the right */}
              {isSent && (
                <>
                  <Text
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    fontSize={10}
                    fontWeight="$normal"
                  >
                    {formatMessageTime(item.timestamp)}
                  </Text>
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
                </>
              )}

              {/* Received messages: time on the left */}
              {!isSent && (
                <Text
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  fontSize={10}
                  fontWeight="$normal"
                >
                  {formatMessageTime(item.timestamp)}
                </Text>
              )}
            </HStack>
          </VStack>
          </ReanimatedAnimated.View>
        </Pressable>
      </View>

      {/* WhatsApp-style Context Menu with Reaction Bar */}
      {isContextMenuOpen && messagePosition && (
        <WhatsAppContextMenu
          visible={isContextMenuOpen}
          onClose={closeContextMenu}
          messagePosition={messagePosition}
          reactionBarPosition={null}
          actions={menuActions}
          reactionEmojis={emojis}
          onReactionPress={(emoji) => {
            onReact?.(item.id, emoji);
            closeContextMenu();
          }}
          isDark={isDark}
          isSent={isSent}
        />
      )}

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

      </HStack>
    </VStack>
  );
};
