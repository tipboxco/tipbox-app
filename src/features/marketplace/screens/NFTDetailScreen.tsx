import React, { useState } from 'react';
import { ScrollView, Dimensions, Alert, ActivityIndicator, TextInput, Modal, Pressable as RNPressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Text, Box, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../navigation';
import { useNFTSellDetail, useNFTSellInfo, useBuyNFT } from '../api/hooks';
import { useBottomOffset, toImageSource } from '@/src/utils';
import { useWalletBalance } from '@/src/features/wallet/api/hooks';
import { NFTPurchaseSuccessBottomSheet } from '../components/NFTPurchaseSuccessBottomSheet';
import { SimpleLineChart } from '../components/SimpleLineChart';
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useDeleteListing, useUpdateListingPrice } from '../api/hooks';

const { width: screenWidth } = Dimensions.get('window');

const NFTDetailScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('marketplace');
    const navigation = useNavigation<NativeStackNavigationProp<MarketplaceStackParamList>>();
    const route = useRoute();
    const { nftId, mode = 'buy' } = route.params as { nftId: string; mode?: 'view' | 'buy' };

    const [footerHeight, setFooterHeight] = useState(100);
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

    // Success bottom sheet state
    const [showSuccessSheet, setShowSuccessSheet] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    // Context menu state
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

    // Fetch NFT detail data
    const { data: nftDetail, isLoading, error, refetch } = useNFTSellDetail(nftId);
    // NOTE: sell-info endpoint includes active listing object (id/price/status)
    // We need listing.id (not nft.id) for update/delist calls.
    const { data: nftSellInfo } = useNFTSellInfo(nftId);

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
    const listingIdFromPriceHistory = activeListing?.id;
    const listingIdFromSellInfo = nftSellInfo?.listing?.id;
    const listingIdForActions = listingIdFromSellInfo || listingIdFromPriceHistory;

    const canEditListingPrice = Boolean(isMyNFT && listingIdForActions);
    const [priceDraft, setPriceDraft] = useState('');
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const priceInputRef = React.useRef<TextInput>(null);

    React.useEffect(() => {
        if (!__DEV__) return;
        console.log('[NFTDetailScreen] price-edit state', {
            nftId,
            isMyNFT,
            canEditListingPrice,
            listingIdForActions,
            isEditingPrice,
            currentPrice: nftDetail?.price,
            priceDraft,
        });
    }, [nftId, isMyNFT, canEditListingPrice, listingIdForActions, isEditingPrice, nftDetail?.price, priceDraft]);

    React.useEffect(() => {
        if (!isEditingPrice && nftDetail?.price !== undefined && nftDetail?.price !== null) {
            setPriceDraft(nftDetail.price.toString());
        }
    }, [nftDetail?.price, isEditingPrice]);

    const handleEditPrice = React.useCallback(() => {
        setIsContextMenuOpen(false);

        if (__DEV__) {
            console.log('[NFTDetailScreen] handleEditPrice pressed', {
                nftId,
                isMyNFT,
                listingIdForActions,
                before_isEditingPrice: isEditingPrice,
            });
        }

        if (!isMyNFT) return;

        if (!listingIdForActions) {
            Alert.alert(t('screens.nftDetail.errors.error'), t('screens.nftDetail.alerts.errorNoListing'));
            return;
        }

        setIsEditingPrice(true);
        // focus input after render
        setTimeout(() => {
            if (__DEV__) {
                console.log('[NFTDetailScreen] focusing price input', {
                    hasRef: Boolean(priceInputRef.current),
                });
            }
            priceInputRef.current?.focus();
        }, 50);
    }, [nftId, isMyNFT, listingIdForActions, isEditingPrice]);

    const handleUpdatePriceInline = React.useCallback(() => {
        const price = parseFloat(priceDraft);

        if (!price || price <= 0) {
            Alert.alert(t('screens.nftDetail.alerts.invalidPrice'), t('screens.nftDetail.alerts.invalidPriceMessage'));
            return;
        }

        if (!listingIdForActions) {
            Alert.alert(t('screens.nftDetail.errors.error'), t('screens.nftDetail.alerts.errorNoListing'));
            return;
        }

        Alert.alert(t('screens.nftDetail.alerts.confirmPriceUpdate'), t('screens.nftDetail.alerts.confirmPriceUpdateMessage', { price }), [
            { text: t('screens.nftDetail.alerts.no'), style: 'cancel' },
            {
                text: t('screens.nftDetail.alerts.yes'),
                onPress: () => {
                    updatePriceMutation.mutate(
                        { listingId: listingIdForActions, amount: price },
                        {
                            onSuccess: () => {
                                Alert.alert(t('screens.nftDetail.success.priceUpdated'), t('screens.nftDetail.success.priceUpdatedMessage'));
                                setIsEditingPrice(false);
                                refetch();
                            },
                            onError: (error: any) => {
                                Alert.alert(
                                    t('screens.nftDetail.errors.error'),
                                    error?.response?.data?.error?.message || error?.message || t('screens.nftDetail.errors.updatePriceFailed')
                                );
                            },
                        }
                    );
                },
            },
        ]);
    }, [priceDraft, listingIdForActions, updatePriceMutation, refetch]);

    // Handle Delist NFT
    const handleDelist = React.useCallback(() => {
        setIsContextMenuOpen(false);

        if (__DEV__) {
            console.log('[NFTDetailScreen] handleDelist', {
                nftId,
                mode,
                isMyNFT,
                listingIdFromSellInfo,
                listingIdFromPriceHistory,
                listingIdForActions,
                title: nftDetail?.title,
            });
        }

        Alert.alert(
            t('screens.nftDetail.alerts.confirmDelist'),
            t('screens.nftDetail.alerts.confirmDelistMessage', { title: nftDetail?.title }),
            [
                {
                    text: t('screens.nftDetail.alerts.no'),
                    style: 'cancel',
                },
                {
                    text: t('screens.nftDetail.alerts.yes'),
                    style: 'destructive',
                    onPress: () => {
                        if (!listingIdForActions) {
                            Alert.alert(t('screens.nftDetail.errors.error'), t('screens.nftDetail.alerts.errorNoListingDelist'));
                            return;
                        }

                        if (__DEV__) {
                            console.log('[NFTDetailScreen] deleteListing request', {
                                listingId: listingIdForActions,
                            });
                        }

                        deleteListingMutation.mutate(listingIdForActions, {
                            onSuccess: () => {
                                Alert.alert(t('screens.nftDetail.success.delisted'), t('screens.nftDetail.success.delistedMessage'));
                                refetch();

                                // Navigate back to MarketPlaceScreen with My Listings tab
                                navigation.goBack();
                                setTimeout(() => {
                                    navigation.navigate('MarketPlaceScreen', { initialTab: 'myListings' });
                                }, 300);
                            },
                            onError: (error: any) => {
                                if (__DEV__) {
                                    console.error('[NFTDetailScreen] deleteListing error', {
                                        message: error?.message,
                                        status: error?.response?.status,
                                        data: error?.response?.data,
                                        listingId: listingIdForActions,
                                    });
                                }
                                Alert.alert(
                                    t('screens.nftDetail.errors.error'),
                                    error?.response?.data?.error?.message || error?.message || t('screens.nftDetail.errors.delistFailed')
                                );
                            },
                        });
                    },
                },
            ]
        );
    }, [
        nftId,
        mode,
        isMyNFT,
        listingIdFromSellInfo,
        listingIdFromPriceHistory,
        listingIdForActions,
        nftDetail?.title,
        deleteListingMutation,
        refetch,
        navigation,
    ]);

    // Handle Buy NFT
    const handleBuyNFT = () => {
        if (!nftDetail) return;

        // Check balance first
        if (!hasSufficientBalance) {
            Alert.alert(
                t('screens.nftDetail.alerts.insufficientBalanceTitle'),
                t('screens.nftDetail.alerts.insufficientBalanceMessage', { required: nftDetail.price, available: userBalance }),
                [{ text: t('screens.nftDetail.alerts.ok'), style: 'cancel' }]
            );
            return;
        }

        // Show confirmation modal
        Alert.alert(
            t('screens.nftDetail.alerts.confirmPurchase'),
            t('screens.nftDetail.alerts.confirmPurchaseMessage', { title: nftDetail.title, price: nftDetail.price }),
            [
                {
                    text: t('screens.nftDetail.alerts.no'),
                    style: 'cancel',
                },
                {
                    text: t('screens.nftDetail.alerts.yes'),
                    style: 'default',
                    onPress: () => {
                        // Find the listing ID from priceHistory (active listing)
                        const activeListing = nftDetail.priceHistory?.find(
                            item => item.status === 'ACTIVE'
                        );

                        if (!activeListing) {
                            Alert.alert(t('screens.nftDetail.errors.error'), t('screens.nftDetail.alerts.errorNoActiveListing'));
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
                                        t('screens.nftDetail.errors.error'),
                                        error.response?.data?.error?.message ||
                                        error.message ||
                                        t('screens.nftDetail.errors.purchaseFailed')
                                    );
                                },
                            }
                        );
                    },
                },
            ]
        );
    };

    // Get rarity display info with translation
    const getRarityInfo = (rarity: string) => {
        const rarityKey = rarity.toLowerCase();
        const colorMap: Record<string, string> = {
            common: '$blue500',
            rare: '$purple500',
            epic: '$orange500',
            legendary: '$yellow500',
        };
        return {
            label: t(`screens.nftDetail.rarity.${rarityKey}`),
            color: colorMap[rarityKey] || '$blue500',
        };
    };

    const rarityInfo = getRarityInfo(nftDetail?.rarity || 'common');

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
                        title={t('screens.nftDetail.title')}
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
                        title={t('screens.nftDetail.title')}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {error?.message || t('screens.nftDetail.errors.loadingFailed')}
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
                    title={t('screens.nftDetail.title')}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    rightAction={
                        isMyNFT ? (
                            <Box position="relative" zIndex={2001}>
                                <Pressable
                                    onPress={() => setIsContextMenuOpen(true)}
                                    p="$2"
                                    borderRadius="$full"
                                >
                                    <EllipsisVerticalIcon width={24} height={24} color={isDark ? '#FFF' : '#000'} />
                                </Pressable>
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
                                {t('screens.nftDetail.owner')} <Text fontSize={11} fontWeight="$bold" textDecorationLine="underline" color={isDark ? '$textDark200' : '$textLight800'}>{nftDetail.ownerUser.name}</Text>
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
                            {canEditListingPrice ? (
                                <VStack space="sm" mb="$2.5">
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight500'}
                                    >
                                        {t('screens.nftDetail.currentPrice')}
                                    </Text>

                                    <HStack
                                        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                                        borderRadius="$md"
                                        borderWidth={1}
                                        borderColor={isEditingPrice ? '#C2E607' : (isDark ? '$borderDark600' : '$borderLight300')}
                                        px="$3"
                                        py="$2"
                                        alignItems="center"
                                    >
                                        <TextInput
                                            ref={priceInputRef}
                                            value={priceDraft}
                                            onChangeText={setPriceDraft}
                                            placeholder={t('screens.nftDetail.placeholders.price')}
                                            placeholderTextColor={isDark ? '#666666' : '#AAAAAA'}
                                            keyboardType="decimal-pad"
                                            editable={isEditingPrice}
                                            style={{
                                                flex: 1,
                                                fontSize: 18,
                                                fontWeight: '700',
                                                color: isDark ? '#FFFFFF' : '#000000',
                                                padding: 8,
                                            }}
                                        />
                                        <Text
                                            fontSize="$sm"
                                            fontWeight="$semibold"
                                            color={isDark ? '$textDark300' : '$textLight700'}
                                        >
                                            {t('common.tips')}
                                        </Text>
                                    </HStack>

                                    {!isEditingPrice && (
                                        <Text
                                            fontSize={10}
                                            color={isDark ? '$textDark400' : '$textLight600'}
                                        >
                                            {t('screens.nftDetail.editPriceNote')}
                                        </Text>
                                    )}

                                    <Pressable
                                        onPress={handleUpdatePriceInline}
                                        bg={
                                            isEditingPrice &&
                                            parseFloat(priceDraft || '0') > 0 &&
                                            parseFloat(priceDraft || '0') !== nftDetail.price
                                                ? '#C2E607'
                                                : '#CCCCCC'
                                        }
                                        borderRadius="$lg"
                                        py="$2.5"
                                        disabled={
                                            updatePriceMutation.isPending ||
                                            !isEditingPrice ||
                                            parseFloat(priceDraft || '0') <= 0 ||
                                            parseFloat(priceDraft || '0') === nftDetail.price
                                        }
                                        opacity={
                                            updatePriceMutation.isPending ||
                                            !isEditingPrice ||
                                            parseFloat(priceDraft || '0') <= 0 ||
                                            parseFloat(priceDraft || '0') === nftDetail.price
                                                ? 0.6
                                                : 1
                                        }
                                    >
                                        {updatePriceMutation.isPending ? (
                                            <ActivityIndicator size="small" color="#000000" />
                                        ) : (
                                            <Text
                                                fontSize={12}
                                                fontWeight="$bold"
                                                color="#000000"
                                                textAlign="center"
                                            >
                                                {t('screens.nftDetail.buttons.updatePrice')}
                                            </Text>
                                        )}
                                    </Pressable>

                                    {isEditingPrice && (
                                        <Pressable
                                            onPress={() => setIsEditingPrice(false)}
                                            bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                                            borderRadius="$lg"
                                            py="$2.5"
                                            borderWidth={1}
                                            borderColor={isDark ? '$borderDark600' : '#E0E0E0'}
                                        >
                                            <Text
                                                fontSize={12}
                                                fontWeight="$bold"
                                                color={isDark ? '$textDark200' : '$textLight700'}
                                                textAlign="center"
                                            >
                                                {t('screens.nftDetail.buttons.cancel')}
                                            </Text>
                                        </Pressable>
                                    )}
                                </VStack>
                            ) : (
                                <>
                                    {/* Current Price */}
                                    <Text
                                        fontSize={10}
                                        fontWeight="$medium"
                                        color={isDark ? '$textDark400' : '$textLight500'}
                                        mb="$2"
                                    >
                                        {t('screens.nftDetail.currentPrice')}
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
                                                {nftDetail.price} {t('common.tips')}
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
                                </>
                            )}

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
                                        {t('screens.nftDetail.suggestedPrice')}
                                    </Text>
                                    <Text
                                        fontSize="$sm"
                                        fontWeight="$bold"
                                        color={isDark ? '$textDark200' : '$textLight800'}
                                    >
                                        {nftDetail.suggestedPrice} {t('common.tips')}
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
                                    {t('screens.nftDetail.earnDate')}
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
                                        {t('screens.nftDetail.rarity')}
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
                                        {t('screens.nftDetail.owners')}
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
                                        {t('screens.nftDetail.description')}
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
                                    {t('screens.nftDetail.salesHistory')}
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
                                    {t('screens.nftDetail.noSalesHistory')}
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
                                {t('screens.nftDetail.insufficientBalance', { amount: nftDetail.price })}
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
                                    {t('screens.nftDetail.buttons.buyNFT', { price: nftDetail.price })}
                                </Text>
                            )}
                        </Pressable>
                    </Box>
                )}
            </Box>

            {/* NFT Options Modal (RN Modal) */}
            <Modal
                transparent
                visible={isContextMenuOpen}
                animationType="fade"
                onRequestClose={() => setIsContextMenuOpen(false)}
            >
                <RNPressable style={{ flex: 1 }} onPress={() => setIsContextMenuOpen(false)}>
                    <RNPressable
                        onPress={() => {}}
                        style={{ position: 'absolute', top: 70, right: 16, minWidth: 180 }}
                    >
                        <Box
                            bg={isDark ? '$backgroundDark900' : '$white'}
                            borderRadius="$lg"
                            borderWidth={1}
                            borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                            overflow="hidden"
                        >
                            <Pressable
                                onPress={handleEditPrice}
                                px="$4"
                                py="$3"
                                borderBottomWidth={1}
                                borderBottomColor={isDark ? '$borderDark700' : '$borderLight200'}
                            >
                                <HStack space="sm" alignItems="center">
                                    <PencilSquareIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                    <Text color={isDark ? '$textDark50' : '$textLight900'} fontSize="$sm" fontWeight="$medium">
                                        {t('screens.nftDetail.menu.editPrice')}
                                    </Text>
                                </HStack>
                            </Pressable>

                            <Pressable onPress={handleDelist} px="$4" py="$3">
                                <HStack space="sm" alignItems="center">
                                    <TrashIcon width={20} height={20} color="#CE4A4A" />
                                    <Text color="#CE4A4A" fontSize="$sm" fontWeight="$medium">
                                        {t('screens.nftDetail.menu.delistNFT')}
                                    </Text>
                                </HStack>
                            </Pressable>
                        </Box>
                    </RNPressable>
                </RNPressable>
            </Modal>

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
