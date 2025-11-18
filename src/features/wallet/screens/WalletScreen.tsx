import React, { useRef, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, Text, HStack, Pressable, Image } from '@gluestack-ui/themed';
import { Header } from '@/src/components/Header';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { WalletCardInfo } from '../components/WalletCardInfo';
import { HistoryCard } from '../components/HistoryCard';
import { SendBottomSheet } from '../components/SendBottomSheet';
import { ClaimBottomSheet } from '../components/ClaimBottomSheet';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';

export const WalletScreen: React.FC = () => {
      const navigation = useNavigation<any>();
      const { colorMode } = useColorMode();
      const isDark = colorMode === 'dark';
      const [activeTab, setActiveTab] = React.useState<'tips' | 'nft'>('tips');


  // Bottom sheet refs
      const sendBottomSheetRef = useRef<BottomSheet>(null);
      const sendSnapPoints = useMemo(() => ['55%', '90%'], []);
      const [sendSheetView, setSendSheetView] = React.useState<'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection'>('options');
  
  const claimBottomSheetRef = useRef<BottomSheet>(null);
  const claimSnapPoints = useMemo(() => ['70%'], []);

  const handleSendPress = useCallback(() => {
    console.log('[WalletScreen] Send button pressed');
    setSendSheetView('options');
    if (sendBottomSheetRef.current) {
      sendBottomSheetRef.current.snapToIndex(0);
    } else {
      console.log('[WalletScreen] Send BottomSheet ref is null, trying again...');
      setTimeout(() => {
        if (sendBottomSheetRef.current) {
          sendBottomSheetRef.current.snapToIndex(0);
        } else {
          console.log('[WalletScreen] Send BottomSheet ref still null after timeout');
        }
      }, 100);
    }
  }, []);

  const handleClaimPress = useCallback(() => {
    console.log('[WalletScreen] Claim button pressed');
    if (claimBottomSheetRef.current) {
      claimBottomSheetRef.current.snapToIndex(0);
    } else {
      console.log('[WalletScreen] Claim BottomSheet ref is null, trying again...');
      setTimeout(() => {
        if (claimBottomSheetRef.current) {
          claimBottomSheetRef.current.snapToIndex(0);
        } else {
          console.log('[WalletScreen] Claim BottomSheet ref still null after timeout');
        }
      }, 100);
    }
  }, []);

  const handleSendViewChange = useCallback((view: 'options' | 'wallet-address' | 'amount' | 'confirmation' | 'friend-selection') => {
    console.log('[WalletScreen] View changing to:', view);
    setSendSheetView(view);
    if (sendBottomSheetRef.current) {
      if (view === 'wallet-address') {
        console.log('[WalletScreen] Snapping to index 0 (55%)');
        sendBottomSheetRef.current.snapToIndex(0);
      } else if (view === 'amount' || view === 'confirmation' || view === 'friend-selection') {
        console.log('[WalletScreen] Snapping to index 1 (90%)');
        // Use requestAnimationFrame to ensure bottom sheet is ready
        requestAnimationFrame(() => {
          if (sendBottomSheetRef.current) {
            sendBottomSheetRef.current.snapToIndex(1);
          }
        });
      } else {
        console.log('[WalletScreen] Snapping to index 0 (options)');
        sendBottomSheetRef.current.snapToIndex(0);
      }
    } else {
      console.log('[WalletScreen] Bottom sheet ref is null');
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

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
      {/* Tabs under header - Figma 2447:28026 */}
      <VStack px="$4" py="$2" space="xs">
        <HStack justifyContent="center" alignItems="center" space="lg">
              <Pressable onPress={() => setActiveTab('tips')}>
                <VStack alignItems="center" space="xs">
                  <Text fontSize={12} fontWeight="$bold" color={activeTab === 'tips' ? '$textLight900' : '$textLight500'} $dark-color={activeTab === 'tips' ? '$textDark50' : '$textDark400'}>
                    TIPS
                  </Text>
                  {activeTab === 'tips' ? (
                    <Box w={72} h={2} bg="$backgroundLight300" $dark-bg="$backgroundDark600" rounded={2} />
                  ) : (
                    <Box w={72} h={2} bg="transparent" />
                  )}
                </VStack>
              </Pressable>

              <Pressable onPress={() => setActiveTab('nft')}>
                <VStack alignItems="center" space="xs">
                  <Text fontSize={12} fontWeight="$bold" color={activeTab === 'nft' ? '$textLight900' : '$textLight500'} $dark-color={activeTab === 'nft' ? '$textDark50' : '$textDark400'}>
                    NFT Varlıklar
                  </Text>
                  {activeTab === 'nft' ? (
                    <Box w={86} h={2} bg="$backgroundLight300" $dark-bg="$backgroundDark600" rounded={2} />
                  ) : (
                    <Box w={86} h={2} bg="transparent" />
                  )}
                </VStack>
              </Pressable>
        </HStack>
        {/* Divider under tabs (body-skeleton style) */}
        <Box h={2} bg="#ECECEC" />
      </VStack>
      <VStack flex={1} px="$4" py="$4" space="lg">
        {activeTab === 'tips' && (
          <>
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
          <HStack mt="$4" space="md" justifyContent="space-between">
                    {[
                      { icon: 'qr-code', label: 'Receive' as const, onPress: () => {} },
                      { icon: 'send', label: 'Send' as const, onPress: handleSendPress },
                      { icon: 'shuffle', label: 'Swap' as const, onPress: () => navigation.navigate('SwapScreen') },
                      { icon: 'gift', label: 'Claim' as const, onPress: handleClaimPress },
                    ].map(action => (
              <Pressable key={action.label} onPress={action.onPress} bg="$backgroundLight0" $dark-bg="$backgroundDark800" borderWidth={1} borderColor="$borderLight200" $dark-borderColor="$borderDark600" rounded={10} w={80} h={70} alignItems="center" justifyContent="center">
                <VStack alignItems="center" space="xs">
                  <Feather name={action.icon as any} size={20} color="#000000" />
                  <Text fontSize={11} fontWeight="$medium" color="$textLight900" $dark-color="$textDark50">{action.label}</Text>
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
          </>
        )}
        {activeTab === 'nft' && (
          <ScrollView showsVerticalScrollIndicator={false}>
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
      <Box h={insets.bottom} />

      {/* Send Bottom Sheet */}
      <BottomSheet
        ref={sendBottomSheetRef}
        index={-1}
        snapPoints={sendSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        }}
      >
        <BottomSheetView>
          <SendBottomSheet
            onClose={() => {
              sendBottomSheetRef.current?.close();
              setSendSheetView('options');
              // Reset view state in SendBottomSheet will be handled internally
            }}
            onWalletAddressPress={() => {
              // Bottom sheet will handle its own state change
            }}
            onFriendPress={() => {
              sendBottomSheetRef.current?.close();
              setSendSheetView('options');
              // Navigate to friend selection screen
            }}
            onViewChange={handleSendViewChange}
          />
          </BottomSheetView>
        </BottomSheet>

        {/* Claim Bottom Sheet */}
        <BottomSheet
          ref={claimBottomSheetRef}
          index={-1}
          snapPoints={claimSnapPoints}
          enablePanDownToClose
          enableOverDrag={false}
          enableHandlePanningGesture={true}
          enableContentPanningGesture={true}
          animateOnMount={true}
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
          handleStyle={{
            backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
          handleIndicatorStyle={{
            backgroundColor: isDark ? '#333333' : '#B8B8B7',
            width: 70,
            height: 5,
          }}
        >
          <BottomSheetView>
            <ClaimBottomSheet
              onClose={() => {
                claimBottomSheetRef.current?.close();
              }}
            />
          </BottomSheetView>
        </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};


