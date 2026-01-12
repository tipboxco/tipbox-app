import React, { useState } from 'react';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QrCodeIcon, DocumentDuplicateIcon, ArrowTopRightOnSquareIcon } from 'react-native-heroicons/outline';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface ReceiveBottomSheetProps {
  onClose: () => void;
}

export const ReceiveBottomSheet: React.FC<ReceiveBottomSheetProps> = ({
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Mock wallet address - gerçek uygulamada API'den gelecek
  const walletAddress = 'F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e98311e0e9';
  const shortenedAddress = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`;

  const handleCopyAddress = () => {
    // Clipboard'a kopyala
    // Clipboard.setString(walletAddress);
    console.log('[ReceiveBottomSheet] Address copied:', walletAddress);
  };

  const handleShare = () => {
    // Share wallet address
    console.log('[ReceiveBottomSheet] Share address:', walletAddress);
  };

  return (
    <BottomSheetScrollView>
      <VStack px="$4" py="$4" space="lg" flex={1}>
        {/* Header */}
        <HStack justifyContent="center" alignItems="center" mb="$2">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Receive TIPS
          </Text>
        </HStack>

        {/* QR Code Section */}
        <VStack alignItems="center" space="md">
          <Box
            bg="$backgroundLight0"
            $dark-bg="$backgroundDark800"
            borderWidth={1}
            borderColor="$borderLight200"
            $dark-borderColor="$borderDark600"
            rounded={10}
            p="$4"
            alignItems="center"
            justifyContent="center"
          >
            {/* QR Code Placeholder - gerçek uygulamada QR code library kullanılacak */}
            <Box
              w={200}
              h={200}
              bg="$backgroundLight100"
              $dark-bg="$backgroundDark700"
              rounded={5}
              alignItems="center"
              justifyContent="center"
            >
              <QrCodeIcon width={100} height={100} color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          </Box>

          {/* Wallet Address */}
          <VStack space="sm" alignItems="center" w="100%">
            <Text fontSize={12} fontWeight="$medium" color="$textLight500" $dark-color="$textDark400">
              Your Wallet Address
            </Text>
            <Box
              bg="$backgroundLight0"
              $dark-bg="$backgroundDark800"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              px="$4"
              py="$3"
              w="100%"
            >
              <HStack alignItems="center" justifyContent="space-between" space="md">
                <Text
                  fontSize={12}
                  fontWeight="$semibold"
                  color="$textLight900"
                  $dark-color="$textDark50"
                  flex={1}
                  numberOfLines={1}
                >
                  {shortenedAddress}
                </Text>
                <Pressable onPress={handleCopyAddress}>
                  <DocumentDuplicateIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                </Pressable>
              </HStack>
            </Box>
          </VStack>

          {/* Action Buttons */}
          <HStack space="md" w="100%" mt="$2">
            <Pressable
              onPress={handleCopyAddress}
              flex={1}
              bg="$backgroundLight100"
              $dark-bg="$backgroundDark700"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              py="$3"
              alignItems="center"
            >
              <HStack alignItems="center" space="xs">
                <DocumentDuplicateIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                  Copy
                </Text>
              </HStack>
            </Pressable>
            <Pressable
              onPress={handleShare}
              flex={1}
              bg="$backgroundLight100"
              $dark-bg="$backgroundDark700"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              py="$3"
              alignItems="center"
            >
              <HStack alignItems="center" space="xs">
                <ArrowTopRightOnSquareIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                  Share
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </VStack>
      </VStack>
    </BottomSheetScrollView>
  );
};
