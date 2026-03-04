import React from 'react';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { XMarkIcon, DocumentDuplicateIcon, ShareIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from '@/src/hooks/useTranslation';
// @ts-ignore - QR code library doesn't have type definitions
import QRCode from 'react-native-qrcode-svg';

interface ReceiveBottomSheetProps {
  onClose: () => void;
  walletAddress: string;
  userName: string;
}

export const ReceiveBottomSheet: React.FC<ReceiveBottomSheetProps> = ({
  onClose,
  walletAddress,
  userName,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('wallet');

  // Truncate wallet address for display (crypto-style)
  const truncateAddress = (address: string, startLength = 12, endLength = 10) => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.substring(0, startLength)}****${address.substring(address.length - endLength)}`;
  };

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert(t('receiveBottomSheet.copied'), t('receiveBottomSheet.addressCopied'));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${userName}'s Wallet Address:\n${walletAddress}`,
        title: 'Share Wallet Address',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <BottomSheetScrollView>
      <VStack 
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} 
        borderTopLeftRadius={20} 
        borderTopRightRadius={20}
        pb="$4"
      >
        {/* Header */}
        <HStack 
          justifyContent="space-between" 
          alignItems="center" 
          px="$4" 
          py="$4"
          borderBottomWidth={1}
          borderBottomColor={isDark ? '$borderDark700' : '$borderLight200'}
        >
          <Text fontSize={18} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
            {t('receiveBottomSheet.title')}
          </Text>
          <Pressable onPress={onClose}>
            <XMarkIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>

        {/* Content */}
        <VStack px="$4" py="$6" space="xl" alignItems="center">
          {/* QR Code */}
          <Box
            bg={isDark ? '$backgroundDark900' : '$white'}
            p="$4"
            borderRadius={12}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '$borderLight200'}
          >
            <QRCode
              value={walletAddress}
              size={200}
              color={isDark ? '#FFFFFF' : '#000000'}
              backgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
            />
          </Box>

          {/* User Info */}
          <VStack space="xs" alignItems="center">
            <Text fontSize={16} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
              {userName}
            </Text>
            <Text fontSize={12} color={isDark ? '$textDark400' : '$textLight500'} textAlign="center">
              {t('receiveBottomSheet.scanQR')}
            </Text>
          </VStack>

          {/* Wallet Address Card */}
          <Box
            bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}
            p="$4"
            borderRadius={8}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '$borderLight200'}
            w="100%"
          >
            <VStack space="sm">
              <Text fontSize={12} fontWeight="$semibold" color={isDark ? '$textDark400' : '$textLight500'}>
                {t('receiveBottomSheet.walletAddress')}
              </Text>
              <Text 
                fontSize={11} 
                color={isDark ? '$textDark50' : '$textLight900'} 
                fontFamily="$mono"
                numberOfLines={1}
              >
                {truncateAddress(walletAddress)}
              </Text>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <HStack space="md" w="100%">
            {/* Copy Button */}
            <Pressable
              onPress={handleCopyAddress}
              flex={1}
              bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '$borderLight200'}
              borderRadius={10}
              py="$3"
              px="$4"
            >
              <HStack space="sm" alignItems="center" justifyContent="center">
                <DocumentDuplicateIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text fontSize={14} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'}>
                  {t('receiveBottomSheet.copy')}
                </Text>
              </HStack>
            </Pressable>

            {/* Share Button */}
            <Pressable
              onPress={handleShare}
              flex={1}
              bg="#E8FF6B"
              borderRadius={10}
              py="$3"
              px="$4"
            >
              <HStack space="sm" alignItems="center" justifyContent="center">
                <ShareIcon width={20} height={20} color="#000000" />
                <Text fontSize={14} fontWeight="$semibold" color="#000000">
                  {t('receiveBottomSheet.share')}
                </Text>
              </HStack>
            </Pressable>
          </HStack>

          {/* Info Text */}
          <Box
            bg={isDark ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.1)'}
            p="$3"
            borderRadius={8}
            borderLeftWidth={3}
            borderLeftColor="#FFC107"
            w="100%"
          >
            <Text fontSize={11} color={isDark ? '$textDark300' : '$textLight700'}>
              {t('receiveBottomSheet.info')}
            </Text>
          </Box>
        </VStack>
      </VStack>
    </BottomSheetScrollView>
  );
};
