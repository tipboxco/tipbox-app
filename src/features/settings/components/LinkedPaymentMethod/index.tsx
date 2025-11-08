import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Button,
    ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export interface LinkedPaymentMethodData {
    cardType: string;
    cardNumber: string; // Masked card number (e.g., 52093984******3945)
}

interface LinkedPaymentMethodProps {
    data: LinkedPaymentMethodData;
    onViewPress?: () => void;
}

export const LinkedPaymentMethod: React.FC<LinkedPaymentMethodProps> = ({ data, onViewPress }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Box
            bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark600' : '$borderLight200'}
            borderRadius={12}
            p="$4"
        >
            <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space="md" flex={1}>
                    <Box
                        w={40}
                        h={40}
                        bg={isDark ? '$backgroundDark700' : '$backgroundLight50'}
                        borderRadius={8}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Feather
                            name="credit-card"
                            size={20}
                            color={isDark ? '#FFFFFF' : '#000000'}
                        />
                    </Box>
                    <VStack flex={1} space="xs">
                        <Text
                            fontSize={12}
                            fontWeight="$semibold"
                            color={isDark ? '$textDark50' : '$textLight900'}
                        >
                            {data.cardType}
                        </Text>
                        <Text
                            fontSize={10}
                            color={isDark ? '$textDark400' : '$textLight500'}
                        >
                            {data.cardNumber}
                        </Text>
                    </VStack>
                </HStack>
                <Button
                    px="$4"
                    variant="outline"
                    onPress={onViewPress}
                    borderColor={isDark ? '$borderDark600' : '$borderLight200'}
                >
                    <ButtonText
                        fontSize={10}
                        fontWeight="$medium"
                        color={isDark ? '$textDark50' : '$textLight900'}
                    >
                        View
                    </ButtonText>
                </Button>
            </HStack>
        </Box>
    );
};

export default LinkedPaymentMethod;

