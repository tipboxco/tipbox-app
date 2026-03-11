import React from 'react';
import { Box, VStack, HStack, Text } from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { formatMessageTime } from '../../utils/messageHelpers';
import type { MessageItemProps } from './types';
import { useTranslation } from '@/src/hooks/useTranslation';

interface TipsMessageProps extends Pick<MessageItemProps, 'item' | 'isDark' | 'params'> {
  isFirstInGroup: boolean;
}

export const TipsMessage: React.FC<TipsMessageProps> = ({
  item,
  isDark,
  params,
  isFirstInGroup,
}) => {
  const { t } = useTranslation('inbox');
  const isSent = item.isSent;
  const tipsAmount = item.tipsAmount || 0;

  return (
    <VStack
      space="xs"
      alignItems="center"
      px="$4"
      py="$2"
    >
      {/* Tips Button */}
      <Box
        borderRadius={24}
        overflow="hidden"
        maxWidth="90%"
        alignSelf="center"
      >
        <LinearGradient
          colors={isDark ? ['#8B5CF6', '#A78BFA', '#C084FC'] : ['#A78BFA', '#C084FC', '#DDD6FE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <HStack space="xs" alignItems="center" justifyContent="center">
            <Text
              color="#000000"
              fontSize={18}
              fontWeight="$bold"
            >
              +
            </Text>
            <Text
              color="#000000"
              fontSize={15}
              fontWeight="$bold"
            >
              {tipsAmount} TIPS {t('messageDetail.tipsSent')}
            </Text>
          </HStack>
        </LinearGradient>
      </Box>

      {/* Optional description message below */}
      {item.text && (
        <Box
          bg={isDark ? '#1A1A1A' : '#F2F2F2'}
          px="$3"
          py="$2"
          borderRadius={12}
          maxWidth="80%"
          mt="$1"
        >
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={13}
            fontWeight="$normal"
          >
            {item.text}
          </Text>
        </Box>
      )}

      {/* Timestamp */}
      <Text
        color={isDark ? '#8C8C8C' : '#8C8C8C'}
        fontSize={11}
        fontWeight="$normal"
        mt="$1"
      >
        {formatMessageTime(item.timestamp)}
      </Text>
    </VStack>
  );
};
