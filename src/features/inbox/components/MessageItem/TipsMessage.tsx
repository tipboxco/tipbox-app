import React from 'react';
import { Box, VStack, HStack, Text, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';

interface TipsMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params'> {
  isFirstInGroup: boolean;
}

export const TipsMessage: React.FC<TipsMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
}) => {
  const isSent = item.isSent;
  const tipsAmount = item.tipsAmount || 0;

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

      <HStack
        space="sm"
        alignItems="flex-end"
        maxWidth="80%"
        flexDirection={isSent ? 'row-reverse' : 'row'}
      >
        <Box
          bg={isSent ? (isDark ? '#6366F1' : '#6366F1') : (isDark ? '#1A1A1A' : '#F2F2F2')}
          px="$3"
          py="$2"
          borderRadius={16}
          borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
          borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
        >
          <VStack space="xs">
            <HStack space="xs" alignItems="center">
              <Feather
                name="award"
                size={16}
                color="#E2FF46"
              />
              <Text
                color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                fontSize="$xs"
                fontWeight="$bold"
              >
                {tipsAmount} TIPS
              </Text>
            </HStack>
            {item.text && (
              <Text
                color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                fontSize="$xs"
                fontWeight="$normal"
              >
                {item.text}
              </Text>
            )}
          </VStack>
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
      </HStack>
    </VStack>
  );
};
