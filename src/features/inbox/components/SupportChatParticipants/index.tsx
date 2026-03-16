import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface SupportChatParticipantsProps {
  user1Name: string;
  user1Title: string;
  user1Avatar: any;
  user2Name: string;
  user2Title: string;
  user2Avatar: any;
  supportTitle?: string;
  tipsAmount?: number;
  category?: string;
  requestDetails?: string;
  attachments?: string[];
  // ✅ YENİ: Response formatından gelen bilgiler
  totalTipsAmount?: number; // Toplam TIPS miktarı
  supportRequestMessages?: string[]; // Support request mesajları
  supportRequestType?: 'GENERAL' | 'TECHNICAL' | 'PRODUCT'; // Support request type
  supportRequestAmount?: number; // Support request amount (TIPS miktarı)
}

export const SupportChatParticipants: React.FC<SupportChatParticipantsProps> = ({
  user1Name,
  user1Title,
  user1Avatar,
  user2Name,
  user2Title,
  user2Avatar,
  supportTitle = 'Support Chat',
  tipsAmount = 0,
  category = '',
  requestDetails = '',
  attachments = [],
  // ✅ YENİ: Response formatından gelen bilgiler
  totalTipsAmount,
  supportRequestMessages = [],
  supportRequestType,
  supportRequestAmount,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('inbox');

  return (
    <VStack
      mx="$4"
      mt="$3"
      mb="$3"
      bg={isDark ? '$backgroundDark900' : '$white'}
      borderRadius="$2xl"
      borderWidth={1}
      borderColor={isDark ? '$borderDark800' : '$borderLight200'}
      sx={{
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Users Section */}
      <HStack alignItems="center" justifyContent="space-between" px="$3" py="$3">
        {/* Left User */}
        <HStack alignItems="center" space="sm" flex={1}>
          <Image
            source={user1Avatar}
            alt={user1Name}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
            }}
          />
          <VStack flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight950'}
              fontSize={12}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {user1Name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={11}
              numberOfLines={1}
            >
              {user1Title}
            </Text>
          </VStack>
        </HStack>

        {/* Center Icon */}
        <Box
          bg={isDark ? '$backgroundDark800' : '#F3F4F6'}
          p="$2"
          borderRadius="$full"
          mx="$2"
        >
          <Feather
            name="repeat"
            size={20}
            color={isDark ? '#A0AEC0' : '#9CA3AF'}
          />
        </Box>

        {/* Right User */}
        <HStack alignItems="center" space="sm" flex={1} justifyContent="flex-end">
          <VStack alignItems="flex-end" flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight950'}
              fontSize={12}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {user2Name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={11}
              numberOfLines={1}
            >
              {user2Title}
            </Text>
          </VStack>
          <Image
            source={user2Avatar}
            alt={user2Name}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
            }}
          />
        </HStack>
      </HStack>

      <Box height={1} bg={isDark ? '$borderDark800' : '$borderLight200'} width="100%"></Box>

      {/* Tips Amount and Support Request Message Section */}
      <VStack px="$3" py="$3" space="sm">
        {/* Support Request Type */}
        {supportRequestType && (
          <HStack alignItems="center" justifyContent="space-between" mb="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              {t('supportChat.requestType')}
            </Text>
            <Box
              bg="#3B82F6"
              borderRadius={12}
              px="$2"
              py="$1"
            >
              <Text
                color="#FFFFFF"
                fontSize={12}
                fontWeight="$semibold"
              >
                {supportRequestType === 'GENERAL' ? t('supportChat.types.general') : supportRequestType === 'TECHNICAL' ? t('supportChat.types.technical') : t('supportChat.types.product')}
              </Text>
            </Box>
          </HStack>
        )}

        {/* Support Request Amount */}
        {supportRequestAmount !== undefined && supportRequestAmount > 0 && (
          <HStack alignItems="center" justifyContent="space-between" mb="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              {t('supportChat.requestAmount')}
            </Text>
            <Text
              color="#000000"
              fontSize={16}
              fontWeight="$bold"
            >
              {supportRequestAmount} TIPS
            </Text>
          </HStack>
        )}

        {/* Total Tips Amount */}
        {totalTipsAmount !== undefined && totalTipsAmount > 0 && (
          <HStack alignItems="center" justifyContent="space-between" mb="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              {t('supportChat.totalTips')}
            </Text>
            <Text
              color="#000000"
              fontSize={16}
              fontWeight="$bold"
            >
              {totalTipsAmount.toFixed(2)} TIPS
            </Text>
          </HStack>
        )}

        {/* Tips Amount (Fallback - eski format için) */}
        {(!totalTipsAmount || totalTipsAmount === 0) && tipsAmount > 0 && (
          <HStack alignItems="center" justifyContent="space-between" mb="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              {t('supportChat.tipsAmount')}
            </Text>
            <Text
              color="#000000"
              fontSize={16}
              fontWeight="$bold"
            >
              {tipsAmount} TIPS
            </Text>
          </HStack>
        )}

        {/* Support Request Messages */}
        {supportRequestMessages && supportRequestMessages.length > 0 && (
          <VStack space="xs" mt="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              Request Messages
            </Text>
            {supportRequestMessages.map((msg, index) => (
              <Text
                key={index}
                fontSize={13}
                fontWeight="$normal"
                color={isDark ? '$textDark50' : '$textLight950'}
                lineHeight={18}
              >
                {msg}
              </Text>
            ))}
          </VStack>
        )}

        {/* Support Request Message (Fallback - eski format için) */}
        {(!supportRequestMessages || supportRequestMessages.length === 0) && requestDetails && (
          <VStack space="xs" mt="$1">
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={12}
              fontWeight="$normal"
            >
              Request Message
            </Text>
            <Text
              fontSize={13}
              fontWeight="$normal"
              color={isDark ? '$textDark50' : '$textLight950'}
              lineHeight={18}
            >
              {requestDetails}
            </Text>
          </VStack>
        )}
      </VStack>
    </VStack>
  );
};

export default SupportChatParticipants;

