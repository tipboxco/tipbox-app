import React, { useState } from 'react';
import { ScrollView, Dimensions, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Text, Box, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../navigation';
import { useNFTSellDetail, useBuyNFT } from '../api/hooks';
import { useBottomOffset, toImageSource } from '@/src/utils';
import { useWalletBalance } from '@/src/features/wallet/api/hooks';
import { NFTPurchaseSuccessBottomSheet } from '../components/NFTPurchaseSuccessBottomSheet';
import { SimpleLineChart } from '../components/SimpleLineChart';
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { ContextMenuReanimated } from '@/src/components/PostCards/PostCard/ContextMenuReanimated';
import { useDeleteListing, useUpdateListingPrice } from '../api/hooks';

const { width: screenWidth } = Dimensions.get('window');

// Rarity mapping
const rarityMap: Record<string, { label: string; color: string }> = {
    common: { label: 'Common', color: '$blue500' },
    rare: { label: 'Rare', color: '$purple500' },
    epic: { label: 'Epic', color: '$orange500' },
    legendary: { label: 'Legendary', color: '$yellow500' },
};

const NFTDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<MarketplaceStackParamList>>();
    const route = useRoute();
    const { nftId, mode = 'buy' } = route.params as { nftId: string; mode?: 'view' | 'buy' };
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

    const [footerHeight, setFooterHeight] = useState(100);
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

    // Success bottom sheet state
    const [showSuccessSheet, setShowSuccessSheet] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    // Context menu state
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const contextMenuCloseRef = React.useRef<(() => void) | null>(null);

    // Fetch NFT detail data
    const { data: nftDetail, isLoading, error, refetch } = useNFTSellDetail(nftId);

    // Refetch when screen comes back into focus
    useFocusEffect(
        React.useCallback(() => {
            refetch();
        }, [refetch])
    );

    // Fetch wallet balance
    const { data: walletBalance } = useWalletBalance();

    // Buy NFT mutation
    const buyNFTMutation = useBuyNFT();

    // Delete and update listing mutations
    const deleteListingMutation = useDeleteListing();
    const updatePriceMutation = useUpdateListingPrice();

    // Get current user ID from app store
    const { user } = require('@/src/store/appStore').useAppStore();
    const currentUserId = user?.id;

    // Check if NFT belongs to current user
    const isMyNFT = currentUserId && nftDetail?.ownerUser?.id === currentUserId;

    // Check if user has sufficient balance
    const userBalance = walletBalance?.balance || 0;
    const nftPrice = nftDetail?.price || 0;
    const hasSufficientBalance = userBalance >= nftPrice;

    // Show buy button only if: mode is 'buy' AND it's not my NFT
    const showBuyButton = mode === 'buy' && !isMyNFT;

    // Get active listing ID for edit/delist operations
    const activeListing = nftDetail?.priceHistory?.find(
        item => item.status === 'ACTIVE'
    );
    const activeListingId = activeListing?.id;

    // Handle Edit Price
    const handleEditPrice = React.useCallback(() => {
        contextMenuCloseRef.current?.();
        
        // EditPriceBottomSheet component'ini oluştur
        const EditPriceBottomSheet = () => {
            const [localPrice, setLocalPrice] = React.useState(nftDetail?.price?.toString() || '');

            return (
                <Box bg={isDark ? '$backgroundDark900' : '$white'} pb={20} pt={16} px={20}>
                    <VStack space="lg">
                        <Text fontSize="$xl" fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
                            Edit Price
                        </Text>

                        {/* Current Price */}
                        <VStack space="xs">
                            <Text fontSize="$sm" color={isDark ? '$textDark400' : '#666'}>
                                Current Price
                            </Text>
                            <Text fontSize="$2xl" fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
                                {nftDetail?.price} TIPS
                            </Text>
                        </VStack>

                        {/* New Price Input */}
                        <VStack space="xs">
                            <Text fontSize="$sm" color={isDark ? '$textDark400' : '#666'}>
                                New Price (TIPS)
                            </Text>
                            <TextInput
                                value={localPrice}
                                onChangeText={setLocalPrice}
                                placeholder="Enter new price"
                                placeholderTextColor={isDark ? '#666' : '#999'}
                                keyboardType="numeric"
                                autoFocus
                                style={{
                                    backgroundColor: isDark ? '#1A1A1A' : '#F7F7F7',
                                    color: isDark ? '#FFF' : '#000',
                                    fontSize: 16,
                                    fontWeight: '600',
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: isDark ? '#404040' : '#D1D1D1',
                                }}
                            />
                        </VStack>

                        {/* Gas Fee */}
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text fontSize="$sm" color={isDark ? '$textDark400' : '#666'}>
                                Gas Fee (10%)
                            </Text>
                            <Text fontSize="$sm" fontWeight="$semibold" color={isDark ? '$textDark50' : '#000'}>
                                {localPrice ? (parseFloat(localPrice) * 0.1).toFixed(2) : '0'} TIPS
                            </Text>
                        </HStack>

                        {/* Total */}
                        <Box
                            bg={isDark ? '#1A1A1A' : '#F7F7F7'}
                            p="$4"
                            borderRadius="$lg"
                        >
                            <HStack justifyContent="space-between" alignItems="center">
                                <Text fontSize="$md" fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
                                    You will receive
                                </Text>
                                <Text fontSize="$md" fontWeight="$bold" color={isDark ? '#FFF' : '#000'}>
                                    {localPrice ? (parseFloat(localPrice) * 0.9).toFixed(2) : '0'} TIPS
                                </Text>
                            </HStack>
                        </Box>

                        {/* Buttons */}
                        <HStack space="md" pt="$2">
                            <Pressable
                                flex={1}
                                onPress={() => closeBottomSheet()}
                                bg={isDark ? '#2A2A2A' : '#F7F7F7'}
                                py="$3"
                                borderRadius="$lg"
                                alignItems="center"
                            >
                                <Text fontSize="$md" fontWeight="$semibold" color={isDark ? '$textDark400' : '#666'}>
                                    Cancel
                                </Text>
                            </Pressable>

                            <Pressable
                                flex={1}
                                onPress={() => {
                                    const price = parseFloat(localPrice);

                                    if (!price || price <= 0) {
                                        Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
                                        return;
                                    }

                                    if (!activeListingId) {
                                        Alert.alert('Error', 'Listing ID not found');
                                        return;
                                    }

                                    Alert.alert(
                                        'Confirm Price Update',
                                        `Update price to ${price} TIPS?`,
                                        [
                                            { text: 'No', style: 'cancel' },
                                            {
                                                text: 'Yes',
                                                onPress: () => {
                                                    updatePriceMutation.mutate(
                                                        { listingId: activeListingId, amount: price },
                                                        {
                                                            onSuccess: () => {
                                                                closeBottomSheet();
                                                                setTimeout(() => {
                                                                    Alert.alert('Success', 'Price has been updated successfully!');
                                                                }, 500);
                                                                refetch();
                                                            },
                                                            onError: (error: any) => {
                                                                Alert.alert('Error', error?.message || 'Failed to update price');
                                                            },
                                                        }
                                                    );
                                                },
                                            },
                                        ]
                                    );
                                }}
                                bg="#C2E607"
                                py="$3"
                                borderRadius="$lg"
                                alignItems="center"
                                opacity={!localPrice || parseFloat(localPrice) <= 0 ? 0.5 : 1}
                            >
                                <Text fontSize="$md" fontWeight="$bold" color="#000">
                                    Update Price
                                </Text>
                            </Pressable>
                        </HStack>
                    </VStack>
                </Box>
            );
        };

        // Edit Price bottom sheet'i aç
        setTimeout(() => {
            openBottomSheet(
                <EditPriceBottomSheet />,
                {
                    snapPoints: [600],
                    enableDynamicSizing: false,
                    keyboardBehavior: 'extend',
                }
            );
        }, 400);
    }, [nftDetail?.price, activeListingId, isDark, updatePriceMutation, openBottomSheet, refetch]);

    // Handle Delist NFT
    const handleDelist = React.useCallback(() => {
        contextMenuCloseRef.current?.();
        
        Alert.alert(
            'Delist NFT',
            `Are you sure you want to remove "${nftDetail?.title}" from marketplace?`,
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        if (!activeListingId) {
                            Alert.alert('Error', 'Listing ID not found');
                            return;
                        }

                        deleteListingMutation.mutate(activeListingId, {
                            onSuccess: () => {
                                Alert.alert('Success', 'NFT has been delisted from marketplace');
                                refetch();
                                
                                // Navigate back to MarketPlaceScreen with My Listings tab
                                navigation.goBack();
                                setTimeout(() => {
                                    navigation.navigate('MarketPlaceScreen', { initialTab: 'myListings' });
                                }, 300);
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', error?.message || 'Failed to delist NFT');
                            },
                        });
                    },
                },
            ]
        );
    }, [nftDetail?.title, activeListingId, deleteListingMutation, refetch, navigation]);

    // Handle Buy NFT
    const handleBuyNFT = () => {
        if (!nftDetail) return;

        // Check balance first
        if (!hasSufficientBalance) {
            Alert.alert(
                'Insufficient Balance',
                `You need ${nftDetail.price} TIPS but you only have ${userBalance} TIPS.`,
                [{ text: 'OK', style: 'cancel' }]
            );
            return;
        }

        // Show confirmation modal
        Alert.alert(
            'Confirm Purchase',
            `Are you sure you want to buy "${nftDetail.title}" for ${nftDetail.price} TIPS?`,
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    style: 'default',
                    onPress: () => {
                        // Find the listing ID from priceHistory (active listing)
                        const activeListing = nftDetail.priceHistory?.find(
                            item => item.status === 'ACTIVE'
                        );

                        if (!activeListing) {
                            Alert.alert('Error', 'No active listing found for this NFT');
                            return;
                        }

                        buyNFTMutation.mutate(
                            { listingId: activeListing.id },
                            {
                                onSuccess: (data) => {
                                    // Show success bottom sheet
                                    setSuccessData({
                                        nftId: data.nftId,
                                        nftTitle: nftDetail.title,
                                        nftImage: nftDetail.image,
                                        buyerTransaction: data.buyerTransaction,
                                        sellerTransaction: data.sellerTransaction,
                                        newOwner: data.newOwner,
                                    });
                                    setShowSuccessSheet(true);
                                },
                                onError: (error: any) => {
                                    Alert.alert(
                                        'Error',
                                        error.response?.data?.error?.message || 
                                        error.message || 
                                        'Failed to purchase NFT'
                                    );
                                },
                            }
                        );
                    },
                },
            ]
        );
    };

    // Get rarity display info
    const rarityInfo = rarityMap[nftDetail?.rarity || 'common'] || rarityMap.common;

    // Get NFT image source
    const nftImageSource = nftDetail?.image 
        ? toImageSource(nftDetail.image) 
        : require('@/assets/marketplace/badge.png');

    // Convert priceHistory to chart data format
    const chartData = nftDetail?.priceHistory?.map(item => ({
        date: item.listedAt,
        price: item.price,
    })) || [];

    // Debug: Log chart data
    console.log('📊 Chart Data:', {
        hasPriceHistory: !!nftDetail?.priceHistory,
        priceHistoryLength: nftDetail?.priceHistory?.length || 0,
        chartData,
        hasSalesHistory: chartData.length > 0
    });

    // Sales history - Check if we have data
    const hasSalesHistory = chartData.length > 0;

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <Box flex={1} bg="#FFFFFF">
                    <Header 
                        title="NFT Detail" 
                        showBackButton={true} 
                        onBackPress={() => navigation.goBack()} 
                    />
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !nftDetail) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <Box flex={1} bg="#FFFFFF">
                    <Header 
                        title="NFT Detail" 
                        showBackButton={true} 
                        onBackPress={() => navigation.goBack()} 
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {error?.message || 'Failed to load NFT details'}
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Box flex={1} bg="#FFFFFF">
                <Header 
                    title="NFT Detail" 
                    showBackButton={true} 
                    onBackPress={() => navigation.goBack()}
                    rightAction={
                        isMyNFT ? (
                            <Box position="relative" zIndex={2001}>
                                <ContextMenuReanimated
                                    menuItems={[
                                        {
                                            label: 'Edit Price',
                                            icon: <PencilSquareIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
                                            onPress: handleEditPrice,
                                        },
                                        {
                                            label: 'Delist NFT',
                                            icon: <TrashIcon width={20} height={20} color="#CE4A4A" />,
                                            onPress: handleDelist,
                                            color: '#CE4A4A',
                                        },
                                    ]}
                                    onMenuStateChange={setIsContextMenuOpen}
                                    onCloseRef={(closeFn) => {
                                        contextMenuCloseRef.current = closeFn;
                                    }}
                                >
                                    <EllipsisVerticalIcon width={24} height={24} color={isDark ? '#FFF' : '#000'} />
                                </ContextMenuReanimated>
                            </Box>
                        ) : undefined
                    }
                />
                
                <ScrollView 
                    style={{ flex: 1 }} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: footerHeight + bottomOffset }}
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
                                source={nftImageSource}
                                alt={nftDetail.title || 'NFT Image'}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
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
                                        {nftDetail.viewer}
                                    </Text>
                                    <Box width={16} height={16}>
                                        <Text color="$white" fontSize="$xs">👁</Text>
                                    </Box>
                                </HStack>
                            </Box>
                        </Box>

                        {/* Title and Rarity Badge */}
                        <VStack space="sm">
                            <HStack justifyContent="space-between" alignItems="flex-start">
                                <VStack flex={1} mr="$3">
                                    <Text
                                        fontSize="$md"
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                        numberOfLines={2}
                                    >
                                        {nftDetail.title}
                                    </Text>
                                </VStack>
                                
                                {/* Rarity Badge */}
                                <Box
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                    borderRadius="$full"
                                    px="$2.5"
                                    py="$1"
                                    borderWidth={1}
                                    borderColor={isDark ? '$borderDark600' : '$borderLight300'}
                                >
                                    <HStack space="xs" alignItems="center">
                                        <Box width={6} height={6} bg={rarityInfo.color} borderRadius="$full" />
                                        <Text
                                            fontSize={10}
                                            fontWeight="$semibold"
                                            color={isDark ? '$textDark200' : '$textLight700'}
                                        >
                                            {rarityInfo.label}
                                        </Text>
                                    </HStack>
                                </Box>
                            </HStack>

                            {/* Owner */}
                            <Text
                                fontSize={10}
                                color={isDark ? '$textDark400' : '$textLight600'}
                            >
                                Owner by <Text fontSize={11} fontWeight="$bold" textDecorationLine="underline" color={isDark ? '$textDark200' : '$textLight800'}>{nftDetail.ownerUser.name}</Text>
                            </Text>
                        </VStack>

                        {/* Current Price Card */}
                        <Box
                            bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
                            borderRadius="$xl"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                            p="$3"
                        >
                            {/* Current Price */}
                            <Text
                                fontSize={10}
                                fontWeight="$medium"
                                color={isDark ? '$textDark400' : '$textLight500'}
                                mb="$2"
                            >
                                Current Price
                            </Text>
                            
                            <HStack space="sm" alignItems="center" mb="$2.5">
                                <Box
                                    width={40}
                                    height={40}
                                    bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
                                    borderRadius="$md"
                                />
                                <VStack>
                                    <Text
                                        fontSize="$xl"
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        {nftDetail.price} TIPS
                                    </Text>
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                    >
                                        (${(nftDetail.price * 0.01).toFixed(2)})
                                    </Text>
                                </VStack>
                            </HStack>

                            {/* Suggested Price */}
                            <Box
                                borderTopWidth={1}
                                borderTopColor={isDark ? '$borderDark700' : '$borderLight200'}
                                pt="$2.5"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                    >
                                        Suggested Price
                                    </Text>
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark200' : '$textLight800'}
                                    >
                                        {nftDetail.suggestedPrice} TIPS
                                    </Text>
                                </HStack>
                            </Box>
                        </Box>

                        {/* Info Card - Earn Date and other info */}
                        <Box
                            bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
                            borderRadius="$xl"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                            p="$3"
                        >
                            {/* Earn Date */}
                            <HStack justifyContent="space-between" alignItems="center" pb="$2.5">
                                <Text
                                    fontSize={10}
                                    fontWeight="$medium"
                                    color={isDark ? '$textDark400' : '$textLight600'}
                                >
                                    Earn Date
                                </Text>
                                <Text
                                    fontSize={11}
                                    fontWeight="$bold"
                                    color={isDark ? '$textDark50' : '$textLight900'}
                                >
                                    {new Date(nftDetail.earnDate).toLocaleDateString('en-US', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </Text>
                            </HStack>

                            {/* Rarity */}
                            <Box
                                borderTopWidth={1}
                                borderTopColor={isDark ? '$borderDark700' : '$borderLight200'}
                                pt="$2.5"
                                pb="$2.5"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                    >
                                        Rarity
                                    </Text>
                                    <Text
                                        fontSize={11}
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        {rarityInfo.label}
                                    </Text>
                                </HStack>
                            </Box>

                            {/* Owners */}
                            <Box
                                borderTopWidth={1}
                                borderTopColor={isDark ? '$borderDark700' : '$borderLight200'}
                                pt="$2.5"
                                pb="$2.5"
                            >
                                <HStack justifyContent="space-between" alignItems="center">
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                    >
                                        Owners
                                    </Text>
                                    <Text
                                        fontSize={11}
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    >
                                        {nftDetail.totalOwner}
                                    </Text>
                                </HStack>
                            </Box>

                            {/* Description */}
                            {nftDetail.description && (
                                <Box
                                    borderTopWidth={1}
                                    borderTopColor={isDark ? '$borderDark700' : '$borderLight200'}
                                    pt="$2.5"
                                >
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight600'}
                                        mb="$1.5"
                                    >
                                        Description
                                    </Text>
                                    <Text
                                        fontSize={10}
                                        color={isDark ? '$textDark300' : '$textLight600'}
                                        lineHeight="$sm"
                                    >
                                        {nftDetail.description}
                                    </Text>
                                </Box>
                            )}
                        </Box>

                        {/* Sales History Chart - Only if data exists */}
                        {hasSalesHistory && (
                            <Box
                                bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                                borderRadius="$lg"
                                borderWidth={1}
                                borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                                p="$2.5"
                            >
                                <Text
                                    fontSize={11}
                                    fontWeight="$bold"
                                    color={isDark ? '$textDark50' : '$textLight900'}
                                    mb="$2.5"
                                >
                                    Sales History
                                </Text>
                                
                                <SimpleLineChart
                                    data={chartData}
                                    width={screenWidth - 64}
                                    height={180}
                                    isDark={isDark}
                                />
                            </Box>
                        )}
                        
                        {/* Debug: Show if we have data */}
                        {!hasSalesHistory && (
                            <Box p="$3">
                                <Text fontSize={10} color={isDark ? '$textDark400' : '$textLight600'}>
                                    No sales history available yet
                                </Text>
                            </Box>
                        )}
                    </VStack>
                </ScrollView>

                {/* Sticky Buy Button - Only show if not owned by current user and mode is 'buy' */}
                {showBuyButton && (
                    <Box
                        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                        position="absolute"
                        bottom={bottomOffset}
                        left={0}
                        right={0}
                        bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}
                        p="$3"
                        borderTopWidth={1}
                        borderTopColor={isDark ? '$borderDark800' : '$borderLight200'}
                    >
                        {!hasSufficientBalance && (
                            <Text
                                fontSize={10}
                                color="#CE4A4A"
                                textAlign="center"
                                mb="$2"
                            >
                                Insufficient TIPS balance. You need {nftDetail.price} TIPS.
                            </Text>
                        )}
                        
                        <Pressable
                            onPress={handleBuyNFT}
                            bg={hasSufficientBalance ? '#C2E607' : '#CCCCCC'}
                            borderRadius="$lg"
                            py="$2.5"
                            px="$4"
                            disabled={!hasSufficientBalance || buyNFTMutation.isPending}
                            opacity={(!hasSufficientBalance || buyNFTMutation.isPending) ? 0.5 : 1}
                        >
                            {buyNFTMutation.isPending ? (
                                <ActivityIndicator size="small" color="#596B00" />
                            ) : (
                                <Text
                                    fontSize={12}
                                    fontWeight="$bold"
                                    color={hasSufficientBalance ? '#000000' : '#666666'}
                                    textAlign="center"
                                >
                                    Buy NFT - {nftDetail.price} TIPS
                                </Text>
                            )}
                        </Pressable>
                    </Box>
                )}
            </Box>

            {/* Success Bottom Sheet */}
            {showSuccessSheet && successData && (
                <NFTPurchaseSuccessBottomSheet
                    isVisible={showSuccessSheet}
                    onClose={() => {
                        setShowSuccessSheet(false);
                        navigation.goBack();
                    }}
                    data={successData}
                />
            )}
        </SafeAreaView>
    );
};

export default NFTDetailScreen;
