import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  CreditCardIcon,
  DocumentDuplicateIcon,
} from 'react-native-heroicons/outline';

interface WalletCardInfoProps {
  name?: string;
  address?: string;
  onCopyPress?: () => void;
}

export const WalletCardInfo: React.FC<WalletCardInfoProps> = ({
  name = 'Michael Clark',
  address = 'F4184fc596......0e9831e9e16',
  onCopyPress,
}) => {
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
      <HStack alignItems="center" space="md">
        <Box
          w={24}
          h={24}
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          rounded={6}
          alignItems="center"
          justifyContent="center"
        >
          <CreditCardIcon width={24} height={24} color="#000000" />
        </Box>
        <VStack flex={1}>
          <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {name}
          </Text>
          <HStack alignItems="center" space="sm">
            <Text fontSize={9} color="$textLight500" numberOfLines={1}>
              {address}
            </Text>
            <Pressable onPress={onCopyPress}>
              <DocumentDuplicateIcon width={12} height={12} color="#000000" />
            </Pressable>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

