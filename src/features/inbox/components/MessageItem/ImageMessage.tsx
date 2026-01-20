import React from 'react';
import { Pressable } from 'react-native';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface ImageMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params' | 'onDelete'> {
  isFirstInGroup: boolean;
}

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
                width={200}
                height={200}
                bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                alignItems="center"
                justifyContent="center"
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
                width={200}
                height={200}
                bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                alignItems="center"
                justifyContent="center"
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
              <Pressable
                onPress={() => {
                  // TODO: Fullscreen image view
                  console.log('[MessageDetail] Image pressed:', item.mediaUrl);
                }}
              >
                <Image
                  source={{ uri: item.mediaUrl }}
                  alt="Message image"
                  width={200}
                  height={200}
                  resizeMode="cover"
                  borderRadius={16}
                />
              </Pressable>
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
          </Box>
          
          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
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
        </VStack>
      </Pressable>
    </VStack>
  );
};
