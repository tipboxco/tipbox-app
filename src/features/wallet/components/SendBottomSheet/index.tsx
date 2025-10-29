import React, { useState } from 'react';
import { VStack, HStack, Text, Box, Pressable, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

interface SendBottomSheetProps {
    onClose: () => void;
    onSendToWallet?: () => void;
    onSendToFriend?: () => void;
    onConfirm?: (address: string) => void;
}

const SendBottomSheet: React.FC<SendBottomSheetProps> = ({
    onClose,
    onSendToWallet,
    onSendToFriend,
    onConfirm
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [walletAddress, setWalletAddress] = useState('');
    const [showWalletForm, setShowWalletForm] = useState(false);

    // Mock recent addresses
    const recentAddresses = [
        { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' },
        { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' },
        { address: 'F4184fc596......0e9', lastUsed: '11 ay önce kullanıldı' }
    ];

    const handleSendToWallet = () => {
        setShowWalletForm(true);
    };

    const handleSendToFriend = () => {
        if (onSendToFriend) {
            onSendToFriend();
        } else {
            console.log('Send to friend');
        }
        onClose();
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(walletAddress);
        } else {
            console.log('Confirm send:', walletAddress);
        }
        onClose();
    };

    const handleAddressSelect = (address: string) => {
        setWalletAddress(address);
    };

    const handleCopyAddress = (address: string) => {
        console.log('Address copied:', address);
        // Clipboard'a kopyalama işlemi
    };

    if (showWalletForm) {
        return (
            <VStack gap="$4" p="$4" flex={1}>
                {/* Başlık */}
                <HStack justifyContent="center" alignItems="center">
                    <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color={isDark ? '$textDark100' : '$textLight900'}
                    >
                        TIPS Gönder
                    </Text>
                </HStack>

                {/* Wallet Address Input */}
                <Box
                    bg={isDark ? '$backgroundDark700' : '#FDFDFD'}
                    borderRadius="$lg"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                    p="$4"
                >
                    <HStack alignItems="center" gap="$3">
                        <Text
                            fontSize={10}
                            fontWeight="$bold"
                            color={isDark ? '$textDark400' : '#7F7F7E'}
                        >
                            To:
                        </Text>
                        <Input flex={1}>
                            <InputField
                                placeholder="Wallet Address..."
                                value={walletAddress}
                                onChangeText={setWalletAddress}
                                fontSize={10}
                                fontWeight="$bold"
                                color={isDark ? '$textDark100' : '$textLight900'}
                                placeholderTextColor={isDark ? '$textDark400' : '#B9B9B9'}
                            />
                        </Input>
                        <Pressable onPress={() => handleCopyAddress(walletAddress)}>
                            <FeatherIcon
                                name="copy"
                                size={16}
                                color={isDark ? '$textDark400' : '#B9B9B9'}
                            />
                        </Pressable>
                    </HStack>
                </Box>

                {/* Recent Addresses */}
                <VStack gap="$2">
                    <Text
                        fontSize={12}
                        fontWeight="$bold"
                        color={isDark ? '$textDark400' : '#B9B9B9'}
                    >
                        Recent
                    </Text>
                    
                    {recentAddresses.map((item, index) => (
                        <Pressable
                            key={index}
                            onPress={() => handleAddressSelect(item.address)}
                            bg={isDark ? '$backgroundDark700' : 'transparent'}
                            borderRadius="$md"
                            p="$3"
                        >
                            <HStack alignItems="center" gap="$3">
                                <FeatherIcon
                                    name="credit-card"
                                    size={20}
                                    color={isDark ? '$textDark400' : '#B9B9B9'}
                                />
                                <VStack flex={1}>
                                    <Text
                                        fontSize={14}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark100' : '$textLight900'}
                                    >
                                        {item.address}
                                    </Text>
                                    <Text
                                        fontSize={9}
                                        color={isDark ? '$textDark400' : '#B9B9B9'}
                                    >
                                        {item.lastUsed}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Pressable>
                    ))}
                </VStack>

                {/* Confirm Button */}
                <Pressable
                    onPress={handleConfirm}
                    bg="#D8FF08"
                    borderRadius="$md"
                    p="$4"
                    alignItems="center"
                    disabled={!walletAddress.trim()}
                    opacity={!walletAddress.trim() ? 0.5 : 1}
                >
                    <Text
                        fontSize={14}
                        fontWeight="$bold"
                        color="#111111"
                    >
                        Confirm
                    </Text>
                </Pressable>
            </VStack>
        );
    }

    return (
        <VStack gap="$4" p="$4">
            {/* Başlık */}
            <HStack justifyContent="center" alignItems="center">
                <Text
                    fontSize={16}
                    fontWeight="$bold"
                    color={isDark ? '$textDark100' : '$textLight900'}
                >
                    TIPS Gönder
                </Text>
            </HStack>

            {/* Seçenekler */}
            <VStack gap="$2">
                {/* Cüzdan Adresine Gönder */}
                <Pressable
                    onPress={handleSendToWallet}
                    bg={isDark ? '$backgroundDark700' : '#FFFFFF'}
                    borderRadius="$lg"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                    p="$4"
                >
                    <HStack alignItems="center" gap="$3">
                        <Box
                            bg={isDark ? '$backgroundDark600' : '#F7F7F7'}
                            borderRadius="$md"
                            width={42}
                            height={42}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <FeatherIcon
                                name="credit-card"
                                size={20}
                                color={isDark ? '$textDark100' : '$textLight900'}
                            />
                        </Box>
                        <VStack flex={1} gap="$1">
                            <Text
                                fontSize={12}
                                fontWeight="$bold"
                                color={isDark ? '$textDark100' : '$textLight900'}
                            >
                                Cüzdan Adresine Gönder
                            </Text>
                            <Text
                                fontSize={9}
                                color={isDark ? '$textDark400' : '#B9B9B9'}
                            >
                                TIPS Yollamak istediğiniz cüzdan adresini yapıştırarak gönderim sağlayın.
                            </Text>
                        </VStack>
                    </HStack>
                </Pressable>

                {/* Arkadaşına Gönder */}
                <Pressable
                    onPress={handleSendToFriend}
                    bg={isDark ? '$backgroundDark700' : '#FFFFFF'}
                    borderRadius="$lg"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                    p="$4"
                >
                    <HStack alignItems="center" gap="$3">
                        <Box
                            bg={isDark ? '$backgroundDark600' : '#F7F7F7'}
                            borderRadius="$md"
                            width={42}
                            height={42}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <FeatherIcon
                                name="users"
                                size={20}
                                color={isDark ? '$textDark100' : '$textLight900'}
                            />
                        </Box>
                        <VStack flex={1} gap="$1">
                            <Text
                                fontSize={12}
                                fontWeight="$bold"
                                color={isDark ? '$textDark100' : '$textLight900'}
                            >
                                Arkadaşına Gönder
                            </Text>
                            <Text
                                fontSize={9}
                                color={isDark ? '$textDark400' : '#B9B9B9'}
                            >
                                TIPS Yollamak istediğiniz arkadaşınızı arkadaş listesinden seçerek gönderim sağlayın.
                            </Text>
                        </VStack>
                    </HStack>
                </Pressable>
            </VStack>
        </VStack>
    );
};

export default SendBottomSheet;
