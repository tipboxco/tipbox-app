import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { 
  ArrowDownIcon,
  ArrowUpIcon,
  XMarkIcon,
  GiftIcon,
} from 'react-native-heroicons/outline';

interface HistoryCardProps {
  type: string;
  description: string;
  amount: string;
  amountColor?: string;
  date?: string;
  transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop';
  onCopyPress?: () => void;
}

/**
 * Transaction type'a göre icon ve renk döndürür
 */
const getTransactionIcon = (type: string, transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop') => {
  // Type string'inden transaction type'ı çıkar
  const typeString = type.toLowerCase();
  
  // Failed durumu kontrolü
  if (typeString.includes('failed') || transactionType === 'failed') {
    return {
      Icon: XMarkIcon,
      iconColor: '#FFFFFF',
      bgColor: '#CE4A4A', // Kırmızı
    };
  }
  
  // Sent durumu kontrolü
  if (typeString.includes('sent') || transactionType === 'sent') {
    return {
      Icon: ArrowUpIcon,
      iconColor: '#FFFFFF',
      bgColor: '#CE4A4A', // Kırmızı
    };
  }
  
  // Claim ve Airdrop durumu kontrolü
  if (
    typeString.includes('claim') || 
    typeString.includes('airdrop') ||
    transactionType === 'claim' ||
    transactionType === 'airdrop'
  ) {
    return {
      Icon: GiftIcon,
      iconColor: '#FFFFFF',
      bgColor: '#4CAF50', // Yeşil
    };
  }
  
  // Received durumu (default)
  return {
    Icon: ArrowDownIcon,
    iconColor: '#FFFFFF',
    bgColor: '#4CAF50', // Yeşil
  };
};

export const HistoryCard: React.FC<HistoryCardProps> = ({
  type,
  description,
  amount,
  amountColor = '#3CA241',
  date,
  transactionType,
  onCopyPress,
}) => {
  const { Icon, iconColor, bgColor } = getTransactionIcon(type, transactionType);
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
        {/* Icon Box */}
        <Box 
          w={42} 
          h={42} 
          rounded={6} 
          bg={bgColor}
          alignItems="center"
          justifyContent="center"
        >
          <Icon width={20} height={20} color={iconColor} />
        </Box>
        
        <VStack flex={1}>
          <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {type}
          </Text>
          <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
            {description}
          </Text>
          {date && (
            <HStack space="sm" alignItems="center" mt="$1">
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
                İşlem Tarihi:
              </Text>
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
                {date}
              </Text>
            </HStack>
          )}
        </VStack>
        
        <VStack alignItems="flex-end" space="xs">
          <Text fontSize={12} fontWeight="$bold" color={amountColor}>
            {amount}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

