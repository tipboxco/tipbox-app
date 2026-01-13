import React, { useState, useRef, useEffect } from 'react';
import {
    VStack,
    HStack,
    Text,
    Pressable,
    Box,
    Input,
    InputField,
    Image,
    Textarea,
    TextareaInput,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Keyboard, Platform } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import TipsSuccessModal from '../TipsSuccessModal';

interface SendTipsBottomSheetProps {
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
    onClose: () => void;
    onSend?: (amount: number, message?: string) => void;
}

export const SendTipsBottomSheet: React.FC<SendTipsBottomSheetProps> = ({
    senderName,
    senderTitle,
    senderAvatar,
    onClose,
    onSend,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    
    // Refs for scroll and input focus handling
    const scrollViewRef = useRef<any>(null);
    const descriptionInputRef = useRef<any>(null);
    const amountInputRef = useRef<any>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'description' | 'amount' | null>(null);

    // Kullanıcının mevcut bakiyesi (normalde prop veya store'dan gelecek)
    const currentBalance = 500;

    // Conversion rate: 1 TIPS = $0.01
    const TIPS_TO_USD_RATE = 0.01;

    const handleMaxAmount = () => {
        setAmount(currentBalance.toString());
    };

    const handleAmountChange = (value: string) => {
        // Sadece sayı karakterlerine izin ver
        const numericValue = value.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    };

    const handleSend = () => {
        const numericAmount = parseFloat(amount) || 0;
        const finalDescription = description?.trim() || '';
        
        // Validation
        if (numericAmount >= 0.01 && finalDescription.length > 0) {
            // Onay modalını aç
            setIsSuccessModalVisible(true);
        }
    };

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount) || 0;
        
        // Validation
        if (numericAmount <= 0 || numericAmount < 0.01) {
            // Validation error will be handled by parent component
            return;
        }
        
        const finalDescription = description?.trim() || '';
        if (finalDescription.length === 0) {
            // Validation error will be handled by parent component
            return;
        }
        
        console.log('Send TIPS:', { amount: numericAmount, description: finalDescription });
        onSend?.(numericAmount, finalDescription);
        // Modal'ı kapat
        setIsSuccessModalVisible(false);
        // BottomSheet'i kapat
        onClose();
        // Formu temizle
        setAmount('');
        setDescription('');
    };

    const handleSuccessModalClose = () => {
        setIsSuccessModalVisible(false);
    };

    const getUSDAmount = () => {
        const numericAmount = parseFloat(amount) || 0;
        return (numericAmount * TIPS_TO_USD_RATE).toFixed(2);
    };

    const isValidAmount = () => {
        const numericAmount = parseFloat(amount) || 0;
        return numericAmount >= 0.01; // Minimum 0.01 TIPS
    };
    
    const isValidDescription = () => {
        return description?.trim().length > 0;
    };
    
    const isValidForm = () => {
        return isValidAmount() && isValidDescription();
    };

    // Klavye durumunu takip et
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setIsKeyboardVisible(true);
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setIsKeyboardVisible(false);
                setFocusedInput(null);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Input focus handler'ları
    const handleDescriptionFocus = () => {
        setFocusedInput('description');
    };

    const handleDescriptionBlur = () => {
        // Blur olduğunda focus state'i temizle (eğer başka input focus değilse)
        setTimeout(() => {
            if (focusedInput === 'description') {
                setFocusedInput(null);
            }
        }, 100);
    };

    const handleAmountFocus = () => {
        setFocusedInput('amount');
    };

    const handleAmountBlur = () => {
        // Blur olduğunda focus state'i temizle (eğer başka input focus değilse)
        setTimeout(() => {
            if (focusedInput === 'amount') {
                setFocusedInput(null);
            }
        }, 100);
    };

    return (
        <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ 
                paddingBottom: isKeyboardVisible ? 120 : 20 
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <VStack flex={1}>
                {/* Başlık */}
                <HStack justifyContent="center" alignItems="center" py="$2">
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={18}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        Bahşiş Gönder
                    </Text>
                </HStack>
                {/* Banner ve Profil Bölümü */}
                <Box position="relative">
                    {/* Banner */}
                    <Box height={160} overflow="hidden" position="relative" px="$4">
                        <Image
                            source={require('@/assets/tips_banner.png')}
                            alt="Tips Banner"
                            style={{ width: '100%', height: '100%', borderRadius: 10 }}
                            resizeMode="cover"
                        />

                        {/* Overlay */}
                        <Box
                            position="absolute"
                            top={0}
                            left={16}
                            right={16}
                            bottom={0}
                            bg="rgba(0, 0, 0, 0.6)"
                            borderRadius={10}
                        />

                        {/* Kullanıcı Bilgileri - Banner içerisinde ortalanmış */}
                        <Box
                            position="absolute"
                            bottom={20}
                            left={0}
                            right={0}
                            alignItems="center"
                        >
                            <VStack space="sm" alignItems="center">
                                {/* Profil Fotoğrafı */}
                                <Box
                                    width={72}
                                    height={72}
                                    borderRadius={36}
                                    borderColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    overflow="hidden"
                                    bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Image
                                        source={senderAvatar}
                                        alt={senderName}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </Box>
                                <Text
                                    color="#FFFFFF"
                                    fontSize={12}
                                    fontWeight="$bold"
                                    textAlign="center"
                                >
                                    {senderName}
                                </Text>
                                <Text
                                    color="rgba(255, 255, 255, 0.8)"
                                    fontSize={9}
                                    fontWeight="$normal"
                                    numberOfLines={1}
                                    textAlign="center"
                                    maxWidth={280}
                                >
                                    {senderTitle}
                                </Text>
                            </VStack>
                        </Box>
                    </Box>
                </Box>

                {/* İçerik */}
                <VStack space="lg" px="$4" pb="$4">
                    {/* Miktar Girişi */}
                    <VStack space="md" mt="$4">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={11}
                            fontWeight="$medium"
                        >
                            Bahşiş Açıklaması (Opsiyonel)
                        </Text>

                        <Box
                            position="relative"
                            borderRadius={12}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                            bg="transparent"
                        >
                            <Textarea
                                borderWidth={0}
                                bg="transparent"
                                minHeight={100}
                            >
                                <TextareaInput
                                    ref={descriptionInputRef}
                                    placeholder="E.g.: Thanks for the great content!"
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={13}
                                    fontWeight="$normal"
                                    value={description}
                                    onChangeText={setDescription}
                                    onFocus={handleDescriptionFocus}
                                    onBlur={handleDescriptionBlur}
                                    numberOfLines={4}
                                    maxLength={200}
                                    style={{ paddingBottom: 28 }}
                                />
                            </Textarea>

                            {/* Karakter Sayacı - Textarea içinde sağ alt köşe */}
                            <Box
                                position="absolute"
                                bottom={8}
                                right={12}
                            >
                                <Text
                                    color={isDark ? '#666' : '#999'}
                                    fontSize={10}
                                    fontWeight="$normal"
                                >
                                    {description.length}/200
                                </Text>
                            </Box>
                        </Box>
                    </VStack>

                    {/* TIPS Miktarı Girişi */}
                    <VStack space="sm" mt="$4">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={11}
                            fontWeight="$medium"
                        >
                            TIPS Miktarı
                        </Text>

                        {/* TIPS Miktarı ve Alt Bilgiler - Tek Bileşen */}
                        <Box
                            borderRadius={12}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                            bg="transparent"
                            overflow="hidden"
                        >
                            {/* Üst Kısım: Input Alanı ve Max Butonu */}
                            <HStack 
                                alignItems="center" 
                                justifyContent="space-between"
                                px="$4"
                                py="$3"
                            >
                                {/* Input Alanı */}
                                <Input
                                    flex={1}
                                    borderWidth={0}
                                    bg="transparent"
                                    height={60}
                                >
                                    <InputField
                                        ref={amountInputRef}
                                        placeholder="50"
                                        placeholderTextColor="#B8B8B8"
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={38}
                                        fontWeight="$bold"
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        onFocus={handleAmountFocus}
                                        onBlur={handleAmountBlur}
                                        keyboardType="numeric"
                                    />
                                </Input>

                                {/* Max Butonu */}
                                <Pressable
                                    onPress={handleMaxAmount}
                                    bg={isDark ? '#2A2A2A' : '#E9E9E9'}
                                    borderRadius={8}
                                    px="$4"
                                    py="$2"
                                    ml="$2"
                                >
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={9}
                                        fontWeight="$semibold"
                                    >
                                        Max
                                    </Text>
                                </Pressable>
                            </HStack>

                            {/* Ayırıcı Çizgi */}
                            <Box
                                height={1}
                                bg={isDark ? '#333' : '#E9E9E9'}
                            />

                            {/* Alt Kısım: USD Eşdeğeri ve Bakiye */}
                            <HStack 
                                justifyContent="space-between" 
                                alignItems="center" 
                                px="$4"
                                py="$3"
                            >
                                {/* USD Eşdeğeri */}
                                <Text
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    fontSize={9}
                                    fontWeight="$normal"
                                >
                                    {amount && parseFloat(amount) > 0 ? `$${getUSDAmount()}` : '$5'}
                                </Text>

                                {/* Mevcut Bakiye */}
                                <Text
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    fontSize={9}
                                    fontWeight="$normal"
                                >
                                    Current Balance : {currentBalance} TIPS
                                </Text>
                            </HStack>
                        </Box>
                    </VStack>

                    {/* Butonlar: Vazgeç ve Gönder */}
                    <HStack space="md" mt="$2">
                        {/* Vazgeç Butonu */}
                        <Pressable
                            onPress={onClose}
                            flex={1}
                            borderRadius={12}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                            bg="transparent"
                            py="$3"
                        >
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={14}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                Vazgeç
                            </Text>
                        </Pressable>

                        {/* Gönder Butonu */}
                        <Pressable
                            onPress={handleSend}
                            flex={1}
                            bg={'#E2FF46'}
                            borderRadius={12}
                            py="$3"
                            disabled={!isValidForm()}
                            opacity={isValidForm() ? 1 : 0.5}
                        >
                            <Text
                                color={"#000000"}
                                fontSize={14}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                Gönder
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
            </VStack>

            {/* Onay Modalı */}
            <TipsSuccessModal
                isVisible={isSuccessModalVisible}
                onClose={handleSuccessModalClose}
                onConfirm={handleConfirm}
                amount={parseFloat(amount) || 0}
                description={description}
                recipientName={senderName}
                recipientTitle={senderTitle}
                recipientAvatar={senderAvatar}
                currentBalance={currentBalance}
            />
        </BottomSheetScrollView>
    );
};

export default SendTipsBottomSheet;

