import React, { useMemo, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Pressable, Box, Image, Input, InputField } from '@gluestack-ui/themed';
import { ChevronLeftIcon, MagnifyingGlassIcon, UsersIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAppStore } from '@/src/store/appStore';
import { useTrustList } from '@/src/features/profile/api/hooks';
import { DEFAULT_USER_AVATAR, toImageSource } from '@/src/utils';
import type { NftTransferRecipientSnapshot } from '@/src/features/wallet/store/nft-transfer-flow-store';
import { useTranslation } from '@/src/hooks/useTranslation';

interface NftTransferUserBottomSheetProps {
  onClose: () => void;
  onSelect: (recipient: NftTransferRecipientSnapshot) => void;
}

export const NftTransferUserBottomSheet: React.FC<NftTransferUserBottomSheetProps> = ({ onClose, onSelect }) => {
  const { t } = useTranslation('wallet');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAppStore((s) => s.user);
  const { data: trustList, isLoading, error } = useTrustList(user?.id);

  const filtered = useMemo(() => {
    const list = trustList || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t: any) => {
      const name = String(t?.name || '').toLowerCase();
      const userName = String(t?.userName || '').toLowerCase();
      const title = String(t?.titles?.[0] || '').toLowerCase();
      return name.includes(q) || userName.includes(q) || title.includes(q);
    });
  }, [trustList, searchQuery]);

  return (
    <VStack flex={1} w="100%" px="$4" pt="$4" pb="$2">
      {/* Header */}
      <HStack alignItems="center" space="md" mb="$3">
        <Pressable onPress={onClose}>
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
        alignItems="center"
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor={isDark ? '#333333' : '#E9E9E9'}
        borderRadius={23}
        px={12}
        space="sm"
        mb="$3"
      >
        <MagnifyingGlassIcon width={22} height={22} color={isDark ? '#8E8E93' : '#8E8E93'} />
        <Input flex={1} borderWidth={0} bg="transparent">
          <InputField
            placeholder={t('nftTransfer.searchUser')}
            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
            color={isDark ? '#fff' : '#000'}
            fontSize={11}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </HStack>

      {/* List */}
      <Box flex={1} pb="$2">
        {isLoading ? (
          <VStack alignItems="center" justifyContent="center" py="$8">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
              {t('nftTransfer.loadingUsers')}
            </Text>
          </VStack>
        ) : error ? (
          <VStack alignItems="center" justifyContent="center" py="$8">
            <Text fontSize={14} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
              {t('nftTransfer.loadFailedUsers')}
            </Text>
            <Text mt="$2" fontSize={12} color="$textLight500" $dark-color="$textDark400" textAlign="center">
              {t('nftTransfer.tryAgain')}
            </Text>
          </VStack>
        ) : filtered.length === 0 ? (
          <VStack alignItems="center" justifyContent="center" py="$8">
            <UsersIcon width={56} height={56} color={isDark ? '#666666' : '#CCCCCC'} />
            <Text mt="$4" fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
              {t('nftTransfer.emptyUsers')}
            </Text>
          </VStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xs">
              {filtered.map((t: any) => (
                <Pressable
                  key={String(t?.id)}
                  onPress={() => {
                    onSelect({
                      id: String(t?.id),
                      name: String(t?.name || ''),
                      userName: t?.userName ? String(t.userName) : undefined,
                      avatar: t?.avatar,
                    });
                  }}
                >
                  <HStack
                    alignItems="center"
                    justifyContent="space-between"
                    py={12}
                    px={16}
                    borderBottomWidth={1}
                    borderBottomColor={isDark ? '#333' : '#E9E9E9'}
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
                              source={toImageSource(t?.avatar) || DEFAULT_USER_AVATAR}
                              alt={String(t?.name || 'User')}
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
                          {t?.name}
                        </Text>
                        <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize={10} numberOfLines={1} lineHeight={12}>
                          @{t?.userName || ''}
                        </Text>
                        {!!t?.titles?.[0] && (
                          <Text color={isDark ? '#B9B9B9' : '#B9B9B9'} fontSize={9} numberOfLines={1} lineHeight={11}>
                            {t.titles[0]}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </ScrollView>
        )}
      </Box>
    </VStack>
  );
};

