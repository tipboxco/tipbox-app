import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Pressable,
    Text,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

interface MessageDetailActionButtonsProps {
    onSendTipsPress?: () => void;
    onRequestSupportPress?: () => void;
    keyboardHeight?: number; // Klavye yüksekliği (kullanılmıyor, KeyboardAvoidingView ile otomatik)
    isKeyboardVisible?: boolean; // Klavye görünür mü?
    keyboardAnim?: any; // Kullanılmıyor (basitleştirme)
}

export const MessageDetailActionButtons: React.FC<MessageDetailActionButtonsProps> = ({
    onSendTipsPress,
    onRequestSupportPress,
    keyboardHeight = 0,
    isKeyboardVisible = false,
    keyboardAnim,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Bottom offset - MessageInput'un üzerinde olmalı
    // WhatsApp/Instagram benzeri: KeyboardAvoidingView tüm ekranı yukarı kaydırır
    // Absolute butonlar da parent container (KeyboardAvoidingView) ile birlikte yukarı kayar
    // Bu yüzden sabit bir offset yeterli
    const bottomOffset = 110; // Input'un üstünde sabit mesafe (klavye açık/kapalı fark etmez)

    return (
        <Box
            position="absolute"
            bottom={bottomOffset}
            right={16}
            zIndex={10}
        >
            <VStack
                space="sm"
                alignItems="flex-end"
            >
            {/* Send TIPS Button */}
            <Pressable
                onPress={onRequestSupportPress}
                bg="#E8FF6B"
                borderWidth={1}
                borderColor="#D8FF08"
                borderRadius={12}
                px="$3"
                py="$2"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.15}
                shadowRadius={4}
                elevation={4}
            >
                <HStack space="xs" alignItems="center" justifyContent="center">
                    <Feather
                        name="message-circle"
                        size={16}
                        color={isDark ? '#FFFFFF' : '#000000'}
                    />
                    <Text
                        color="#000000"
                        fontSize={11}
                        fontWeight="$semibold"
                    >
                        Request 1-on-1
                    </Text>
                </HStack>
            </Pressable>

            {/* Request 1-on-1 Button */}
            <Pressable
                onPress={onSendTipsPress}
                bg="#BC6BFF"
                borderWidth={1}
                borderColor="#AD08FF"
                borderRadius={12}
                px="$3"
                py="$2"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.1}
                shadowRadius={4}
                elevation={3}
            >
                <HStack space="xs" alignItems="center" justifyContent="center">
                    <Feather
                        name="gift"
                        size={16}
                        color="#000000"
                    />
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={11}
                        fontWeight="$medium"
                    >
                        Send TIPS
                    </Text>
                </HStack>
            </Pressable>
            </VStack>
        </Box>
    );
};

export default MessageDetailActionButtons;

