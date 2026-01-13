import React, { useState, useMemo, useEffect } from 'react';
import { VStack, HStack, Text, Pressable, Box, Input, InputField, Image } from '@gluestack-ui/themed';
import { Keyboard, TouchableWithoutFeedback, InputAccessoryView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import {
  ChevronLeftIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  UsersIcon,
} from 'react-native-heroicons/outline';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SendFriendBottomSheet } from '../SendFriendBottomSheet';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useWalletTransactions, useWalletBalance, useSendTips } from '../../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useTrusterList } from '@/src/features/profile/api/hooks';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

// Truster List Component for Bottom Sheet
const TrusterListContent: React.FC<{
  trusterList: any[];
  isLoadingTrusters: boolean;
  onTrusterSelect: (truster: any) => void;
  onClose: () => void;
  isDark: boolean;
}> = ({ trusterList, isLoadingTrusters, onTrusterSelect, onClose, isDark }) => {
  console.log('[TrusterList] 🎨 Rendering with', trusterList?.length || 0, 'trusters');
  
  return (
    <VStack flex={1} w="100%">
      {/* Header - Fixed */}
      <HStack alignItems="center" space="md" mb="$2" px="$4" pt="$4">
        <Pressable onPress={onClose}>
          <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <HStack flex={1} justifyContent="center" alignItems="center">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Select Friend
          </Text>
        </HStack>
        <Box w={24} />
      </HStack>

      {/* Truster List - Scrollable */}
      <Box flex={1}>
        <ScrollView 
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingTop: 8,
            paddingBottom: 16
          }}
          showsVerticalScrollIndicator={true}
        >
          {isLoadingTrusters ? (
            <VStack alignItems="center" justifyContent="center" py="$8">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" mt="$4">
                Loading friends...
              </Text>
            </VStack>
          ) : trusterList && trusterList.length > 0 ? (
            <VStack space="md">
              {trusterList.map((truster, index) => {
                console.log(`[TrusterList] 🎨 Rendering truster ${index + 1}/${trusterList.length}:`, truster.name);
                
                return (
                  <Pressable
                    key={truster.id}
                    onPress={() => {
                      console.log('[TrusterList] 🔵 Truster clicked:', truster.name);
                      console.log('[TrusterList] 🔵 Calling onTrusterSelect directly');
                      onTrusterSelect(truster);
                    }}
                  >
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
                        <Box w={48} h={48} rounded="$full" overflow="hidden" bg="$backgroundLight200" $dark-bg="$backgroundDark700">
                          <Image
                            source={toImageSource(truster.avatar) || DEFAULT_USER_AVATAR}
                            alt={truster.name}
                            style={{ width: 48, height: 48 }}
                            resizeMode="cover"
                          />
                        </Box>

                        <VStack flex={1} space="xs">
                          <Text 
                            fontSize={14} 
                            fontWeight="$bold" 
                            color="$textLight900" 
                            $dark-color="$textDark50"
                          >
                            {truster.name}
                          </Text>
                          <Text 
                            fontSize={12} 
                            color="$textLight500" 
                            $dark-color="$textDark400"
                          >
                            @{truster.userName}
                          </Text>
                          {truster.titles && truster.titles.length > 0 && (
                            <Text 
                              fontSize={11} 
                              color="$textLight400" 
                              $dark-color="$textDark500"
                            >
                              {truster.titles[0]}
                            </Text>
                          )}
                        </VStack>

                        {truster.isTrusted && (
                          <Box bg="#C2E607" rounded={6} px="$2" py="$1">
                            <Text fontSize={10} fontWeight="$bold" color="#111111">Trusted</Text>
                          </Box>
                        )}
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
          ) : (
            <VStack alignItems="center" justifyContent="center" py="$8">
              <UsersIcon width={64} height={64} color={isDark ? '#666666' : '#CCCCCC'} />
              <Text fontSize={16} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400" mt="$4">
                No Friends Found
              </Text>
              <Text fontSize={12} color="$textLight400" $dark-color="$textDark500" mt="$2" textAlign="center">
                You don't have any friends in your trust list yet.
              </Text>
            </VStack>
          )}
        </ScrollView>
      </Box>
    </VStack>
  );
};

interface SendBottomSheetProps {
  onClose: () => void;
  onWalletAddressPress?: () => void;
  onFriendPress?: () => void;
  onViewChange?: (view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection' | 'truster-list') => void;
  onSuccess?: (transactionDetails: {
    sentAmount: string;
    transactionFee: string;
    remainingBalance: string;
    transactionId?: string;
  }) => void;
}

export const SendBottomSheet: React.FC<SendBottomSheetProps> = ({
  onClose,
  onWalletAddressPress,
  onFriendPress,
  onViewChange,
  onSuccess,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [view, setView] = useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection' | 'truster-list'>('options');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapped, setIsSwapped] = useState(false); // false = TIPS mode, true = USD mode
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string; title?: string; bio?: string; avatar: any } | null>(null);
  const [previousView, setPreviousView] = useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection' | null>(null);
  
  // Global bottom sheet
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Debug: Log view changes
  React.useEffect(() => {
    console.log('[SendBottomSheet] 📱 View changed to:', view);
    console.log('[SendBottomSheet] 📱 Selected friend:', selectedFriend?.name || 'none');
  }, [view, selectedFriend]);
  
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
  
  // Fetch Truster List
  const { data: trusterList, isLoading: isLoadingTrusters, error: trusterListError } = useTrusterList(user?.id);
  
  // Debug: Log truster list state
  React.useEffect(() => {
    console.log('[SendBottomSheet] 🔍 Truster List Debug:', {
      userId: user?.id,
      isLoading: isLoadingTrusters,
      hasError: !!trusterListError,
      error: trusterListError,
      data: trusterList,
      dataLength: trusterList?.length || 0,
    });
  }, [trusterList, isLoadingTrusters, trusterListError, user?.id]);

  // Function to show Truster list view (no nested bottom sheet)
  const openTrusterListBottomSheet = () => {
    console.log('[SendBottomSheet] 🎯 Opening Truster List View');
    console.log('[SendBottomSheet] 🎯 User ID:', user?.id);
    console.log('[SendBottomSheet] 🎯 Is Loading:', isLoadingTrusters);
    console.log('[SendBottomSheet] 🎯 Has Error:', !!trusterListError);
    console.log('[SendBottomSheet] 🎯 Total trusters:', trusterList?.length || 0);
    console.log('[SendBottomSheet] 🎯 Truster List Data:', trusterList);
    
    // View'ı değiştirmeden önce parent'a haber ver
    // Parent bottom sheet'i kapatıp %50 snap point ile yeniden açacak
    setPreviousView('options');
    onViewChange?.('truster-list');
    
    // Küçük bir delay ile view'ı değiştir (parent'ın bottom sheet'i güncellemesi için)
    setTimeout(() => {
      setView('truster-list');
    }, 100);
  };
  
  // Callback for when a truster is selected from the list
  const handleTrusterSelect = (truster: any) => {
    console.log('[SendBottomSheet] 🟢 handleTrusterSelect called:', truster.name);
    
    // Set the friend data
    const friendData = {
      id: truster.id,
      name: truster.name,
      title: truster.titles?.[0],
      bio: truster.userName,
      avatar: truster.avatar,
    };
    
    console.log('[SendBottomSheet] 🟢 Setting selectedFriend:', friendData);
    setSelectedFriend(friendData);
    
    // Directly navigate to amount view (skip friend-selection)
    console.log('[SendBottomSheet] 🟢 Setting view to amount (skipping friend-selection)');
    setPreviousView('friend-selection');
    setView('truster-list');
    onViewChange?.('amount');
  };

  // Truncate wallet address for display (crypto-style)
  const truncateAddress = (address: string | undefined, startLength = 6, endLength = 4) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.substring(0, startLength)}****${address.substring(address.length - endLength)}`;
  };

  // Calculate relative time (e.g., "2 days ago", "3 hours ago")
  const getRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Recently';
      
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffYears > 0) {
        return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
      } else if (diffMonths > 0) {
        return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
      } else if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.error('[SendBottomSheet] Error calculating relative time:', error);
      return 'Recently';
    }
  };

  // Get recent sent transactions (unique addresses)
  const recentAddresses = useMemo(() => {
    if (!transactionsData) {
      console.log('[SendBottomSheet] No transaction data available');
      return [];
    }

    // Combine all transactions from all time periods
    const allTransactions = [
      ...(transactionsData.today || []),
      ...(transactionsData.yesterday || []),
      ...(transactionsData.lastWeek || []),
      ...(transactionsData.lastMonth || []),
    ];

    console.log('[SendBottomSheet] Total transactions:', allTransactions.length);

    // Debug: Log first transaction to see structure
    if (allTransactions.length > 0) {
      console.log('[SendBottomSheet] First transaction sample:', JSON.stringify(allTransactions[0], null, 2));
    }

    // Filter only 'sent' transactions with valid 'to' addresses
    const sentTransactions = allTransactions
      .filter((tx: any) => {
        const isSent = tx.type === 'sent';
        // Check if 'to.walletAddress' exists (new field from backend)
        const hasWalletAddress = tx.to?.walletAddress && typeof tx.to.walletAddress === 'string' && tx.to.walletAddress.length > 0;
        return isSent && hasWalletAddress;
      })
      .sort((a: any, b: any) => {
        // Sort by date descending (most recent first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    console.log('[SendBottomSheet] Sent transactions with addresses:', sentTransactions.length);

    // Get unique addresses (only first occurrence of each address)
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

    const result = Array.from(uniqueAddresses.values()).slice(0, 3);
    console.log('[SendBottomSheet] Recent unique addresses:', result.length);
    
    return result;
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
    console.log('[SendBottomSheet] Confirm from address pressed');
    // Clear selected friend if any (wallet address flow)
    setSelectedFriend(null);
    // Navigate to amount view
    // First update local state
    setPreviousView('wallet-address');
    setView('amount');
    console.log('[SendBottomSheet] View state set to amount');
    // Then notify parent to update bottom sheet snap point
    onViewChange?.('amount');
    console.log('[SendBottomSheet] onViewChange callback called');
  };

  const handleConfirmFromAmount = () => {
    console.log('[SendBottomSheet] Confirm from amount pressed');
    const inputValue = parseFloat(amount.replace('$', '').replace(/,/g, '')) || 0;
    console.log('[SendBottomSheet] Amount value:', inputValue);
    
    if (inputValue > 0) {
      // Navigate to confirmation view
      console.log('[SendBottomSheet] Navigating to confirmation view');
      setPreviousView('amount');
      setView('confirmation');
      onViewChange?.('confirmation');
    } else {
      console.log('[SendBottomSheet] Invalid amount, cannot proceed');
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
                Done
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

  console.log('[SendBottomSheet] Current view:', view);
  
  if (view === 'options') {
    return (
      <VStack px="$4" py="$4" space="lg">
        {/* Title */}
        <HStack justifyContent="center" alignItems="center">
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Send TIPS
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
                    Send to Wallet Address
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    TIPS Yollamak istediğiniz cüzdan adresini yapıştırarak gönderim sağlayın.
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>

          {/* Friend Option */}
          <Pressable onPress={() => {
            openTrusterListBottomSheet();
          }}>
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
                    Send to Friend
                  </Text>
                  <Text fontSize={9} color="$textLight500" $dark-color="$textDark400" lineHeight={14}>
                    Select a friend from your friend list to send TIPS.
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
            Send TIPS
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
            To:
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

  if (view === 'truster-list') {
    // Truster List View - Shows list of friends to select
    console.log('[SendBottomSheet] 🎨 Rendering truster-list view');
    console.log('[SendBottomSheet] 🎨 Truster list data:', trusterList);
    console.log('[SendBottomSheet] 🎨 Is loading:', isLoadingTrusters);
    return (
      <TrusterListContent
        trusterList={trusterList || []}
        isLoadingTrusters={isLoadingTrusters}
        onTrusterSelect={handleTrusterSelect}
        onClose={handleBack}
        isDark={isDark}
      />
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
          console.log('[SendBottomSheet] ✅ Friend confirmed, moving to amount');
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
          // Back to previous view (truster-list or wallet-address)
          if (previousView === 'friend-selection' || selectedFriend) {
            setView('truster-list');
            onViewChange?.('truster-list');
          } else if (previousView === 'wallet-address' || walletAddress) {
            setView('wallet-address');
            onViewChange?.('wallet-address');
          } else {
            // Default: go back to options
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
    console.log('[SendBottomSheet] Rendering confirmation view, current view state:', view);
    const transactionDetails = getTransactionDetails();
    
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
          console.log('[SendBottomSheet] Send button pressed');
          
          // Validate recipient - recipientId VEYA walletAddress olmalı
          const recipientId = selectedFriend?.id;
          if (!recipientId && !walletAddress) {
            console.error('[SendBottomSheet] No recipient selected');
            // TODO: Show error toast to user
            return;
          }

          const tipsAmount = transactionDetails.tipsAmount;
          
          console.log('[SendBottomSheet] Sending transaction:', {
            recipientId: recipientId || undefined,
            walletAddress: walletAddress || undefined,
            amount: tipsAmount,
            message: 'TIPS transfer',
          });

          // Call API to send TIPS - Backend hem recipientId hem walletAddress destekliyor
          console.log('[SendBottomSheet] Sending TIPS:', {
            recipientId,
            walletAddress,
            amount: tipsAmount,
            hasRecipientId: !!recipientId,
            hasWalletAddress: !!walletAddress,
          });
          
          sendTips(
            {
              ...(recipientId && { recipientId }),           // Friend ise recipientId gönder
              ...(walletAddress && { walletAddress }),       // Wallet address ise walletAddress gönder
              amount: tipsAmount,
              message: 'TIPS transfer',
            },
            {
              onSuccess: (response) => {
                console.log('[SendBottomSheet] Send successful:', response);

                // Call onSuccess callback with transaction details
                onSuccess?.({
                  sentAmount: `${tipsAmount.toLocaleString()} TIPS`,
                  transactionFee: `$${transactionDetails.transactionFee}`,
                  remainingBalance: `${transactionDetails.remainingBalance.toLocaleString()} TIPS`,
                  transactionId: response.transactionId,
                });

                // Close bottom sheet
                onClose();
              },
              onError: (error: any) => {
                console.error('[SendBottomSheet] Send failed:', error);
                // TODO: Show error toast to user
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
    </VStack>
    );
  }

  // Fallback - should never reach here
  console.warn('[SendBottomSheet] Unknown view state:', view);
  return null;
};

