import React, { useState } from 'react';
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

interface AddPaymentMethodBottomSheetProps {
    onClose: () => void;
}

type PaymentMethodType = 'apple-pay' | 'credit-card' | null;

export const AddPaymentMethodBottomSheet = ({ onClose }: AddPaymentMethodBottomSheetProps) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(null);
    const [nameOnCard, setNameOnCard] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [cardName, setCardName] = useState('');

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

    // Payment method selection view
    if (!selectedPaymentMethod) {
        return (
            <VStack flex={1} px="$4" py="$4">
                {/* Header */}
                <HStack justifyContent="space-between" alignItems="center" mb="$4">
                    <Pressable onPress={onClose}>
                        <Feather
                            name="x"
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
                        Add Payment Method
                    </Text>
                    <Box w={24} h={24} />
                </HStack>

                {/* Payment Method Options */}
                <VStack space="md">
                    {/* Apple Pay Option */}
                    <Pressable onPress={() => handlePaymentMethodSelect('apple-pay')}>
                        <Box
                            bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
                            borderRadius={10}
                            p="$4"
                        >
                            <HStack space="md" alignItems="center">
                                <Box
                                    w={24}
                                    h={24}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
                                    borderRadius={6}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Feather name="smartphone" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1} space="xs">
                                    <Text
                                        fontSize={12}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        Apple Pay
                                    </Text>
                                    <Text
                                        fontSize={9}
                                        color={isDark ? '$textDark400' : '$textLight500'}
                                        lineHeight={14}
                                    >
                                        Add Apple Pay as your payment method
                                    </Text>
                                </VStack>
                                <Feather
                                    name="chevron-right"
                                    size={18}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                />
                            </HStack>
                        </Box>
                    </Pressable>

                    {/* Credit Card Option */}
                    <Pressable onPress={() => handlePaymentMethodSelect('credit-card')}>
                        <Box
                            bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
                            borderRadius={10}
                            p="$4"
                        >
                            <HStack space="md" alignItems="center">
                                <Box
                                    w={24}
                                    h={24}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
                                    borderRadius={6}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Feather name="credit-card" size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                                </Box>
                                <VStack flex={1} space="xs">
                                    <Text
                                        fontSize={12}
                                        fontWeight="$semibold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        Credit Card
                                    </Text>
                                    <Text
                                        fontSize={9}
                                        color={isDark ? '$textDark400' : '$textLight500'}
                                        lineHeight={14}
                                    >
                                        Add a credit or debit card
                                    </Text>
                                </VStack>
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
                        name="arrow-left"
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
                    Add Payment Method
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
                <VStack space="md">
                    {/* Name on Card Section */}
                    <VStack space="xs">
                        <Text
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                        >
                            Name on Card
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            mt="$1"
                        >
                            <Input borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder="Ozan Mutluoğlu"
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
                            Card Number
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            mt="$1"
                        >
                            <HStack alignItems="center" space="sm">
                                <Input flex={1} borderWidth={0} bg="transparent">
                                    <InputField
                                        placeholder="1234 5678 9012 3456"
                                        placeholderTextColor="#B9B9B9"
                                        value={cardNumber}
                                        onChangeText={handleCardNumberChange}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={11}
                                        keyboardType="numeric"
                                        maxLength={19}
                                    />
                                </Input>
                                <Feather
                                    name="credit-card"
                                    size={20}
                                    color={isDark ? '#8C8C8C' : '#9CA3AF'}
                                />
                            </HStack>
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
                                Expiration Date
                            </Text>
                            <Box
                                borderWidth={1}
                                borderColor="#B9B9B9"
                                borderRadius={10}
                                px="$4"
                                mt="$1"
                            >
                                <Input borderWidth={0} bg="transparent">
                                    <InputField
                                        placeholder="MM/YY"
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
                                Security Code
                            </Text>
                            <Box
                                borderWidth={1}
                                borderColor="#B9B9B9"
                                borderRadius={10}
                                px="$4"
                                mt="$1"
                            >
                                <Input borderWidth={0} bg="transparent">
                                    <InputField
                                        placeholder="CVV"
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
                            Card Name
                        </Text>
                        <Box
                            borderWidth={1}
                            borderColor="#B9B9B9"
                            borderRadius={10}
                            px="$4"
                            mt="$1"
                        >
                            <Input borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder="Work Card"
                                    placeholderTextColor="#B9B9B9"
                                    value={cardName}
                                    onChangeText={setCardName}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={11}
                                />
                            </Input>
                        </Box>
                    </VStack>
                    {/* Save Card Button */}
                    <Button
                        bg="#E2FF46"
                        borderRadius={8}
                        onPress={() => {
                            console.log('Save card requested');
                            onClose();
                        }}
                    >
                        <ButtonText
                            color="#000000"
                            fontSize={14}
                            fontWeight="$bold"
                            textAlign="center"
                        >
                            Save Card
                        </ButtonText>
                    </Button>
                </VStack>
            </ScrollView>
        </VStack>
    );
};

export default AddPaymentMethodBottomSheet;

