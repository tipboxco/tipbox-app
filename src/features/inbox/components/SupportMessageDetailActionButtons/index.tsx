import React from 'react';
import { Platform } from 'react-native';
import {
    VStack,
    Pressable,
    Text,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SupportMessageDetailActionButtonsProps {
    onCloseRequestPress?: () => void;
    onReportPress?: () => void;
    keyboardHeight?: number;
    isKeyboardVisible?: boolean;
}

export const SupportMessageDetailActionButtons: React.FC<SupportMessageDetailActionButtonsProps> = ({
    onCloseRequestPress,
    onReportPress,
    keyboardHeight = 0,
    isKeyboardVisible = false,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Klavye açıkken butonları klavyenin üstünde göster
    // Input field yüksekliği yaklaşık 60px, butonlar input'un üstünde 100px mesafede
    // Klavye açıkken: bottom = keyboardHeight + 100 (input'un üstünde)
    // Klavye kapalıyken: bottom = 100 (input'un üstünde)
    const bottomOffset = isKeyboardVisible ? keyboardHeight + 100 : 100;

    return (
        <VStack
            position="absolute"
            bottom={bottomOffset}
            right={16}
            space="sm"
            zIndex={100}
            alignItems="flex-end"
        >
            {/* Close Support Request Button */}
            <Pressable
                onPress={onCloseRequestPress}
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
                <Text
                    color="#000000"
                    fontSize={11}
                    fontWeight="$semibold"
                >
                    Close Support Request
                </Text>
            </Pressable>

            {/* Report Button */}
            <Pressable
                onPress={onReportPress}
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
                <Text
                    color="#FFFFFF"
                    fontSize={11}
                    fontWeight="$medium"
                >
                    Report
                </Text>
            </Pressable>
        </VStack>
    );
};

export default SupportMessageDetailActionButtons;

