import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, VStack, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { PaymentTab } from './PaymentAndSubscriptionTabsScreen/PaymentTab';
import { SubscriptionTab } from './PaymentAndSubscriptionTabsScreen/SubscriptionTab';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import AddPaymentMethodBottomSheet from '../components/AddPaymentMethodBottomSheet';

export const PaymentAndSubscriptionScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'payment' | 'subscription'>('payment');
  
  // Bottom sheet refs
  const addPaymentMethodBottomSheetRef = useRef<BottomSheet>(null);

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

  const handleAddPaymentMethod = () => {
    if (addPaymentMethodBottomSheetRef.current) {
      addPaymentMethodBottomSheetRef.current.snapToIndex(0);
    } else {
      setTimeout(() => {
        if (addPaymentMethodBottomSheetRef.current) {
          addPaymentMethodBottomSheetRef.current.snapToIndex(0);
        }
      }, 100);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'payment':
        return <PaymentTab onAddPaymentMethod={handleAddPaymentMethod} />;
      case 'subscription':
        return <SubscriptionTab />;
      default:
        return <PaymentTab onAddPaymentMethod={handleAddPaymentMethod} />;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Payment & Subscription"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <VStack flex={1} py="$2" space="md">
        {/* Tabs */}
        <VStack bg={isDark ? '#000' : '#FFF'}>
          <HStack borderBottomWidth={1} borderColor={'#ECECEC'} p={0} m={0}>
            <Pressable
              onPress={() => setActiveTab('payment')}
              flex={1}
              alignItems="center"
              pb="$1"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  color={activeTab === 'payment' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  Payment Methods
                </Text>
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="25%"
                height={2}
                width="50%"
                borderRadius={999}
                bg={activeTab === 'payment' ? (isDark ? '#FFF' : '#000') : 'transparent'}
              />
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('subscription')}
              flex={1}
              alignItems="center"
              pb="$1"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  color={activeTab === 'subscription' ? (isDark ? '#FFF' : '#000') : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  Premium Plans
                </Text>
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="20%"
                height={2}
                width="60%"
                borderRadius={999}
                bg={activeTab === 'subscription' ? (isDark ? '#FFF' : '#000') : 'transparent'}
              />
            </Pressable>
          </HStack>
        </VStack>

        {/* Tab Content */}
        <Box px="$4" flex={1}>
          {renderTabContent()}
        </Box>
      </VStack>

      {/* Add Payment Method Bottom Sheet */}
      <BottomSheet
        ref={addPaymentMethodBottomSheetRef}
        index={-1}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          <AddPaymentMethodBottomSheet
            onClose={() => addPaymentMethodBottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
    </SafeAreaView>
  );
};

export default PaymentAndSubscriptionScreen;

