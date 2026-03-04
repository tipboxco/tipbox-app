import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Feather } from '@expo/vector-icons';

export type TransactionFilterValue =
  | 'all'
  | 'sent'
  | 'received'
  | 'claim'
  | 'nft'
  | 'airdrop'
  | 'failed';

interface TransactionFilterBottomSheetProps {
  value: TransactionFilterValue;
  onChange: (value: TransactionFilterValue) => void;
  onClose: () => void;
}

export const TransactionFilterBottomSheet: React.FC<TransactionFilterBottomSheetProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('wallet');

  const FILTER_OPTIONS: Array<{ value: TransactionFilterValue; label: string }> = [
    { value: 'all', label: t('transactionFilterBottomSheet.all') },
    { value: 'sent', label: t('transactionFilterBottomSheet.sent') },
    { value: 'received', label: t('transactionFilterBottomSheet.received') },
    { value: 'claim', label: t('transactionFilterBottomSheet.claim') },
    { value: 'nft', label: t('transactionFilterBottomSheet.nft') },
    { value: 'airdrop', label: t('transactionFilterBottomSheet.airdrop') },
    { value: 'failed', label: t('transactionFilterBottomSheet.failed') },
  ];

  const borderColor = isDark ? '$borderDark600' : '$borderLight200';
  const cardBg = isDark ? '$backgroundDark900' : '$backgroundLight0';

  return (
    <BottomSheetScrollView>
      <VStack px="$4" py="$4" pb="$8" space="md">
        <HStack alignItems="center" justifyContent="space-between">
          <Box w={24} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {t('transactionFilterBottomSheet.title')}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>

        <VStack space="sm" mt="$2">
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  onClose();
                }}
              >
                <Box
                  bg={cardBg}
                  $dark-bg={cardBg}
                  borderWidth={1}
                  borderColor={borderColor}
                  $dark-borderColor={borderColor}
                  rounded={10}
                  px="$4"
                  py="$3"
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text
                      fontSize={14}
                      fontWeight={isSelected ? '$bold' : '$medium'}
                      color="$textLight900"
                      $dark-color="$textDark50"
                    >
                      {opt.label}
                    </Text>
                    {isSelected ? (
                      <Feather name="check" size={18} color={isDark ? '#D8FF08' : '#111111'} />
                    ) : (
                      <Box w={18} h={18} />
                    )}
                  </HStack>
                </Box>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    </BottomSheetScrollView>
  );
};

