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
import { Platform } from 'react-native';

interface SupportMessageDetailActionButtonsProps {
    onCloseRequestPress?: () => void;
    onReportPress?: () => void;
}

export const SupportMessageDetailActionButtons: React.FC<SupportMessageDetailActionButtonsProps> = ({
    onCloseRequestPress,
    onReportPress,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <VStack
            position="absolute"
            bottom={80}
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
                        Close Support Request
                    </Text>
                </HStack>
            </Pressable>

            {/* Report Button */}
            <Pressable
                onPress={onReportPress}
                bg="#BC6BFF"
                borderWidth={1}
                borderColor="#AD08FF"
                borderRadius={12}
                maxWidth={100}
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
                        Report
                    </Text>
                </HStack>
            </Pressable>
        </VStack>
    );
};

export default SupportMessageDetailActionButtons;

