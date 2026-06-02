import React, { useState, useEffect, useRef } from 'react';
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
import { ChatBubbleLeftIcon, Cog6ToothIcon, CubeIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Keyboard, Platform } from 'react-native';
import OneOnOneSupportRequestModal from '../OneOnOneSupportRequestModal';

interface OneOnOneSupportBottomSheetProps {
    expertName: string;
    expertTitle: string;
    expertAvatar: any;
    onClose: () => void;
    onSend?: (supportType: string, message: string, amount: number) => void;
}

export const OneOnOneSupportBottomSheet: React.FC<OneOnOneSupportBottomSheetProps> = ({
    expertName,
    expertTitle,
    expertAvatar,
    onClose,
    onSend,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('inbox');
    const [supportType, setSupportType] = useState<'GENERAL' | 'TECHNICAL' | 'PRODUCT' | ''>('');
    const [message, setMessage] = useState('');
    const [amount, setAmount] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showSupportTypeDropdown, setShowSupportTypeDropdown] = useState(false);

    // Kullanıcının mevcut bakiyesi (normalde prop veya store'dan gelecek)
    const currentBalance = 500;

    // Conversion rate: 1 TIPS = $0.01
    const TIPS_TO_USD_RATE = 0.01;

    const supportTypes: Array<'GENERAL' | 'TECHNICAL' | 'PRODUCT'> = [
        'GENERAL',
        'TECHNICAL',
        'PRODUCT',
    ];

    const getSupportTypeLabel = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT' | '') => {
        switch (type) {
            case 'GENERAL':
                return t('support.types.general');
            case 'TECHNICAL':
                return t('support.types.technical');
            case 'PRODUCT':
                return t('support.types.product');
            default:
                return t('support.selectType');
        }
    };

    const getSupportTypeIcon = (type: 'GENERAL' | 'TECHNICAL' | 'PRODUCT') => {
        switch (type) {
            case 'GENERAL':
                return ChatBubbleLeftIcon;
            case 'TECHNICAL':
                return Cog6ToothIcon;
            case 'PRODUCT':
                return CubeIcon;
        }
    };

    const handleMaxAmount = () => {
        setAmount(currentBalance.toString());
    };

    const handleAmountChange = (value: string) => {
        // Sadece sayı karakterlerine izin ver
        const numericValue = value.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    };

    const getUSDAmount = () => {
        const numericAmount = parseFloat(amount) || 0;
        return (numericAmount * TIPS_TO_USD_RATE).toFixed(2);
    };

    const handleCreateRequest = () => {
        // Modal'ı aç
        if (isValidRequest()) {
            setIsModalVisible(true);
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    const handleConfirm = () => {
        const numericAmount = parseFloat(amount) || 0;
        console.log('Send Support Request:', { supportType, message, amount: numericAmount });
        onSend?.(supportType, message, numericAmount);
        
        // Modal'ı kapat
        setIsModalVisible(false);
        
        // BottomSheet'i kapat
        onClose();
        
        // Formu temizle
        setSupportType('');
        setMessage('');
        setAmount('');
    };

    const isValidRequest = () => {
        const numericAmount = parseFloat(amount) || 0;
        return supportType.length > 0 && message.trim().length > 0 && numericAmount > 0;
    };


    return (
        <VStack
            bg={isDark ? '$backgroundDark950' : '#FDFDFB'}
            pb={12}
            pt={6}
            px={16}
            space="sm"
            minHeight={100}
        >
                {/* Başlık */}
                <HStack justifyContent="center" alignItems="center" py="$1">
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={16}
                        fontWeight="$bold"
                        textAlign="center"
                    >
                        {t('support.title')}
                    </Text>
                </HStack>

                {/* Banner ve Profil Bölümü */}
                <Box position="relative">
                    {/* Banner */}
                    <Box height={120} overflow="hidden" position="relative" px="$4">
                        <Image
                            source={require('@/assets/tips_banner.png')}
                            alt="Support Banner"
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
                            bottom={12}
                            left={0}
                            right={0}
                            alignItems="center"
                        >
                            <VStack space="xs" alignItems="center">
                                {/* Profil Fotoğrafı */}
                                <Box
                                    width={56}
                                    height={56}
                                    borderRadius={28}
                                    borderColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    overflow="hidden"
                                    bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Image
                                        source={expertAvatar}
                                        alt={expertName}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </Box>
                                <Text
                                    color="#FFFFFF"
                                    fontSize={11}
                                    fontWeight="$bold"
                                    textAlign="center"
                                >
                                    {expertName}
                                </Text>
                                <Text
                                    color="rgba(255, 255, 255, 0.8)"
                                    fontSize={8}
                                    fontWeight="$normal"
                                    numberOfLines={1}
                                    textAlign="center"
                                    maxWidth={280}
                                >
                                    {expertTitle}
                                </Text>
                            </VStack>
                        </Box>
                    </Box>
                </Box>

                {/* İçerik */}
                <VStack space="sm" px="$4" pb="$2">
                    {/* Support Type Seçimi */}
                    <VStack space="xs" mt="$2">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={11}
                            fontWeight="$semibold"
                        >
                            {t('support.areaQuestion')}
                        </Text>

                        <VStack space="xs" position="relative">
                            <Pressable onPress={() => setShowSupportTypeDropdown((v) => !v)}>
                                <Box
                                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                    borderWidth={1}
                                    borderColor={isDark ? '#333' : '#E9E9E9'}
                                    borderTopLeftRadius={12}
                                    borderTopRightRadius={12}
                                    borderBottomLeftRadius={showSupportTypeDropdown ? 0 : 12}
                                    borderBottomRightRadius={showSupportTypeDropdown ? 0 : 12}
                                    height={48}
                                    px="$4"
                                    justifyContent="center"
                                >
                                    <HStack
                                        flex={1}
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <HStack alignItems="center" space="sm" flex={1}>
                                            {supportType && (() => {
                                                const IconComponent = getSupportTypeIcon(supportType);
                                                return IconComponent ? (
                                                    <IconComponent
                                                        width={20}
                                                        height={20}
                                                        color={supportType ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                                                    />
                                                ) : null;
                                            })()}
                                            <Text
                                                color={
                                                    supportType
                                                        ? (isDark ? '#FFFFFF' : '#000000')
                                                        : (isDark ? '#8C8C8C' : '#8C8C8C')
                                                }
                                                fontSize={13}
                                                fontWeight="$normal"
                                                flex={1}
                                            >
                                                {getSupportTypeLabel(supportType)}
                                            </Text>
                                        </HStack>
                                        <Feather
                                            name={showSupportTypeDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        />
                                    </HStack>
                                </Box>
                            </Pressable>

                            {showSupportTypeDropdown && (
                                <Box
                                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                                    borderWidth={1}
                                    borderColor={isDark ? '#333' : '#E9E9E9'}
                                    borderTopWidth={0}
                                    borderTopLeftRadius={0}
                                    borderTopRightRadius={0}
                                    borderBottomLeftRadius={12}
                                    borderBottomRightRadius={12}
                                    overflow="hidden"
                                >
                                    <VStack>
                                        {supportTypes.map((type, index) => (
                                            <React.Fragment key={type}>
                                                {index > 0 && (
                                                    <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} width="100%" />
                                                )}
                                                <Pressable
                                                    onPress={() => {
                                                        setSupportType(type);
                                                        setShowSupportTypeDropdown(false);
                                                    }}
                                                >
                                                    <HStack px="$4" py="$2.5" alignItems="center" space="sm">
                                                        {(() => {
                                                            const IconComponent = getSupportTypeIcon(type);
                                                            return IconComponent ? (
                                                                <IconComponent
                                                                    width={20}
                                                                    height={20}
                                                                    color={isDark ? '#FFFFFF' : '#2F2F2F'}
                                                                />
                                                            ) : null;
                                                        })()}
                                                        <Text
                                                            color={isDark ? '#FFFFFF' : '#2F2F2F'}
                                                            fontSize={13}
                                                            fontWeight="$normal"
                                                        >
                                                            {getSupportTypeLabel(type)}
                                                        </Text>
                                                    </HStack>
                                                </Pressable>
                                            </React.Fragment>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </VStack>

                    {/* Mesaj Girişi */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={10}
                            fontWeight="$semibold"
                        >
                            {t('support.helpQuestion')}
                        </Text>

                        <Box
                            position="relative"
                            borderRadius={10}
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
                                    placeholder={t('support.placeholders.describeIssue')}
                                    placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={12}
                                    fontWeight="$normal"
                                    value={message}
                                    onChangeText={setMessage}
                                    numberOfLines={6}
                                    maxLength={500}
                                    style={{ paddingBottom: 24 }}
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
                                    {message.length}/500
                                </Text>
                            </Box>
                        </Box>
                    </VStack>

                    {/* TIPS Miktarı Girişi */}
                    <VStack space="xs">
                        <Text
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            fontSize={10}
                            fontWeight="$medium"
                        >
                            {t('support.tipsAmount')}
                        </Text>

                        {/* TIPS Miktarı ve Alt Bilgiler - Tek Bileşen */}
                        <Box
                            borderRadius={10}
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                            bg="transparent"
                            overflow="hidden"
                        >
                            {/* Üst Kısım: Input Alanı ve Max Butonu */}
                            <HStack
                                alignItems="center"
                                justifyContent="space-between"
                                px="$3"
                                py="$2"
                            >
                                {/* Input Alanı */}
                                <Input
                                    flex={1}
                                    borderWidth={0}
                                    bg="transparent"
                                    height={40}
                                >
                                    <InputField
                                        placeholder={t('support.placeholders.amount')}
                                        placeholderTextColor={isDark ? '#666666' : '#B8B8B8'}
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={28}
                                        fontWeight="$bold"
                                        value={amount}
                                        onChangeText={handleAmountChange}
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
                                        {t('support.maxButton')}
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
                                py="$2"
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
                                    {t('support.currentBalance', { balance: currentBalance })}
                                </Text>
                            </HStack>
                        </Box>
                    </VStack>

                    {/* Bilgilendirme Notu */}
                    <Box borderRadius={12} px="$4" py="$1.5">
                        <HStack space="sm" alignItems="center">
                            <Feather 
                                name="info" 
                                size={16} 
                                color={isDark ? '#E2FF46' : '#7A8C00'} 
                            />
                            <Text
                                color={isDark ? '#C4D63E' : '#6B7800'}
                                fontSize={10}
                                fontWeight="$normal"
                                flex={1}
                            >
                                {t('support.minTipsInfo', { name: expertName, amount: 50 })}
                            </Text>
                        </HStack>
                    </Box>

                    {/* Create 1-On-1 Request Butonu */}
                    <Pressable
                        onPress={handleCreateRequest}
                        bg={'#E2FF46'}
                        borderRadius={12}
                        py="$2.5"
                        disabled={!isValidRequest()}
                        opacity={isValidRequest() ? 1 : 0.5}
                    >
                        <Text
                            color={"#000000"}
                            fontSize={14}
                            fontWeight="$bold"
                            textAlign="center"
                        >
                            {t('support.createButton')}
                        </Text>
                    </Pressable>
                </VStack>

            {/* Onay Modalı */}
            <OneOnOneSupportRequestModal
                isVisible={isModalVisible}
                onClose={handleModalClose}
                onConfirm={handleConfirm}
                expertName={expertName}
                expertTitle={expertTitle}
                expertAvatar={expertAvatar}
                supportType={supportType}
                message={message}
                amount={parseFloat(amount) || 0}
                currentBalance={currentBalance}
            />
        </VStack>
    );
};

export default OneOnOneSupportBottomSheet;


