import React, { useCallback, useState } from 'react';
import { VStack, HStack, Text, Pressable, Input, InputField, Box } from '@gluestack-ui/themed';
import { Alert, TextInput, Keyboard, InputAccessoryView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { PencilSquareIcon, TrashIcon } from 'react-native-heroicons/outline';
import { useDeleteListing, useUpdateListingPrice } from '../../api/hooks';

interface NFTOptionsMenuProps {
  nftId: string;
  listingId?: string;
  currentPrice?: number;
  nftTitle?: string;
  onSuccess?: (action?: 'delist' | 'updatePrice') => void;
}

export const NFTOptionsMenu: React.FC<NFTOptionsMenuProps> = ({
  nftId,
  listingId,
  currentPrice,
  nftTitle,
  onSuccess,
}) => {
  const { t } = useTranslation('marketplace');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { closeBottomSheet, openBottomSheet } = useGlobalBottomSheet();

  const deleteListingMutation = useDeleteListing();
  const updatePriceMutation = useUpdateListingPrice();

  const inputAccessoryViewID = 'nftPriceInputAccessory';

  const handleDelist = useCallback(() => {
    closeBottomSheet();

    Alert.alert(
      t('nftOptions.delist.title'),
      t('nftOptions.delist.message', { nftTitle }),
      [
        {
          text: t('nftOptions.buttons.no'),
          style: 'cancel',
        },
        {
          text: t('nftOptions.buttons.yes'),
          style: 'destructive',
          onPress: () => {
            if (!listingId) {
              Alert.alert(t('common.error'), t('nftOptions.delist.listingNotFound'));
              return;
            }

            deleteListingMutation.mutate(listingId, {
              onSuccess: () => {
                Alert.alert(t('common.success'), t('nftOptions.delist.success'));
                onSuccess?.('delist');
              },
              onError: (error: any) => {
                Alert.alert(t('common.error'), error?.message || t('nftOptions.delist.failed'));
              },
            });
          },
        },
      ]
    );
  }, [t, nftTitle, listingId, closeBottomSheet, deleteListingMutation, onSuccess]);

  const handleEditPrice = useCallback(() => {
    closeBottomSheet();
    
    // EditPriceBottomSheet component'ini oluştur
    const EditPriceBottomSheet = () => {
      const [localPrice, setLocalPrice] = useState(currentPrice?.toString() || '');

      return (
        <Box bg={isDark ? '$backgroundDark900' : '$white'} pb={20} pt={16} px={20}>
          <VStack space="lg">
            <Text fontSize="$xl" fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
              {t('nftOptions.editPrice.title')}
            </Text>

            {/* Current Price */}
            <VStack space="xs">
              <Text fontSize="$sm" color={isDark ? '$textDark400' : '#666'}>
                {t('nftOptions.editPrice.currentPrice')}
              </Text>
              <Text fontSize="$2xl" fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
                {currentPrice} {t('common.tips')}
              </Text>
            </VStack>

            {/* New Price Input */}
            <VStack space="xs">
              <Text fontSize="$sm" color={isDark ? '$textDark400' : '#666'}>
                {t('nftOptions.editPrice.newPrice')}
              </Text>
              <TextInput
                value={localPrice}
                onChangeText={setLocalPrice}
                placeholder={t('nftOptions.editPrice.placeholder')}
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
                inputAccessoryViewID={inputAccessoryViewID}
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
                {t('nftOptions.editPrice.gasFee')}
              </Text>
              <Text fontSize="$sm" fontWeight="$semibold" color={isDark ? '$textDark50' : '#000'}>
                {localPrice ? (parseFloat(localPrice) * 0.1).toFixed(2) : '0'} {t('common.tips')}
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
                  {t('nftOptions.editPrice.youWillReceive')}
                </Text>
                <Text fontSize="$md" fontWeight="$bold" color={isDark ? '#FFF' : '#000'}>
                  {localPrice ? (parseFloat(localPrice) * 0.9).toFixed(2) : '0'} {t('common.tips')}
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
                  {t('nftOptions.buttons.cancel')}
                </Text>
              </Pressable>

              <Pressable
                flex={1}
                onPress={() => {
                  const price = parseFloat(localPrice);

                  if (!price || price <= 0) {
                    Alert.alert(t('nftOptions.editPrice.invalidPrice'), t('nftOptions.editPrice.invalidPriceMessage'));
                    return;
                  }

                  if (!listingId) {
                    Alert.alert(t('common.error'), t('nftOptions.delist.listingNotFound'));
                    return;
                  }

                  Alert.alert(
                    t('nftOptions.editPrice.confirmTitle'),
                    t('nftOptions.editPrice.confirmMessage', { price }),
                    [
                      { text: t('nftOptions.buttons.no'), style: 'cancel' },
                      {
                        text: t('nftOptions.buttons.yes'),
                        onPress: () => {
                          console.log('[NFTOptionsMenu] Updating price:', { listingId, amount: price });

                          updatePriceMutation.mutate(
                            { listingId, amount: price },
                            {
                              onSuccess: (data) => {
                                console.log('[NFTOptionsMenu] ✅ Price updated successfully:', data);

                                // Önce bottom sheet'i kapat
                                closeBottomSheet();

                                // Sonra success mesajını göster (setTimeout ile bottom sheet kapandıktan sonra)
                                setTimeout(() => {
                                  Alert.alert(t('common.success'), t('nftOptions.editPrice.success'));
                                }, 500);

                                // Parent component'i bilgilendir (NFT detail refetch için)
                                onSuccess?.('updatePrice');
                              },
                              onError: (error: any) => {
                                console.error('[NFTOptionsMenu] ❌ Failed to update price:', error);

                                // Error durumunda bottom sheet'i kapatma, sadece mesajı göster
                                Alert.alert(t('common.error'), error?.message || t('nftOptions.editPrice.failed'));
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
                  {t('nftOptions.buttons.updatePrice')}
                </Text>
              </Pressable>
            </HStack>
          </VStack>

          {/* iOS Keyboard Accessory View */}
          {Platform.OS === 'ios' && (
            <InputAccessoryView nativeID={inputAccessoryViewID}>
              <Box bg={isDark ? '#1A1A1A' : '#F7F7F7'} px={20} py={10}>
                <Pressable onPress={() => Keyboard.dismiss()}>
                  <HStack justifyContent="flex-end">
                    <Text fontSize="$md" fontWeight="$semibold" color={isDark ? '#FFF' : '#000'}>
                      {t('nftOptions.menu.done')}
                    </Text>
                  </HStack>
                </Pressable>
              </Box>
            </InputAccessoryView>
          )}
        </Box>
      );
    };

    // NFTOptionsMenu bottom sheet'i kapandıktan sonra Edit Price bottom sheet'i aç
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
  }, [closeBottomSheet, openBottomSheet, isDark, currentPrice, listingId, updatePriceMutation, onSuccess, inputAccessoryViewID]);

  return (
    <VStack 
      bg={isDark ? '$backgroundDark900' : '$white'} 
      pb={20}
      pt={8}
      minHeight={120}
    >
      {/* Edit Price */}
      <Pressable
        onPress={handleEditPrice}
        px={20}
        py={16}
        borderBottomWidth={1}
        borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
      >
        <HStack alignItems="center" space="md">
          <PencilSquareIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />
          <Text
            color={isDark ? '$textDark50' : '#000'}
            fontSize="$md"
            fontWeight="$medium"
          >
            {t('nftOptions.editPrice.title')}
          </Text>
        </HStack>
      </Pressable>

      {/* Delist NFT */}
      <Pressable
        onPress={handleDelist}
        px={20}
        py={16}
      >
        <HStack alignItems="center" space="md">
          <TrashIcon width={20} height={20} color="#CE4A4A" />
          <Text
            color="#CE4A4A"
            fontSize="$md"
            fontWeight="$medium"
          >
            {t('nftOptions.menu.delist')}
          </Text>
        </HStack>
      </Pressable>
    </VStack>
  );
};
