import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { Modal, View, StyleSheet, Dimensions, Pressable as RNPressable } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface OneOnOneSupportRequestModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    expertName: string;
    expertTitle: string;
    expertAvatar: any;
    supportType: string;
    message: string;
    amount: number;
    currentBalance: number;
}

const OneOnOneSupportRequestModal: React.FC<OneOnOneSupportRequestModalProps> = ({ 
    isVisible, 
    onClose,
    onConfirm,
    expertName,
    expertTitle,
    expertAvatar,
    supportType,
    message,
    amount,
    currentBalance
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('inbox');
    const { width } = Dimensions.get('window');

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <RNPressable
                style={styles.modalOverlay}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                            width: width * 0.9,
                            maxWidth: 320,
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                >
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
                                    source={expertAvatar}
                                    alt={expertName}
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
                                    {expertName}
                                </Text>

                                {/* Title/Tags */}
                                <Text
                                    fontSize={9}
                                    fontWeight="$normal"
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    numberOfLines={1}
                                >
                                    {expertTitle}
                                </Text>
                            </VStack>
                        </HStack>

                        {/* Destek Türü Başlığı */}
                        <Text
                            px="$4"
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                            lineHeight={14}
                        >
                            {supportType}
                        </Text>

                        {/* Mesaj İçeriği */}
                        <Text
                            px="$4"
                            fontSize={9}
                            fontWeight="$normal"
                            color={isDark ? '#8C8C8C' : '#8C8C8C'}
                            lineHeight={13}
                        >
                            {message}
                        </Text>

                        {/* TIPS Miktarı ve Bakiye */}
                        <HStack 
                            borderTopWidth={1} 
                            borderBottomWidth={1} 
                            borderColor={'#D9D9D9'} 
                            justifyContent="space-between" 
                            alignItems="flex-end" 
                            py="$2"
                            px="$4"
                        >
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
                                    {t('support.confirmModal.currentBalance')}
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
                        <VStack space="xs" mt="$2" px="$4" pb="$4">
                            {/* Confirm Butonu */}
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
                                    {t('support.confirmModal.confirmButton')}
                                </Text>
                            </Pressable>

                            {/* Cancel Butonu */}
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
                                    {t('support.confirmModal.cancelButton')}
                                </Text>
                            </Pressable>
                        </VStack>
                    </VStack>
                </View>
            </RNPressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 16,
        padding: 0,
        maxHeight: '80%',
    },
});

export default OneOnOneSupportRequestModal;

