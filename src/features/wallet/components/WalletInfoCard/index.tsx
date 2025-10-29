import React from 'react';
import { VStack, HStack, Text, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

interface WalletInfoCardProps {
    userName?: string;
    walletAddress?: string;
    onCopyAddress?: () => void;
}

const WalletInfoCard: React.FC<WalletInfoCardProps> = ({
    userName = "Michael Clark",
    walletAddress = "F4184fc596......0e9831e9e16",
    onCopyAddress
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const handleCopyAddress = () => {
        if (onCopyAddress) {
            onCopyAddress();
        } else {
            // Varsayılan copy işlemi
            console.log('Wallet address copied:', walletAddress);
        }
    };

    return (
        <Box 
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderRadius="$lg"
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
            p="$4"
        >
            <HStack alignItems="center" gap="$3">
                <FeatherIcon 
                    name="credit-card" 
                    size={24} 
                    color={isDark ? '$textDark100' : '$textLight900'} 
                />
                <VStack flex={1}>
                    <Text 
                        fontSize="$sm" 
                        fontWeight="$bold" 
                        color={isDark ? '$textDark100' : '$textLight900'}
                    >
                        {userName}
                    </Text>
                    <HStack alignItems="center" gap="$2">
                        <Text 
                            fontSize="$xs" 
                            color={isDark ? '$textDark400' : '#B9B9B9'}
                        >
                            {walletAddress}
                        </Text>
                        <Pressable onPress={handleCopyAddress}>
                            <FeatherIcon 
                                name="copy" 
                                size={12} 
                                color={isDark ? '$textDark400' : '#B9B9B9'} 
                            />
                        </Pressable>
                    </HStack>
                </VStack>
            </HStack>
        </Box>
    );
};

export default WalletInfoCard;
