import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { DevicePhoneMobileIcon, CreditCardIcon } from 'react-native-heroicons/outline';
import { useAddPaymentMethod } from '../../api/hooks';
import type { PaymentApiErrorResponse } from '../../api/paymentApi';
import type { AxiosError } from 'axios';
import { useTranslation } from '@/src/hooks/useTranslation';

interface AddPaymentMethodBottomSheetProps {
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please check your card.',
  INVALID_EXPIRY: 'Invalid expiration date.',
  CARD_DECLINED: 'Card declined. Please try another card.',
};

type PaymentMethodType = 'apple-pay' | 'credit-card' | null;

export const AddPaymentMethodBottomSheet = ({ onClose }: AddPaymentMethodBottomSheetProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('settings');
  const addPaymentMethodMutation = useAddPaymentMethod();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(null);
  const [nameOnCard, setNameOnCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [cardName, setCardName] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

    const handlePaymentMethodSelect = (method: PaymentMethodType) => {
        if (method === 'apple-pay') {
            // Apple Pay seçildiğinde direkt işlemi tamamla ve modal'ı kapat
            console.log('Apple Pay selected');
            onClose();
            return;
        }
        // Credit card seçildiğinde state'i güncelle
        setSelectedPaymentMethod(method);
    };

    // Format card number with spaces (e.g., 1234 5678 9012 3456)
    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.slice(0, 19); // Max 16 digits + 3 spaces
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        setCardNumber(formatted);
    };

    // Format expiration date (MM/YY)
    const formatExpirationDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleExpirationDateChange = (text: string) => {
        const formatted = formatExpirationDate(text);
        setExpirationDate(formatted);
    };

  const maskCardNumber = (number: string) => {
    if (number.length <= 8) return number;
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length <= 8) return number;
    const first8 = cleaned.slice(0, 8);
    const last4 = cleaned.slice(-4);
    return `${first8}***${last4}`;
  };

  const handleSaveCard = useCallback(() => {
    setApiError(null);
    const alias = (cardName || 'My Card').trim();
    if (!alias) {
      setApiError('Please enter a card name.');
      return;
    }
    // In production, payment_token is obtained from the payment provider (Stripe/Apple Pay etc.).
    // Card number/CVV are never sent to the backend.
    const paymentToken = 'pm_placeholder_' + Date.now();
    addPaymentMethodMutation.mutate(
      { payment_token: paymentToken, card_alias: alias },
      {
        onSuccess: () => onClose(),
        onError: (err: Error) => {
          const axiosErr = err as AxiosError<PaymentApiErrorResponse>;
          const code = axiosErr.response?.data?.error_code;
          const msg =
            (code && ERROR_MESSAGES[code]) ||
            axiosErr.response?.data?.message ||
            t('tabs.paymentTab.errors.addCardError');
          setApiError(msg);
        },
      }
    );
  }, [cardName, addPaymentMethodMutation, onClose]);

    // Payment method selection view
    if (!selectedPaymentMethod) {
        return (
            <VStack flex={1} px="$4" py="$4">
                {/* Header */}
                <HStack justifyContent="space-between" alignItems="center" mb="$4">
                    <Pressable onPress={onClose}>
                        <Feather
                            name="chevron-left"
                            size={24}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </Pressable>
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '#FFFFFF' : '#000000'}
                        textAlign="center"
                        flex={1}
                    >
                        {t('paymentMethod.addPaymentMethod')}
                    </Text>
                    <Box w={24} h={24} />
                </HStack>

                {/* Payment Method Options */}
                <VStack space="md">
                    {/* Apple Pay Option */}
                    <Pressable onPress={() => handlePaymentMethodSelect('apple-pay')}>
                        <Box
                            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            p="$4"
                        >
                            <HStack space="md" alignItems="center">
                                <Box
                                    w={40}
                                    h={40}
                                    bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                    borderRadius={20}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <DevicePhoneMobileIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <Text
                                    fontSize={11}
                                    fontWeight="$bold"
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    flex={1}
                                >
                                    {t('paymentMethod.applePay')}
                                </Text>
                            </HStack>
                        </Box>
                    </Pressable>

                    {/* Credit Card Option */}
                    <Pressable onPress={() => handlePaymentMethodSelect('credit-card')}>
                        <Box
                            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            p="$4"
                        >
                            <HStack space="md" alignItems="center" justifyContent="space-between">
                                <HStack space="md" alignItems="center" flex={1}>
                                    <Box
                                        w={40}
                                        h={40}
                                        bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                        borderRadius={20}
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <CreditCardIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                    </Box>
                                    <Text
                                        fontSize={11}
                                        fontWeight="$bold"
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                    >
                                        {t('paymentMethod.creditCard')}
                                    </Text>
                                </HStack>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                />
                            </HStack>
                        </Box>
                    </Pressable>
                </VStack>
            </VStack>
        );
    }

    // Credit Card form view
    return (
        <VStack flex={1} px="$4" py="$4">
            {/* Header */}
            <HStack justifyContent="space-between" alignItems="center" mb="$4">
                <Pressable onPress={() => setSelectedPaymentMethod(null)}>
                    <Feather
                        name="chevron-left"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                </Pressable>
                <Text
                    fontSize={16}
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    textAlign="center"
                    flex={1}
                >
                    {t('paymentMethod.addPaymentMethod')}
                </Text>
                <Pressable onPress={onClose}>
                    <Feather
                        name="x"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                </Pressable>
            </HStack>

            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <VStack space="md" pb="$4">
                    {/* Name on Card Section */}
                    <VStack space="xs">
                        <Text
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                        >
                            {t('paymentMethod.nameOnCard')}
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            py="$2"
                            mt="$1"
                        >
                            <Input borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder={t('paymentMethod.placeholders.nameOnCard')}
                                    placeholderTextColor="#B9B9B9"
                                    value={nameOnCard}
                                    onChangeText={setNameOnCard}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={11}
                                />
                            </Input>
                        </Box>
                    </VStack>

                    {/* Card Number Section */}
                    <VStack space="xs">
                        <Text
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                        >
                            {t('paymentMethod.cardNumber')}
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            py="$2"
                            mt="$1"
                        >
                            <Input borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder={t('paymentMethod.placeholders.cardNumber')}
                                    placeholderTextColor="#B9B9B9"
                                    value={cardNumber ? maskCardNumber(cardNumber) : ''}
                                    onChangeText={handleCardNumberChange}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={11}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </Input>
                        </Box>
                    </VStack>

                    {/* Expiration Date and Security Code Section */}
                    <HStack space="md">
                        <VStack flex={1} space="xs">
                            <Text
                                fontSize={11}
                                fontWeight="$bold"
                                color={isDark ? '#FFFFFF' : '#000000'}
                            >
                                {t('paymentMethod.expirationDate')}
                            </Text>
                            <Box
                                borderWidth={1}
                                borderColor="#B9B9B9"
                                borderRadius={10}
                                px="$4"
                                py="$2"
                                mt="$1"
                            >
                                <Input borderWidth={0} bg="transparent">
                                    <InputField
                                        placeholder={t('paymentMethod.placeholders.expirationDate')}
                                        placeholderTextColor="#B9B9B9"
                                        value={expirationDate}
                                        onChangeText={handleExpirationDateChange}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={11}
                                        keyboardType="numeric"
                                        maxLength={5}
                                    />
                                </Input>
                            </Box>
                        </VStack>

                        <VStack flex={1} space="xs">
                            <Text
                                fontSize={11}
                                fontWeight="$bold"
                                color={isDark ? '#FFFFFF' : '#000000'}
                            >
                                {t('paymentMethod.securityCode')}
                            </Text>
                            <Box
                                borderWidth={1}
                                borderColor="#B9B9B9"
                                borderRadius={10}
                                px="$4"
                                py="$2"
                                mt="$1"
                            >
                                <Input borderWidth={0} bg="transparent">
                                    <InputField
                                        placeholder={t('paymentMethod.placeholders.cvv')}
                                        placeholderTextColor="#B9B9B9"
                                        value={securityCode}
                                        onChangeText={setSecurityCode}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={11}
                                        keyboardType="numeric"
                                        secureTextEntry
                                        maxLength={4}
                                    />
                                </Input>
                            </Box>
                        </VStack>
                    </HStack>

                    {/* Card Name Section */}
                    <VStack space="xs">
                        <Text
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                        >
                            {t('paymentMethod.cardName')}
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            py="$2"
                            mt="$1"
                        >
                            <Input borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder={t('paymentMethod.placeholders.cardName')}
                                    placeholderTextColor="#B9B9B9"
                                    value={cardName}
                                    onChangeText={setCardName}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={11}
                                />
                            </Input>
                        </Box>
                    </VStack>

                    {apiError && (
                      <Text fontSize="$xs" color="#DC2626" mt="$2">
                        {apiError}
                      </Text>
                    )}

                    <Button
                      bg="#E2FF46"
                      borderRadius={8}
                      onPress={handleSaveCard}
                      mt="$2"
                      isDisabled={addPaymentMethodMutation.isPending}
                    >
                      <ButtonText
                        color="#000000"
                        fontSize={14}
                        fontWeight="$bold"
                        textAlign="center"
                      >
                        {addPaymentMethodMutation.isPending ? t('paymentMethod.saving') : t('paymentMethod.saveCard')}
                      </ButtonText>
                    </Button>
                </VStack>
            </ScrollView>
        </VStack>
    );
};

export default AddPaymentMethodBottomSheet;
