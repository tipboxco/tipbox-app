import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { 
  ArrowDownIcon,
  ArrowUpIcon,
  XMarkIcon,
  GiftIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ReceiptPercentIcon,
} from 'react-native-heroicons/outline';

export type ActionType = 
  | 'TIP_SEND'
  | 'TIP_RECEIVE'
  | 'CLAIM_REWARD'
  | 'CLAIM_BADGE'
  | 'NFT_BUY'
  | 'NFT_SELL'
  | 'SWAP_TIP_TO_SOL'
  | 'SWAP_SOL_TO_TIP'
  | 'AIRDROP'
  | 'FEE';

interface HistoryCardProps {
  type: string;
  description: string;
  amount: string;
  amountColor?: string;
  date?: string;
  transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop';
  actionType?: ActionType;
  onCopyPress?: () => void;
}

/**
 * Returns English label based on ActionType
 */
const getActionTypeLabel = (actionType?: ActionType): string => {
  switch (actionType) {
    case 'TIP_SEND':
      return 'TIPS Sent';
    case 'TIP_RECEIVE':
      return 'TIPS Received';
    case 'CLAIM_REWARD':
      return 'Reward Claimed';
    case 'CLAIM_BADGE':
      return 'Badge Claimed';
    case 'NFT_BUY':
      return 'NFT Purchased';
    case 'NFT_SELL':
      return 'NFT Sold';
    case 'SWAP_TIP_TO_SOL':
      return 'TIPS → SOL Swap';
    case 'SWAP_SOL_TO_TIP':
      return 'SOL → TIPS Swap';
    case 'AIRDROP':
      return 'Airdrop Received';
    case 'FEE':
      return 'Transaction Fee';
    default:
      return 'Transaction';
  }
};

/**
 * Returns default description based on ActionType (used when description is empty)
 */
const getActionTypeDescription = (actionType?: ActionType): string => {
  switch (actionType) {
    case 'TIP_SEND':
      return 'TIPS transfer completed';
    case 'TIP_RECEIVE':
      return 'TIPS transfer received';
    case 'CLAIM_REWARD':
      return 'Reward successfully claimed';
    case 'CLAIM_BADGE':
      return 'Badge successfully claimed';
    case 'NFT_BUY':
      return 'NFT purchase completed';
    case 'NFT_SELL':
      return 'NFT sale completed';
    case 'SWAP_TIP_TO_SOL':
      return 'TIPS tokens swapped to SOL';
    case 'SWAP_SOL_TO_TIP':
      return 'SOL tokens swapped to TIPS';
    case 'AIRDROP':
      return 'Airdrop reward received';
    case 'FEE':
      return 'Transaction fee paid';
    default:
      return '';
  }
};

/**
 * Transaction type ve actionType'a göre icon ve renk döndürür
 */
const getTransactionIcon = (
  type: string, 
  transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop',
  actionType?: ActionType
) => {
  // Failed durumu kontrolü
  if (transactionType === 'failed') {
    return {
      Icon: XMarkIcon,
      iconColor: '#FFFFFF',
      bgColor: '#CE4A4A', // Kırmızı
    };
  }

  // ActionType bazlı icon seçimi
  switch (actionType) {
    case 'NFT_BUY':
      return {
        Icon: ShoppingBagIcon,
        iconColor: '#FFFFFF',
        bgColor: '#7C3AED', // Mor
      };
    
    case 'NFT_SELL':
      return {
        Icon: BanknotesIcon,
        iconColor: '#FFFFFF',
        bgColor: '#059669', // Yeşil
      };
    
    case 'SWAP_TIP_TO_SOL':
    case 'SWAP_SOL_TO_TIP':
      return {
        Icon: ArrowsRightLeftIcon,
        iconColor: '#FFFFFF',
        bgColor: '#2563EB', // Mavi
      };
    
    case 'AIRDROP':
      return {
        Icon: SparklesIcon,
        iconColor: '#FFFFFF',
        bgColor: '#F59E0B', // Turuncu/Altın
      };
    
    case 'CLAIM_REWARD':
    case 'CLAIM_BADGE':
      return {
        Icon: GiftIcon,
        iconColor: '#FFFFFF',
        bgColor: '#10B981', // Yeşil
      };
    
    case 'FEE':
      return {
        Icon: ReceiptPercentIcon,
        iconColor: '#FFFFFF',
        bgColor: '#6B7280', // Gri
      };
    
    case 'TIP_SEND':
      return {
        Icon: ArrowUpIcon,
        iconColor: '#FFFFFF',
        bgColor: '#CE4A4A', // Kırmızı
      };
    
    case 'TIP_RECEIVE':
      return {
        Icon: ArrowDownIcon,
        iconColor: '#FFFFFF',
        bgColor: '#4CAF50', // Yeşil
      };
    
    default:
      // Fallback - transactionType'a göre
      if (transactionType === 'sent') {
        return {
          Icon: ArrowUpIcon,
          iconColor: '#FFFFFF',
          bgColor: '#CE4A4A', // Kırmızı
        };
      }
      
      // Default: Received
      return {
        Icon: ArrowDownIcon,
        iconColor: '#FFFFFF',
        bgColor: '#4CAF50', // Yeşil
      };
  }
};

export const HistoryCard: React.FC<HistoryCardProps> = ({
  type,
  description,
  amount,
  amountColor = '#3CA241',
  date,
  transactionType,
  actionType,
  onCopyPress,
}) => {
  const { Icon, iconColor, bgColor } = getTransactionIcon(type, transactionType, actionType);
  
  // Use English label if actionType exists
  const displayType = actionType ? getActionTypeLabel(actionType) : type;
  
  // Use default description if description is empty
  const displayDescription = description || getActionTypeDescription(actionType);
  
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
            {displayType}
          </Text>
          {displayDescription && (
            <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
              {displayDescription}
            </Text>
          )}
          {date && (
            <HStack space="sm" alignItems="center" mt="$1">
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
                Transaction Date:
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

