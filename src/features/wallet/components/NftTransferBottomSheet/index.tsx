import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import {
  Box,
  HStack,
  Image,
  Input,
  InputField,
  Pressable,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { ChevronLeftIcon, MagnifyingGlassIcon, UsersIcon } from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAppStore } from '@/src/store/appStore';
import { useTrustList } from '@/src/features/profile/api/hooks';
import { DEFAULT_USER_AVATAR, toImageSource } from '@/src/utils';
import type { TrustUser } from '@/src/features/profile/types';
import type { NftTransferRecipientSnapshot } from '@/src/features/wallet/store/nft-transfer-flow-store';
import { useNftTransferFlowStore } from '@/src/features/wallet/store/nft-transfer-flow-store';
import { useNftTransfer } from '@/src/features/wallet/api/hooks';
import { deleteListing } from '@/src/features/marketplace/api/marketplaceApi';

export interface NftTransferBottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface NftTransferBottomSheetProps {
  onRecipientSelected?: (recipient: NftTransferRecipientSnapshot) => void;
  onClose?: () => void;
}

export const NftTransferBottomSheet = forwardRef<NftTransferBottomSheetHandle, NftTransferBottomSheetProps>(
  ({ onRecipientSelected, onClose }, ref) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const insets = useSafeAreaInsets();

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(
      ref,
      () => ({
        present: () => bottomSheetRef.current?.present(),
        dismiss: () => bottomSheetRef.current?.dismiss(),
      }),
      []
    );

    const snapPoints = useMemo(() => ['70%'], []);

    const user = useAppStore((s) => s.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected, setSelected] = useState<NftTransferRecipientSnapshot | null>(null);

    // IMPORTANT: Avoid returning a new object from Zustand selector (can trigger
    // "getSnapshot should be cached" + maximum update depth exceeded).
    const nftId = useNftTransferFlowStore((s) => s.nftId);
    const listingId = useNftTransferFlowStore((s) => s.listingId);
    const listingStatus = useNftTransferFlowStore((s) => s.listingStatus);

    const { mutate: transferNft, isPending: isTransferPending } = useNftTransfer();

    // ✅ Transfer sadece Trust List'e yapılacak
    const { data: trustList, isLoading, error } = useTrustList(user?.id, searchQuery);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.5} />
      ),
      []
    );

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.dismiss();
      onClose?.();
    }, [onClose]);

    const bottomOffset = insets.bottom + 30;
    const buttonHeight = 48;
    const listBottomPadding = bottomOffset + buttonHeight + 24;

    const handleSelect = useCallback(
      (t: TrustUser) => {
        const recipient: NftTransferRecipientSnapshot = {
          id: String(t.id),
          name: String(t.name || ''),
          userName: t.userName ? String(t.userName) : undefined,
          avatar: t.avatar,
        };
        setSelected(recipient);
        onRecipientSelected?.(recipient);
      },
      [onRecipientSelected]
    );

    const runTransfer = useCallback(async () => {
      if (!selected || !nftId) return;

      // Eğer NFT ACTIVE listing'deyse önce delist et
      if (listingId && listingStatus === 'ACTIVE') {
        await deleteListing(listingId);
      }

      return new Promise<void>((resolve, reject) => {
        transferNft(
          {
            nftId,
            recipientId: selected.id,
          },
          {
            onSuccess: () => {
              Alert.alert('Başarılı', 'NFT transferi tamamlandı.');
              bottomSheetRef.current?.dismiss();
              resolve();
            },
            onError: (err: any) => {
              const msg = err?.response?.data?.message || err?.message || 'NFT transferi sırasında hata oluştu.';
              Alert.alert('Hata', msg);
              reject(err);
            },
          }
        );
      });
    }, [listingId, listingStatus, nftId, selected, transferNft]);

    const handleConfirmPress = useCallback(() => {
      if (!selected) return;
      if (!nftId) {
        Alert.alert('Hata', 'NFT seçimi bulunamadı. Lütfen tekrar deneyin.');
        return;
      }

      Alert.alert(
        'NFT Transfer',
        `${selected.name} kullanıcısına transfer etmek istiyor musunuz?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              // fire-and-forget; error/success handled inside
              void runTransfer();
            },
          },
        ]
      );
    }, [nftId, runTransfer, selected]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        // "Drawable / draggable olmasın" -> pan-down kapalı, handle gizli
        enablePanDownToClose={false}
        enableHandlePanningGesture={false}
        handleComponent={() => null}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
        }}
        onDismiss={() => {
          // State reset: her açılışta temiz başlasın
          setSearchQuery('');
          setSelected(null);
          onClose?.();
        }}
      >
        <Box flex={1} px="$4" pt="$4" position="relative">
          {/* Header */}
          <HStack alignItems="center" space="md" mb="$3">
            <Pressable onPress={handleClose}>
              <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <HStack flex={1} justifyContent="center" alignItems="center">
              <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                NFT Transfer
              </Text>
            </HStack>
            <Box w={24} />
          </HStack>

          {/* Search */}
          <HStack
            alignItems="center"
            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
            borderWidth={1}
            borderColor="#E9E9E9"
            borderRadius={23}
            px={12}
            space="sm"
            mb="$3"
          >
            <MagnifyingGlassIcon width={22} height={22} color="#8E8E93" />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Trust list içinde ara"
                placeholderTextColor="#B9B9B9"
                color={isDark ? '#fff' : '#000'}
                fontSize={11}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>

          {/* List */}
          {/* 
            CRITICAL: BottomSheetModal içindeki scrollable her zaman render edilmeli,
            aksi halde "Couldn't find the scrollable node handle id!" uyarısı + crash oluşabiliyor.
          */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: listBottomPadding }}
          >
            {isLoading ? (
              <VStack alignItems="center" justifyContent="center" py="$8">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  Trust list yükleniyor...
                </Text>
              </VStack>
            ) : error ? (
              <VStack alignItems="center" justifyContent="center" py="$8">
                <Text fontSize={14} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  Trust list alınamadı
                </Text>
                <Text mt="$2" fontSize={12} color="$textLight500" $dark-color="$textDark400" textAlign="center">
                  Lütfen daha sonra tekrar deneyin.
                </Text>
              </VStack>
            ) : !trustList || trustList.length === 0 ? (
              <VStack alignItems="center" justifyContent="center" py="$8">
                <UsersIcon width={56} height={56} color={isDark ? '#666666' : '#CCCCCC'} />
                <Text mt="$4" fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                  Trust listeniz boş
                </Text>
              </VStack>
            ) : (
              <VStack space="xs">
                {trustList.map((item: TrustUser) => {
                  const isSelected = selected?.id === String(item.id);
                  return (
                    <Pressable key={String(item.id)} onPress={() => handleSelect(item)}>
                      <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        py={12}
                        px={16}
                        borderBottomWidth={1}
                        borderBottomColor={isDark ? '#333' : '#E9E9E9'}
                        bg={isSelected ? (isDark ? '#2A2A2A' : '#F3F3F3') : 'transparent'}
                        rounded={10}
                      >
                        <HStack alignItems="center" space="md" flex={1}>
                          <Box position="relative">
                            <Box
                              width={54}
                              height={54}
                              borderRadius={100}
                              bg="#CE4A4A"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Box width={50} height={50} borderRadius={23} overflow="hidden">
                                <Image
                                  source={toImageSource(item.avatar) || DEFAULT_USER_AVATAR}
                                  alt={String(item.name || 'User')}
                                  width={50}
                                  height={50}
                                  resizeMode="cover"
                                />
                              </Box>
                            </Box>
                          </Box>

                          <VStack space="xs" flex={1}>
                            <Text
                              color={isDark ? '#fff' : '#000'}
                              fontSize={12}
                              fontWeight="$semibold"
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text color="#8C8C8C" fontSize={10} numberOfLines={1} lineHeight={12}>
                              @{item.userName || ''}
                            </Text>
                            {!!item.titles?.[0] && (
                              <Text color="#B9B9B9" fontSize={9} numberOfLines={1} lineHeight={11}>
                                {item.titles[0]}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            )}
          </BottomSheetScrollView>

          {/* Fixed Transfer Button */}
          <Box position="absolute" left={0} right={0} px="$4" bottom={bottomOffset}>
            <Pressable
              onPress={handleConfirmPress}
              bg={selected && !isTransferPending ? '#D8FF08' : '#EDEDEC'}
              $dark-bg={selected && !isTransferPending ? '#D8FF08' : '#2C2C2C'}
              rounded={10}
              h={buttonHeight}
              alignItems="center"
              justifyContent="center"
              borderWidth={selected ? 0 : 1}
              borderColor={selected ? 'transparent' : '#B1B1B1'}
              opacity={selected && !isTransferPending ? 1 : 0.6}
              disabled={!selected || isTransferPending}
            >
              {isTransferPending ? (
                <HStack alignItems="center" space="sm">
                  <ActivityIndicator size="small" color="#111111" />
                  <Text fontSize={14} fontWeight="$bold" color="#111111">
                    Transfer...
                  </Text>
                </HStack>
              ) : (
                <Text fontSize={14} fontWeight="$bold" color={selected ? '#111111' : '#B1B1B1'} $dark-color={selected ? '#111111' : '#777777'}>
                  Transfer
                </Text>
              )}
            </Pressable>
          </Box>
        </Box>
      </BottomSheetModal>
    );
  }
);

NftTransferBottomSheet.displayName = 'NftTransferBottomSheet';

