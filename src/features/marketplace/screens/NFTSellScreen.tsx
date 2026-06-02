import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Text, Box, Pressable, Image, useToast } from '@gluestack-ui/themed';
import { ScrollView, Alert, ActivityIndicator, TextInput, Dimensions, Keyboard, InputAccessoryView, Platform } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../navigation';
import { useNFTSellInfo, useCreateListing, useDeleteListing, useUpdateListingPrice } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import { NFTListingSuccessBottomSheet } from '../components/NFTListingSuccessBottomSheet';
import { showCustomToast } from '@/src/components/CustomToast';

const { width: screenWidth } = Dimensions.get('window');

export const NFTSellScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('marketplace');
  const navigation = useNavigation<NativeStackNavigationProp<MarketplaceStackParamList>>();
  const route = useRoute();
  const { nftId } = route.params as { nftId: string };
  const toast = useToast();

  // Input accessory view ID for keyboard toolbar
  const inputAccessoryViewID = 'priceInputAccessory';

  // State
  const [priceInput, setPriceInput] = useState('');
  const [updatePriceInput, setUpdatePriceInput] = useState('');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [footerHeight, setFooterHeight] = useState(100);

  // API hooks
  const { data: nftInfo, isLoading, error, refetch } = useNFTSellInfo(nftId);
  const createListingMutation = useCreateListing();
  const deleteListingMutation = useDeleteListing();
  const updatePriceMutation = useUpdateListingPrice();

  // Check if NFT is currently listed
  const isListed = nftInfo?.listing?.status === 'ACTIVE';
  const currentListingPrice = nftInfo?.listing?.price || 0;
  const listingId = nftInfo?.listing?.id;

  // Set suggested price as initial value (only if not listed)
  useEffect(() => {
    if (nftInfo?.suggestedPrice && !isListed) {
      setPriceInput(nftInfo.suggestedPrice.toString());
    }
    // Set current listing price for update input
    if (isListed && currentListingPrice) {
      setUpdatePriceInput(currentListingPrice.toString());
    }
  }, [nftInfo?.suggestedPrice, isListed, currentListingPrice]);

  const handleListForSale = () => {
    const price = parseFloat(priceInput);

    if (!price || price <= 0) {
      showCustomToast(toast, {
        title: t('screens.nftSell.toast.invalidPrice'),
        description: t('screens.nftSell.toast.invalidPriceMessage'),
        action: 'error',
        duration: 3000,
      });
      return;
    }

    // Show confirmation modal
    Alert.alert(
      t('screens.nftSell.alerts.confirmListing'),
      t('screens.nftSell.alerts.confirmListingMessage', { price }),
      [
        { text: t('screens.nftSell.alerts.no'), style: 'cancel' },
        {
          text: t('screens.nftSell.alerts.yes'),
          style: 'default',
          onPress: () => {
            createListingMutation.mutate(
              { nftId, amount: price },
              {
                onSuccess: (data) => {
                  // Show success bottom sheet
                  setSuccessData(data);
                  setShowSuccessSheet(true);
                  // Refetch NFT info to update listing status
                  refetch();
                },
                onError: (error: any) => {
                  showCustomToast(toast, {
                    title: t('screens.nftSell.toast.listingFailed'),
                    description: error.response?.data?.error?.message ||
                      error.message ||
                      t('screens.nftSell.toast.listingFailedMessage'),
                    action: 'error',
                    duration: 3000,
                  });
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleDelist = () => {
    if (!listingId) {
      showCustomToast(toast, {
        title: t('screens.nftSell.toast.noListingFound'),
        description: t('screens.nftSell.toast.noListingFoundMessage'),
        action: 'error',
        duration: 3000,
      });
      return;
    }

    Alert.alert(
      t('screens.nftSell.alerts.confirmDelist'),
      t('screens.nftSell.alerts.confirmDelistMessage'),
      [
        { text: t('screens.nftSell.alerts.no'), style: 'cancel' },
        {
          text: t('screens.nftSell.alerts.yes'),
          style: 'destructive',
          onPress: () => {
            deleteListingMutation.mutate(listingId, {
              onSuccess: () => {
                showCustomToast(toast, {
                  title: t('screens.nftSell.toast.delistSuccess'),
                  description: t('screens.nftSell.toast.delistSuccessMessage'),
                  action: 'success',
                  duration: 3000,
                });
                // Refetch NFT info to update listing status
                refetch();
              },
              onError: (error: any) => {
                showCustomToast(toast, {
                  title: t('screens.nftSell.toast.delistFailed'),
                  description: error.response?.data?.error?.message ||
                    error.message ||
                    t('screens.nftSell.toast.delistFailedMessage'),
                  action: 'error',
                  duration: 3000,
                });
              },
            });
          },
        },
      ]
    );
  };

  const handleUpdatePrice = () => {
    const newPrice = parseFloat(updatePriceInput);

    if (!newPrice || newPrice <= 0) {
      showCustomToast(toast, {
        title: t('screens.nftSell.toast.invalidPrice'),
        description: t('screens.nftSell.toast.invalidPriceMessage'),
        action: 'error',
        duration: 3000,
      });
      return;
    }

    if (!listingId) {
      showCustomToast(toast, {
        title: t('screens.nftSell.toast.noListingFound'),
        description: t('screens.nftSell.toast.noListingFoundMessage'),
        action: 'error',
        duration: 3000,
      });
      return;
    }

    Alert.alert(
      t('screens.nftSell.alerts.confirmPriceUpdate'),
      t('screens.nftSell.alerts.confirmPriceUpdateMessage', { oldPrice: currentListingPrice, newPrice }),
      [
        { text: t('screens.nftSell.alerts.no'), style: 'cancel' },
        {
          text: t('screens.nftSell.alerts.yes'),
          style: 'default',
          onPress: () => {
            updatePriceMutation.mutate(
              { listingId, amount: newPrice },
              {
                onSuccess: () => {
                  showCustomToast(toast, {
                    title: t('screens.nftSell.toast.priceUpdated'),
                    description: t('screens.nftSell.toast.priceUpdatedMessage'),
                    action: 'success',
                    duration: 3000,
                  });
                  // Refetch NFT info to show new price
                  refetch();
                },
                onError: (error: any) => {
                  showCustomToast(toast, {
                    title: t('screens.nftSell.toast.updateFailed'),
                    description: error.response?.data?.error?.message ||
                      error.message ||
                      t('screens.nftSell.toast.updateFailedMessage'),
                    action: 'error',
                    duration: 3000,
                  });
                },
              }
            );
          },
        },
      ]
    );
  };

  // Rarity is not needed in this screen - removed mapping

  // Get NFT image source
  const nftImageSource = nftInfo?.image 
    ? toImageSource(nftInfo.image) 
    : require('@/assets/marketplace/badge.png');

  // Calculate gas fee as 10% of the price
  const priceValue = isListed ? parseFloat(updatePriceInput || '0') : parseFloat(priceInput || '0');
  const gasFee = priceValue * 0.10; // 10% of price
  const earningsAfterFees = priceValue - gasFee;

  // Input Accessory View (Keyboard Toolbar with Done button) - iOS Only
  const renderInputAccessoryView = () => {
    if (Platform.OS !== 'ios') return null;
    
    return (
      <InputAccessoryView nativeID={inputAccessoryViewID}>
        <Box
          bg={isDark ? '#1C1C1E' : '#F2F2F7'}
          borderTopWidth={0.5}
          borderTopColor={isDark ? '#38383A' : '#C6C6C8'}
          px="$4"
          py="$3"
          w="100%"
        >
          <HStack justifyContent="flex-end" alignItems="center" w="100%">
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                fontSize={17}
                fontWeight="$semibold"
                color="#007AFF"
                letterSpacing={-0.4}
              >
                {t('screens.nftSell.buttons.done')}
              </Text>
            </Pressable>
          </HStack>
        </Box>
      </InputAccessoryView>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }}>
        <Box flex={1} bg={isDark ? '#0A0A0A' : '#FFFFFF'}>
          <Header
            title={t('screens.nftSell.title')}
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
  if (error || !nftInfo) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }}>
        <Box flex={1} bg={isDark ? '#0A0A0A' : '#FFFFFF'}>
          <Header
            title={t('screens.nftSell.title')}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
          />
          <Box flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
              {error?.message || t('screens.nftSell.errors.loadingError')}
            </Text>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }}>
      <Box flex={1} bg={isDark ? '#0A0A0A' : '#FFFFFF'}>
        <Header
          title={t('screens.nftSell.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: footerHeight + 20 }}
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
                alt={nftInfo.title || 'NFT Image'}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </Box>

            {/* Title and Rarity */}
            <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="$lg"
                  fontWeight="$bold"
                  color={isDark ? '$textDark50' : '$textLight900'}
                  flex={1}
                >
                  {nftInfo.title || 'NFT'}
                </Text>
                <Box
                  bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
                  borderRadius="$full"
                  px="$3"
                  py="$1"
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                >
                  <Text
                    fontSize="$xs"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    {nftInfo.rarity?.toUpperCase() || 'COMMON'}
                  </Text>
                </Box>
              </HStack>

              {/* Description */}
              {nftInfo.description && (
                <Text
                  fontSize="$sm"
                  color={isDark ? '$textDark400' : '$textLight600'}
                  lineHeight="$md"
                >
                  {nftInfo.description}
                </Text>
              )}
            </VStack>

            {/* Set Price Card or Update Price Card (depending on listing status) */}
            {isListed ? (
              /* UPDATE PRICE CARD - When NFT is already listed */
              <Box
                bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
                borderRadius="$lg"
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                p="$4"
              >
                <VStack space="md">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark200' : '$textLight700'}
                    >
                      {t('screens.nftSell.currentPrice')}
                    </Text>
                    <HStack space="xs" alignItems="center">
                      <Text
                        fontSize="$md"
                        fontWeight="$bold"
                        color="#C2E607"
                      >
                        {Number(currentListingPrice).toFixed(2)}
                      </Text>
                      <Text
                        fontSize="$sm"
                        fontWeight="$semibold"
                        color={isDark ? '$textDark300' : '$textLight700'}
                      >
                        {t('common.tips')}
                      </Text>
                    </HStack>
                  </HStack>
                  
                  <Box height={1} bg={isDark ? '$borderDark700' : '$borderLight200'} />


                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    {t('screens.nftSell.updatePrice')}
                  </Text>
                  
                  {/* Price Input for Update */}
                  <HStack
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                    borderRadius="$md"
                    borderWidth={2}
                    borderColor="#C2E607"
                    px="$3"
                    py="$2"
                    alignItems="center"
                  >
                    <TextInput
                      value={updatePriceInput}
                      onChangeText={setUpdatePriceInput}
                      placeholder={t('screens.nftSell.placeholders.price')}
                      placeholderTextColor={isDark ? '#666666' : '#AAAAAA'}
                      keyboardType="decimal-pad"
                      inputAccessoryViewID={inputAccessoryViewID}
                      style={{
                        flex: 1,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: isDark ? '#FFFFFF' : '#000000',
                        padding: 8,
                      }}
                    />
                    <Text
                      fontSize="$md"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark300' : '$textLight700'}
                    >
                      TIPS
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            ) : (
              /* SET PRICE CARD - When NFT is not listed */
              <Box
                bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
                borderRadius="$lg"
                borderWidth={1}
                borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                p="$4"
              >
                <VStack space="md">
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    Set Price
                  </Text>
                  
                  {/* Price Input */}
                  <HStack
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                    borderRadius="$md"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark600' : '$borderLight300'}
                    px="$3"
                    py="$2"
                    alignItems="center"
                  >
                    <TextInput
                      value={priceInput}
                      onChangeText={setPriceInput}
                      placeholder={t('screens.nftSell.placeholders.price')}
                      placeholderTextColor={isDark ? '#666666' : '#AAAAAA'}
                      keyboardType="decimal-pad"
                      inputAccessoryViewID={inputAccessoryViewID}
                      style={{
                        flex: 1,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: isDark ? '#FFFFFF' : '#000000',
                        padding: 8,
                      }}
                    />
                    <Text
                      fontSize="$md"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark300' : '$textLight700'}
                    >
                      TIPS
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Suggested Price Card */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              borderRadius="$lg"
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
              p="$4"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="$sm"
                  fontWeight="$semibold"
                  color={isDark ? '$textDark200' : '$textLight700'}
                >
                  Suggested Price
                </Text>
                <Pressable onPress={() => setPriceInput(nftInfo.suggestedPrice.toString())}>
                  <Text
                    fontSize="$md"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {Number(nftInfo.suggestedPrice).toFixed(2)} TIPS
                  </Text>
                </Pressable>
              </HStack>
            </Box>

            {/* Info Card */}
            <Box
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              borderRadius="$lg"
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
            >
              <VStack>
                {/* Earn Date */}
                <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    {t('screens.nftSell.rarity')}
                  </Text>
                  <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {nftInfo.rarity || 'Common'}
                  </Text>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* Gas Fee */}
                <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    {t('screens.nftSell.gasFee')}
                  </Text>
                  <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {gasFee.toFixed(2)} {t('common.tips')}
                  </Text>
                </HStack>

                <Box
                  height={1}
                  bg={isDark ? '$borderDark700' : '$borderLight200'}
                />

                {/* You Will Earn */}
                <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    {t('screens.nftSell.youWillEarn')}
                  </Text>
                  <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {earningsAfterFees > 0 ? earningsAfterFees.toFixed(2) : '0.00'} {t('common.tips')}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </ScrollView>

        {/* Footer with Action Buttons */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
          borderTopWidth={1}
          borderTopColor={isDark ? '$borderDark800' : '$borderLight200'}
          px="$4"
          py="$3"
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setFooterHeight(height);
          }}
        >
          {isListed ? (
            /* DELIST AND UPDATE PRICE BUTTONS - When NFT is listed */
            <VStack space="sm">
              {/* Update Price Button */}
              <Pressable
                onPress={handleUpdatePrice}
                bg={parseFloat(updatePriceInput || '0') > 0 ? '#C2E607' : '#CCCCCC'}
                borderRadius="$lg"
                py="$3"
                disabled={
                  parseFloat(updatePriceInput || '0') <= 0 ||
                  updatePriceMutation.isPending ||
                  parseFloat(updatePriceInput || '0') === currentListingPrice
                }
                opacity={
                  parseFloat(updatePriceInput || '0') <= 0 ||
                  updatePriceMutation.isPending ||
                  parseFloat(updatePriceInput || '0') === currentListingPrice
                    ? 0.5
                    : 1
                }
              >
                {updatePriceMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text
                    fontSize="$md"
                    fontWeight="$bold"
                    color={
                      parseFloat(updatePriceInput || '0') > 0 &&
                      parseFloat(updatePriceInput || '0') !== currentListingPrice
                        ? '#000000'
                        : '#666666'
                    }
                    textAlign="center"
                  >
                    {t('screens.nftSell.buttons.updatePriceButton', { price: parseFloat(updatePriceInput || '0') > 0 ? updatePriceInput : '0' })}
                  </Text>
                )}
              </Pressable>

              {/* Delist Button */}
              <Pressable
                onPress={handleDelist}
                bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                borderRadius="$lg"
                py="$3"
                borderWidth={1}
                borderColor={isDark ? '$borderDark600' : '#E0E0E0'}
                disabled={deleteListingMutation.isPending}
                opacity={deleteListingMutation.isPending ? 0.5 : 1}
              >
                {deleteListingMutation.isPending ? (
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                ) : (
                  <Text
                    fontSize="$md"
                    fontWeight="$bold"
                    color="#CE4A4A"
                    textAlign="center"
                  >
                    {t('screens.nftSell.buttons.delist')}
                  </Text>
                )}
              </Pressable>
            </VStack>
          ) : (
            /* LIST FOR SALE BUTTON - When NFT is not listed */
            <Pressable
              onPress={handleListForSale}
              bg={parseFloat(priceInput || '0') > 0 ? '#C2E607' : '#CCCCCC'}
              borderRadius="$lg"
              py="$3"
              disabled={parseFloat(priceInput || '0') <= 0 || createListingMutation.isPending}
              opacity={parseFloat(priceInput || '0') <= 0 || createListingMutation.isPending ? 0.5 : 1}
            >
              {createListingMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text
                  fontSize="$md"
                  fontWeight="$bold"
                  color={parseFloat(priceInput || '0') > 0 ? '#000000' : '#666666'}
                  textAlign="center"
                >
                  {t('screens.nftSell.buttons.sell', { price: parseFloat(priceInput || '0') > 0 ? priceInput : '0' })}
                </Text>
              )}
            </Pressable>
          )}
        </Box>

        {/* Success Bottom Sheet */}
        {showSuccessSheet && successData && (
          <NFTListingSuccessBottomSheet
            isVisible={showSuccessSheet}
            onClose={() => {
              setShowSuccessSheet(false);
              // Close SelectNFTScreen and go back to MarketPlaceScreen
              // Use reset to clear stack and set initialTab
              navigation.reset({
                index: 0,
                routes: [{ name: 'MarketPlaceScreen', params: { initialTab: 'myListings' } }],
              });
            }}
            onViewListing={(nftId) => {
              setShowSuccessSheet(false);
              // Close SelectNFTScreen and go back to MarketPlaceScreen with My Listings tab
              navigation.reset({
                index: 0,
                routes: [{ name: 'MarketPlaceScreen', params: { initialTab: 'myListings' } }],
              });
            }}
            data={successData}
          />
        )}

        {/* Input Accessory View (Done button for iOS keyboard) */}
        {renderInputAccessoryView()}
      </Box>
    </SafeAreaView>
  );
};

export default NFTSellScreen;
