import React, { useState, useMemo, useEffect, useRef } from 'react';
import { VStack, HStack, Text, Pressable, Box, Input, InputField, Image } from '@gluestack-ui/themed';
import { Keyboard, TouchableWithoutFeedback, InputAccessoryView, Platform, ScrollView, ActivityIndicator, Clipboard } from 'react-native';
import {
  ChevronLeftIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
  ClockIcon,
} from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useWalletTransactions, useWalletBalance, useSendTips, useTransactionById, useCancelTransaction } from '../../api/hooks';
import type { SendTipResponse } from '../../api/walletApi';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';

// Truster List Component is now a separate screen (SelectFriendScreen)

interface SendBottomSheetProps {
  onClose: () => void;
  onWalletAddressPress?: () => void;
  onFriendPress?: () => void;
  onViewChange?: (view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => void;
  onSuccess?: (transactionDetails: {
    sentAmount: string;
    transactionFee: string;
    remainingBalance: string;
    transactionId?: string;
  }) => void;
  onNavigateToFriendSelect?: () => void;
  initialView?: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection';
  selectedFriend?: {
    id: string;
    name: string;
    title?: string;
    bio?: string;
    avatar: any;
  } | null;
}

export const SendBottomSheet: React.FC<SendBottomSheetProps> = ({
  onClose,
  onWalletAddressPress,
  onFriendPress,
  onViewChange,
  onSuccess,
  onNavigateToFriendSelect,
  initialView = 'options',
  selectedFriend: initialSelectedFriend = null,
}) => {
  const { t } = useTranslation('wallet');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [view, setView] = useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection'>(initialView);
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapped, setIsSwapped] = useState(false); // false = TIPS mode, true = USD mode
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string; title?: string; bio?: string; avatar: any } | null>(initialSelectedFriend);
  const [previousView, setPreviousView] = useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection' | null>(null);
  /** Send-tip API response; used for status-based UI and polling */
  const [sendResult, setSendResult] = useState<SendTipResponse | null>(null);
  const sendResultTipsAmountRef = useRef<number>(0);
  const sendResultDetailsRef = useRef<{ transactionFee: string; remainingBalance: string } | null>(null);
  /** Transaction id (backend returns `id`; alias transactionId for compat) */
  const transactionIdForPoll = sendResult ? (sendResult.id ?? sendResult.transactionId) : null;
  
  // Polling: created/pending ise GET /transactions/:id ile periyodik sorgula
  const shouldPoll = sendResult != null && (sendResult.status === 'created' || sendResult.status === 'pending');
  const { data: polledTx } = useTransactionById(
    shouldPoll ? transactionIdForPoll ?? null : null,
    { pollUntilFinal: true }
  );
  const effectiveStatus = polledTx?.status ?? sendResult?.status;
  const effectiveTxHash = (polledTx?.txHash ?? sendResult?.txHash) || undefined;
  const effectiveErrorMessage = (polledTx as any)?.errorMessage ?? sendResult?.errorMessage;
  
  const { mutate: cancelTx, isPending: isCancelling } = useCancelTransaction();
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const cancelCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTxIdRef = useRef<string | null>(null);
  
  // 5 second window: countdown when status is created (start once); disable cancel button when time runs out
  useEffect(() => {
    if (effectiveStatus !== 'created' || !transactionIdForPoll) {
      countdownTxIdRef.current = null;
      if (cancelCountdownRef.current) {
        clearInterval(cancelCountdownRef.current);
        cancelCountdownRef.current = null;
      }
      setCancelCountdown(null);
      return;
    }
    if (countdownTxIdRef.current === transactionIdForPoll) return;
    countdownTxIdRef.current = transactionIdForPoll;
    setCancelCountdown(5);
    cancelCountdownRef.current = setInterval(() => {
      setCancelCountdown((prev) => {
        if (prev == null || prev <= 1) {
          if (cancelCountdownRef.current) {
            clearInterval(cancelCountdownRef.current);
            cancelCountdownRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (cancelCountdownRef.current) {
        clearInterval(cancelCountdownRef.current);
        cancelCountdownRef.current = null;
      }
    };
  }, [effectiveStatus, transactionIdForPoll]);
  
  // confirmed olunca onSuccess + onClose (bir kez)
  const confirmedHandledRef = useRef(false);
  useEffect(() => {
    if (sendResult == null || effectiveStatus !== 'confirmed' || confirmedHandledRef.current) return;
    confirmedHandledRef.current = true;
    const tipsAmount = sendResultTipsAmountRef.current;
    const details = sendResultDetailsRef.current;
    onSuccess?.({
      sentAmount: `${tipsAmount.toLocaleString()} TIPS`,
      transactionFee: details?.transactionFee ?? '',
      remainingBalance: details?.remainingBalance ?? '',
      transactionId: transactionIdForPoll ?? undefined,
    });
    setSendResult(null);
    onClose();
  }, [sendResult, effectiveStatus, onSuccess, onClose, transactionIdForPoll]);
  
  // Debug: Log view changes
  React.useEffect(() => {
    if (view === 'confirmation') {
      console.log('[SendBottomSheet] View changed to:', view);
    }
  }, [view]);
  
  // Input accessory view ID for keyboard toolbar
  const inputAccessoryViewID = 'amountInputAccessory';
  
  // Conversion rate: 1 TIPS = $0.01 (20,000 TIPS = $200)
  const TIPS_TO_USD_RATE = 0.01;
  const USD_TO_TIPS_RATE = 100;

  // Fetch wallet transactions
  const { data: transactionsData } = useWalletTransactions();
  
  // Fetch wallet balance
  const { data: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
  
  // Get current user info
  const user = useAppStore((state) => state.user);

  // Send TIPS mutation hook
  const { mutate: sendTips, isPending: isSending } = useSendTips();

  // Function to open friend selection screen
  const handleOpenFriendSelection = () => {
    // Close bottom sheet and notify parent to navigate
    onClose();

    // Let parent (WalletScreen) handle navigation
    setTimeout(() => {
      onNavigateToFriendSelect?.();
    }, 300);
  };

  // Truncate wallet address for display (crypto-style)
  const truncateAddress = (address: string | undefined, startLength = 6, endLength = 4) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.substring(0, startLength)}****${address.substring(address.length - endLength)}`;
  };

  // Calculate relative time (e.g., "2 days ago", "3 hours ago")
  const getRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return t('common:time.recently');

    try {
      const date = new Date(dateString);
      const now = new Date();

      // Check if date is valid
      if (isNaN(date.getTime())) return t('common:time.recently');

      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffYears > 0) {
        return `${diffYears} ${t('common:time.year', { count: diffYears })} ${t('common:time.ago')}`;
      } else if (diffMonths > 0) {
        return `${diffMonths} ${t('common:time.month', { count: diffMonths })} ${t('common:time.ago')}`;
      } else if (diffDays > 0) {
        return `${diffDays} ${t('common:time.day', { count: diffDays })} ${t('common:time.ago')}`;
      } else if (diffHours > 0) {
        return `${diffHours} ${t('common:time.hour', { count: diffHours })} ${t('common:time.ago')}`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${t('common:time.minute', { count: diffMinutes })} ${t('common:time.ago')}`;
      } else {
        return t('common:time.justNow');
      }
    } catch (error) {
      console.error('[SendBottomSheet] Error calculating relative time:', error);
      return t('common:time.recently');
    }
  };

  // Get recent sent transactions (unique addresses)
  const recentAddresses = useMemo(() => {
    if (!transactionsData) {
      return [];
    }

    const allTransactions = [
      ...(transactionsData.today || []),
      ...(transactionsData.yesterday || []),
      ...(transactionsData.lastWeek || []),
      ...(transactionsData.lastMonth || []),
    ];

    const sentTransactions = allTransactions
      .filter((tx: any) => {
        const isSent = tx.type === 'sent';
        const hasWalletAddress = tx.to?.walletAddress && typeof tx.to.walletAddress === 'string' && tx.to.walletAddress.length > 0;
        return isSent && hasWalletAddress;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    const uniqueAddresses = new Map();
    sentTransactions.forEach((tx: any) => {
      const walletAddress = tx.to?.walletAddress;
      if (walletAddress && !uniqueAddresses.has(walletAddress)) {
        uniqueAddresses.set(walletAddress, {
          address: walletAddress,
          lastUsed: getRelativeTime(tx.createdAt),
          fullAddress: walletAddress,
        });
      }
    });

    return Array.from(uniqueAddresses.values()).slice(0, 3);
  }, [transactionsData]);

  // Mock recent addresses (fallback if no transactions)
  const mockRecentAddresses = [
    { address: 'F4184fc596******0e9', lastUsed: '11 months ago', fullAddress: 'F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9' },
    { address: 'F4184fc596******0e9', lastUsed: '11 months ago', fullAddress: 'F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9' },
    { address: 'F4184fc596******0e9', lastUsed: '11 months ago', fullAddress: 'F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9' },
  ];

  // Mock friends list
  const mockFriends = [
    { id: '1', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '2', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '3', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '4', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '5', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '6', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '7', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '8', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '9', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '10', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '11', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
    { id: '12', name: 'Micheal Clark', title: 'Technology Enthuistant - Hardware Expert - Digital...', avatar: DEFAULT_USER_AVATAR },
  ];

  const handleWalletAddressSelect = () => {
    setPreviousView('options');
    setView('wallet-address');
    onViewChange?.('wallet-address');
    onWalletAddressPress?.();
  };

  const handleBack = () => {
    // Navigate back based on current view
    if (previousView) {
      const backToView = previousView;
      setPreviousView(null);
      setView(backToView);
      onViewChange?.(backToView);
    } else {
      // Default: go back to options
      setView('options');
      onViewChange?.('options');
    }
  };

  const handleConfirmFromAddress = () => {
    setSelectedFriend(null);
    setPreviousView('wallet-address');
    setView('amount');
    onViewChange?.('amount');
  };

  const handleConfirmFromAmount = () => {
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    
    if (inputValue > 0) {
      setPreviousView('amount');
      setView('confirmation');
      onViewChange?.('confirmation');
    }
  };

  // Calculate transaction fee and remaining balance
  const getTransactionDetails = () => {
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    const tipsAmount = isSwapped ? Math.round(inputValue * USD_TO_TIPS_RATE) : Math.round(inputValue);
    const usdAmount = isSwapped ? inputValue : (tipsAmount * TIPS_TO_USD_RATE);
    // Transaction fee: 0.001% of the amount in USD
    const transactionFee = usdAmount * 0.00001;
    const currentBalance = walletBalance?.balance || 0;
    const remainingBalance = currentBalance - tipsAmount;
    
    return {
      tipsAmount,
      usdAmount: usdAmount.toFixed(2),
      transactionFee: transactionFee.toFixed(4),
      remainingBalance: Math.max(0, remainingBalance),
    };
  };

  const handleMaxPress = () => {
    const maxTips = walletBalance?.balance || 0;
    if (isSwapped) {
      // Convert TIPS to USD
      const maxUSD = (maxTips * TIPS_TO_USD_RATE).toFixed(2);
      setAmount(maxUSD);
    } else {
      setAmount(maxTips.toString());
    }
  };

  const handleSwap = () => {
    const currentValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    let newValue = '';
    
    if (isSwapped) {
      // Converting from USD to TIPS
      newValue = Math.round(currentValue * USD_TO_TIPS_RATE).toString();
    } else {
      // Converting from TIPS to USD
      newValue = (currentValue * TIPS_TO_USD_RATE).toFixed(2);
    }
    
    setAmount(newValue);
    setIsSwapped(!isSwapped);
  };

  // Input Accessory View (Keyboard Toolbar with Done button) - Modern & Clean Design
  const renderInputAccessoryView = () => {
    if (Platform.OS !== 'ios') return null;
    
    return (
      <InputAccessoryView nativeID={inputAccessoryViewID}>
        <Box
          bg={isDark ? '#1C1C1E' : '#F2F2F7'}
          borderTopWidth={0.5}
          borderTopColor={isDark ? '#38383A' : '#C6C6C8'}
          px="$4"
          py="$3"
          w="100%"
        >
          <HStack justifyContent="flex-end" alignItems="center" w="100%">
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                fontSize={17}
                fontWeight="$semibold"
                color="#007AFF"
                letterSpacing={-0.4}
              >
                {t('common:buttons.done')}
              </Text>
            </Pressable>
          </HStack>
        </Box>
      </InputAccessoryView>
    );
  };

  // Calculate display value for the bottom section
  const getDisplayValue = () => {
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    
    if (isSwapped) {
      // If in USD mode, show TIPS equivalent
      const tipsValue = Math.round(inputValue * USD_TO_TIPS_RATE);
      return `${tipsValue.toLocaleString()} TIPS`;
    } else {
      // If in TIPS mode, show USD equivalent
      const usdValue = (inputValue * TIPS_TO_USD_RATE).toFixed(2);
      return `$${parseFloat(usdValue).toLocaleString()}`;
    }
  };

  if (view === 'options') {
    return (
      <VStack px="$4" py="$4" space="lg">
        {/* Title */}
        <HStack justifyContent="center" alignItems="center">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {t('sendBottomSheet.title')}
          </Text>
        </HStack>

        {/* Option Cards */}
        <VStack space="md">
          {/* Wallet Address Option */}
          <Pressable onPress={handleWalletAddressSelect}>
            <Box
              bg="$backgroundLight0"
              $dark-bg="$backgroundDark800"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              p="$4"
            >
              <HStack space="md" alignItems="center">
                <Box
                  w={24}
                  h={24}
                  bg="$backgroundLight50"
                  $dark-bg="$backgroundDark700"
                  rounded={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <CreditCardIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <VStack flex={1} space="xs">
                  <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                    {t('sendBottomSheet.options.walletAddressTitle')}
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    {t('sendBottomSheet.options.walletAddressDescription')}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>

          {/* Friend Option */}
          <Pressable onPress={handleOpenFriendSelection}>
            <Box
              bg="$backgroundLight0"
              $dark-bg="$backgroundDark800"
              borderWidth={1}
              borderColor="$borderLight200"
              $dark-borderColor="$borderDark600"
              rounded={10}
              p="$4"
            >
              <HStack space="md" alignItems="center">
                <Box
                  w={24}
                  h={24}
                  bg="$backgroundLight50"
                  $dark-bg="$backgroundDark700"
                  rounded={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <UsersIcon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
                <VStack flex={1} space="xs">
                  <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                    {t('sendBottomSheet.options.friendTitle')}
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    {t('sendBottomSheet.options.friendDescription')}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>
        </VStack>
      </VStack>
    );
  }

  if (view === 'wallet-address') {
    // Wallet Address View
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={handleBack}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
                  <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            {t('sendBottomSheet.title')}
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Input Field */}
      <Box
        bg="$backgroundLight0"
        $dark-bg="$backgroundDark800"
        borderWidth={1}
        borderColor="#E9E9E9"
        $dark-borderColor="$borderDark600"
        rounded={10}
        p="$4"
      >
        <HStack alignItems="center" space="md">
          <Text fontSize={11} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
            {t('sendBottomSheet.walletAddress.to')}
          </Text>
          {walletAddress && walletAddress !== '0x' ? (
            <Text 
              fontSize={13} 
              fontWeight="$semibold" 
              color="$textLight900" 
              $dark-color="$textDark50"
              flex={1}
              numberOfLines={1}
            >
              {truncateAddress(walletAddress, 10, 8)}
            </Text>
          ) : (
            <Input flex={1} variant="outline" borderWidth={0}>
              <InputField
                placeholder="Wallet Address..."
                placeholderTextColor="#D9D9D9"
                value={walletAddress}
                onChangeText={setWalletAddress}
                fontSize={13}
                fontWeight="$semibold"
                color="$textLight900"
                $dark-color="$textDark50"
              />
            </Input>
          )}
          <Pressable>
            <DocumentDuplicateIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>
      </Box>

      {/* Recent Section */}
      <VStack space="sm" mt="$2">
        <Text fontSize={12} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
          Recent
        </Text>
        {(recentAddresses.length > 0 ? recentAddresses : mockRecentAddresses).map((item, index) => {
          const addressToShow = item.fullAddress || item.address || '';
          const addressToUse = item.fullAddress || item.address || '';
          
          // Skip rendering if no valid address
          if (!addressToShow) return null;
          
          return (
            <Pressable
              key={`${addressToShow}-${index}`}
              onPress={() => setWalletAddress(addressToUse)}
            >
              <HStack
                alignItems="center"
                space="md"
                py="$3"
                px="$2"
                rounded={6}
              >
                <CreditCardIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
                <HStack flex={1} justifyContent="space-between">
                  <Text fontSize={14} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                    {truncateAddress(addressToShow)}
                  </Text>
                  <Text fontSize={9} color="#B9B9B9" $dark-color="$textDark400">
                    {item.lastUsed || 'Recently'}
                  </Text>
                </HStack>
              </HStack>
            </Pressable>
          );
        })}
      </VStack>

      {/* Confirm Button */}
      <Pressable
        onPress={handleConfirmFromAddress}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
        disabled={!walletAddress.trim()}
        opacity={walletAddress.trim() ? 1 : 0.5}
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" textAlign="center">
          Confirm
        </Text>
      </Pressable>
    </VStack>
    );
  }

  if (view === 'friend-selection') {
    // Friend Selection View - Shows selected friend with confirm button
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={handleBack}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
          <UsersIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            Send TIPS
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Selected Friend Display */}
      {selectedFriend && (
        <Box
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          borderWidth={1}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          rounded={10}
          p="$4"
        >
          <VStack space="md">
            <Text fontSize={11} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
              To:
            </Text>
            
            <HStack alignItems="center" space="md">
              {/* Friend Avatar */}
              <Box position="relative">
                <Box
                  width={60}
                  height={60}
                  borderRadius={100}
                  bg="#CE4A4A"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box
                    width={56}
                    height={56}
                    borderRadius={28}
                    overflow="hidden"
                  >
                    <Image
                      source={toImageSource(selectedFriend.avatar) || DEFAULT_USER_AVATAR}
                      alt={selectedFriend.name}
                      width={56}
                      height={56}
                      resizeMode="cover"
                    />
                  </Box>
                </Box>
              </Box>
              
              {/* Friend Info */}
              <VStack flex={1} space="xs">
                <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  {selectedFriend.name}
                </Text>
                {selectedFriend.bio && (
                  <Text fontSize={12} fontWeight="$medium" color="#8C8C8C" $dark-color="$textDark400">
                    @{selectedFriend.bio}
                  </Text>
                )}
                {selectedFriend.title && (
                  <Text fontSize={11} color="#B9B9B9" $dark-color="$textDark500">
                    {selectedFriend.title}
                  </Text>
                )}
              </VStack>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Info Message */}
      <HStack alignItems="center" space="sm" mt="$2">
        <Box
          w={16}
          h={16}
          rounded="$full"
          bg="$backgroundLight200"
          $dark-bg="$backgroundDark700"
          alignItems="center"
          justifyContent="center"
        >
          <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" flex={1} lineHeight={12}>
          You are about to send TIPS to this friend from your trust list.
        </Text>
      </HStack>

      {/* Confirm Button */}
      <Pressable
        onPress={() => {
          setPreviousView('friend-selection');
          setView('amount');
          onViewChange?.('amount');
        }}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" textAlign="center">
          Confirm
        </Text>
      </Pressable>
    </VStack>
    );
  }

  if (view === 'amount') {
    // Amount View
    return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <VStack space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={() => {
          Keyboard.dismiss();
          // Back to previous view (wallet-address or options)
          if (previousView === 'wallet-address' || (walletAddress && !selectedFriend)) {
            setView('wallet-address');
            onViewChange?.('wallet-address');
          } else {
            // Default: go back to options and clear friend selection
            setView('options');
            onViewChange?.('options');
            setSelectedFriend(null);
          }
        }}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
          <PaperAirplaneIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            Send TIPS
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* To: Friend or Address Field */}
      {selectedFriend ? (
        <Box
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          borderWidth={1}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          rounded={10}
          p="$4"
        >
          <HStack alignItems="center" space="md">
            <Text fontSize={10} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
              To:
            </Text>
            {/* Friend Avatar */}
            <Box position="relative">
              <Box
                width={50}
                height={50}
                borderRadius={100}
                bg="#CE4A4A"
                alignItems="center"
                justifyContent="center"
              >
                <Box
                  width={46}
                  height={46}
                  borderRadius={23}
                  overflow="hidden"
                >
                  <Image
                    source={toImageSource(selectedFriend.avatar) || DEFAULT_USER_AVATAR}
                    alt={selectedFriend.name}
                    width={46}
                    height={46}
                    resizeMode="cover"
                  />
                </Box>
              </Box>
            </Box>
            {/* Friend Info */}
            <VStack space="xs" flex={1}>
              <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                {selectedFriend.name}
              </Text>
              {(selectedFriend.title || selectedFriend.bio) && (
                <Text
                  fontSize={9}
                  fontWeight="$medium"
                  color="#8C8C8C"
                  $dark-color="$textDark400"
                  numberOfLines={1}
                >
                  {selectedFriend.bio ? `@${selectedFriend.bio}` : selectedFriend.title}
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      ) : (
        <Box
          bg="$backgroundLight0"
          $dark-bg="$backgroundDark800"
          borderWidth={1}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          rounded={10}
          p="$4"
        >
          <HStack alignItems="center" space="md">
            <Text fontSize={11} fontWeight="$bold" color="#7F7F7E" $dark-color="$textDark400">
              To:
            </Text>
            {walletAddress && walletAddress.trim() && walletAddress !== '0x' ? (
              <Text 
                fontSize={13} 
                fontWeight="$semibold" 
                color="$textLight900" 
                $dark-color="$textDark50"
                flex={1}
                numberOfLines={1}
              >
                {truncateAddress(walletAddress, 10, 8)}
              </Text>
            ) : (
              <Text 
                fontSize={13} 
                fontWeight="$semibold" 
                color="#B9B9B9" 
                $dark-color="$textDark400"
                flex={1}
                numberOfLines={1}
              >
                No address selected
              </Text>
            )}
          </HStack>
        </Box>
      )}

      {/* Info Icon and Warning Message */}
      <HStack alignItems="center" space="sm" mt="$1">
        <Box
          w={16}
          h={16}
          rounded="$full"
          bg="$backgroundLight200"
          $dark-bg="$backgroundDark700"
          alignItems="center"
          justifyContent="center"
        >
          <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" flex={1} lineHeight={12}>
          TIPS token is calculated based on the current USD exchange rate.
        </Text>
      </HStack>

      {/* Amount Input Section */}
      <VStack space="md" alignItems="center" py="$2">
        {/* Amount Input with Swap Icon */}
        <Box w="100%" position="relative" alignItems="center" justifyContent="center" py="$2" px="$4">
          {/* Centered Input - Equal padding on both sides for proper centering */}
          <Box w="100%" alignItems="center" justifyContent="center" px="$16">
            <HStack alignItems="center" justifyContent="center" w="100%">
              {isSwapped && (
                <Text fontSize={44} fontWeight="$bold" color="#DDDDDD" $dark-color="$textDark400" mr="$1">
                  $
                </Text>
              )}
              <Input variant="outline" borderWidth={0} flex={1} minHeight={50} alignItems="center">
                <InputField
                  value={isSwapped ? amount.replace('$', '') : amount}
                  onChangeText={(text) => {
                    // Remove non-numeric characters except decimal point
                    const numericValue = text.replace(/[^0-9.]/g, '');
                    const inputValue = parseFloat(numericValue) || 0;
                    
                    // Get max balance
                    const maxTips = walletBalance?.balance || 0;
                    const maxUSD = maxTips * TIPS_TO_USD_RATE;
                    
                    // Check if input exceeds max balance
                    if (isSwapped) {
                      // USD mode: check against max USD
                      if (inputValue > maxUSD) {
                        setAmount(maxUSD.toFixed(2));
                      } else {
                        setAmount(numericValue);
                      }
                    } else {
                      // TIPS mode: check against max TIPS
                      if (inputValue > maxTips) {
                        setAmount(maxTips.toString());
                      } else {
                        setAmount(numericValue);
                      }
                    }
                  }}
                  keyboardType="decimal-pad"
                  inputAccessoryViewID={inputAccessoryViewID}
                  blurOnSubmit={false}
                  fontSize={44}
                  fontWeight="$bold"
                  color={amount ? "$textLight900" : "#DDDDDD"}
                  $dark-color={amount ? "$textDark50" : "#666666"}
                  textAlign="center"
                  placeholder={isSwapped ? "200" : "20.000"}
                  placeholderTextColor="#DDDDDD"
                />
              </Input>
            </HStack>
          </Box>
          {/* Swap Icon - Right side, absolute positioned */}
          <Box position="absolute" right="$4" top="$4">
            <Pressable onPress={handleSwap}>
              <ArrowsRightLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#808080'} />
            </Pressable>
          </Box>
        </Box>
        {/* Display Value Button - Centered */}
        <Pressable
          bg="#DDDDDD"
          $dark-bg="#DDDDDD"
          borderWidth={1}
          borderColor="#808080"
          $dark-borderColor="#808080"
          rounded={10}
          px="$5"
          py="$2"
          opacity={0.5}
          w={96}
          h={36}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={12} fontWeight="$bold" color="#000000" $dark-color="#000000">
            {amount ? getDisplayValue() : (isSwapped ? '$0' : '0 TIPS')}
          </Text>
        </Pressable>
      </VStack>

      {/* Available Balance Section */}
      <HStack justifyContent="space-between" alignItems="center" px="$0" mt="$2">
        <VStack>
          <Text fontSize={11} fontWeight="$bold" color="#8C8C8C" $dark-color="$textDark300">
            Available Balance
          </Text>
          <Text fontSize={20} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {isLoadingBalance 
              ? 'Loading...' 
              : `${walletBalance?.balance?.toLocaleString('en-US') || '0'} TIPS`
            }
          </Text>
        </VStack>
        <Pressable
          bg="#EDEDEC"
          $dark-bg="$backgroundDark700"
          borderWidth={1}
          borderColor="#B5B5B5"
          $dark-borderColor="$borderDark600"
          rounded={5}
          px="$5"
          py={6}
          onPress={handleMaxPress}
        >
          <Text fontSize={10} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Max.
          </Text>
        </Pressable>
      </HStack>

      {/* Confirm Button */}
      {(() => {
        const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
        const isEnabled = amount && inputValue > 0;
        
        return (
          <Pressable
            onPress={handleConfirmFromAmount}
            bg={isEnabled ? "#D8FF08" : "#EDEDEC"}
            $dark-bg={isEnabled ? "#D8FF08" : "$backgroundDark700"}
            borderWidth={isEnabled ? 0 : 1}
            borderColor={isEnabled ? "transparent" : "#B1B1B1"}
            $dark-borderColor={isEnabled ? "transparent" : "$borderDark600"}
            rounded={8}
            py="$3"
            mt="$4"
            disabled={!isEnabled}
            opacity={isEnabled ? 1 : 0.5}
          >
            <Text fontSize={14} fontWeight="$bold" color={isEnabled ? "#111111" : "#B1B1B1"} $dark-color={isEnabled ? "#111111" : "$textDark400"} textAlign="center">
              Confirm
            </Text>
          </Pressable>
        );
      })()}
        </VStack>
      </ScrollView>
    </TouchableWithoutFeedback>
    {renderInputAccessoryView()}
    </>
    );
  }

  // Confirmation View (view === 'confirmation')
  if (view === 'confirmation') {
    const transactionDetails = getTransactionDetails();

    // Result screen after send (status: created | pending | confirmed | failed)
    if (sendResult != null && effectiveStatus !== 'confirmed') {
      const isCancelled = effectiveStatus === 'failed' && effectiveErrorMessage === 'Cancelled by user';
      const statusMessage =
        effectiveStatus === 'created'
          ? 'Your transaction has been queued. Confirmation will start shortly. You can cancel within 5 seconds if you wish.'
          : effectiveStatus === 'pending'
            ? 'Processing on network…'
            : effectiveStatus === 'failed'
              ? isCancelled
                ? 'Transaction cancelled.'
                : (effectiveErrorMessage || 'Transaction failed.')
              : 'Processing…';
      const isFailed = effectiveStatus === 'failed';
      const isPendingOrCreated = effectiveStatus === 'created' || effectiveStatus === 'pending';
      const showCancelButton = effectiveStatus === 'created' && transactionIdForPoll && (cancelCountdown == null || cancelCountdown > 0) && !isCancelling;

      return (
        <VStack px="$4" py="$4" space="md" flex={1}>
          <HStack alignItems="center" space="md" mb="$2">
            <Pressable
              onPress={() => {
                setSendResult(null);
                setView('amount');
                onViewChange?.('amount');
              }}
            >
              <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <HStack flex={1} justifyContent="center" alignItems="center">
              {isFailed ? (
                <XCircleIcon width={24} height={24} color="#CE4A4A" />
              ) : isPendingOrCreated ? (
                <ClockIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
              ) : (
                <PaperAirplaneIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
              )}
              <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
                {isFailed ? (isCancelled ? 'Transaction Cancelled' : 'Send Failed') : 'Send Tip'}
              </Text>
            </HStack>
            <Box w={24} />
          </HStack>
          <VStack flex={1} space="md" alignItems="center" justifyContent="center" py="$6">
            <Text fontSize={16} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="center">
              {statusMessage}
            </Text>
            {effectiveStatus === 'created' && cancelCountdown != null && cancelCountdown > 0 && (
              <Text fontSize={12} color="$textLight500" $dark-color="$textDark400" textAlign="center">
                You have {cancelCountdown} seconds to cancel.
              </Text>
            )}
            {effectiveTxHash && (
              <VStack w="100%" space="xs" mt="$2">
                <Text fontSize={11} fontWeight="$semibold" color="#6B6B6B" $dark-color="$textDark300">
                  Transaction hash
                </Text>
                <HStack alignItems="center" space="sm">
                  <Text fontSize={10} color="$textLight700" $dark-color="$textDark400" flex={1} numberOfLines={1}>
                    {effectiveTxHash}
                  </Text>
                  <Pressable
                    onPress={() => Clipboard.setString(effectiveTxHash!)}
                    bg="$backgroundLight200"
                    $dark-bg="$backgroundDark600"
                    rounded={6}
                    px="$2"
                    py="$1"
                  >
                    <DocumentDuplicateIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                  </Pressable>
                </HStack>
              </VStack>
            )}
            {isPendingOrCreated && (
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} style={{ marginTop: 8 }} />
            )}
          </VStack>
          {showCancelButton && (
            <Pressable
              onPress={() => {
                if (!transactionIdForPoll) return;
                cancelTx(transactionIdForPoll, {
                  onSuccess: (data) => {
                    setSendResult((prev) =>
                      prev ? { ...prev, status: 'failed', errorMessage: data.errorMessage || 'Cancelled by user' } : null
                    );
                  },
                });
              }}
              bg="#CE4A4A"
              $dark-bg="#CE4A4A"
              rounded={8}
              py="$3"
              opacity={isCancelling ? 0.6 : 1}
              disabled={isCancelling}
            >
              <Text fontSize={14} fontWeight="$bold" color="#FFFFFF" textAlign="center">
                {isCancelling ? 'Cancelling…' : 'Cancel'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setSendResult(null);
              if (isFailed) onClose();
              else {
                setView('amount');
                onViewChange?.('amount');
              }
            }}
            bg={isFailed ? '#CE4A4A' : '#D8FF08'}
            $dark-bg={isFailed ? '#CE4A4A' : '#D8FF08'}
            rounded={8}
            py="$3"
            mt="auto"
          >
            <Text fontSize={14} fontWeight="$bold" color={isFailed ? '#FFFFFF' : '#111111'} textAlign="center">
              {isFailed ? 'Close' : 'Back'}
            </Text>
          </Pressable>
        </VStack>
      );
    }
    
    return (
    <VStack px="$4" py="$4" space="md" flex={1}>
      {/* Header with back button */}
      <HStack alignItems="center" space="md" mb="$2">
        <Pressable onPress={() => {
          setView('amount');
          onViewChange?.('amount');
        }}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
        <PaperAirplaneIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" ml="$2">
            Send TIPS
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Amount Display */}
      <VStack space="md" alignItems="center" py="$2">
        <Text fontSize={44} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
          {transactionDetails.tipsAmount.toLocaleString()} TIPS
        </Text>
        <Pressable
          bg="#DDDDDD"
          $dark-bg="#DDDDDD"
          borderWidth={1}
          borderColor="#808080"
          $dark-borderColor="#808080"
          rounded={10}
          px="$5"
          py="$2"
          opacity={0.5}
          w={96}
          h={36}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={12} fontWeight="$bold" color="#000000" $dark-color="#000000">
            ${transactionDetails.usdAmount}
          </Text>
        </Pressable>
      </VStack>

      {/* Sender and Receiver Card */}
      <Box
        bg="$backgroundLight0"
        $dark-bg="$backgroundDark800"
        borderWidth={1}
        borderColor="#D9D9D9"
        $dark-borderColor="$borderDark600"
        rounded={10}
        p="$4"
      >
        <HStack alignItems="center" justifyContent="space-between" w="100%">
          {/* Sender */}
          <HStack alignItems="center" space="sm" flex={1}>
            <Box w={29} h={29} rounded="$full" bg="#D9D9D9" $dark-bg="$backgroundDark700" alignItems="center" justifyContent="center" position="relative">
              {user?.avatar ? (
                <Image
                  source={toImageSource(user.avatar) || DEFAULT_USER_AVATAR}
                  alt={user.fullName || 'User'}
                  width={29}
                  height={29}
                  borderRadius={100}
                  resizeMode="cover"
                />
              ) : (
                <UserIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
              )}
              <Box position="absolute" bottom={-2} right={-2} w={16} h={16} rounded="$full" bg="$backgroundLight0" $dark-bg="$backgroundDark800" borderWidth={1} borderColor="#D9D9D9" alignItems="center" justifyContent="center">
                <CreditCardIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
            </Box>
            <VStack>
              <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                {user?.fullName || 'User'}
              </Text>
            </VStack>
          </HStack>

          {/* Arrow Icon */}
          <Box mx="$2" position="relative">
            <PaperAirplaneIcon 
              width={24} 
              height={24} 
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Box>

          {/* Receiver */}
          <HStack alignItems="center" space="sm" flex={1} justifyContent="flex-end">
            {selectedFriend ? (
              <>
                <VStack alignItems="flex-end" flex={1}>
                  <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
                    {selectedFriend.name}
                  </Text>
                  {(selectedFriend.title || selectedFriend.bio) && (
                    <Text fontSize={9} fontWeight="$medium" color="#8C8C8C" $dark-color="$textDark400" textAlign="right" numberOfLines={1}>
                      {selectedFriend.bio ? `@${selectedFriend.bio}` : selectedFriend.title}
                    </Text>
                  )}
                </VStack>
                <Box position="relative">
                  <Box
                    width={29}
                    height={29}
                    borderRadius={100}
                    bg="#CE4A4A"
                    alignItems="center"
                    justifyContent="center"
                    >
                    <Box
                      width={25}
                      height={25}
                      borderRadius={12}
                      overflow="hidden"
                    >
                      <Image
                        source={toImageSource(selectedFriend.avatar) || DEFAULT_USER_AVATAR}
                        alt={selectedFriend.name}
                        width={25}
                        height={25}
                        resizeMode="cover"
                      />
                    </Box>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <VStack alignItems="flex-end" flex={1}>
                  <Text fontSize={10} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right" numberOfLines={1}>
                    {truncateAddress(walletAddress || '0x', 6, 4)}
                  </Text>
                </VStack>
                <Box w={29} h={29} rounded="$full" bg="#D9D9D9" $dark-bg="$backgroundDark700" alignItems="center" justifyContent="center">
                  <CreditCardIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              </>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Info Icon and Warning Message */}
      <HStack alignItems="center" space="sm">
        <Box
          w={16}
          h={16}
          rounded="$full"
          bg="$backgroundLight200"
          $dark-bg="$backgroundDark700"
          alignItems="center"
          justifyContent="center"
        >
          <InformationCircleIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
        <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" flex={1} lineHeight={12}>
          TIPS token is calculated based on the current USD exchange rate.
        </Text>
      </HStack>

      {/* Divider */}
      <Box h={1} bg="#D9D9D9" my="$2" />

      {/* Transaction Details */}
      <VStack space="sm">
        <HStack justifyContent="space-between" alignItems="center" w="100%">
          <Text fontSize={11} fontWeight="$semibold" color="#6B6B6B" $dark-color="$textDark300">
            Transaction Fee:
          </Text>
          <Text fontSize={11} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            ${transactionDetails.transactionFee}
          </Text>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center" w="100%">
          <Text fontSize={11} fontWeight="$semibold" color="#6B6B6B" $dark-color="$textDark300">
            Remaining Balance:
          </Text>
          <Text fontSize={11} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
            {transactionDetails.remainingBalance.toLocaleString()} TIPS
          </Text>
        </HStack>
      </VStack>

      {/* Send Button */}
      <Pressable
        onPress={() => {
          const recipientId = selectedFriend?.id;
          if (!recipientId && !walletAddress) {
            console.error('[SendBottomSheet] No recipient selected');
            return;
          }

          const tipsAmount = transactionDetails.tipsAmount;
          
          sendResultTipsAmountRef.current = tipsAmount;
          sendResultDetailsRef.current = {
            transactionFee: `$${transactionDetails.transactionFee}`,
            remainingBalance: `${transactionDetails.remainingBalance.toLocaleString()} TIPS`,
          };
          sendTips(
            {
              ...(recipientId && { recipientId }),
              ...(walletAddress && { recipientId: walletAddress }),
              amount: tipsAmount,
              message: 'TIPS transfer',
            },
            {
              onSuccess: (response) => {
                setSendResult(response);
                // confirmed is handled by useEffect when effectiveStatus becomes confirmed (e.g. after polling)
              },
              onError: (error: any) => {
                console.error('[SendBottomSheet] Send failed:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
                console.error('[SendBottomSheet] Error details:', errorMessage);
              },
            }
          );
        }}
        bg="#D8FF08"
        $dark-bg="#D8FF08"
        rounded={8}
        py="$3"
        mt="auto"
        opacity={isSending ? 0.6 : 1}
        disabled={isSending}
      >
        <Text fontSize={14} fontWeight="$bold" color="#111111" $dark-color="#111111" textAlign="center">
          {isSending ? 'Sending...' : 'Send'}
        </Text>
      </Pressable>
      {isSending && (
        <Text fontSize={11} color="$textLight500" $dark-color="$textDark400" textAlign="center" mt="$2">
          Please wait if the request takes a moment.
        </Text>
      )}
    </VStack>
    );
  }

  return null;
};

