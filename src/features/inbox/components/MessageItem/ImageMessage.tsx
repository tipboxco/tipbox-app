import React, { useState, useEffect } from 'react';
import { Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Image as ExpoImage, ImageErrorEventData } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface ImageMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params' | 'onDelete'> {
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
}) => {
  const isSent = item.isSent;
  const isUploading = item.uploadStatus === 'uploading';
  const isFailed = item.uploadStatus === 'failed';
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
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
          if (isSent && !isUploading && !isFailed) {
            onDelete?.(item.id);
          }
        }}
        delayLongPress={500}
      >
        <VStack space="xs" maxWidth="80%" alignItems={isSent ? 'flex-end' : 'flex-start'}>
          <Box
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
                    Yükleniyor...
                  </Text>
                  {item.uploadProgress !== undefined && (
                    <Text
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                      fontSize="$xs"
                    >
                      {item.uploadProgress}%
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
                        console.log('[ImageMessage] 🖼️ Image load start:', item.mediaUrl);
                        setImageLoading(true);
                        setImageError(false);
                      }}
                      onLoad={(e: { source: { width: number; height: number } }) => {
                        console.log('[ImageMessage] 🖼️ Image loaded successfully:', {
                          uri: item.mediaUrl,
                          width: e.source.width,
                          height: e.source.height,
                        });
                        setImageLoading(false);
                        setImageError(false);
                      }}
                      onError={(event: ImageErrorEventData) => {
                        console.error('[ImageMessage] ❌ Image load error:', {
                          uri: item.mediaUrl,
                          error: event.error || 'Unknown error',
                        });
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                  )}
                </Pressable>
                
                {/* ✅ Okundu bilgisi - Görselin sol altında (sadece gönderilen mesajlar için) */}
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
            
            {item.text && item.text.trim() && (
              <Box px="$3" py="$2">
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$xs"
                  fontWeight="$normal"
                >
                  {item.text}
                </Text>
              </Box>
            )}
            
            {/* ✅ Grup mesajları (5 dakika içinde aynı kullanıcıdan gelen mesajlar - görselin altında) */}
            {item.groupedMessages && item.groupedMessages.length > 0 && (
              <VStack space="xs" px="$3" py="$2">
                {item.groupedMessages.map((groupedMsg: any) => (
                  <Text
                    key={groupedMsg.id || groupedMsg.timestamp}
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$xs"
                    fontWeight="$normal"
                    opacity={0.9}
                  >
                    {groupedMsg.text || '(Mesaj içeriği yok)'}
                  </Text>
                ))}
              </VStack>
            )}
          </Box>
          
          {/* ✅ Timestamp - Okundu bilgisi artık görselin sol altında */}
          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$2xs"
              fontWeight="$normal"
            >
              {formatMessageTime(item.timestamp)}
            </Text>
          </VStack>
        </VStack>
      </Pressable>
    </VStack>
  );
};
