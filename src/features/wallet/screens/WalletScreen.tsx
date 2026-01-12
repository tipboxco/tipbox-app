import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Box, VStack, Text, HStack, Pressable, Image } from '@gluestack-ui/themed';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { Header } from '@/src/components/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  QrCodeIcon,
  PaperAirplaneIcon,
  ArrowsRightLeftIcon,
  GiftIcon,
  FunnelIcon,
  PresentationChartBarIcon,
  ChevronDownIcon,
  TrophyIcon,
} from 'react-native-heroicons/outline';
import { WalletCardInfo } from '../components/WalletCardInfo';
import { HistoryCard } from '../components/HistoryCard';
import { SendBottomSheet } from '../components/SendBottomSheet';
import { ReceiveBottomSheet } from '../components/ReceiveBottomSheet';
import { ClaimBottomSheet } from '../components/ClaimBottomSheet';
import { SuccessBottomSheet } from '../components/SuccessBottomSheet';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';
import { useSafeAreaValues } from '@/src/utils';
import { useWalletBalance, useWalletTransactions, useWalletInfo } from '../api/hooks';
import { useMyNFTs } from '@/src/features/marketplace/api/hooks';
import { useAppStore } from '@/src/store/appStore';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export const WalletScreen: React.FC = () => {
      const navigation = useNavigation<any>();
      const { colorMode } = useColorMode();
      const isDark = colorMode === 'dark';
      const [activeTab, setActiveTab] = useState<'tips' | 'nft'>('tips');
      const bottomInset = useSafeAreaValues('bottom');
      const pagerRef = useRef<PagerView>(null);
      const tabContainerRef = useRef<any>(null);
      const [tabContainerWidth, setTabContainerWidth] = useState(0);
      const [currentPage, setCurrentPage] = useState(0);
      
      // Shared progress value for realtime tab animations (0 = TIPS, 1 = NFT)
      const progress = useSharedValue(0);
      
      // Track if user is trying to swipe left on first page (to go back)
      const isSwipingBack = useRef(false);

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // App Store
  const user = useAppStore((state) => state.user);
  
  // API hooks
  const { data: walletInfo, isLoading: isLoadingWalletInfo, error: walletInfoError } = useWalletInfo();
  const { data: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
  const { data: transactionsData, isLoading: isLoadingTransactions } = useWalletTransactions();
  const { data: nftsData, isLoading: isLoadingNFTs } = useMyNFTs();
  
  // Debug: Log wallet info
  React.useEffect(() => {
    console.log('[WalletScreen] 🔍 Wallet Info Debug:', {
      isLoading: isLoadingWalletInfo,
      hasError: !!walletInfoError,
      error: walletInfoError,
      data: walletInfo,
      walletIdentifier: walletInfo?.walletIdentifier,
      user: user?.fullName,
    });
  }, [walletInfo, isLoadingWalletInfo, walletInfoError, user]);
  
  // Enable/disable navigation gesture based on current page
  // When on first page (TIPS), allow swipe back to FeedScreen
  // When on other pages, disable navigation gesture to prevent conflict with PagerView
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: currentPage === 0, // Only enable on first page
    });
  }, [currentPage, navigation]);
  const handleCopyAddress = useCallback(() => {
    if (walletInfo?.walletIdentifier) {
      Clipboard.setString(walletInfo.walletIdentifier);
      Alert.alert('Copied', 'Wallet address copied to clipboard');
    }
  }, [walletInfo?.walletIdentifier]);
  
  const [sendSheetView, setSendSheetView] = React.useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection'>('options');
  const [successTransactionDetails, setSuccessTransactionDetails] = React.useState<{
    sentAmount?: string;
    receivedAmount?: string;
    transactionFee?: string;
    remainingBalance?: string;
    transactionId?: string;
  } | null>(null);

  const handleSendSuccess = useCallback((transactionDetails: {
    sentAmount: string;
    transactionFee: string;
    remainingBalance: string;
    transactionId?: string;
  }) => {
    setSuccessTransactionDetails(transactionDetails);
    // Close send bottom sheet
    closeBottomSheet();
    // Open success bottom sheet
    setTimeout(() => {
      openBottomSheet(
        <SuccessBottomSheet
          onClose={() => {
            closeBottomSheet();
            setSuccessTransactionDetails(null);
          }}
          title="Transaction Successful"
          message="Your transaction has been completed successfully."
          transactionDetails={transactionDetails}
        />,
        {
          enablePanDownToClose: true,
          enableOverDrag: false,
          enableHandlePanningGesture: true,
          enableContentPanningGesture: true,
          enableDynamicSizing: true,
          animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
          paddingBottom: bottomInset,
          handleIndicatorStyle: {
            backgroundColor: isDark ? '#333333' : '#B8B8B7',
            width: 70,
            height: 5,
          },
        }
      );
    }, 300);
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark]);

  const handleSendViewChange = useCallback((view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => {
    console.log('[WalletScreen] View changing to:', view);
    setSendSheetView(view);
    // enableDynamicSizing kullanıldığında içerik otomatik olarak boyutlanır,
    // bu yüzden snapToIndex çağrılarına gerek yok
  }, []);

  const handleSendPress = useCallback(() => {
    console.log('[WalletScreen] Send button pressed');
    setSendSheetView('options');
    openBottomSheet(
      <SendBottomSheet
        onClose={() => {
          closeBottomSheet();
          setSendSheetView('options');
        }}
        onWalletAddressPress={() => {
          // Bottom sheet will handle its own state change
        }}
        onFriendPress={() => {
          closeBottomSheet();
          setSendSheetView('options');
          // Navigate to friend selection screen
        }}
        onViewChange={handleSendViewChange}
        onSuccess={handleSendSuccess}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, handleSendViewChange, handleSendSuccess]);

  const handleClaimPress = useCallback(() => {
    console.log('[WalletScreen] Claim button pressed');
    openBottomSheet(
      <ClaimBottomSheet
        onClose={closeBottomSheet}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark]);

  const handleReceivePress = useCallback(() => {
    console.log('[WalletScreen] Receive button pressed');
    openBottomSheet(
      <ReceiveBottomSheet
        onClose={closeBottomSheet}
        walletAddress={walletInfo?.walletIdentifier || ''}
        userName={user?.fullName || 'User'}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, walletInfo?.walletIdentifier, user?.fullName]);

  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      const currentProgress = position + offset;
      progress.value = currentProgress;
      
      // Detect swipe back gesture on first page (TIPS tab)
      // If user is on page 0 and tries to swipe left (negative offset), trigger navigation back
      if (position === 0 && offset < -0.1) {
        // User is swiping left on first page - enable back gesture
        isSwipingBack.current = true;
      } else {
        isSwipingBack.current = false;
      }
    },
    [progress]
  );

  // PagerView page selected handler
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setActiveTab(position === 0 ? 'tips' : 'nft');
      setCurrentPage(position);
    },
    [progress]
  );
  
  // Tab 1 (TIPS) label color animation
  const tab1Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [activeColor, inactiveColor]
    );
    return { color };
  });

  // Tab 2 (NFT) label color animation
  const tab2Style = useAnimatedStyle(() => {
    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = '#8C8C8C';
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    );
    return { color };
  });

  // Indicator position animation
  const tabWidth = tabContainerWidth / 2 || 0;
  const indicatorWidth = tabWidth * 0.5; // Tab genişliğinin %50'si
  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });


  // Transform API transactions data to match component format
  const transactions = useMemo(() => {
    if (!transactionsData) {
      return { today: [], yesterday: [], lastWeek: [], lastMonth: [] };
    }
    return transactionsData;
  }, [transactionsData]);

  // NFT Item interface
  interface NftItem {
    id: string;
    name: string;
    rarity: 'Usual' | 'Rare';
    rarityColor: string;
    rarityBorderColor: string;
    rarityTextColor?: string;
    image: any;
  }

  // Transform API NFTs data
  const nfts: NftItem[] = useMemo(() => {
    if (!nftsData?.pages) {
      return [];
    }
    // Flatten all pages
    const allNFTs = nftsData.pages.flat();
    return allNFTs.map((nft: any) => ({
      id: nft.id || nft.nftId || String(Math.random()),
      name: nft.title || nft.name || 'Unnamed NFT',
      rarity: (nft.rarity === 'Rare' || nft.rarity === 'EPIC' ? 'Rare' : 'Usual') as 'Usual' | 'Rare',
      rarityColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? 'rgba(255, 8, 152, 0.4)' 
        : 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? '#EF4F75' 
        : '#D4D4D4',
      rarityTextColor: nft.rarity === 'Rare' || nft.rarity === 'EPIC' 
        ? '#AB2847' 
        : undefined,
      image: nft.image || require('@/assets/defaultImages/default-badge.png'),
    }));
  }, [nftsData]);

  return (
    <SafeAreaView 
      edges={['top', 'bottom', 'left', 'right']} 
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
    >
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <VStack flex={1}>
        <Header 
          title="Wallet" 
          showBackButton 
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Feed');
            }
          }} 
        />
      {/* Tabs */}
      <VStack pt={0} pb="$4" bg={isDark ? '#000' : '#FFF'}>
        <HStack 
          ref={tabContainerRef}
          borderBottomWidth={1} 
          borderColor="#E9E9E9" 
          p={0} 
          m={0}
          position="relative"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            setTabContainerWidth(width);
          }}
        >
          <Pressable
            onPress={() => handleTabPress(0)}
            flex={1}
            alignItems="center"
            pb={8}
            position="relative"
          >
            <VStack alignItems="center" space="xs">
              <Animated.Text
                style={[
                  {
                    fontSize: 14,
                    fontWeight: 'bold',
                  },
                  tab1Style,
                ]}
              >
                TIPS
              </Animated.Text>
            </VStack>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress(1)}
            flex={1}
            alignItems="center"
            pb={8}
            position="relative"
          >
            <VStack alignItems="center" space="xs">
              <Animated.Text
                style={[
                  {
                    fontSize: 14,
                    fontWeight: 'bold',
                  },
                  tab2Style,
                ]}
              >
                NFT Assets
              </Animated.Text>
            </VStack>
          </Pressable>
          
          {/* Animated Indicator */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: indicatorWidth,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: isDark ? '#FFFFFF' : '#000000',
                },
                indicatorStyle,
              ]}
            />
          )}
        </HStack>
      </VStack>
      
      {/* PagerView - Native swipe tab switching */}
      <AnimatedPagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
        scrollEnabled={true}
        overScrollMode="never"
      >
        {/* TIPS Tab */}
        <Box key="0" flex={1}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 16
            }}
          >
            <VStack space="lg">
              {/* Wallet Card */}
              {isLoadingWalletInfo ? (
                <Box 
                  bg="$backgroundLight0" 
                  $dark-bg="$backgroundDark900" 
                  borderWidth={1} 
                  borderColor="$borderLight200" 
                  $dark-borderColor="$borderDark600" 
                  rounded={5} 
                  p="$4"
                  h={80}
                  justifyContent="center"
                  alignItems="center"
                >
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              ) : (
                <WalletCardInfo 
                  name={user?.fullName || 'Kullanıcı'}
                  address={walletInfo?.walletIdentifier || 'Adres bulunamadı'}
                  onCopyPress={handleCopyAddress}
                />
              )}

              {/* Balance Card */}
              <Box bg="$backgroundLight0" $dark-bg="$backgroundDark900" borderWidth={1} borderColor="$borderLight200" $dark-borderColor="$borderDark600" rounded={5} p="$4">
                <VStack space="sm" alignItems="center">
                  <Text fontSize={14} color="#B9B9B9" fontWeight={'$bold'}>Current Balance</Text>
                  {isLoadingBalance ? (
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                  ) : (
                    <Text fontSize={38} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                      {walletBalance?.balance?.toFixed(2) || '0.00'}
                    </Text>
                  )}
                  <HStack space="sm" alignItems="center">
                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">-$0.24</Text>
                    <Box bg="$backgroundLight200" rounded={3} px="$1" h={16} justifyContent="center">
                      <Text fontSize={11} color="$textLight900" $dark-color="$textDark50">-1.05%</Text>
                    </Box>
                  </HStack>
                </VStack>

                {/* Quick Actions */}
                <HStack mt="$4" space="md">
                  {[
                    { icon: QrCodeIcon, label: 'Receive' as const, onPress: handleReceivePress },
                    { icon: PaperAirplaneIcon, label: 'Send' as const, onPress: handleSendPress },
                    { icon: ArrowsRightLeftIcon, label: 'Swap' as const, onPress: () => navigation.navigate('SwapScreen') },
                    { icon: GiftIcon, label: 'Claim' as const, onPress: handleClaimPress },
                  ].map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Pressable
                        key={action.label}
                        onPress={action.onPress}
                        flex={1}
                        bg="$backgroundLight0"
                        $dark-bg="$backgroundDark800"
                        borderWidth={1}
                        borderColor="$borderLight200"
                        $dark-borderColor="$borderDark600"
                        rounded={10}
                        py="$3"
                        px="$3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <VStack alignItems="center" space="xs">
                          <IconComponent width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                          <Text fontSize={11} fontWeight="$medium" color="$textLight900" $dark-color="$textDark50">
                            {action.label}
                          </Text>
                        </VStack>
                      </Pressable>
                    );
                  })}
                </HStack>
              </Box>

              {/* Transaction History Header */}
              <HStack mt="$4" alignItems="center" justifyContent="space-between">
                <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  Transaction History
                </Text>
                <HStack space="sm" alignItems="center">
                  <Pressable px="$2" py="$1" borderWidth={1} borderColor="$borderLight200" rounded={5}>
                    <FunnelIcon width={16} height={16} color="#000000" />
                  </Pressable>
                  <Pressable px="$2" py="$1" borderWidth={1} borderColor="$borderLight200" rounded={5}>
                    <PresentationChartBarIcon width={16} height={16} color="#000000" />
                  </Pressable>
                </HStack>
              </HStack>

              {/* Transaction History */}
              {isLoadingTransactions ? (
                <VStack alignItems="center" py="$8">
                  <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                    Loading transactions...
                  </Text>
                </VStack>
              ) : (
                <>
                  {/* Today Section */}
                  {transactions.today && transactions.today.length > 0 && (
                    <VStack space="md">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        Today
                      </Text>
                      {transactions.today.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`today-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          transactionType={
                            transaction.status === 'failed' 
                              ? 'failed' 
                              : transaction.actionType === 'CLAIM_REWARD' || transaction.actionType === 'CLAIM_BADGE'
                              ? 'claim'
                              : transaction.actionType === 'AIRDROP'
                              ? 'airdrop'
                              : transaction.type
                          }
                        />
                      ))}
                    </VStack>
                  )}

                  {/* Yesterday Section */}
                  {transactions.yesterday && transactions.yesterday.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        Yesterday
                      </Text>
                      {transactions.yesterday.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`yesterday-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          transactionType={
                            transaction.status === 'failed' 
                              ? 'failed' 
                              : transaction.actionType === 'CLAIM_REWARD' || transaction.actionType === 'CLAIM_BADGE'
                              ? 'claim'
                              : transaction.actionType === 'AIRDROP'
                              ? 'airdrop'
                              : transaction.type
                          }
                        />
                      ))}
                    </VStack>
                  )}

                  {/* Last Week Section */}
                  {transactions.lastWeek && transactions.lastWeek.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        Last Week
                      </Text>
                      {transactions.lastWeek.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`lastWeek-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          transactionType={
                            transaction.status === 'failed' 
                              ? 'failed' 
                              : transaction.actionType === 'CLAIM_REWARD' || transaction.actionType === 'CLAIM_BADGE'
                              ? 'claim'
                              : transaction.actionType === 'AIRDROP'
                              ? 'airdrop'
                              : transaction.type
                          }
                        />
                      ))}
                    </VStack>
                  )}

                  {/* Last Month Section */}
                  {transactions.lastMonth && transactions.lastMonth.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        Last Month
                      </Text>
                      {transactions.lastMonth.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`lastMonth-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          transactionType={
                            transaction.status === 'failed' 
                              ? 'failed' 
                              : transaction.actionType === 'CLAIM_REWARD' || transaction.actionType === 'CLAIM_BADGE'
                              ? 'claim'
                              : transaction.actionType === 'AIRDROP'
                              ? 'airdrop'
                              : transaction.type
                          }
                        />
                      ))}
                    </VStack>
                  )}

                  {/* Empty State */}
                  {(!transactions.today || transactions.today.length === 0) &&
                   (!transactions.yesterday || transactions.yesterday.length === 0) &&
                   (!transactions.lastWeek || transactions.lastWeek.length === 0) &&
                   (!transactions.lastMonth || transactions.lastMonth.length === 0) && (
                    <VStack alignItems="center" py="$8">
                      <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        No transactions found
                      </Text>
                    </VStack>
                  )}
                </>
              )}
            </VStack>
          </ScrollView>
        </Box>

        {/* NFT Tab */}
        <Box key="1" flex={1}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 16
            }}
          >
            <VStack space="lg">
              {/* Wallet Card */}
              {isLoadingWalletInfo ? (
                <Box 
                  bg="$backgroundLight0" 
                  $dark-bg="$backgroundDark900" 
                  borderWidth={1} 
                  borderColor="$borderLight200" 
                  $dark-borderColor="$borderDark600" 
                  rounded={5} 
                  p="$4"
                  h={80}
                  justifyContent="center"
                  alignItems="center"
                >
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              ) : (
                <WalletCardInfo 
                  name={user?.fullName || 'User'}
                  address={walletInfo?.walletIdentifier || 'Address not found'}
                  onCopyPress={handleCopyAddress}
                />
              )}

              {/* NFT Assets Header */}
              <VStack space="md">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={14} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
                    NFT Assets
                  </Text>
                  <HStack space="xs" alignItems="center">
                    {/* Filter Button */}
                    <Pressable
                      bg="$backgroundLight0"
                      $dark-bg="$backgroundDark800"
                      borderWidth={1}
                      borderColor="#EFEFEF"
                      $dark-borderColor="$borderDark600"
                      rounded={20}
                      px="$3"
                      py="$1"
                    >
                      <HStack alignItems="center" space="xs">
                        <Text fontSize={9} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                          Filter
                        </Text>
                        <ChevronDownIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                    {/* Sort Button */}
                    <Pressable
                      bg="$backgroundLight0"
                      $dark-bg="$backgroundDark800"
                      borderWidth={1}
                      borderColor="#EFEFEF"
                      $dark-borderColor="$borderDark600"
                      rounded={20}
                      px="$3"
                      py="$1"
                    >
                      <HStack alignItems="center" space="xs">
                        <Text fontSize={9} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                          Sort
                        </Text>
                        <ChevronDownIcon width={12} height={12} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                  </HStack>
                </HStack>

                {/* NFT Grid */}
                <VStack space="md">
                  {nfts.reduce((rows: NftItem[][], nft, index) => {
                    if (index % 2 === 0) {
                      rows.push([nft]);
                    } else {
                      rows[rows.length - 1].push(nft);
                    }
                    return rows;
                  }, []).map((row, rowIndex) => (
                    <HStack key={rowIndex} space="md" justifyContent="space-between">
                      {row.map((nft) => (
                        <Box key={nft.id} flex={1}>
                          <Pressable onPress={() => navigation.navigate('NftAssetDetailScreen', { nft })}>
                            <Box
                              bg="$backgroundLight0"
                              $dark-bg="$backgroundDark800"
                              borderWidth={1}
                              borderColor="#E9E9E9"
                              $dark-borderColor="$borderDark600"
                              rounded={5}
                              overflow="hidden"
                            >
                              {/* NFT Image */}
                              <Box
                                w="100%"
                                bg="$backgroundLight0"
                                $dark-bg="$backgroundDark800"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Image
                                  source={nft.image}
                                  alt={nft.name}
                                  w={135}
                                  h={135}
                                  resizeMode="contain"
                                />
                              </Box>
                              
                              {/* NFT Info */}
                              <VStack p="$4" space="sm" alignItems="center">
                                {/* NFT Name - Above Badge */}
                                <Text fontSize={12} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="center">
                                  {nft.name}
                                </Text>
                                {/* Rarity Badge */}
                                <HStack
                                  bg={nft.rarityColor}
                                  $dark-bg={nft.rarityColor}
                                  borderWidth={1}
                                  borderColor={nft.rarityBorderColor}
                                  rounded={10}
                                  px="$4"
                                  py="$1"
                                  alignItems="center"
                                  space="xs"
                                >
                                  <TrophyIcon width={10} height={10} color={isDark ? '#FFFFFF' : '#000000'} />
                                  <Text 
                                    fontSize={9} 
                                    fontWeight="$medium" 
                                    color={nft.rarityTextColor || "$textLight900"} 
                                    $dark-color={nft.rarityTextColor || "$textDark50"}
                                  >
                                    {nft.rarity}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Pressable>
                        </Box>
                      ))}
                      {/* Fill empty space if odd number of items */}
                      {row.length === 1 && <Box flex={1} />}
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
      </AnimatedPagerView>

        </VStack>
      </Box>
    </SafeAreaView>
  );
};


