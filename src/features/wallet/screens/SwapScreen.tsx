import React, { useState, useRef, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, HStack, Text, Pressable, Input, InputField } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/src/components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { SuccessBottomSheet } from '../components/SuccessBottomSheet';

export const SwapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [activeToken, setActiveToken] = useState<'TIP' | 'SOL'>('TIP');

  // Bottom sheet refs
  const insufficientBalanceSheetRef = useRef<BottomSheet>(null);
  const successBottomSheetRef = useRef<BottomSheet>(null);
  const [successTransactionDetails, setSuccessTransactionDetails] = useState<{
    sentAmount?: string;
    receivedAmount?: string;
    transactionFee?: string;
    remainingBalance?: string;
    transactionId?: string;
  } | null>(null);

  // Conversion rate: 1 TIP = 0.0001 SOL (example rate)
  const TIP_TO_SOL_RATE = 0.0001;
  const SOL_TO_TIP_RATE = 10000;
  const MAX_TIPS = 20000; // Maximum available TIPS balance

  const handleSwap = () => {
    setActiveToken(activeToken === 'TIP' ? 'SOL' : 'TIP');
    // Swap amounts
    const temp = payAmount;
    setPayAmount(receiveAmount);
    setReceiveAmount(temp);
  };

  const handlePercentagePress = (percentage: number) => {
    const maxAmount = activeToken === 'TIP' ? 20000 : 2; // 20,000 TIP or 2 SOL
    const amount = (maxAmount * percentage / 100).toString();
    setPayAmount(amount);
    
    // Calculate receive amount
    const receive = activeToken === 'TIP' 
      ? (parseFloat(amount) * TIP_TO_SOL_RATE).toFixed(6)
      : (parseFloat(amount) * SOL_TO_TIP_RATE).toString();
    setReceiveAmount(receive);
  };

  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setPayAmount(numericValue);
    
    // Calculate receive amount
    if (numericValue && parseFloat(numericValue) > 0) {
      const receive = activeToken === 'TIP'
        ? (parseFloat(numericValue) * TIP_TO_SOL_RATE).toFixed(6)
        : (parseFloat(numericValue) * SOL_TO_TIP_RATE).toString();
      setReceiveAmount(receive);
    } else {
      setReceiveAmount('');
    }
  };

  const handleSwapNow = () => {
    const numericValue = parseFloat(payAmount) || 0;
    
    // Check if amount exceeds balance
    if (activeToken === 'TIP' && numericValue > MAX_TIPS) {
      // Open insufficient balance bottom sheet
      if (insufficientBalanceSheetRef.current) {
        insufficientBalanceSheetRef.current.expand();
      } else {
        setTimeout(() => {
          if (insufficientBalanceSheetRef.current) {
            insufficientBalanceSheetRef.current.expand();
          }
        }, 100);
      }
    } else {
      // Proceed with swap - show success
      console.log('Swap Now pressed - proceeding with swap');
      
      // Set success transaction details
      const sentAmount = `${parseFloat(payAmount).toLocaleString()} ${activeToken}`;
      const receivedAmount = `${parseFloat(receiveAmount).toLocaleString()} ${activeToken === 'TIP' ? 'SOL' : 'TIP'}`;
      const remainingBalance = activeToken === 'TIP' 
        ? `${(MAX_TIPS - parseFloat(payAmount)).toLocaleString()} TIP`
        : `${MAX_TIPS.toLocaleString()} TIP`;
      
      // Generate transaction ID (mock - in real app this would come from backend)
      const transactionId = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      setSuccessTransactionDetails({
        sentAmount,
        receivedAmount,
        transactionFee: '$0.495',
        remainingBalance,
        transactionId,
      });
      
      // Open success bottom sheet
      setTimeout(() => {
        if (successBottomSheetRef.current) {
          successBottomSheetRef.current.expand();
        } else {
          setTimeout(() => {
            if (successBottomSheetRef.current) {
              successBottomSheetRef.current.expand();
            }
          }, 100);
        }
      }, 300);
      
      // Reset amounts after showing success
      setTimeout(() => {
        setPayAmount('');
        setReceiveAmount('');
      }, 500);
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
      />
    ),
    []
  );

  // Calculate remaining and required amounts
  const getInsufficientBalanceDetails = () => {
    const requestedAmount = parseFloat(payAmount) || 0;
    const remaining = Math.max(0, MAX_TIPS - requestedAmount);
    const required = requestedAmount > MAX_TIPS ? (requestedAmount - MAX_TIPS).toFixed(5) : '0';
    return { remaining, required };
  };

  // Mock transaction history
  const transactions = [
    {
      type: 'TIPS Claim',
      description: 'Toplu TIPS Claim Edildi.',
      amount: '370 TIPS',
      amountColor: '#3CA241',
    },
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
    {
      type: 'TIPS Claim',
      description: 'Toplu TIPS Claim Edildi.',
      amount: '370 TIPS',
      amountColor: '#3CA241',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg="$backgroundLight0" $dark-bg="$backgroundDark950">
      <Header title="Swap" showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack px="$4" py="$4" space="lg">
          {/* Swap Cards */}
          <Box position="relative">
            <VStack space="md" flex={1}>
              {/* You Pay Card */}
              <Box
                bg="$backgroundLight0"
                $dark-bg="$backgroundDark800"
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                rounded={5}
                p="$3"
                flex={1}
              >
                <VStack space="md" flex={1}>
                  <Text fontSize={14} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
                    You Pay
                  </Text>
                  
                  {/* Amount Input Section */}
                  <HStack alignItems="center" justifyContent="space-between" space="md">
                    <Box flex={1}>
                      <Input variant="outline" borderWidth={0}>
                        <InputField
                          value={payAmount}
                          onChangeText={handleAmountChange}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#DDDDDD"
                          fontSize={38}
                          fontWeight="$bold"
                          color={payAmount ? "$textLight900" : "#DDDDDD"}
                          $dark-color={payAmount ? "$textDark50" : "$textDark400"}
                        />
                      </Input>
                    </Box>
                    
                    {/* Token Selector */}
                    <Pressable>
                      <HStack
                        bg="#EDEDEC"
                        $dark-bg="$backgroundDark700"
                        borderWidth={1}
                        borderColor="#B5B5B5"
                        $dark-borderColor="$borderDark600"
                        rounded={20}
                        px="$4"
                        py="$2"
                        alignItems="center"
                        space="xs"
                      >
                        <Box
                          w={28}
                          h={28}
                          rounded="$full"
                          bg="#D9D9D9"
                          $dark-bg="$backgroundDark600"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Feather name="credit-card" size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                        </Box>
                        <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                          {activeToken}
                        </Text>
                        <Feather name="chevron-down" size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                      </HStack>
                    </Pressable>
                  </HStack>
                  
                  {/* Available Balance */}
                  <Text fontSize={12} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                    {activeToken === 'TIP' ? '20.000 TIP' : '0 SOL'}
                  </Text>
                </VStack>
              </Box>

              {/* You Receive Card */}
              <Box
                bg="$backgroundLight0"
                $dark-bg="$backgroundDark800"
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                rounded={5}
                p="$3"
                flex={1}
              >
                <VStack space="md" flex={1}>
                  <Text fontSize={14} fontWeight="$bold" color="#B9B9B9" $dark-color="$textDark400">
                    You Receive
                  </Text>
                  
                  {/* Amount Display Section */}
                  <HStack alignItems="center" justifyContent="space-between" space="md">
                    <Box flex={1}>
                      <Text fontSize={38} fontWeight="$bold" color={receiveAmount ? "$textLight900" : "#DDDDDD"} $dark-color={receiveAmount ? "$textDark50" : "$textDark400"}>
                        {receiveAmount || '0'}
                      </Text>
                    </Box>
                    
                    {/* Token Display */}
                    <HStack
                      bg="#EDEDEC"
                      $dark-bg="$backgroundDark700"
                      borderWidth={1}
                      borderColor="#B5B5B5"
                      $dark-borderColor="$borderDark600"
                      rounded={20}
                      px="$4"
                      py="$2"
                      alignItems="center"
                      space="xs"
                    >
                      <Box
                        w={28}
                        h={28}
                        rounded="$full"
                        bg="#D9D9D9"
                        $dark-bg="$backgroundDark600"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Feather name="credit-card" size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                      </Box>
                      <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                        {activeToken === 'TIP' ? 'SOL' : 'TIP'}
                      </Text>
                      <Feather name="chevron-down" size={14} color={isDark ? '#FFFFFF' : '#000000'} />
                    </HStack>
                  </HStack>
                  
                  {/* Available Balance */}
                  <Text fontSize={12} fontWeight="$medium" color="#B9B9B9" $dark-color="$textDark400">
                    {activeToken === 'TIP' ? '0 SOL' : '20.000 TIP'}
                  </Text>
                </VStack>
              </Box>
            </VStack>

            {/* Swap Icon - Absolute Positioned */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              style={{ transform: [{ translateX: -17.5 }, { translateY: -17.5 }] }}
              zIndex={10}
            >
              <Pressable
                onPress={handleSwap}
                w={35}
                h={35}
                rounded="$full"
                bg="#E8FF6B"
                $dark-bg="#E8FF6B"
                alignItems="center"
                justifyContent="center"
                borderWidth={3}
                borderColor="#FFFFFF"
                $dark-borderColor="#FFFFFF"
              >
                <Feather 
                  name="shuffle" 
                  size={24} 
                  color="#000000"
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </Pressable>
            </Box>
          </Box>

          {/* Percentage Buttons */}
          <Box>
            <HStack space="md" justifyContent="space-between">
              {[25, 50, 75].map((percentage) => (
                <Pressable
                  key={percentage}
                  onPress={() => handlePercentagePress(percentage)}
                  bg="$backgroundLight0"
                  $dark-bg="$backgroundDark800"
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  $dark-borderColor="$borderDark600"
                  rounded={5}
                  w={82}
                  h={48}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={14} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                    {percentage}%
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => handlePercentagePress(100)}
                bg="$backgroundLight0"
                $dark-bg="$backgroundDark800"
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                rounded={5}
                w={82}
                h={48}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={14} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  All
                </Text>
              </Pressable>
            </HStack>
          </Box>

          {/* Pricing Card - Only shown when amount is entered */}
          {payAmount && parseFloat(payAmount) > 0 && (
            <>
              <Box
                bg="$backgroundLight0"
                $dark-bg="$backgroundDark800"
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                rounded={5}
                p="$4"
                mt="$4"
              >
                <VStack space="md">
                  {/* Pricing Row */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Pricing
                      </Text>
                      <Pressable>
                        <Feather name="info" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                      </Pressable>
                    </HStack>
                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      11 July 2025
                    </Text>
                  </HStack>

                  {/* Divider */}
                  <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                  {/* Slippage Row */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Slippage
                      </Text>
                      <Pressable>
                        <Feather name="info" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                      </Pressable>
                    </HStack>
                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      Rare
                    </Text>
                  </HStack>

                  {/* Divider */}
                  <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                  {/* Price Impact Row */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Price Impact
                      </Text>
                      <Pressable>
                        <Feather name="info" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                      </Pressable>
                    </HStack>
                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      11049
                    </Text>
                  </HStack>

                  {/* Divider */}
                  <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                  {/* Fees Row */}
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Fees
                      </Text>
                      <Pressable>
                        <Feather name="info" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
                      </Pressable>
                    </HStack>
                    <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50">
                      $0.495
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Swap Now Button */}
              <Pressable
                onPress={handleSwapNow}
                bg={payAmount && parseFloat(payAmount) > 0 ? "#D8FF08" : "#EDEDEC"}
                $dark-bg={payAmount && parseFloat(payAmount) > 0 ? "#D8FF08" : "$backgroundDark700"}
                rounded={8}
                py="$3"
                mt="$4"
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                opacity={payAmount && parseFloat(payAmount) > 0 ? 1 : 0.5}
              >
                <Text 
                  fontSize={14} 
                  fontWeight="$bold" 
                  color={payAmount && parseFloat(payAmount) > 0 ? "#111111" : "#B1B1B1"} 
                  $dark-color={payAmount && parseFloat(payAmount) > 0 ? "#111111" : "$textDark400"} 
                  textAlign="center"
                >
                  Swap Now
                </Text>
              </Pressable>
            </>
          )}
        </VStack>
      </ScrollView>

      {/* Insufficient Balance Bottom Sheet */}
      <BottomSheet
        ref={insufficientBalanceSheetRef}
        index={-1}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        enableDynamicSizing
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
          <VStack px="$4" py="$4" space="lg" flex={1}>
            {/* Header with back button */}
            <HStack alignItems="center" space="md" mb="$2">
              <Pressable onPress={() => insufficientBalanceSheetRef.current?.close()}>
                <Feather name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
              <HStack flex={1} justifyContent="center" alignItems="center">
                <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
                  Swap
                </Text>
              </HStack>
              <Box w={24} />
            </HStack>

            {/* Warning Icon and Message */}
            <VStack alignItems="center" space="md" py="$4">
              <Box
                w={146}
                h={146}
                rounded={5}
                bg="#D9D9D9"
                $dark-bg="$backgroundDark700"
                alignItems="center"
                justifyContent="center"
              />
              <VStack alignItems="center" space="xs" px="$4">
                <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50" textAlign="center">
                  Not Enought TIP
                </Text>
                <Text fontSize={12} fontWeight="$normal" color="$textLight900" $dark-color="$textDark50" textAlign="center" lineHeight={18}>
                  You don't have enough TIP in your wallet for this transaction.
                </Text>
              </VStack>
            </VStack>

            {/* Remaining and Required Card */}
            {(() => {
              const { remaining, required } = getInsufficientBalanceDetails();
              return (
                <Box
                  bg="$backgroundLight0"
                  $dark-bg="$backgroundDark800"
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  $dark-borderColor="$borderDark600"
                  rounded={5}
                  p="$4"
                >
                  <VStack space="md">
                    {/* Remaining Row */}
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Remaining
                      </Text>
                      <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
                        {remaining.toFixed(0)} TIP
                      </Text>
                    </HStack>

                    {/* Divider */}
                    <Box h={1} bg="#EBEBEB" $dark-bg="$borderDark600" />

                    {/* Required Row */}
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize={11} fontWeight="$semibold" color="#9D9D9D" $dark-color="$textDark400">
                        Required
                      </Text>
                      <Text fontSize={11} fontWeight="$semibold" color="$textLight900" $dark-color="$textDark50" textAlign="right">
                        {required} TIP
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              );
            })()}

            {/* Action Buttons */}
            <HStack space="md" mt="auto">
              <Pressable
                onPress={() => {
                  console.log('Buy TIP pressed');
                  insufficientBalanceSheetRef.current?.close();
                }}
                bg="#C2E607"
                $dark-bg="#C2E607"
                rounded={8}
                py="$3"
                flex={1}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={12} fontWeight="$bold" color="#111111" textAlign="center">
                  Buy TIP
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  insufficientBalanceSheetRef.current?.close();
                  setPayAmount('');
                  setReceiveAmount('');
                }}
                bg="#F5F5F5"
                $dark-bg="$backgroundDark700"
                rounded={8}
                py="$3"
                flex={1}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize={12} fontWeight="$bold" color="#9E9E9E" $dark-color="$textDark400" textAlign="center">
                  Cancel
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </BottomSheetView>
      </BottomSheet>

      {/* Success Bottom Sheet */}
      <BottomSheet
        ref={successBottomSheetRef}
        index={-1}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        enableDynamicSizing
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
          <SuccessBottomSheet
            onClose={() => {
              successBottomSheetRef.current?.close();
              setSuccessTransactionDetails(null);
            }}
            title="Swap Successful"
            message="Your swap transaction has been completed successfully."
            transactionDetails={successTransactionDetails || undefined}
          />
        </BottomSheetView>
      </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};

