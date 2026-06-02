import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, HStack, Image, Input, InputField, Pressable, Text, VStack, useToast } from '@gluestack-ui/themed';
import { ChevronLeftIcon, MagnifyingGlassIcon, UsersIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAppStore } from '@/src/store/appStore';
import { useTrustList } from '@/src/features/profile/api/hooks';
import type { TrustUser } from '@/src/features/profile/types';
import { DEFAULT_USER_AVATAR, toImageSource } from '@/src/utils';
import { useNftTransferFlowStore } from '@/src/features/wallet/store/nft-transfer-flow-store';
import { useNftTransfer } from '@/src/features/wallet/api/hooks';
import { deleteListing } from '@/src/features/marketplace/api/marketplaceApi';
import { showCustomToast } from '@/src/components/CustomToast';

export const NftTransferScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { t } = useTranslation('wallet');

  const user = useAppStore((s) => s.user);

  const nftId = useNftTransferFlowStore((s) => s.nftId);
  const listingId = useNftTransferFlowStore((s) => s.listingId);
  const listingStatus = useNftTransferFlowStore((s) => s.listingStatus);
  const recipient = useNftTransferFlowStore((s) => s.recipient);
  const setRecipient = useNftTransferFlowStore((s) => s.setRecipient);
  const clearFlow = useNftTransferFlowStore((s) => s.clear);

  const [searchQuery, setSearchQuery] = useState('');
  const { data: trustList, isLoading, error } = useTrustList(user?.id, searchQuery);

  const { mutateAsync: transferNft, isPending: isTransferPending } = useNftTransfer();

  const bottomOffset = insets.bottom + 30;
  const buttonHeight = 48;
  const listBottomPadding = bottomOffset + buttonHeight + 24;

  const selectedId = recipient?.id;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelect = useCallback(
    (t: TrustUser) => {
      setRecipient({
        id: String(t.id),
        name: String(t.name || ''),
        userName: t.userName ? String(t.userName) : undefined,
        avatar: t.avatar,
      });
    },
    [setRecipient]
  );

  const runTransfer = useCallback(async () => {
    if (!nftId || !recipient?.id) return;

    // ACTIVE listing varsa önce delist
    if (listingId && listingStatus === 'ACTIVE') {
      await deleteListing(listingId);
    }

    await transferNft({
      nftId,
      recipientId: recipient.id,
    });

    showCustomToast(toast, {
      title: t('nftTransfer.toasts.success'),
      description: t('nftTransfer.toasts.successMessage'),
      action: 'success',
      duration: 3000,
    });
    clearFlow();
    navigation.goBack();
  }, [clearFlow, listingId, listingStatus, navigation, nftId, recipient?.id, transferNft, toast]);

  const handleTransferPress = useCallback(() => {
    if (!nftId) {
      showCustomToast(toast, {
        title: t('nftTransfer.toasts.nftNotFound'),
        description: t('nftTransfer.toasts.nftNotFoundMessage'),
        action: 'error',
        duration: 3000,
      });
      return;
    }
    if (!recipient?.id) return;

    Alert.alert(
      t('nftTransfer.confirmDialog.title'),
      t('nftTransfer.confirmDialog.message', { name: recipient.name }),
      [
        { text: t('nftTransfer.confirmDialog.no'), style: 'cancel' },
        {
          text: t('nftTransfer.confirmDialog.yes'),
          style: 'destructive',
          onPress: () => {
            void runTransfer().catch((err: any) => {
              const msg = err?.response?.data?.message || err?.message || t('nftTransfer.toasts.failed');
              showCustomToast(toast, {
                title: t('nftTransfer.toasts.failed'),
                description: msg,
                action: 'error',
                duration: 3000,
              });
            });
          },
        },
      ]
    );
  }, [nftId, recipient?.id, recipient?.name, runTransfer, toast]);

  const listContent = useMemo(() => {
    if (isLoading) {
      return (
        <VStack alignItems="center" justifyContent="center" py="$8">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
            {t('nftTransfer.loading')}
          </Text>
        </VStack>
      );
    }

    if (error) {
      return (
        <VStack alignItems="center" justifyContent="center" py="$8">
          <Text fontSize={14} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {t('nftTransfer.loadFailed')}
          </Text>
          <Text mt="$2" fontSize={12} color="$textLight500" $dark-color="$textDark400" textAlign="center">
            {t('nftTransfer.tryAgain')}
          </Text>
        </VStack>
      );
    }

    if (!trustList || trustList.length === 0) {
      return (
        <VStack alignItems="center" justifyContent="center" py="$8">
          <UsersIcon width={56} height={56} color={isDark ? '#666666' : '#CCCCCC'} />
          <Text mt="$4" fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
            {t('nftTransfer.emptyList')}
          </Text>
        </VStack>
      );
    }

    return (
      <VStack space="xs" alignItems="stretch" w="100%">
        {trustList.map((item: TrustUser) => {
          const isSelected = selectedId === String(item.id);
          return (
            <Pressable key={String(item.id)} onPress={() => handleSelect(item)} w="100%">
              <HStack
                alignItems="center"
                justifyContent="flex-start"
                py={12}
                px={12}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
                bg={isSelected ? (isDark ? '#2A2A2A' : '#F3F3F3') : 'transparent'}
                rounded={10}
                w="100%"
              >
                <HStack alignItems="center" space="md" flex={1} w="100%">
                  <Box position="relative">
                    <Box
                      width={54}
                      height={54}
                      borderRadius={100}
                      bg="$backgroundLight200"
                      $dark-bg="$backgroundDark700"
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

                  <VStack space="xs" flex={1} w="100%">
                    <Text color={isDark ? '#fff' : '#000'} fontSize={12} fontWeight="$semibold" numberOfLines={1}>
                      {item.name || '—'}
                    </Text>
                    <Text color="#8C8C8C" fontSize={10} numberOfLines={1} lineHeight={12}>
                      {item.userName ? `@${item.userName}` : ''}
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
    );
  }, [error, handleSelect, isDark, isLoading, selectedId, trustList]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950" position="relative">
        {/* Header */}
        <HStack alignItems="center" space="md" px="$4" pt="$4" pb="$3">
          <Pressable onPress={handleBack}>
            <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
          <HStack flex={1} justifyContent="center" alignItems="center">
            <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
              {t('nftTransfer.title')}
            </Text>
          </HStack>
          <Box w={24} />
        </HStack>

        {/* Search */}
        <HStack
          mx="$4"
          alignItems="center"
          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          borderRadius={23}
          px={12}
          space="sm"
          mb="$3"
        >
          <MagnifyingGlassIcon width={22} height={22} color="#8E8E93" />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder={t('nftTransfer.searchPlaceholder')}
              placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
              color={isDark ? '#fff' : '#000'}
              fontSize={11}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>

        {/* Scrollable List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: listBottomPadding }}
        >
          {listContent}
        </ScrollView>

        {/* Fixed Transfer Button */}
        <Box position="absolute" left={0} right={0} px="$4" bottom={bottomOffset}>
          <Pressable
            onPress={handleTransferPress}
            bg={recipient?.id && !isTransferPending ? '#D8FF08' : '#EDEDEC'}
            $dark-bg={recipient?.id && !isTransferPending ? '#D8FF08' : '#2C2C2C'}
            rounded={10}
            h={buttonHeight}
            alignItems="center"
            justifyContent="center"
            borderWidth={recipient?.id ? 0 : 1}
            borderColor={recipient?.id ? 'transparent' : '#B1B1B1'}
            opacity={recipient?.id && !isTransferPending ? 1 : 0.6}
            disabled={!recipient?.id || isTransferPending}
          >
            {isTransferPending ? (
              <HStack alignItems="center" space="sm">
                <ActivityIndicator size="small" color="#111111" />
                <Text fontSize={14} fontWeight="$bold" color="#111111">
                  {t('nftTransfer.transferring')}
                </Text>
              </HStack>
            ) : (
              <Text
                fontSize={14}
                fontWeight="$bold"
                color={recipient?.id ? '#111111' : '#B1B1B1'}
                $dark-color={recipient?.id ? '#111111' : '#777777'}
              >
                {t('nftTransfer.transfer')}
              </Text>
            )}
          </Pressable>
        </Box>
      </Box>
    </SafeAreaView>
  );
};

