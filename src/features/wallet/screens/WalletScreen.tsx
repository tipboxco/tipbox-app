import React, { useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, Text, HStack, Pressable, Image } from '@gluestack-ui/themed';
import { Header } from '@/src/components/Header';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { WalletCardInfo } from '../components/WalletCardInfo';
import { HistoryCard } from '../components/HistoryCard';
import { SendBottomSheet } from '../components/SendBottomSheet';
import { ClaimBottomSheet } from '../components/ClaimBottomSheet';
import { SuccessBottomSheet } from '../components/SuccessBottomSheet';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';
import { useSafeAreaValues } from '@/src/utils';

export const WalletScreen: React.FC = () => {
      const navigation = useNavigation<any>();
      const { colorMode } = useColorMode();
      const isDark = colorMode === 'dark';
      const [activeTab, setActiveTab] = React.useState<'tips' | 'nft'>('tips');
      const bottomInset = useSafeAreaValues('bottom');


  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
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
          animateOnMount: true,
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

  const handleSendViewChange = useCallback((view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => {
    console.log('[WalletScreen] View changing to:', view);
    setSendSheetView(view);
    // enableDynamicSizing kullanıldığında içerik otomatik olarak boyutlanır,
    // bu yüzden snapToIndex çağrılarına gerek yok
  }, []);


  // Mock transaction data grouped by date
  const transactions = {
    today: [
      {
        type: 'Bahşiş Gönderimi',
        description: 'Ömer Faruk Demiral',
        amount: '-50 TIPS',
        amountColor: '#A23C3C',
      },
      {
        type: 'TIPS Claim',
        description: 'Toplu TIPS Claim Edildi.',
        amount: '370 TIPS',
        amountColor: '#3CA241',
      },
    ],
    yesterday: [
      {
        type: 'Bahşiş Alındı',
        description: 'Mehmet Koç',
        amount: '80 TIPS',
        amountColor: '#3CA241',
        date: '11 July 2025',
      },
    ],
  };

  // Mock NFT data
  interface NftItem {
    id: string;
    name: string;
    rarity: 'Usual' | 'Rare';
    rarityColor: string;
    rarityBorderColor: string;
    rarityTextColor?: string;
    image: any;
  }

  const nfts: NftItem[] = [
    {
      id: '1',
      name: 'Everyday Consumer',
      rarity: 'Usual',
      rarityColor: 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: '#D4D4D4',
      image: require('@/assets/badges/badge_01.png'),
    },
    {
      id: '2',
      name: 'Premium Shopper',
      rarity: 'Rare',
      rarityColor: 'rgba(255, 8, 152, 0.4)',
      rarityBorderColor: '#EF4F75',
      rarityTextColor: '#AB2847',
      image: require('@/assets/badges/badge_02.png'),
    },
    {
      id: '3',
      name: 'Collector',
      rarity: 'Usual',
      rarityColor: 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: '#D4D4D4',
      image: require('@/assets/badges/badge_03.png'),
    },
    {
      id: '4',
      name: 'Wishmaker',
      rarity: 'Usual',
      rarityColor: 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: '#D4D4D4',
      image: require('@/assets/badges/badge_04.png'),
    },
    {
      id: '5',
      name: 'Hardware Expert',
      rarity: 'Usual',
      rarityColor: 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: '#D4D4D4',
      image: require('@/assets/badges/badge_01.png'),
    },
    {
      id: '6',
      name: 'Early Tech Adopter',
      rarity: 'Usual',
      rarityColor: 'rgba(211, 211, 211, 0.4)',
      rarityBorderColor: '#D4D4D4',
      image: require('@/assets/badges/badge_02.png'),
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
      <Header title="Varlıklar" showBackButton onBackPress={() => navigation.goBack()} />
      {/* Tabs */}
      <VStack bg={isDark ? '#000' : '#FFF'}>
        <HStack borderBottomWidth={1} borderColor="#E9E9E9" p={0} m={0}>
          <Pressable
            onPress={() => setActiveTab('tips')}
            flex={1}
            alignItems="center"
            pb="$1"
            position="relative"
          >
            <VStack alignItems="center" space="xs">
              <Text
                fontSize={12}
                fontWeight="$bold"
                color={activeTab === 'tips' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
              >
                TIPS
              </Text>
            </VStack>
            <Box
              position="absolute"
              bottom={-1}
              left="25%"
              height={2}
              width="50%"
              borderRadius={999}
              bg={activeTab === 'tips' ? (isDark ? '#FFF' : '#000') : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('nft')}
            flex={1}
            alignItems="center"
            pb="$1"
            position="relative"
          >
            <VStack alignItems="center" space="xs">
              <Text
                fontSize={12}
                fontWeight="$bold"
                color={activeTab === 'nft' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
              >
                NFT Varlıklar
              </Text>
            </VStack>
            <Box
              position="absolute"
              bottom={-1}
              left="20%"
              height={2}
              width="60%"
              borderRadius={999}
              bg={activeTab === 'nft' ? (isDark ? '#FFF' : '#000') : 'transparent'}
            />
          </Pressable>
        </HStack>
      </VStack>
      <VStack flex={1} px="$4" py="$4" space="lg">
        {activeTab === 'tips' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset, flexGrow: 1 }}>
            <VStack space="lg">
              {/* Wallet Card */}
              <WalletCardInfo />

              {/* Balance Card */}
              <Box bg="$backgroundLight0" $dark-bg="$backgroundDark900" borderWidth={1} borderColor="$borderLight200" $dark-borderColor="$borderDark600" rounded={5} p="$4">
                <VStack space="sm" alignItems="center">
                  <Text fontSize={14} color="#B9B9B9" fontWeight={'$bold'}>Current Balance</Text>
                  <Text fontSize={38} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">20.000</Text>
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
                    { icon: 'qr-code', label: 'Receive' as const, onPress: () => {} },
                    { icon: 'send', label: 'Send' as const, onPress: handleSendPress },
                    { icon: 'shuffle', label: 'Swap' as const, onPress: () => navigation.navigate('SwapScreen') },
                    { icon: 'gift', label: 'Claim' as const, onPress: handleClaimPress },
                  ].map((action) => (
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
                        <Feather name={action.icon as any} size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text fontSize={11} fontWeight="$medium" color="$textLight900" $dark-color="$textDark50">
                          {action.label}
                        </Text>
                      </VStack>
                    </Pressable>
                  ))}
                </HStack>
              </Box>

              {/* Transaction History Header */}
              <HStack mt="$4" alignItems="center" justifyContent="space-between">
                <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  Transaction History
                </Text>
                <HStack space="sm" alignItems="center">
                  <Pressable px="$2" py="$1" borderWidth={1} borderColor="$borderLight200" rounded={5}>
                    <Feather name="filter" size={16} color="#000000" />
                  </Pressable>
                  <Pressable px="$2" py="$1" borderWidth={1} borderColor="$borderLight200" rounded={5}>
                    <Feather name="bar-chart-2" size={16} color="#000000" />
                  </Pressable>
                </HStack>
              </HStack>

              {/* Today Section */}
              <VStack space="md">
                <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                  Today
                </Text>
                {transactions.today.map((transaction, index) => (
                  <HistoryCard
                    key={`today-${index}`}
                    type={transaction.type}
                    description={transaction.description}
                    amount={transaction.amount}
                    amountColor={transaction.amountColor}
                  />
                ))}
              </VStack>

              {/* Yesterday Section */}
              <VStack space="md">
                <Text fontSize={14} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400">
                  Yesterday
                </Text>
                {transactions.yesterday.map((transaction, index) => (
                  <HistoryCard
                    key={`yesterday-${index}`}
                    type={transaction.type}
                    description={transaction.description}
                    amount={transaction.amount}
                    amountColor={transaction.amountColor}
                    date={transaction.date}
                    onCopyPress={() => {}}
                  />
                ))}
              </VStack>
            </VStack>
          </ScrollView>
        )}
        {activeTab === 'nft' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset }}>
            <VStack space="lg">
              {/* Wallet Card */}
              <WalletCardInfo />

              {/* NFT Varlıklar Header */}
              <VStack space="md">
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={14} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
                    NFT Varlıklar
                  </Text>
                  <HStack space="xs" alignItems="center">
                    {/* Filtrele Button */}
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
                          Filtrele
                        </Text>
                        <Feather name="chevron-down" size={12} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                    {/* Sırala Button */}
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
                          Sırala
                        </Text>
                        <Feather name="chevron-down" size={12} color={isDark ? '#FFFFFF' : '#000000'} />
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
                                  <Feather name="award" size={10} color={isDark ? '#FFFFFF' : '#000000'} />
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
        )}
      </VStack>

      </Box>
    </SafeAreaView>
  );
};


