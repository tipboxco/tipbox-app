import React, { useState, useEffect, useRef } from 'react';
import { Pressable, Dimensions, ActivityIndicator, Alert, View, Platform } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Image as ExpoImage, ImageErrorEventData } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { WhatsAppContextMenu } from './WhatsAppContextMenu';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

// Haptic feedback - opsiyonel
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics yoksa sessizce devam et
}

interface ImageMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params' | 'onDelete' | 'onContextMenuStateChange' | 'currentUserId'> {
  isFirstInGroup: boolean;
}

// Görsel boyutlandırma sabitleri
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.75; // Ekran genişliğinin %75'i
const MAX_IMAGE_HEIGHT = 400; // Maksimum yükseklik
const MIN_IMAGE_SIZE = 150; // Minimum boyut

export const ImageMessage: React.FC<ImageMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
  onDelete,
  onContextMenuStateChange,
  currentUserId,
}) => {
  // ✅ FIX: isSent değerini yeniden hesapla - item.isSent yanlış olabilir
  const isSent = currentUserId && item.senderId 
    ? String(item.senderId) === String(currentUserId)
    : item.isSent; // Fallback: item.isSent kullan
  
  const isDeleted = item.isDeleted;
  const isDeleting = item.isDeleting; // ✅ Optimistic delete state
  
  const isUploading = item.uploadStatus === 'uploading';
  const isFailed = item.uploadStatus === 'failed';
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Context menu state
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [messagePosition, setMessagePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const messageRef = useRef<View>(null);
  const imageContainerRef = useRef<any>(null);
  const messageScale = useSharedValue(1);
  
  const emojis: string[] = []; // Image mesajlar için emoji reaction yok
  
  // ✅ FIX: Görsel yükleme kontrolü - mediaUrl değiştiğinde loading state'i reset et
  useEffect(() => {
    if (item.mediaUrl) {
      setImageLoading(true);
      setImageError(false);
      
      // ✅ FIX: Timeout ekle - eğer 10 saniye içinde yüklenmezse loading'i kapat
      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [item.mediaUrl]);
  
  // Görsel boyutlarını hesapla
  const calculateImageSize = () => {
    // Backend'den gelen dimensions varsa kullan
    const originalWidth = item.dimensions?.width || 200;
    const originalHeight = item.dimensions?.height || 200;
    
    // Aspect ratio hesapla
    const aspectRatio = originalWidth / originalHeight;
    
    // Maksimum genişliği hesapla (ekran genişliğinin %75'i)
    let width = Math.min(MAX_IMAGE_WIDTH, originalWidth);
    let height = width / aspectRatio;
    
    // Maksimum yüksekliği kontrol et
    if (height > MAX_IMAGE_HEIGHT) {
      height = MAX_IMAGE_HEIGHT;
      width = height * aspectRatio;
    }
    
    // Minimum boyut kontrolü
    if (width < MIN_IMAGE_SIZE) {
      width = MIN_IMAGE_SIZE;
      height = width / aspectRatio;
    }
    
    return { width, height };
  };
  
  const imageSize = calculateImageSize();
  
  // Context menu handlers
  const handleLongPress = (event: any) => {
    // ✅ FIX: Silinen veya silme işlemi devam eden mesajlar için context menu açma
    if (isDeleted || isDeleting) {
      return;
    }
    
    // ✅ FIX: Context menu her zaman açılsın (text mesajlar gibi)
    // Delete action sadece isSent && onDelete olduğunda eklenecek (menuActions içinde)
    
    // Haptic feedback (opsiyonel)
    if (Haptics && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Mesaj pozisyonunu ölç - Görsel container'ını ölç
    const containerRef = imageContainerRef.current;
    
    if (containerRef && typeof containerRef.measureInWindow === 'function') {
      setTimeout(() => {
        if (imageContainerRef.current) {
          imageContainerRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
            if (x !== 0 || y !== 0 || width !== 0 || height !== 0) {
              setMessagePosition({ x, y, width, height });
              setIsContextMenuOpen(true);
              messageScale.value = withSpring(1.05);
            } else {
              // Fallback: touch event'ten pozisyon al
              handleLongPressFallback(event);
            }
          });
        } else {
          handleLongPressFallback(event);
        }
      }, 50);
    } else if (messageRef.current && typeof messageRef.current.measureInWindow === 'function') {
      setTimeout(() => {
        if (messageRef.current) {
          messageRef.current.measureInWindow((x, y, width, height) => {
            if (x !== 0 || y !== 0 || width !== 0 || height !== 0) {
              setMessagePosition({ x, y, width, height });
              setIsContextMenuOpen(true);
              messageScale.value = withSpring(1.05);
            } else {
              handleLongPressFallback(event);
            }
          });
        } else {
          handleLongPressFallback(event);
        }
      }, 50);
    } else {
      handleLongPressFallback(event);
    }
  };
  
  const handleLongPressFallback = (event?: any) => {
    // Fallback: Event'ten pozisyon al veya görselin yaklaşık pozisyonunu kullan
    if (event?.nativeEvent) {
      const touchX = event.nativeEvent.pageX || event.nativeEvent.locationX || 0;
      const touchY = event.nativeEvent.pageY || event.nativeEvent.locationY || 0;
      
      if (touchX > 0 && touchY > 0) {
        setMessagePosition({ 
          x: touchX - imageSize.width / 2, 
          y: touchY - imageSize.height / 2, 
          width: imageSize.width, 
          height: imageSize.height 
        });
        setIsContextMenuOpen(true);
        messageScale.value = withSpring(1.05);
        return;
      }
    }
    
    // Son çare: Görselin yaklaşık pozisyonu
    const approximateX = isSent ? Dimensions.get('window').width - imageSize.width - 16 : 16;
    const approximateY = Dimensions.get('window').height / 2;
    setMessagePosition({ 
      x: approximateX, 
      y: approximateY, 
      width: imageSize.width, 
      height: imageSize.height 
    });
    setIsContextMenuOpen(true);
    messageScale.value = withSpring(1.05);
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
    
    // ✅ DISABLED: Delete action geçici olarak devre dışı
    // // ✅ FIX: Delete action - sadece gönderilen mesajlar için (isSent === true)
    // // Silinen veya silme işlemi devam eden mesajlar için delete action ekleme
    // if (isSent && onDelete && !isDeleted && !isDeleting) {
    //   actions.push({
    //     id: 'delete',
    //     label: 'Delete',
    //     icon: 'trash-2',
    //     color: '#F44336',
    //     onPress: () => {
    //       // Delete confirmation
    //       Alert.alert(
    //         'Delete Message',
    //         'Are you sure you want to delete this message?',
    //         [
    //           {
    //             text: 'Cancel',
    //             style: 'cancel',
    //             onPress: () => {
    //               closeContextMenu();
    //             },
    //           },
    //           {
    //             text: 'Delete',
    //             style: 'destructive',
    //             onPress: () => {
    //               onDelete(item.id);
    //               closeContextMenu();
    //             },
    //           },
    //         ]
    //       );
    //     },
    //   });
    // }
    
    return actions;
  }, [isDeleted, isDeleting, isSent, onDelete, item, closeContextMenu]);
  
  const messageBubbleAnimatedStyle = useAnimatedStyle(() => {
    const scale = messageScale.value;
    return {
      transform: [{ scale }],
    };
  });

  return (
    <VStack
      space="xs"
      alignItems={isSent ? 'flex-end' : 'flex-start'}
      px={isSent ? "$2" : "$4"} // ✅ FIX: Gönderilen görsel mesajlar için daha az padding (sağ kenara daha yakın)
      py="$2"
    >
      {!isSent && isFirstInGroup && (
        <HStack space="sm" alignItems="center" mb="$1">
          <Image
            source={
              toImageSource(item.senderAvatar || params.senderAvatar) ||
              DEFAULT_USER_AVATAR
            }
            alt={String(item.senderName || params.senderName || 'User')}
            width={24}
            height={24}
            borderRadius={12}
          />
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize="$xs"
            fontWeight="$medium"
          >
            {String(item.senderName || params.senderName || 'Unknown User')}
          </Text>
        </HStack>
      )}
      
      <View
        ref={messageRef}
        collapsable={false}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          disabled={isDeleted || isDeleting} // ✅ FIX: Silinen veya silme işlemi devam eden mesajlar için pressable disable
        >
          <ReanimatedAnimated.View
            style={isContextMenuOpen ? messageBubbleAnimatedStyle : undefined}
          >
        <VStack space="xs" maxWidth={isSent ? "90%" : "80%"} alignItems={isSent ? 'flex-end' : 'flex-start'}> 
          <Box
            ref={imageContainerRef as any}
            collapsable={false}
            bg={isDark ? '#1A1A1A' : '#F2F2F2'}
            borderRadius={16}
            borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
            borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
            overflow="hidden"
            position="relative"
          >
            {isUploading ? (
              <Box
                width={imageSize.width}
                height={imageSize.height}
                bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                alignItems="center"
                justifyContent="center"
                borderRadius={16}
              >
                <VStack space="sm" alignItems="center">
                  <Feather
                    name="upload"
                    size={32}
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  />
                  <Text
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    fontSize="$xs"
                  >
                    Loading...
                  </Text>
                  {item.uploadProgress !== undefined && (
                    <Text
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                      fontSize="$xs"
                    >
                      {`${typeof item.uploadProgress === 'number' ? item.uploadProgress : Number(item.uploadProgress) || 0}%`}
                    </Text>
                  )}
                </VStack>
              </Box>
            ) : isFailed ? (
              <Box
                width={imageSize.width}
                height={imageSize.height}
                bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                alignItems="center"
                justifyContent="center"
                borderRadius={16}
              >
                <VStack space="sm" alignItems="center">
                  <Feather
                    name="alert-circle"
                    size={32}
                    color="#F44336"
                  />
                  <Text
                    color="#F44336"
                    fontSize="$xs"
                  >
                    Yükleme başarısız
                  </Text>
                </VStack>
              </Box>
            ) : (
              <Box position="relative" width={imageSize.width} height={imageSize.height}>
                {/* Thumbnail göster (yüklenirken) */}
                {item.thumbnailUrl && imageLoading && (
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    alt="Message image thumbnail"
                    width={imageSize.width}
                    height={imageSize.height}
                    resizeMode="cover"
                    borderRadius={16}
                    position="absolute"
                    opacity={0.5}
                  />
                )}
                
                {/* Loading indicator (görsel yüklenirken) */}
                {imageLoading && (
                  <Box
                    position="absolute"
                    width={imageSize.width}
                    height={imageSize.height}
                    alignItems="center"
                    justifyContent="center"
                    bg={isDark ? '#1A1A1A' : '#F2F2F2'}
                    borderRadius={16}
                    zIndex={1}
                  >
                    <ActivityIndicator
                      size="small"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </Box>
                )}
                
                {/* Ana görsel */}
                <Pressable
                  onPress={() => {
                    // TODO: Fullscreen image view
                    console.log('[MessageDetail] Image pressed:', item.mediaUrl);
                  }}
                  disabled={imageLoading || imageError}
                >
                  {imageError ? (
                    <Box
                      width={imageSize.width}
                      height={imageSize.height}
                      bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                      alignItems="center"
                      justifyContent="center"
                      borderRadius={16}
                    >
                      <VStack space="sm" alignItems="center">
                        <Feather
                          name="image"
                          size={32}
                          color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        />
                        <Text
                          color={isDark ? '#8C8C8C' : '#8C8C8C'}
                          fontSize="$xs"
                        >
                          Görsel yüklenemedi
                        </Text>
                      </VStack>
                    </Box>
                  ) : (
                    <ExpoImage
                      source={{ uri: item.mediaUrl }}
                      // ✅ expo-image: Görseller invalid olana veya silinene kadar cache'te tutulur
                      // Default cache policy: 'memory-disk' (hem memory hem disk cache)
                      cachePolicy="memory-disk"
                      priority="normal"
                      style={{
                        width: imageSize.width,
                        height: imageSize.height,
                        borderRadius: 16,
                        opacity: imageLoading ? 0 : 1,
                      }}
                      contentFit="cover"
                      transition={{ duration: 200 }}
                      onLoadStart={() => {
                        console.log('[ImageMessage] 🖼️ Image load start:', {
                          mediaUrl: item.mediaUrl,
                        });
                        setImageLoading(true);
                        setImageError(false);
                      }}
                      onLoad={(e: { source: { width: number; height: number } }) => {
                        console.log('[ImageMessage] 🖼️ Image loaded successfully:', {
                          mediaUrl: item.mediaUrl,
                          width: e.source.width,
                          height: e.source.height,
                        });
                        setImageLoading(false);
                        setImageError(false);
                      }}
                      onError={(event: ImageErrorEventData) => {
                        console.error('[ImageMessage] ❌ Image load error:', {
                          mediaUrl: item.mediaUrl,
                          error: event.error || 'Unknown error',
                        });
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                  )}
                </Pressable>
                
              
                {isSent && (
                  <Box
                    position="absolute"
                    left={6}
                    bottom={8}
                    zIndex={10}
                    bg="#ececec" // Beyaz badge

                    borderRadius={16}
                    px="$0.5"
                    py="$0.5"
                    minWidth={24}
                    minHeight={16}
                    alignItems="center"
                    justifyContent="center"
                    
                  >
                    {item.isRead ? (
                      <Box position="relative" width={18} height={14} alignItems="center" justifyContent="center">
                        <Feather
                          name="check"
                          size={12}
                          color="#4CAF50"
                          style={{ position: 'absolute', left: 0, top: 1 }}
                        />
                        <Feather
                          name="check"
                          size={12}
                          color="#4CAF50"
                          style={{ position: 'absolute', left: 6, top: 1 }}
                        />
                      </Box>
                    ) : (
                      <Feather
                        name="check"
                        size={14}
                        color="#8C8C8C"
                      />
                    )}
                  </Box>
                )}
              </Box>
            )}
            
            {item.text && String(item.text).trim() && (
              <Box px="$3" py="$2">
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$normal"
                >
                  {String(item.text)}
                </Text>
              </Box>
            )}
          </Box>
          
          {/* ✅ Timestamp - Okundu bilgisi artık görselin sol altında */}
          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$2xs"
              fontWeight="$normal"
            >
              {String(formatMessageTime(item.timestamp) || '')}
            </Text>
          </VStack>
        </VStack>
          </ReanimatedAnimated.View>
        </Pressable>
      </View>
      
      {/* WhatsApp-style Context Menu */}
      {isContextMenuOpen && messagePosition && (
        <WhatsAppContextMenu
          visible={isContextMenuOpen}
          onClose={closeContextMenu}
          messagePosition={messagePosition}
          reactionBarPosition={null}
          actions={menuActions}
          reactionEmojis={emojis}
          onReactionPress={() => {}}
          isDark={isDark}
          isSent={isSent}
        />
      )}
    </VStack>
  );
};
