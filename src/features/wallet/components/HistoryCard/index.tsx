import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { Clipboard } from 'react-native';
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
  DocumentDuplicateIcon,
} from 'react-native-heroicons/outline';

export type ActionType = 
  | 'TIP_SEND'
  | 'TIP_RECEIVE'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'CLAIM_REWARD'
  | 'CLAIM_BADGE'
  | 'NFT_BUY'
  | 'NFT_SELL'
  | 'SWAP_TIP_TO_SOL'
  | 'SWAP_SOL_TO_TIP'
  | 'AIRDROP'
  | 'FEE';

/** Transaction status from backend (created → pending → confirmed/failed) */
export type TransactionStatus = 'created' | 'pending' | 'confirmed' | 'failed';

interface HistoryCardProps {
  type: string;
  description: string;
  amount: string;
  amountColor?: string;
  date?: string;
  transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop';
  actionType?: ActionType;
  /** Backend status: created | pending | confirmed | failed */
  status?: TransactionStatus;
  /** On-chain tx hash (optional) */
  txHash?: string | null;
  /** When status is failed and errorMessage === "Cancelled by user" show "Cancelled" */
  errorMessage?: string | null;
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
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAW':
      return 'Withdraw';
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
    case 'DEPOSIT':
      return 'Deposit received (external wallet)';
    case 'WITHDRAW':
      return 'Withdraw to external wallet';
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
 * Status label (created | pending | confirmed | failed).
 * Returns "Cancelled" when errorMessage === "Cancelled by user".
 */
const getStatusLabel = (status?: TransactionStatus, errorMessage?: string | null): string | null => {
  if (!status) return null;
  if (status === 'failed' && errorMessage === 'Cancelled by user') return 'Cancelled';
  switch (status) {
    case 'created': return 'Pending';
    case 'pending': return 'Processing';
    case 'confirmed': return 'Completed';
    case 'failed': return 'Failed';
    default: return null;
  }
};

/**
 * Returns icon and color by transaction type and actionType
 */
const getTransactionIcon = (
  type: string, 
  transactionType?: 'sent' | 'received' | 'failed' | 'claim' | 'airdrop',
  actionType?: ActionType
) => {
  if (transactionType === 'failed') {
    return {
      Icon: XMarkIcon,
      iconColor: '#FFFFFF',
      bgColor: '#CE4A4A', // Red
    };
  }

  switch (actionType) {
    case 'NFT_BUY':
      return {
        Icon: ShoppingBagIcon,
        iconColor: '#FFFFFF',
        bgColor: '#7C3AED', // Purple
      };
    
    case 'NFT_SELL':
      return {
        Icon: BanknotesIcon,
        iconColor: '#FFFFFF',
        bgColor: '#059669', // Green
      };
    
    case 'SWAP_TIP_TO_SOL':
    case 'SWAP_SOL_TO_TIP':
      return {
        Icon: ArrowsRightLeftIcon,
        iconColor: '#FFFFFF',
        bgColor: '#2563EB', // Blue
      };
    
    case 'AIRDROP':
      return {
        Icon: SparklesIcon,
        iconColor: '#FFFFFF',
        bgColor: '#F59E0B', // Orange/Gold
      };
    
    case 'CLAIM_REWARD':
    case 'CLAIM_BADGE':
      return {
        Icon: GiftIcon,
        iconColor: '#FFFFFF',
        bgColor: '#10B981', // Green
      };
    
    case 'FEE':
      return {
        Icon: ReceiptPercentIcon,
        iconColor: '#FFFFFF',
        bgColor: '#6B7280', // Gray
      };
    
    case 'TIP_SEND':
    case 'WITHDRAW':
      return {
        Icon: ArrowUpIcon,
        iconColor: '#FFFFFF',
        bgColor: '#CE4A4A', // Red
      };
    
    case 'TIP_RECEIVE':
    case 'DEPOSIT':
      return {
        Icon: ArrowDownIcon,
        iconColor: '#FFFFFF',
        bgColor: '#4CAF50', // Green
      };
    
    default:
      if (transactionType === 'sent') {
        return {
          Icon: ArrowUpIcon,
          iconColor: '#FFFFFF',
          bgColor: '#CE4A4A', // Red
        };
      }
      return {
        Icon: ArrowDownIcon,
        iconColor: '#FFFFFF',
        bgColor: '#4CAF50', // Green
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
  status,
  txHash,
  errorMessage,
  onCopyPress,
}) => {
  const { Icon, iconColor, bgColor } = getTransactionIcon(type, transactionType, actionType);
  
  // Use English label if actionType exists
  const displayType = actionType ? getActionTypeLabel(actionType) : type;
  
  // Use default description if description is empty; show "Cancelled" for cancelled
  const isCancelled = status === 'failed' && errorMessage === 'Cancelled by user';
  const displayDescription = isCancelled ? 'Cancelled' : (description || getActionTypeDescription(actionType));
  
  const statusLabel = getStatusLabel(status, errorMessage);
  const statusBg =
    status === 'failed' ? (isCancelled ? '#6B7280' : '#CE4A4A') :
    status === 'pending' || status === 'created' ? '#F59E0B' :
    status === 'confirmed' ? '#10B981' : undefined;
  
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
          <HStack alignItems="center" space="sm" flexWrap="wrap">
            <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
              {displayType}
            </Text>
            {statusLabel && statusBg && (
              <Box bg={statusBg} rounded={4} px="$1.5" py="$0.5">
                <Text fontSize={9} fontWeight="$semibold" color="#FFFFFF">
                  {statusLabel}
                </Text>
              </Box>
            )}
          </HStack>
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
          {txHash && (
            <HStack space="sm" alignItems="center" mt="$1" flexWrap="wrap">
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" numberOfLines={1} flex={1}>
                Hash: {txHash.length > 12 ? `${txHash.slice(0, 6)}…${txHash.slice(-6)}` : txHash}
              </Text>
              <Pressable
                onPress={() => Clipboard.setString(txHash)}
                hitSlop={8}
              >
                <DocumentDuplicateIcon width={14} height={14} color="#6B7280" />
              </Pressable>
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

