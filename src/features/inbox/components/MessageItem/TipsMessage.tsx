import React from 'react';
import { View } from 'react-native';
import { Box, VStack, HStack, Text } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
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
      py="$1"
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
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={18}
              fontWeight="$bold"
            >
              +
            </Text>
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
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
          bg={isSent ? '#6366F1' : (isDark ? '#1A1A1A' : '#F2F2F2')}
          px="$3"
          py="$2"
          borderRadius={12}
          maxWidth="80%"
          mt="$1"
        >
          <Text
            color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
            fontSize={13}
            fontWeight="$normal"
          >
            {item.text}
          </Text>
        </Box>
      )}

      {/* Timestamp + Ticks BELOW */}
      <HStack
        space="xs"
        alignItems="center"
        mt={2}
        alignSelf="center"
      >
        <Text
          color={isDark ? '#8C8C8C' : '#8C8C8C'}
          fontSize={10}
          fontWeight="$normal"
        >
          {formatMessageTime(item.timestamp)}
        </Text>
        {isSent && (
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
        )}
      </HStack>
    </VStack>
  );
};
