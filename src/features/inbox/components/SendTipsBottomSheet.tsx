import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box, Input, InputField, Image, Textarea, TextareaInput } from '@gluestack-ui/themed';
import { Keyboard, TouchableWithoutFeedback, Platform, ScrollView } from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SendTipsBottomSheetProps {
  recipientName: string; // Recipient name (person receiving TIPS)
  recipientTitle: string; // Recipient title
  recipientAvatar: any; // Recipient avatar
  onClose: () => void;
  onSend: (amount: number, message?: string) => void;
}

const SendTipsBottomSheet: React.FC<SendTipsBottomSheetProps> = ({
  recipientName: recipientName,
  recipientTitle: recipientTitle,
  recipientAvatar: recipientAvatar,
  onClose,
  onSend,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const parsedAmount = parseFloat(amount);

    // Validation
    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    if (parsedAmount < 0.01) {
      return;
    }

    if (!message.trim()) {
      return;
    }

    // Call onSend callback
    onSend(parsedAmount, message.trim());

    // Close bottom sheet
    onClose();
  };

  const isValidAmount = amount && parseFloat(amount) >= 0.01;
  const isValidMessage = message.trim().length > 0;
  const isFormValid = isValidAmount && isValidMessage;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <VStack px="$4" py="$4" space="lg" minHeight={400}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize={18} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
              Send TIPS
            </Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XMarkIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          </HStack>

          {/* Recipient Info */}
          <Box
            bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
            borderRadius={12}
            p="$4"
          >
            <VStack space="xs">
              <Text fontSize={11} fontWeight="$bold" color={isDark ? '$textDark400' : '#7F7F7E'}>
                To
              </Text>
              <HStack alignItems="center" space="md">
                {/* Avatar */}
                <Box
                  width={50}
                  height={50}
                  borderRadius={25}
                  overflow="hidden"
                  bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
                >
                  <Image
                    source={recipientAvatar}
                    alt={recipientName}
                    width={50}
                    height={50}
                    resizeMode="cover"
                  />
                </Box>
                {/* Info */}
                <VStack flex={1} space="xs">
                  <Text fontSize={14} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
                    {recipientName}
                  </Text>
                  {recipientTitle && (
                    <Text fontSize={11} color={isDark ? '$textDark400' : '$textLight500'} numberOfLines={1}>
                      {recipientTitle}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Amount Input */}
          <VStack space="sm">
            <Text fontSize={13} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
              Amount (TIPS)
            </Text>
            <Input
              variant="outline"
              borderWidth={1}
              borderColor={isDark ? '$borderDark600' : '$borderLight200'}
              borderRadius={10}
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
            >
              <InputField
                placeholder="Enter amount (min 0.01)"
                placeholderTextColor={isDark ? '$textDark400' : '#D9D9D9'}
                value={amount}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const numericValue = text.replace(/[^0-9.]/g, '');
                  setAmount(numericValue);
                }}
                keyboardType="decimal-pad"
                fontSize={14}
                fontWeight="$medium"
                color={isDark ? '$textDark50' : '$textLight900'}
                py="$3"
                px="$3"
              />
            </Input>
            {amount && parseFloat(amount) < 0.01 && (
              <Text fontSize={11} color="#CE4A4A">
                Minimum amount is 0.01 TIPS
              </Text>
            )}
          </VStack>

          {/* Message Input */}
          <VStack space="sm" flex={1}>
            <Text fontSize={13} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
              Message
            </Text>
            <Textarea
              borderWidth={1}
              borderColor={isDark ? '$borderDark600' : '$borderLight200'}
              borderRadius={10}
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              minHeight={100}
            >
              <TextareaInput
                placeholder="Write a message..."
                placeholderTextColor={isDark ? '$textDark400' : '#D9D9D9'}
                value={message}
                onChangeText={setMessage}
                fontSize={14}
                color={isDark ? '$textDark50' : '$textLight900'}
                py="$3"
                px="$3"
              />
            </Textarea>
            {!message.trim() && (
              <Text fontSize={11} color={isDark ? '$textDark400' : '$textLight500'}>
                Message is required
              </Text>
            )}
          </VStack>

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            bg={isFormValid ? '#D8FF08' : (isDark ? '$backgroundDark700' : '#EDEDEC')}
            borderWidth={isFormValid ? 0 : 1}
            borderColor={isFormValid ? 'transparent' : (isDark ? '$borderDark600' : '#B1B1B1')}
            borderRadius={10}
            py="$3"
            mt="auto"
            disabled={!isFormValid}
            opacity={isFormValid ? 1 : 0.6}
          >
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isFormValid ? '#111111' : (isDark ? '$textDark400' : '#B1B1B1')}
              textAlign="center"
            >
              Send TIPS
            </Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default SendTipsBottomSheet;
