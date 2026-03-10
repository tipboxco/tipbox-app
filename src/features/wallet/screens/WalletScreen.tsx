import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Box, VStack, Text, HStack, Pressable, Image } from '@gluestack-ui/themed';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { Header } from '@/src/components/Header';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '@/src/hooks/useTranslation';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import type { WalletStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
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
import { SwapBottomSheet } from '../components/SwapBottomSheet';
import { SuccessBottomSheet } from '../components/SuccessBottomSheet';
import { NFTFilterBottomSheet } from '../components/NFTFilterBottomSheet';
import { NFTSortBottomSheet, SortOption } from '../components/NFTSortBottomSheet';
import { TransactionFilterBottomSheet, TransactionFilterValue } from '../components/TransactionFilterBottomSheet';
import { TransactionPeriodBottomSheet, TransactionPeriodValue } from '../components/TransactionPeriodBottomSheet';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaValues } from '@/src/utils';
import { useWalletBalance, useWalletTransactions, useWalletInfo } from '../api/hooks';
import { useMyNFTs } from '@/src/features/marketplace/api/hooks';
import { useAppStore } from '@/src/store/appStore';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type WalletScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<WalletStackParamList, 'WalletScreen'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const WalletScreen: React.FC = () => {
      const navigation = useNavigation<WalletScreenNavigationProp>();
      const { t } = useTranslation('wallet');
      const { colorMode } = useColorMode();
      const isDark = colorMode === 'dark';
      const [activeTab, setActiveTab] = useState<'tips' | 'nft'>('tips');
      const safeAreaValues = useSafeAreaValues();
      const topInset = typeof safeAreaValues.top === 'number' ? safeAreaValues.top : 0;
      const bottomInset = typeof safeAreaValues.bottom === 'number' ? safeAreaValues.bottom : 0;
      const pagerRef = useRef<PagerView>(null);
      const tabContainerRef = useRef<any>(null);
      const tipsScrollViewRef = useRef<ScrollView>(null);
      const nftScrollViewRef = useRef<ScrollView>(null);
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
  const { data: walletInfo, isLoading: isLoadingWalletInfo, error: walletInfoError, refetch: refetchWalletInfo } = useWalletInfo();
  const { data: walletBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useWalletBalance();
  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useWalletTransactions();
  const { data: nftsData, isLoading: isLoadingNFTs, refetch: refetchNFTs } = useMyNFTs();
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = React.useState(false);

  // Handle pull to refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWalletInfo(),
        refetchBalance(),
        refetchTransactions(),
        refetchNFTs(),
      ]);
    } catch (error) {
      console.error('[WalletScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWalletInfo, refetchBalance, refetchTransactions, refetchNFTs]);
  
  // Enable/disable navigation gesture based on current page
  // When on first page (TIPS), allow swipe back to FeedScreen
  // When on other pages, disable navigation gesture to prevent conflict with PagerView
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: currentPage === 0, // Only enable on first page
    });
  }, [currentPage, navigation]);
  const handleCopyAddress = useCallback(async () => {
    if (walletInfo?.walletIdentifier) {
      await Clipboard.setStringAsync(walletInfo.walletIdentifier);
      Alert.alert(t('receiveBottomSheet.copied'), t('receiveBottomSheet.addressCopied'));
    }
  }, [walletInfo?.walletIdentifier, t]);
  
  const [successTransactionDetails, setSuccessTransactionDetails] = React.useState<{
    sentAmount?: string;
    receivedAmount?: string;
    transactionFee?: string;
    remainingBalance?: string;
    transactionId?: string;
  } | null>(null);
  
  // NFT Filter & Sort States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('rarity_desc');
  
  // Transaction History Filter (single-select)
  const [selectedTxFilter, setSelectedTxFilter] = useState<TransactionFilterValue>('all');
  const [selectedTxPeriod, setSelectedTxPeriod] = useState<TransactionPeriodValue>('all');

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
          title={t('successBottomSheet.title')}
          message={t('successBottomSheet.message')}
          transactionDetails={transactionDetails}
        />,
        {
          enableDynamicSizing: false,
          snapPoints: ['50%'], // Success message + transaction details
          enablePanDownToClose: true,
          enableOverDrag: false,
          enableHandlePanningGesture: true,
          enableContentPanningGesture: true,
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


  const sendBottomSheetContentRef = React.useRef<React.ReactNode>(null);
  const [pendingFriend, setPendingFriend] = React.useState<{
    id: string;
    name: string;
    title?: string;
    bio?: string;
    avatar: any;
  } | null>(null);

  // Listen for friend selection from SelectFriendScreen
  React.useEffect(() => {
    if (pendingFriend) {
      // Friend was selected, reopen bottom sheet with amount view
      const bottomSheetContent = (
        <SendBottomSheet
          onClose={() => {
            closeBottomSheet();
            setPendingFriend(null);
          }}
          onViewChange={handleSendViewChange}
          onSuccess={handleSendSuccess}
          onNavigateToFriendSelect={handleNavigateToFriendSelect}
          initialView="amount"
          selectedFriend={pendingFriend}
        />
      );

      sendBottomSheetContentRef.current = bottomSheetContent;

      openBottomSheet(
        bottomSheetContent,
        {
          enableDynamicSizing: false,
          snapPoints: ['60%'], // Multi-view send flow (options/address/amount/confirmation)
          enablePanDownToClose: true,
          enableOverDrag: false,
          enableHandlePanningGesture: true,
          enableContentPanningGesture: true,
          animateOnMount: true,
          paddingBottom: bottomInset,
          handleIndicatorStyle: {
            backgroundColor: isDark ? '#333333' : '#B8B8B7',
            width: 70,
            height: 5,
          },
        }
      );
    }
  }, [pendingFriend, openBottomSheet, closeBottomSheet, bottomInset, isDark, handleSendSuccess, handleSendViewChange, handleNavigateToFriendSelect]);

  const handleSendViewChange = useCallback((view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => {
    if (!sendBottomSheetContentRef.current) {
      return;
    }

    const optionsForView = {
      enableDynamicSizing: false,
      snapPoints: ['60%'], // Multi-view send flow
      enablePanDownToClose: true,
      enableOverDrag: false,
      enableHandlePanningGesture: true,
      enableContentPanningGesture: true,
      animateOnMount: true,
      paddingBottom: bottomInset,
      handleIndicatorStyle: {
        backgroundColor: isDark ? '#333333' : '#B8B8B7',
        width: 70,
        height: 5,
      },
    };

    openBottomSheet(sendBottomSheetContentRef.current, optionsForView);
  }, [openBottomSheet, bottomInset, isDark]);

  const handleNavigateToFriendSelect = useCallback(() => {
    navigation.navigate('SelectFriendScreen', {
      onSelect: (friendData) => {
        setPendingFriend(friendData);
      },
    });
  }, [navigation]);

  const handleSendPress = useCallback(() => {
    const bottomSheetContent = (
      <SendBottomSheet
        onClose={closeBottomSheet}
        onViewChange={handleSendViewChange}
        onSuccess={handleSendSuccess}
        onNavigateToFriendSelect={handleNavigateToFriendSelect}
      />
    );

    sendBottomSheetContentRef.current = bottomSheetContent;
    
    openBottomSheet(
      bottomSheetContent,
      {
        enableDynamicSizing: false,
        snapPoints: ['60%'], // Multi-view send flow
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, handleSendSuccess, handleSendViewChange, handleNavigateToFriendSelect]);

  const handleSwapPress = useCallback(() => {
    openBottomSheet(
      <SwapBottomSheet
        onClose={closeBottomSheet}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['70%'], // Token swap interface with selectors
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
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

  const handleClaimPress = useCallback(() => {
    openBottomSheet(
      <ClaimBottomSheet
        onClose={closeBottomSheet}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['55%'], // Claim form with options
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
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
    openBottomSheet(
      <ReceiveBottomSheet
        onClose={closeBottomSheet}
        walletAddress={walletInfo?.walletIdentifier || ''}
        userName={user?.fullName || 'User'}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['65%'], // QR code + wallet address info
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
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

      // Tab değiştiğinde scroll pozisyonunu sıfırla
      if (position === 0) {
        tipsScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      } else {
        nftScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }
    },
    [progress, tipsScrollViewRef, nftScrollViewRef]
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

  // Apply Transaction History filter (single-select)
  const filteredTransactions = useMemo(() => {
    const matchesFilter = (tx: any): boolean => {
      if (selectedTxFilter === 'all') return true;

      const status = tx?.status;
      const type = tx?.type;
      const actionType = tx?.actionType;

      // Failed filter has priority
      if (selectedTxFilter === 'failed') {
        return status === 'failed';
      }
      // Exclude failed from other filters
      if (status === 'failed') {
        return false;
      }

      switch (selectedTxFilter) {
        case 'nft':
          return actionType === 'NFT_BUY' || actionType === 'NFT_SELL';
        case 'claim':
          return actionType === 'CLAIM_REWARD' || actionType === 'CLAIM_BADGE';
        case 'airdrop':
          return actionType === 'AIRDROP';
        case 'sent':
          return type === 'sent';
        case 'received':
          return type === 'received';
        default:
          return true;
      }
    };

    return {
      today: (transactions.today || []).filter(matchesFilter),
      yesterday: (transactions.yesterday || []).filter(matchesFilter),
      lastWeek: (transactions.lastWeek || []).filter(matchesFilter),
      lastMonth: (transactions.lastMonth || []).filter(matchesFilter),
    };
  }, [transactions, selectedTxFilter]);

  // Calculate balance change from today's transactions
  const balanceChange = useMemo(() => {
    if (!transactions.today || transactions.today.length === 0) {
      return { amount: 0, percentage: 0, isPositive: true };
    }

    // Calculate net change from today's transactions
    const netChange = transactions.today.reduce((acc, tx) => {
      if (tx.type === 'received') {
        return acc + tx.amount;
      } else if (tx.type === 'sent') {
        return acc - tx.amount;
      }
      return acc;
    }, 0);

    // Calculate percentage change based on current balance
    const currentBalance = walletBalance?.balance || 0;
    const previousBalance = currentBalance - netChange;
    const percentage = previousBalance > 0 
      ? ((netChange / previousBalance) * 100) 
      : 0;

    // Assume 1 TIP = $0.014084 (based on SOL conversion rate)
    const TIP_PRICE_USD = 0.014084;
    const dollarAmount = netChange * TIP_PRICE_USD;

    return {
      amount: netChange,
      dollarAmount: dollarAmount,
      percentage: percentage,
      isPositive: netChange >= 0,
    };
  }, [transactions.today, walletBalance]);

  const handleTransactionFilterPress = useCallback(() => {
    openBottomSheet(
      <TransactionFilterBottomSheet
        value={selectedTxFilter}
        onChange={(next: TransactionFilterValue) => setSelectedTxFilter(next)}
        onClose={closeBottomSheet}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['45%'], // 7 filter options (All, NFT, Claim, Airdrop, Sent, Received, Failed)
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, selectedTxFilter]);

  const handleTransactionPeriodPress = useCallback(() => {
    openBottomSheet(
      <TransactionPeriodBottomSheet
        value={selectedTxPeriod}
        onChange={(next: TransactionPeriodValue) => setSelectedTxPeriod(next)}
        onClose={closeBottomSheet}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['35%'], // 5 period options (All, Today, Yesterday, Last Week, Last Month)
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, selectedTxPeriod]);

  const shouldShowPeriod = useCallback(
    (period: TransactionPeriodValue) => selectedTxPeriod === 'all' || selectedTxPeriod === period,
    [selectedTxPeriod]
  );

  // NFT Item interface
  interface NftItem {
    id: string;
    name: string;
    type: string; // Type field ekledik
    rarity: 'Usual' | 'Rare';
    rarityColor: string;
    rarityBorderColor: string;
    rarityTextColor?: string;
    image: any;
    listing?: {
      id: string;
      price: number;
      listedAt: string;
      status: string;
    };
  }

  // Transform API NFTs data
  const nfts: NftItem[] = useMemo(() => {
    if (!nftsData || nftsData.length === 0) {
      return [];
    }
    
    return nftsData.map((nft: any) => {
      // Rarity mapping: Backend'den gelen İngilizce değerleri UI'a uygun formata çevir
      const rarityMap: Record<string, 'Usual' | 'Rare'> = {
        'COMMON': 'Usual',
        'RARE': 'Rare',
        'EPIC': 'Rare',
        'LEGENDARY': 'Rare',
      };
      
      const mappedRarity = rarityMap[nft.rarity || 'COMMON'] || 'Usual';
      
      // Image handling: API'den gelen path varsa kullan, yoksa default göster
      let imageSource;
      if (nft.image && nft.image.trim() !== '') {
        // API'den gelen image path'i kullan (backend'in base URL'i ile birleştirilecek)
        imageSource = { uri: `${nft.image}` };
      } else {
        // Default badge görseli
        imageSource = require('@/assets/defaultImages/default-badge.png');
      }
      
      return {
        id: nft.id || String(Math.random()),
        name: nft.title || 'Unnamed NFT',
        type: nft.type || 'Unknown', // Type bilgisini ekledik
        rarity: mappedRarity,
        rarityColor: mappedRarity === 'Rare' 
          ? 'rgba(255, 8, 152, 0.4)' 
          : 'rgba(211, 211, 211, 0.4)',
        rarityBorderColor: mappedRarity === 'Rare'
          ? '#EF4F75' 
          : '#D4D4D4',
        rarityTextColor: mappedRarity === 'Rare'
          ? '#AB2847' 
          : undefined,
        image: imageSource,
        listing: nft.listing, // Listing bilgisini ekledik
      };
    });
  }, [nftsData]);

  // Get available types from NFT data
  const availableTypes = useMemo(() => {
    if (!nftsData || nftsData.length === 0) {
      return [];
    }
    const types = new Set<string>();
    nftsData.forEach((nft: any) => {
      if (nft.type) {
        types.add(nft.type);
      }
    });
    return Array.from(types);
  }, [nftsData]);

  // Filter and Sort NFTs
  const filteredAndSortedNfts = useMemo(() => {
    let result = [...nfts];

    // Apply Type Filter
    if (selectedTypes.length > 0) {
      result = result.filter((nft) => selectedTypes.includes(nft.type));
    }

    // Apply Sort
    switch (sortOption) {
      case 'rarity_desc':
        // Rare first, then Usual
        result.sort((a, b) => {
          if (a.rarity === 'Rare' && b.rarity !== 'Rare') return -1;
          if (a.rarity !== 'Rare' && b.rarity === 'Rare') return 1;
          return 0;
        });
        break;
      case 'rarity_asc':
        // Usual first, then Rare
        result.sort((a, b) => {
          if (a.rarity === 'Usual' && b.rarity !== 'Usual') return -1;
          if (a.rarity !== 'Usual' && b.rarity === 'Usual') return 1;
          return 0;
        });
        break;
    }

    // PRIORITY: Move "ON SALE" items to the top
    result.sort((a, b) => {
      const aIsOnSale = a.listing?.status === 'ACTIVE';
      const bIsOnSale = b.listing?.status === 'ACTIVE';
      
      if (aIsOnSale && !bIsOnSale) return -1;
      if (!aIsOnSale && bIsOnSale) return 1;
      return 0;
    });

    return result;
  }, [nfts, selectedTypes, sortOption]);

  // Handle Filter Button Press
  const handleFilterPress = useCallback(() => {
    openBottomSheet(
      <NFTFilterBottomSheet
        onClose={closeBottomSheet}
        onApply={(types) => setSelectedTypes(types)}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['50%'], // NFT type filters with checkboxes
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, availableTypes, selectedTypes]);

  // Handle Sort Button Press
  const handleSortPress = useCallback(() => {
    openBottomSheet(
      <NFTSortBottomSheet
        onClose={closeBottomSheet}
        onApply={(sort) => setSortOption(sort)}
        sortOption={sortOption}
      />,
      {
        enableDynamicSizing: false,
        snapPoints: ['30%'], // 2 sort options (Rarity Desc/Asc)
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomInset,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomInset, isDark, sortOption]);

  return (
    <SafeAreaView 
      edges={['top', 'bottom', 'left', 'right']} 
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
    >
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <VStack flex={1}>
        <Header
          title={t('header.title')}
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
                {t('tabs.tips')}
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
                {t('tabs.nft')}
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
            ref={tipsScrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16 + bottomInset
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? '#FFFFFF' : '#000000'}
                colors={['#000000']}
              />
            }
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
                  name={user?.fullName || t('walletCard.user')}
                  address={walletInfo?.walletIdentifier || t('walletCard.addressNotFound')}
                  onCopyPress={handleCopyAddress}
                />
              )}

              {/* Balance Card */}
              <Box bg="$backgroundLight0" $dark-bg="$backgroundDark900" borderWidth={1} borderColor="$borderLight200" $dark-borderColor="$borderDark600" rounded={5} p="$4">
                <VStack space="sm" alignItems="center">
                  <Text fontSize={14} color="#B9B9B9" fontWeight={'$bold'}>{t('balance.currentBalance')}</Text>
                  {isLoadingBalance ? (
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                  ) : (
                    <AnimatedCounter
                      value={Number((walletBalance?.balance || 0).toFixed(2))}
                      fontSize={38}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  )}
                  <HStack space="sm" alignItems="center">
                    <Text 
                      fontSize={11} 
                      fontWeight="$semibold" 
                      color={balanceChange.isPositive ? '#3CA241' : '#CE4A4A'}
                    >
                      {balanceChange.isPositive ? '+' : ''}{balanceChange.amount.toFixed(2)} TIPS
                    </Text>
                    <Box 
                      bg={balanceChange.isPositive ? 'rgba(60, 162, 65, 0.1)' : 'rgba(206, 74, 74, 0.1)'} 
                      borderWidth={1}
                      borderColor={balanceChange.isPositive ? '#3CA241' : '#CE4A4A'}
                      rounded={3} 
                      px={8} 
                      py={4}
                    >
                      <Text 
                        fontSize={11} 
                        fontWeight="$semibold"
                        color={balanceChange.isPositive ? '#3CA241' : '#CE4A4A'}
                      >
                        {balanceChange.isPositive ? '+' : ''}{balanceChange.percentage.toFixed(2)}%
                      </Text>
                    </Box>
                  </HStack>
                </VStack>

                {/* Quick Actions */}
                <HStack mt="$4" space="md">
                  {[
                    { icon: QrCodeIcon, label: 'receive' as const, onPress: handleReceivePress },
                    { icon: PaperAirplaneIcon, label: 'send' as const, onPress: handleSendPress },
                    { icon: ArrowsRightLeftIcon, label: 'swap' as const, onPress: handleSwapPress },
                    { icon: GiftIcon, label: 'claim' as const, onPress: handleClaimPress },
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
                            {t(`quickActions.${action.label}`)}
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
                  {t('transactions.title')}
                </Text>
                <HStack space="sm" alignItems="center">
                  <Pressable
                    onPress={handleTransactionFilterPress}
                    px={8}
                    py={4}
                    borderWidth={1}
                    borderColor="$borderLight200"
                    $dark-borderColor="$borderDark600"
                    rounded={5}
                  >
                    <FunnelIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                  </Pressable>
                  <Pressable
                    onPress={handleTransactionPeriodPress}
                    px={8}
                    py={4}
                    borderWidth={1}
                    borderColor="$borderLight200"
                    $dark-borderColor="$borderDark600"
                    rounded={5}
                  >
                    <PresentationChartBarIcon width={16} height={16} color={isDark ? '#FFFFFF' : '#000000'} />
                  </Pressable>
                </HStack>
              </HStack>

              {/* Transaction History */}
              {isLoadingTransactions ? (
                <VStack alignItems="center" py="$8">
                  <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                    {t('transactions.loading')}
                  </Text>
                </VStack>
              ) : (
                <>
                  {/* Today Section */}
                  {shouldShowPeriod('today') && filteredTransactions.today && filteredTransactions.today.length > 0 && (
                    <VStack space="md">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        {t('transactions.today')}
                      </Text>
                      {filteredTransactions.today.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`today-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          actionType={transaction.actionType}
                          status={transaction.status}
                          txHash={transaction.txHash}
                          errorMessage={transaction.errorMessage}
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
                  {shouldShowPeriod('yesterday') && filteredTransactions.yesterday && filteredTransactions.yesterday.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        {t('transactions.yesterday')}
                      </Text>
                      {filteredTransactions.yesterday.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`yesterday-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          actionType={transaction.actionType}
                          status={transaction.status}
                          txHash={transaction.txHash}
                          errorMessage={transaction.errorMessage}
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
                  {shouldShowPeriod('lastWeek') && filteredTransactions.lastWeek && filteredTransactions.lastWeek.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        {t('transactions.lastWeek')}
                      </Text>
                      {filteredTransactions.lastWeek.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`lastWeek-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          actionType={transaction.actionType}
                          status={transaction.status}
                          txHash={transaction.txHash}
                          errorMessage={transaction.errorMessage}
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
                  {shouldShowPeriod('lastMonth') && filteredTransactions.lastMonth && filteredTransactions.lastMonth.length > 0 && (
                    <VStack space="md" mt="$4">
                      <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                        {t('transactions.lastMonth')}
                      </Text>
                      {filteredTransactions.lastMonth.map((transaction: any, index: number) => (
                        <HistoryCard
                          key={`lastMonth-${index}`}
                          type={transaction.description || transaction.actionType || 'Transaction'}
                          description={transaction.reason || ''}
                          amount={`${transaction.type === 'sent' ? '-' : '+'}${transaction.amount} ${transaction.currency || 'TIPS'}`}
                          amountColor={transaction.amountColor || '#000000'}
                          actionType={transaction.actionType}
                          status={transaction.status}
                          txHash={transaction.txHash}
                          errorMessage={transaction.errorMessage}
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
                  {(
                    (selectedTxPeriod === 'all' &&
                      (!filteredTransactions.today || filteredTransactions.today.length === 0) &&
                      (!filteredTransactions.yesterday || filteredTransactions.yesterday.length === 0) &&
                      (!filteredTransactions.lastWeek || filteredTransactions.lastWeek.length === 0) &&
                      (!filteredTransactions.lastMonth || filteredTransactions.lastMonth.length === 0)) ||
                    (selectedTxPeriod === 'today' && (!filteredTransactions.today || filteredTransactions.today.length === 0)) ||
                    (selectedTxPeriod === 'yesterday' && (!filteredTransactions.yesterday || filteredTransactions.yesterday.length === 0)) ||
                    (selectedTxPeriod === 'lastWeek' && (!filteredTransactions.lastWeek || filteredTransactions.lastWeek.length === 0)) ||
                    (selectedTxPeriod === 'lastMonth' && (!filteredTransactions.lastMonth || filteredTransactions.lastMonth.length === 0))
                  ) && (
                    <VStack alignItems="center" py="$8">
                      <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        {t('transactions.noTransactionsFound')}
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
            ref={nftScrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16 + bottomInset
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? '#FFFFFF' : '#000000'}
                colors={['#000000']}
              />
            }
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
                  name={user?.fullName || t('walletCard.user')}
                  address={walletInfo?.walletIdentifier || t('walletCard.addressNotFound')}
                  onCopyPress={handleCopyAddress}
                />
              )}

              {/* NFT Assets Header */}
              <VStack space="md">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                    {t('nft.title')}
                  </Text>
                  <HStack space="xs" alignItems="center">
                    {/* Filter Button */}
                    <Pressable
                      onPress={handleFilterPress}
                      bg="$backgroundLight0"
                      $dark-bg="$backgroundDark800"
                      borderWidth={1}
                      borderColor="#EFEFEF"
                      $dark-borderColor="$borderDark600"
                      rounded={20}
                      px="$4"
                      py="$2"
                    >
                      <HStack alignItems="center" space="xs">
                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                          {t('nft.filter')}
                        </Text>
                        <ChevronDownIcon width={14} height={14} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                    {/* Sort Button */}
                    <Pressable
                      onPress={handleSortPress}
                      bg="$backgroundLight0"
                      $dark-bg="$backgroundDark800"
                      borderWidth={1}
                      borderColor="#EFEFEF"
                      $dark-borderColor="$borderDark600"
                      rounded={20}
                      px="$4"
                      py="$2"
                    >
                      <HStack alignItems="center" space="xs">
                        <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                          {t('nft.sort')}
                        </Text>
                        <ChevronDownIcon width={14} height={14} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                  </HStack>
                </HStack>

                {/* NFT Grid */}
                {isLoadingNFTs ? (
                  <VStack alignItems="center" py="$4">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                      {t('nft.loading')}
                    </Text>
                  </VStack>
                ) : filteredAndSortedNfts.length === 0 ? (
                  <VStack alignItems="center" py="$8">
                    <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                      {selectedTypes.length > 0 ? t('nft.noMatchingFilter') : t('nft.noNfts')}
                    </Text>
                  </VStack>
                ) : (
                  <VStack space="md">
                    {filteredAndSortedNfts.reduce((rows: NftItem[][], nft, index) => {
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
                                  position="relative"
                                >
                                  <Image
                                    source={nft.image}
                                    alt={nft.name}
                                    w={135}
                                    h={135}
                                    resizeMode="contain"
                                  />
                                  
                                  {/* ON SALE Badge - Top Right */}
                                  {nft.listing?.status === 'ACTIVE' && (
                                    <Box
                                      position="absolute"
                                      top={8}
                                      right={8}
                                      bg="rgba(194, 230, 7, 0.95)"
                                      borderRadius={10}
                                      px="$2"
                                      py="$1"
                                    >
                                      <Text
                                        color="#596B00"
                                        fontSize={8}
                                        fontWeight="$bold"
                                      >
                                        {t('nft.onSale')}
                                      </Text>
                                    </Box>
                                  )}
                                  
                                  {/* Price Badge - Top Left (only if listed) */}
                                  {nft.listing?.status === 'ACTIVE' && nft.listing.price && (
                                    <Box
                                      position="absolute"
                                      top={8}
                                      left={8}
                                      bg="rgba(0, 0, 0, 0.7)"
                                      borderRadius={10}
                                      px="$2"
                                      py="$1"
                                    >
                                      <Text
                                        color="#FFFFFF"
                                        fontSize={9}
                                        fontWeight="$bold"
                                      >
                                        {Math.floor(nft.listing.price)} {t('nft.tips')}
                                      </Text>
                                    </Box>
                                  )}
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
                )}
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


