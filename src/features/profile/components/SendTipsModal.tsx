import React, { useState } from 'react';
import { Modal, View, Pressable, TextInput, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Text, VStack, HStack, Box, Image } from '@gluestack-ui/themed';
import { XMarkIcon, InformationCircleIcon, PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';
import { useTranslation } from 'react-i18next';

interface SendTipsModalProps {
  visible: boolean;
  recipientName: string;
  recipientAvatar?: any;
  currentBalance: number;
  onClose: () => void;
  onSend: (amount: number) => void;
}

export const SendTipsModal: React.FC<SendTipsModalProps> = ({
  visible,
  recipientName,
  recipientAvatar,
  currentBalance,
  onClose,
  onSend,
}) => {
  const { t } = useTranslation('profile');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    const parsedAmount = parseFloat(amount);

    // Validation
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(t('sendTipsModal.errorTitle'), t('sendTipsModal.errorInvalidAmount'));
      return;
    }

    if (parsedAmount < 0.01) {
      Alert.alert(t('sendTipsModal.errorTitle'), t('sendTipsModal.errorMinimum'));
      return;
    }

    if (parsedAmount > currentBalance) {
      Alert.alert(t('sendTipsModal.errorTitle'), t('sendTipsModal.errorInsufficient'));
      return;
    }

    // Call onSend callback
    onSend(parsedAmount);

    // Reset and close
    setAmount('');
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const isValidAmount = amount && parseFloat(amount) >= 0.01 && parseFloat(amount) <= currentBalance;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <Pressable
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <VStack space="md" p="$4" flex={1}>
                {/* Header - Close Button */}
                <HStack alignItems="flex-start" justifyContent="flex-start" mb="$2">
                  <Pressable onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <XMarkIcon size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                  </Pressable>
                </HStack>

                {/* To: Recipient */}
                <Box
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                  borderRadius={10}
                  p="$4"
                >
                  <HStack alignItems="center" space="md">
                    <Text fontSize={10} fontWeight="$bold" color="#7F7F7E">
                      {t('sendTipsModal.to')}
                    </Text>
                    {/* Recipient Avatar */}
                    {recipientAvatar && (
                      <Box position="relative">
                        <Box
                          width={50}
                          height={50}
                          borderRadius={100}
                          bg="#CE4A4A"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box
                            width={46}
                            height={46}
                            borderRadius={23}
                            overflow="hidden"
                          >
                            <Image
                              source={recipientAvatar}
                              alt={recipientName}
                              width={46}
                              height={46}
                              resizeMode="cover"
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                    {/* Recipient Info */}
                    <VStack space="xs" flex={1}>
                      <Text fontSize={11} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
                        {recipientName}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Info Message */}
                <HStack alignItems="center" space="sm" mt="$1">
                  <Box
                    w={16}
                    h={16}
                    rounded="$full"
                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
                  </Box>
                  <Text fontSize={9} color={isDark ? '$textDark400' : '$textLight500'} flex={1} lineHeight={12}>
                    {t('sendTipsModal.infoMessage')}
                  </Text>
                </HStack>

                {/* Amount Input Section */}
                <VStack space="md" alignItems="center" py="$4">
                  {/* Amount Input - Large, Centered */}
                  <Box w="100%" alignItems="center" justifyContent="center" py="$4">
                    <TextInput
                      value={amount}
                      onChangeText={(text) => {
                        // Only allow numbers and decimal point
                        const numericValue = text.replace(/[^0-9.]/g, '');
                        const inputValue = parseFloat(numericValue) || 0;

                        // Check if input exceeds max balance
                        if (inputValue > currentBalance) {
                          setAmount(currentBalance.toString());
                        } else {
                          setAmount(numericValue);
                        }
                      }}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666666' : '#DDDDDD'}
                      keyboardType="decimal-pad"
                      style={[
                        styles.amountInput,
                        {
                          color: amount ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#666666' : '#DDDDDD'),
                        }
                      ]}
                    />
                  </Box>

                  {/* Validation Messages */}
                  {amount && parseFloat(amount) < 0.01 && (
                    <HStack alignItems="center" space="xs">
                      <Box w={4} h={4} rounded="$full" bg="#CE4A4A" />
                      <Text fontSize={11} color="#CE4A4A" fontWeight="$medium">
                        {t('sendTipsModal.minimumError')}
                      </Text>
                    </HStack>
                  )}
                  {amount && parseFloat(amount) > currentBalance && (
                    <HStack alignItems="center" space="xs">
                      <Box w={4} h={4} rounded="$full" bg="#CE4A4A" />
                      <Text fontSize={11} color="#CE4A4A" fontWeight="$medium">
                        {t('sendTipsModal.insufficientBalance')}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                {/* Balance Display - Above Send Button */}
                <HStack alignItems="center" justifyContent="space-between" px="$2" py="$2">
                  <Text fontSize={11} fontWeight="$semibold" color="#7F7F7E">
                    {t('sendTipsModal.balance')}
                  </Text>
                  <Text fontSize={14} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
                    {currentBalance.toLocaleString()} TIPS
                  </Text>
                </HStack>

                {/* Send Button */}
                <Pressable
                  onPress={handleSend}
                  disabled={!isValidAmount}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: isValidAmount ? '#D8FF08' : (isDark ? '#2A2A2A' : '#EDEDEC'),
                      opacity: isValidAmount ? 1 : 0.5,
                    }
                  ]}
                >
                  <Text
                    fontSize={14}
                    fontWeight="$bold"
                    color={isValidAmount ? '#111111' : (isDark ? '#666666' : '#B1B1B1')}
                    textAlign="center"
                  >
                    {t('sendTipsModal.sendButton')}
                  </Text>
                </Pressable>
              </VStack>
            </ScrollView>
          </Pressable>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  sendButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
});
