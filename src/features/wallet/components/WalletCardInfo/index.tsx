import React, { useMemo } from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  CreditCardIcon,
  DocumentDuplicateIcon,
} from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';

interface WalletCardInfoProps {
  name?: string;
  address?: string;
  onCopyPress?: () => void;
}

/**
 * Wallet adresini kripto tarzında kısaltır (örn: 0x1234...5678)
 * @param address - Tam wallet adresi
 * @param startChars - Baştan kaç karakter gösterilecek (default: 12)
 * @param endChars - Sondan kaç karakter gösterilecek (default: 10)
 */
const truncateAddress = (address: string, startChars = 12, endChars = 10): string => {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}****${address.slice(-endChars)}`;
};

export const WalletCardInfo: React.FC<WalletCardInfoProps> = ({
  name = 'Michael Clark',
  address = 'F4184fc596......0e9831e9e16',
  onCopyPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  // Kısaltılmış adresi memoize et
  const truncatedAddress = useMemo(() => truncateAddress(address), [address]);
  return (
    <Box
      bg="$backgroundLight0"
      $dark-bg="$backgroundDark900"
      borderWidth={1}
      borderColor="$borderLight200"
      $dark-borderColor="$borderDark600"
      rounded={5}
      p="$4"
    >
      <HStack alignItems="center" justifyContent="space-between" space="md">
        <HStack alignItems="center" space="md" flex={1}>
        <Box
          w={24}
          h={24}
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          rounded={6}
          alignItems="center"
          justifyContent="center"
        >
          <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <VStack flex={1}>
          <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {name}
          </Text>
            <Text fontSize={9} color="$textLight500" numberOfLines={1}>
              {truncatedAddress}
            </Text>
          </VStack>
        </HStack>
        
        {/* Kopyalama Butonu - Sağa yaslanmış ve büyük */}
            <Pressable onPress={onCopyPress}>
          <DocumentDuplicateIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
      </HStack>
    </Box>
  );
};

