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
import { Keyboard, Platform, Alert, Modal as RNModal, View, ScrollView, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useWalletBalance } from '@/src/features/wallet/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';

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
    const { t } = useTranslation('wallet');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const { width } = Dimensions.get('window');
    
    // Refs for input focus handling
    const descriptionInputRef = useRef<any>(null);
    const amountInputRef = useRef<any>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'description' | 'amount' | null>(null);

    // Wallet balance - Önce store'dan al, yoksa API'den getir
    const { walletBalance: storeBalance } = useAppStore();
    const { data: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
    // Store'daki balance varsa onu kullan, yoksa API'den gelen balance'ı kullan
    const currentBalance = storeBalance !== null && storeBalance !== undefined ? storeBalance : (walletBalance?.balance || 0);

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
        
        // Balance check
        if (numericAmount > currentBalance) {
            Alert.alert(t('sendTips.alerts.insufficientBalanceTitle'), t('sendTips.errors.insufficientBalance', { balance: currentBalance }));
            return;
        }

        // Validation
        if (numericAmount >= 0.01 && finalDescription.length > 0) {
            // Open confirmation modal
            setIsConfirmModalVisible(true);
        }
    };

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount) || 0;
        
        // Validation
        if (numericAmount <= 0 || numericAmount < 0.01) {
            Alert.alert(t('sendTips.errors.errorTitle'), t('sendTips.errors.minimumAmount'));
            return;
        }

        // Balance check (check again - balance may have changed)
        if (numericAmount > currentBalance) {
            Alert.alert(t('sendTips.alerts.insufficientBalanceTitle'), t('sendTips.errors.insufficientBalance', { balance: currentBalance }));
            return;
        }

        const finalDescription = description?.trim() || '';
        if (finalDescription.length === 0) {
            Alert.alert(t('sendTips.errors.errorTitle'), t('sendTips.errors.emptyMessage'));
            return;
        }
        
        console.log('Send TIPS:', { amount: numericAmount, description: finalDescription, currentBalance });
        onSend?.(numericAmount, finalDescription);
        // Close modal
        setIsConfirmModalVisible(false);
        // Close BottomSheet
        onClose();
        // Clear form
        setAmount('');
        setDescription('');
    };

    const handleConfirmModalClose = () => {
        setIsConfirmModalVisible(false);
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
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                paddingBottom: isKeyboardVisible ? 120 : 20
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <VStack flex={1}>
                {/* Header */}
                <HStack justifyContent="center" alignItems="center" py="$2">
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={18}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        {t('sendTips.title')}
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
                    {/* Description Input */}
                    <VStack space="md" mt="$4">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={11}
                            fontWeight="$medium"
                        >
                            {t('sendTips.descriptionLabel')}
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
                                    placeholder={t('sendTips.descriptionPlaceholder')}
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

                            {/* Character Counter - Bottom right inside Textarea */}
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

                    {/* TIPS Amount Input */}
                    <VStack space="sm" mt="$4">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={11}
                            fontWeight="$medium"
                        >
                            {t('sendTips.amountLabel')}
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
                                        placeholder={t('sendTips.amountPlaceholder')}
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
                                        {t('sendTips.maxButton')}
                                    </Text>
                                </Pressable>
                            </HStack>

                            {/* Ayırıcı Çizgi */}
                            <Box
                                height={1}
                                bg={isDark ? '#333' : '#E9E9E9'}
                            />

                            {/* Bottom Section: USD Equivalent and Balance */}
                            <HStack 
                                justifyContent="space-between" 
                                alignItems="center" 
                                px="$4"
                                py="$3"
                            >
                                {/* USD Equivalent */}
                                <Text
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    fontSize={9}
                                    fontWeight="$normal"
                                >
                                    {amount && parseFloat(amount) > 0 ? t('sendTips.usdEquivalent', { amount: getUSDAmount() }) : t('sendTips.usdEquivalent', { amount: '5' })}
                                </Text>

                                {/* Current Balance */}
                                <Text
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    fontSize={9}
                                    fontWeight="$normal"
                                >
                                    {t('sendTips.currentBalance', { balance: currentBalance })}
                                </Text>
                            </HStack>
                        </Box>
                    </VStack>

                    {/* Buttons: Cancel and Send */}
                    <HStack space="md" mt="$2">
                        {/* Cancel Button */}
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
                                {t('sendTips.cancelButton')}
                            </Text>
                        </Pressable>

                        {/* Send Button */}
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
                                {t('sendTips.sendButton')}
                            </Text>
                        </Pressable>
                    </HStack>
                </VStack>
            </VStack>

            {/* Confirmation Modal - RNModal */}
            <RNModal
                visible={isConfirmModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleConfirmModalClose}
            >
                <TouchableWithoutFeedback onPress={handleConfirmModalClose}>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <TouchableWithoutFeedback>
                            <View style={{
                                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                                borderRadius: 16,
                                width: width * 0.9,
                                maxWidth: 400,
                                maxHeight: '85%',
                                padding: 0,
                            }}>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <VStack space="md" p="$4">
                                        {/* User Profile Info */}
                                        <HStack space="sm" alignItems="center">
                                            {/* Avatar */}
                                            <Box
                                                width={40}
                                                height={40}
                                                borderRadius={20}
                                                overflow="hidden"
                                                bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                                            >
                                                <Image
                                                    source={senderAvatar}
                                                    alt={senderName}
                                                    style={{ width: '100%', height: '100%' }}
                                                    resizeMode="cover"
                                                />
                                            </Box>

                                            <VStack flex={1}>
                                                {/* Name */}
                                                <Text
                                                    fontSize={12}
                                                    fontWeight="$bold"
                                                    color={isDark ? '#FFFFFF' : '#000000'}
                                                >
                                                    {senderName}
                                                </Text>

                                                {/* Title/Tags */}
                                                <Text
                                                    fontSize={9}
                                                    fontWeight="$normal"
                                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                    numberOfLines={1}
                                                >
                                                    {senderTitle}
                                                </Text>
                                            </VStack>
                                        </HStack>

                                        {/* Title */}
                                        <Text
                                            fontSize={11}
                                            fontWeight="$bold"
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            lineHeight={14}
                                        >
                                            {t('sendTips.confirmPayment')}
                                        </Text>

                                        {/* Tips Description */}
                                        <Text
                                            fontSize={9}
                                            fontWeight="$normal"
                                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                            lineHeight={13}
                                        >
                                            {description || t('sendTips.noDescription')}
                                        </Text>

                                        {/* TIPS Amount and Balance */}
                                        <HStack 
                                            borderTopWidth={1} 
                                            borderBottomWidth={1} 
                                            borderColor={'#D9D9D9'} 
                                            justifyContent="space-between" 
                                            alignItems="flex-end" 
                                            py="$2"
                                        >
                                            {/* Left: TIPS Amount */}
                                            <VStack>
                                                <Text
                                                    fontSize={24}
                                                    fontWeight="$bold"
                                                    color={isDark ? '#FFFFFF' : '#000000'}
                                                >
                                                    {parseFloat(amount) || 0} TIPS
                                                </Text>
                                            </VStack>

                                            {/* Right: Current Balance */}
                                            <VStack alignItems="flex-end">
                                                <Text
                                                    fontSize={9}
                                                    fontWeight="$normal"
                                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                >
                                                    {t('sendTips.currentBalance', { balance: '' }).replace(/:\s*$/, '')}
                                                </Text>
                                                <Text
                                                    fontSize={9}
                                                    fontWeight="$semibold"
                                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                >
                                                    {currentBalance} TIPS
                                                </Text>
                                            </VStack>
                                        </HStack>

                                        {/* Buttons */}
                                        <VStack space="xs" mt="$2">
                                            {/* Confirm Button */}
                                            <Pressable
                                                onPress={handleConfirm}
                                                bg="#E2FF46"
                                                borderRadius={8}
                                                py="$2"
                                            >
                                                <Text
                                                    color="#000000"
                                                    fontSize={12}
                                                    fontWeight="$bold"
                                                    textAlign="center"
                                                >
                                                    {t('sendTips.confirmButton')}
                                                </Text>
                                            </Pressable>

                                            {/* Cancel Button */}
                                            <Pressable
                                                onPress={handleConfirmModalClose}
                                                bg="#EDEDED"
                                                borderWidth={1}
                                                borderColor={'#D3D3D3'}
                                                borderRadius={8}
                                                py="$2"
                                            >
                                                <Text
                                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                                    fontSize={12}
                                                    fontWeight="$normal"
                                                    textAlign="center"
                                                >
                                                    {t('sendTips.cancelButton')}
                                                </Text>
                                            </Pressable>
                                        </VStack>
                                    </VStack>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </RNModal>
        </ScrollView>
    );
};

export default SendTipsBottomSheet;

