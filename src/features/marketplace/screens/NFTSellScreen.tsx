import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack, HStack, Text, Box, Pressable, Image } from '@gluestack-ui/themed';
import { ScrollView, Alert, ActivityIndicator, TextInput, Dimensions, Keyboard, InputAccessoryView, Platform } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../navigation';
import { useNFTSellInfo, useCreateListing, useDeleteListing, useUpdateListingPrice } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import { NFTListingSuccessBottomSheet } from '../components/NFTListingSuccessBottomSheet';

const { width: screenWidth } = Dimensions.get('window');

// Rarity mapping
const rarityMap: Record<string, { label: string; color: string }> = {
    common: { label: 'Common', color: '$blue500' },
    rare: { label: 'Rare', color: '$purple500' },
    epic: { label: 'Epic', color: '$orange500' },
    legendary: { label: 'Legendary', color: '$yellow500' },
};

export const NFTSellScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<MarketplaceStackParamList>>();
  const route = useRoute();
  const { nftId } = route.params as { nftId: string };

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
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    // Show confirmation modal
    Alert.alert(
      'Confirm Listing',
      `Are you sure you want to list this NFT for ${price} TIPS?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
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
                  Alert.alert(
                    'Error',
                    error.response?.data?.error?.message || 
                    error.message || 
                    'Failed to list NFT for sale'
                  );
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
      Alert.alert('Error', 'No active listing found');
      return;
    }

    Alert.alert(
      'Confirm Delist',
      'Are you sure you want to remove this NFT from sale?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            deleteListingMutation.mutate(listingId, {
              onSuccess: () => {
                Alert.alert('Success', 'NFT removed from marketplace');
                // Refetch NFT info to update listing status
                refetch();
              },
              onError: (error: any) => {
                Alert.alert(
                  'Error',
                  error.response?.data?.error?.message || 
                  error.message || 
                  'Failed to delist NFT'
                );
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
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    if (!listingId) {
      Alert.alert('Error', 'No active listing found');
      return;
    }

    Alert.alert(
      'Confirm Price Update',
      `Update price from ${currentListingPrice} TIPS to ${newPrice} TIPS?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'default',
          onPress: () => {
            updatePriceMutation.mutate(
              { listingId, amount: newPrice },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Price updated successfully');
                  // Refetch NFT info to show new price
                  refetch();
                },
                onError: (error: any) => {
                  Alert.alert(
                    'Error',
                    error.response?.data?.error?.message || 
                    error.message || 
                    'Failed to update price'
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
  const rarityInfo = rarityMap[nftInfo?.rarity?.toLowerCase() || 'common'] || rarityMap.common;

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
                Done
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
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Box flex={1} bg="#FFFFFF">
          <Header 
            title="Sell NFT" 
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
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Box flex={1} bg="#FFFFFF">
          <Header 
            title="Sell NFT" 
            showBackButton={true} 
            onBackPress={() => navigation.goBack()} 
          />
          <Box flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
              {error?.message || 'Failed to load NFT information'}
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
          title="Sell NFT" 
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
                    color={rarityInfo.color}
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
                      Current Price
                    </Text>
                    <HStack space="xs" alignItems="center">
                      <Text
                        fontSize="$md"
                        fontWeight="$bold"
                        color="#C2E607"
                      >
                        {currentListingPrice}
                      </Text>
                      <Text
                        fontSize="$sm"
                        fontWeight="$semibold"
                        color={isDark ? '$textDark300' : '$textLight700'}
                      >
                        TIPS
                      </Text>
                    </HStack>
                  </HStack>
                  
                  <Box height={1} bg={isDark ? '$borderDark700' : '$borderLight200'} />
                  
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '$textDark200' : '$textLight700'}
                  >
                    Update Price
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                    {nftInfo.suggestedPrice} TIPS
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
                    Rarity
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
                    Gas Fee (10%)
                  </Text>
                  <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {gasFee.toFixed(2)} TIPS
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
                    You Will Earn
                  </Text>
                  <Text
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '$textDark50' : '$textLight900'}
                  >
                    {earningsAfterFees > 0 ? earningsAfterFees.toFixed(2) : '0.00'} TIPS
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </ScrollView>

        {/* Footer with Action Buttons */}
        {isListed && (
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
            {/* DELIST AND UPDATE PRICE BUTTONS - When NFT is listed */}
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
                    Update Price - {parseFloat(updatePriceInput || '0') > 0 ? updatePriceInput : '0'} TIPS
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
                    Delist from Marketplace
                  </Text>
                )}
              </Pressable>
            </VStack>
          </Box>
        )}

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
