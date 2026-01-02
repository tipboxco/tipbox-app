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
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor="#B9B9B9"
            borderRadius={10}
            p="$4"
        >
            <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space="md" flex={1}>
                    <Box
                        w={40}
                        h={40}
                        bg={isDark ? '#2A2A2A' : '#F5F5F5'}
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
                            fontSize={11}
                            fontWeight="$bold"
                            color={isDark ? '#FFFFFF' : '#000000'}
                        >
                            {data.cardType}
                        </Text>
                        <Text
                            fontSize={10}
                            fontWeight="$normal"
                            color="#B9B9B9"
                        >
                            {data.cardNumber}
                        </Text>
                    </VStack>
                </HStack>
                <Button
                    px="$4"
                    py="$2"
                    variant="outline"
                    onPress={onViewPress}
                    borderColor="#B9B9B9"
                    bg="transparent"
                >
                    <ButtonText
                        fontSize={10}
                        fontWeight="$medium"
                        color={isDark ? '#FFFFFF' : '#000000'}
                    >
                        View
                    </ButtonText>
                </Button>
            </HStack>
        </Box>
    );
};

export default LinkedPaymentMethod;
