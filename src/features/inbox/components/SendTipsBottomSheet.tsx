import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box, Input, InputField, Image, Textarea, TextareaInput } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';

interface SendTipsBottomSheetProps {
  senderName: string;
  senderTitle?: string;
  senderAvatar: any;
  onClose: () => void;
  onSend: (amount: number, message?: string) => void;
  currentBalance?: number;
}

const SendTipsBottomSheet: React.FC<SendTipsBottomSheetProps> = ({
  senderName,
  senderTitle,
  senderAvatar,
  onClose,
  onSend,
  currentBalance = 500,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('inbox');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    if (parsedAmount < 0.01) {
      return;
    }

    onSend(parsedAmount, message.trim() || undefined);
    onClose();
  };

  const handleMaxPress = () => {
    setAmount(currentBalance.toString());
  };

  const isValidAmount = amount && parseFloat(amount) >= 0.01 && parseFloat(amount) <= currentBalance;
  const isFormValid = isValidAmount;

  return (
    <VStack
      bg={isDark ? '$backgroundDark950' : '#FDFDFB'}
      px="$5"
      pt="$3"
      pb="$5"
      space="md"
      minHeight={100}
    >
        {/* Header */}
        <Text fontSize={18} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'} textAlign="center">
          {t('sendTips.title')}
        </Text>

        {/* Recipient Profile Card */}
        <Box position="relative">
          {/* Banner */}
          <Box height={110} overflow="hidden" position="relative">
            <Image
              source={require('@/assets/tips_banner.png')}
              alt="Support Banner"
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              resizeMode="cover"
            />

            {/* Overlay */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.6)"
              borderRadius={12}
            />

            {/* User Info - Banner içinde ortalanmış */}
            <Box
              position="absolute"
              bottom={10}
              left={0}
              right={0}
              alignItems="center"
            >
              <VStack space="xs" alignItems="center">
                {/* Avatar */}
                <Box
                  width={60}
                  height={60}
                  borderRadius={30}
                  borderWidth={3}
                  borderColor="#D8FF08"
                  overflow="hidden"
                  bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    source={toImageSource(senderAvatar, DEFAULT_USER_AVATAR) || DEFAULT_USER_AVATAR}
                    alt={senderName}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Box>
                <Text
                  color="#FFFFFF"
                  fontSize={14}
                  fontWeight="$bold"
                  textAlign="center"
                >
                  {senderName}
                </Text>
                {senderTitle && (
                  <Text
                    color="rgba(255, 255, 255, 0.8)"
                    fontSize={10}
                    fontWeight="$normal"
                    numberOfLines={1}
                    textAlign="center"
                    maxWidth={280}
                  >
                    {senderTitle}
                  </Text>
                )}
              </VStack>
            </Box>
          </Box>
        </Box>

        {/* Message Input (Optional) */}
        <VStack space="xs">
          <HStack space="xs" alignItems="center">
            <Text fontSize={13} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
              {t('sendTips.description')}
            </Text>
            <Text fontSize={11} color={isDark ? '$textDark400' : '$textLight500'}>
              ({t('sendTips.optional')})
            </Text>
          </HStack>
          <Box
            borderWidth={1}
            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
            borderRadius={12}
            borderStyle="dashed"
            bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
            minHeight={90}
            p="$2"
          >
            <Textarea
              borderWidth={0}
              bg="transparent"
              minHeight={70}
            >
              <TextareaInput
                placeholder={t('sendTips.descriptionPlaceholder')}
                placeholderTextColor={isDark ? '$textDark400' : '#D9D9D9'}
                value={message}
                onChangeText={setMessage}
                fontSize={13}
                color={isDark ? '$textDark50' : '$textLight900'}
              />
            </Textarea>
          </Box>
        </VStack>

        {/* TIPS Amount */}
        <VStack space="xs">
          <Text fontSize={13} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
            {t('sendTips.tipsAmount')}
          </Text>
          <HStack
            alignItems="center"
            space="md"
            borderWidth={1}
            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
            borderRadius={12}
            bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
            px="$4"
            py="$1.5"
          >
            <Input
              variant="unstyled"
              flex={1}
              bg="transparent"
              borderWidth={0}
            >
              <InputField
                placeholder={t('sendTips.amountPlaceholder')}
                placeholderTextColor={isDark ? '$textDark400' : '#D9D9D9'}
                value={amount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9.]/g, '');
                  setAmount(numericValue);
                }}
                keyboardType="decimal-pad"
                fontSize={36}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '$textLight900'}
              />
            </Input>
            <Pressable
              onPress={handleMaxPress}
              bg={isDark ? '$backgroundDark700' : '#EDEDEC'}
              borderRadius={20}
              px="$4"
              py="$1.5"
            >
              <Text fontSize={13} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
                {t('sendTips.max')}
              </Text>
            </Pressable>
          </HStack>
          <HStack justifyContent="space-between" px="$1">
            <Text fontSize={12} color={isDark ? '$textDark400' : '$textLight500'}>
              {t('sendTips.dollarValue', { value: ((parseFloat(amount) || 0) * 0.01).toFixed(2) })}
            </Text>
            <Text fontSize={12} color={isDark ? '$textDark400' : '$textLight500'}>
              {t('sendTips.currentBalance', { balance: currentBalance })}
            </Text>
          </HStack>
          {amount && parseFloat(amount) > currentBalance && (
            <Text fontSize={11} color="#CE4A4A" px="$1">
              {t('sendTips.insufficientBalance')}
            </Text>
          )}
          {amount && parseFloat(amount) < 0.01 && parseFloat(amount) > 0 && (
            <Text fontSize={11} color="#CE4A4A" px="$1">
              {t('sendTips.minimumAmount')}
            </Text>
          )}
        </VStack>

        {/* Action Buttons */}
        <HStack space="md" mt="$1">
          <Pressable
            onPress={onClose}
            flex={1}
            bg={isDark ? '$backgroundDark800' : '#EDEDEC'}
            borderRadius={12}
            py="$3"
          >
            <Text
              fontSize={15}
              fontWeight="$semibold"
              color={isDark ? '$textDark300' : '#7F7F7E'}
              textAlign="center"
            >
              {t('sendTips.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSend}
            flex={1}
            bg={isFormValid ? '#D8FF08' : (isDark ? '$backgroundDark700' : '#EDEDEC')}
            borderRadius={12}
            py="$3"
            disabled={!isFormValid}
            opacity={isFormValid ? 1 : 0.6}
          >
            <Text
              fontSize={15}
              fontWeight="$bold"
              color={isFormValid ? '#111111' : (isDark ? '$textDark400' : '#B1B1B1')}
              textAlign="center"
            >
              {t('sendTips.send')}
            </Text>
          </Pressable>
        </HStack>
    </VStack>
  );
};

export default SendTipsBottomSheet;
