import React, { useState } from 'react';
import { ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Text, Box, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserNFT } from '@/src/mock/marketplace/NFTList/types';
import { useCreateListing } from '../api/hooks';

const { width: screenWidth } = Dimensions.get('window');

const NFTDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation();
    const route = useRoute();
    const { nftData } = route.params as { nftData: UserNFT };

    const [selectedPrice, setSelectedPrice] = useState(1500);
    const [footerHeight, setFooterHeight] = useState(100);

    // Create Listing mutation
    const createListingMutation = useCreateListing();

    const handleSellNFT = () => {
        // Validate price
        if (selectedPrice <= 0) {
            Alert.alert('Hata', 'Fiyat 0\'dan büyük olmalıdır');
            return;
        }

        // Validate NFT ID
        if (!nftData?.id) {
            Alert.alert('Hata', 'NFT bilgisi bulunamadı');
            return;
        }

        createListingMutation.mutate(
            {
                nftId: nftData.id,
                amount: selectedPrice,
            },
            {
                onSuccess: (data) => {
                    Alert.alert('Başarılı', 'NFT başarıyla satışa koyuldu!', [
                        { text: 'Tamam', onPress: () => navigation.goBack() }
                    ]);
                },
                onError: (error) => {
                    Alert.alert('Hata', error.message || 'NFT satışa koyulurken bir hata oluştu');
                },
            }
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <Box flex={1} bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}>
            <Header 
                title="Set Price" 
                showBackButton={true} 
                onBackPress={() => navigation.goBack()} 
            />
            
            <ScrollView 
                style={{ flex: 1 }} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: footerHeight }}
            >
                <VStack space="md" p="$4">
                    {/* NFT Image */}
                    <Box
                        width="100%"
                        height={358}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark800' : '$borderLight300'}
                        bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                        overflow="hidden"
                    >
                        <Image
                            source={require('@/assets/marketplace/badge.png')}
                            alt={nftData.title}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />

                        {/* View Count */}
                        <Box
                            position="absolute"
                            top="$4"
                            right="$4"
                            bg="rgba(0, 0, 0, 0.7)"
                            borderRadius="$md"
                            px="$4"
                            py="$2"
                        >
                            <HStack space="xs" alignItems="center">
                                <Text color="$white" fontSize="$xs" fontWeight="$bold">
                                    444
                                </Text>
                                <Box width={16} height={16}>
                                    {/* Eye icon placeholder */}
                                    <Text color="$white" fontSize="$xs">👁</Text>
                                </Box>
                            </HStack>
                        </Box>
                    </Box>

                    {/* NFT Info */}
                    <VStack space="sm">
                        <HStack justifyContent="space-between" alignItems="center">
                        <Text
                                    fontSize="$lg"
                                    fontWeight="$bold"
                                    color={isDark ? '$textDark50' : '$textLight900'}
                                >
                                    Everyday Consumer
                                </Text>
                            
                            {/* Rarity Badge */}
                            <Box
                                bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                borderRadius="$md"
                                px="$3"
                                py="$1"
                                borderWidth={1}
                                borderColor={isDark ? '$borderDark600' : '$borderLight300'}
                            >
                                <HStack space="xs" alignItems="center">
                                    <Box width={10} height={10} bg="$blue500" borderRadius="$full" />
                                    <Text
                                        fontSize="$xs"
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark200' : '$textLight700'}
                                    >
                                        Usual
                                    </Text>
                                </HStack>
                            </Box>
                        </HStack>
                    </VStack>

                    {/* Set Your Price Section */}
                    <Box
                        bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                    >
                        <Text
                            fontSize="$xs"
                            fontWeight="$bold"
                            color={isDark ? '$textDark50' : '$textLight900'}
                            mb="$2"
                            px="$3"
                            pt="$3"
                        >
                            Set Your Price
                        </Text>

                        {/* Price Input Box */}
                        <Box
                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                            borderRadius="$sm"
                            mx="$3"
                            mb="$2"
                            p="$2"
                        >
                            <HStack space="md" alignItems="center">
                                <Box
                                    width={34}
                                    height={34}
                                    bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
                                    borderRadius="$sm"
                                />
                                <HStack flex={1} justifyContent="space-between">
                                    <Text
                                        fontSize="$md"
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        1500 TIPS
                                    </Text>
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                    >
                                        = $15 USD
                                    </Text>
                                </HStack>
                            </HStack>
                        </Box>

                        {/* Suggested Price Range */}
                        <HStack justifyContent="space-between" alignItems="center" mb="$3" px="$3">
                            <Text
                                fontSize="$xs"
                                fontWeight="$semibold"
                                color={isDark ? '$textDark400' : '$textLight600'}
                            >
                                Suggested Price Range
                            </Text>
                            <Text
                                fontSize="$xs"
                                fontWeight="$semibold"
                                color={isDark ? '$textDark400' : '$textLight600'}
                            >
                                1850 TIPS
                            </Text>
                        </HStack>

                        {/* Divider Line */}
                        <Box height={1} bg={isDark ? '$borderDark700' : '$borderLight200'} mb="$3"/>

                        {/* Fee Information */}
                        <VStack space="xs" px="$3" pb="$3">
                            <HStack justifyContent="space-between">
                                <Text
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                    color={isDark ? '$textDark400' : '$textLight600'}
                                >
                                    Ağ Ücreti:
                                </Text>
                                <Text
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                    color={isDark ? '$textDark400' : '$textLight600'}
                                >
                                    $0.0130
                                </Text>
                            </HStack>
                            <HStack justifyContent="space-between">
                                <Text
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                    color={isDark ? '$textDark400' : '$textLight600'}
                                >
                                    Satış Sonrası Kazanç:
                                </Text>
                                <Text
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                    color={isDark ? '$textDark200' : '$textLight700'}
                                >
                                    $14.0870
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* Market Price Chart Section */}
                    <Box
                        bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                        borderRadius="$lg"
                        borderWidth={1}
                        borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                    >
                        <Text
                            fontSize="$xs"
                            fontWeight="$bold"
                            color={isDark ? '$textDark50' : '$textLight900'}
                            mb="$3"
                            px="$3"
                            pt="$3"
                        >
                            Ortalama Market Fiyatları
                        </Text>
                        
                        {/* Chart Container */}
                        <Box
                            mx="$3"
                            mb="$3"
                            height={200}
                            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                            borderRadius="$md"
                            overflow="hidden"
                        >
                            <Image
                                source={require('@/assets/marketplace/chart.png')}
                                alt="Market Price Chart"
                                style={{ 
                                    width: '100%', 
                                    height: '100%' 
                                }}
                                resizeMode="cover"
                            />
                        </Box>
                    </Box>

                </VStack>
            </ScrollView>

            {/* Sticky Sell Button */}
            <Box
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}
                p="$4"
            >
                <Pressable
                    onPress={handleSellNFT}
                    bg="$yellow400"
                    borderRadius="$md"
                    py="$3"
                    px="$4"
                >
                    <Text
                        fontSize="$sm"
                        fontWeight="$bold"
                        color="$black"
                        textAlign="center"
                    >
                        Sell NFT
                    </Text>
                </Pressable>
            </Box>
            </Box>
        </SafeAreaView>
    );
};

export default NFTDetailScreen;
