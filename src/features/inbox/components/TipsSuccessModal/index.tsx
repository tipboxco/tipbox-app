import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Modal,
    ModalBackdrop,
    ModalContent,
    ModalBody,
    Pressable,
} from '@gluestack-ui/themed';
import { ScrollView } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface TipsSuccessModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    amount: number;
    description: string;
    recipientName: string;
    recipientTitle: string;
    recipientAvatar: any;
    currentBalance: number;
    isConfirmed?: boolean; // Confirm sonrası re-render kontrolü
}

const TipsSuccessModal: React.FC<TipsSuccessModalProps> = ({ 
    isVisible, 
    onClose,
    onConfirm,
    amount,
    description,
    recipientName,
    recipientTitle,
    recipientAvatar,
    currentBalance,
    isConfirmed = false
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('inbox');

    return (
        <Modal isOpen={isVisible} onClose={onClose} flex={1}>
            <ModalBackdrop  />
            <ModalContent
                width="90%"
                maxWidth={isConfirmed ? 400 : 400} // Confirm sonrası da aynı boyutta kal
                maxHeight="85%"
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={16}
            >
                <ModalBody p="$0">
                    <VStack space="md">
                        {/* Kullanıcı Profil Bilgileri */}
                        <HStack space="sm" alignItems="center" px="$4" mt="$4">
                            {/* Avatar */}
                            <Box
                                width={40}
                                height={40}
                                borderRadius={20}
                                overflow="hidden"
                                bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                            >
                                <Image
                                    source={recipientAvatar}
                                    alt={recipientName}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </Box>

                            <VStack flex={1}>
                                {/* İsim */}
                                <Text
                                    fontSize={12}
                                    fontWeight="$bold"
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                >
                                    {recipientName}
                                </Text>

                                {/* Title/Tags */}
                                <Text
                                    fontSize={9}
                                    fontWeight="$normal"
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    numberOfLines={1}
                                >
                                    {recipientTitle}
                                </Text>
                            </VStack>
                        </HStack>

                        {/* Bahşiş Açıklaması */}
                        {description ? (
                        <Text
                            px="$4"
                            fontSize={9}
                            fontWeight="$normal"
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            lineHeight={13}
                        >
                            {description}
                        </Text>
                        ) : null}

                        {/* TIPS Miktarı ve Bakiye */}
                        <HStack borderTopWidth={1} borderBottomWidth={1} borderColor={'#D9D9D9'} justifyContent="space-between" alignItems="flex-end" py="$2">
                            {/* Sol: TIPS Miktarı */}
                            <VStack>
                                <Text
                                    fontSize={24}
                                    fontWeight="$bold"
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                >
                                    {amount} TIPS
                                </Text>
                            </VStack>

                            {/* Sağ: Current Balance */}
                            <VStack alignItems="flex-end">
                                <Text
                                    fontSize={9}
                                    fontWeight="$normal"
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                >
                                    {t('tipsConfirmModal.currentBalance')}
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

                        {/* Butonlar */}
                        <VStack space="xs" mt="$2" px="$4">
                            {/* Onayla Butonu */}
                            <Pressable
                                onPress={onConfirm}
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
                                    {t('tipsConfirmModal.confirm')}
                                </Text>
                            </Pressable>

                            {/* İptal Et Butonu */}
                            <Pressable
                                onPress={onClose}
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
                                    {t('tipsConfirmModal.cancel')}
                                </Text>
                            </Pressable>
                        </VStack>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default TipsSuccessModal;

