import React, { useState } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { VStack, HStack, Text, Box, Pressable, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useNavigation } from '@react-navigation/native';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import TabsScreen from '../components/TabsScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WalletScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();
    
    // Wallet bağlı olup olmadığını kontrol eden state
    const [isWalletConnected, setIsWalletConnected] = useState(false);

    const handleCreateWallet = () => {
        // Wallet oluşturma işlemi
        console.log('Create Wallet');
    };

    const handleConnectWallet = () => {
        // Wallet bağlama işlemi
        setIsWalletConnected(true);
        console.log('Connect Wallet');
    };

    const handleReceive = () => {
        console.log('Receive');
    };

    const handleSend = () => {
        console.log('Send');
    };

    const handleSwap = () => {
        console.log('Swap');
    };

    const handleClaim = () => {
        console.log('Claim');
    };

    return (
        <Box flex={1} bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}>
            <Header
                title="Varlıklar"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            {!isWalletConnected ? (
                // Bağlı olmayan wallet durumu
                <Box flex={1} justifyContent="center" alignItems="center" px="$6">
                    {/* Merkezi Container */}
                    <VStack 
                        alignItems="center" 
                        gap="$8"
                        width="100%"
                        maxWidth={screenWidth * 0.9}
                    >
                        {/* Görsel Alanı */}
                        <VStack alignItems="center" gap="$6">
                            {/* Büyük Gri Kare Placeholder */}
                            <Box 
                                width={screenWidth * 0.55} 
                                height={screenWidth * 0.55} 
                                bg={isDark ? '$backgroundDark700' : '#F7F7F7'}
                                borderRadius="$lg"
                                justifyContent="center"
                                alignItems="center"
                                borderWidth={1}
                                borderColor={isDark ? '$borderDark600' : '#ECECEC'}
                            >
                                {/* X şeklinde çizgiler */}
                                <Box position="absolute" width="100%" height="100%" justifyContent="center" alignItems="center">
                                    <Box 
                                        width="60%" 
                                        height={2} 
                                        bg={isDark ? '#666' : '#BFBFBF'} 
                                        position="absolute"
                                        transform={[{ rotate: '45deg' }]}
                                    />
                                    <Box 
                                        width="60%" 
                                        height={2} 
                                        bg={isDark ? '#666' : '#BFBFBF'} 
                                        position="absolute"
                                        transform={[{ rotate: '-45deg' }]}
                                    />
                                </Box>
                            </Box>

                            {/* Alt placeholder çubukları */}
                            <VStack gap="$2" alignItems="center">
                                <Box 
                                    width={screenWidth * 0.4} 
                                    height={3} 
                                    bg={isDark ? '$backgroundDark600' : '#ECECEC'}
                                    borderRadius="$sm"
                                />
                                <Box 
                                    width={screenWidth * 0.25} 
                                    height={3} 
                                    bg={isDark ? '$backgroundDark600' : '#ECECEC'}
                                    borderRadius="$sm"
                                />
                            </VStack>
                        </VStack>

                        {/* Butonlar HStack */}
                        <HStack 
                            gap="$4"
                            width="100%"
                            justifyContent="center"
                        >
                            {/* Connect Wallet Butonu (Sol) */}
                            <Pressable
                                onPress={handleConnectWallet}
                                bg={isDark ? '$backgroundDark700' : '#ECECEC'}
                                borderRadius="$xl"
                                borderWidth={1}
                                borderColor={isDark ? '$borderDark600' : '#9F9F9F'}
                                py="$3"
                                px="$5"
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="center"
                                gap="$2"
                                flex={1}
                            >
                                <FeatherIcon 
                                    name="link" 
                                    size={16} 
                                    color={isDark ? '#999' : '#666'} 
                                />
                                <Text 
                                    fontSize="$sm" 
                                    fontWeight="$bold" 
                                    color={isDark ? '$textDark400' : '#666'}
                                >
                                    Connect Wallet
                                </Text>
                            </Pressable>

                            {/* Create Wallet Butonu (Sağ) */}
                            <Pressable
                                onPress={handleCreateWallet}
                                bg="#E8FF6B"
                                borderRadius="$xl"
                                borderWidth={1}
                                borderColor="#D8FF08"
                                py="$3"
                                px="$5"
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="center"
                                gap="$2"
                                flex={1}
                                shadowColor="$black"
                                shadowOffset={{ width: 0, height: 2 }}
                                shadowOpacity={0.1}
                                shadowRadius={4}
                                elevation={2}
                            >
                                <FeatherIcon 
                                    name="plus" 
                                    size={16} 
                                    color="#000" 
                                />
                                <Text 
                                    fontSize="$sm" 
                                    fontWeight="$bold" 
                                    color="#000"
                                >
                                    Create a Wallet
                                </Text>
                            </Pressable>
                        </HStack>
                    </VStack>
                </Box>
            ) : (
                // Bağlı wallet durumu
                <TabsScreen 
                    onReceive={handleReceive}
                    onSend={handleSend}
                    onSwap={handleSwap}
                    onClaim={handleClaim}
                />
            )}
        </Box>
    );
};

export default WalletScreen;
