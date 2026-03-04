import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  ShieldCheckIcon,
  LinkIcon,
  PlusIcon,
} from 'react-native-heroicons/outline';
import { Header } from '@/src/components/Header';
import { WalletService } from '@/src/services/WalletService';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/src/hooks/useTranslation';

export const WalletConnection: React.FC = () => {
    const { t } = useTranslation('wallet');
    const [isConnected, setIsConnected] = useState(false);
    const navigation = useNavigation<any>();

    // Wallet connection durumunu yükle
    useEffect(() => {
        const loadWalletStatus = async () => {
            const status = await WalletService.getWalletConnectionStatus();
            setIsConnected(status);
        };
        loadWalletStatus();
    }, []);

    const handleConnect = async () => {
        await WalletService.setWalletConnectionStatus(true);
        setIsConnected(true);
        // WalletScreen'e yönlendir
        navigation.replace('WalletScreen' as never);
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
            <Header title={t('header.assets')} showBackButton onBackPress={() => navigation.goBack()} />

            {/* Body */}
            <VStack flex={1} px="$4" py="$4" space="lg" alignItems="center" justifyContent="center">
                {/* Illustration placeholder (kept minimal; design uses a circular graphic) */}
                <Box
                    w={220}
                    h={220}
                    rounded="$full"
                    bg="$backgroundLight100"
                    $dark-bg="$backgroundDark800"
                    alignItems="center"
                    justifyContent="center"
                >
                    <ShieldCheckIcon width={64} height={64} color="#9CA3AF" />
                </Box>

                {/* Action buttons block (Create / Connect) */}
                <HStack mt="$6" space="md" flexWrap="wrap" justifyContent="center">
                    <Pressable
                        onPress={handleConnect}
                        bg="$backgroundLight100"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="$borderLight200"
                        $dark-borderColor="$borderDark600"
                        rounded="$lg"
                        px={20}
                        h={40}
                        alignItems="center"
                        justifyContent="center"
                        mb="$2"
                    >
                        <HStack space="xs" alignItems="center">
                            <LinkIcon width={14} height={14} color="#6B7280" />
                            <Text fontSize={12} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                                {t('walletConnection.connectWallet')}
                            </Text>
                        </HStack>
                    </Pressable>

                    <Pressable
                        onPress={() => { }}
                        bg="#E8FF6B"
                        $dark-bg="#E8FF6B"
                        borderWidth={1}
                        borderColor="#D8FF08"
                        rounded="$lg"
                        px={20}
                        h={40}
                        alignItems="center"
                        justifyContent="center"
                        mb="$2"
                    >
                        <HStack space="xs" alignItems="center">
                            <PlusIcon width={14} height={14} color="#000000" />
                            <Text fontSize={12} fontWeight="$bold" color="$black">
                                {t('walletConnection.createWallet')}
                            </Text>
                        </HStack>
                    </Pressable>
                </HStack>
            </VStack>
            </Box>
        </SafeAreaView>
    );
};


