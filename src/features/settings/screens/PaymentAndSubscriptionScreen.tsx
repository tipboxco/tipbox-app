import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { Box, VStack, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { PaymentTab } from './PaymentAndSubscriptionTabsScreen/PaymentTab';
import { SubscriptionTab } from './PaymentAndSubscriptionTabsScreen/SubscriptionTab';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import AddPaymentMethodBottomSheet from '../components/AddPaymentMethodBottomSheet';
import { useTranslation } from '@/src/hooks/useTranslation';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const TAB_INDEX = { payment: 0, subscription: 1 } as const;

export const PaymentAndSubscriptionScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const backgroundColor = '#FFFFFF';
  const pagerRef = useRef<PagerView>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const tabWidth = tabContainerWidth / 2 || Dimensions.get('window').width / 2;
  const { t } = useTranslation('settings');

  const [activeTab, setActiveTab] = useState<'payment' | 'subscription'>('payment');

  const progress = useSharedValue(0);

  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  const handleAddPaymentMethod = useCallback(() => {
    openBottomSheet(
      <AddPaymentMethodBottomSheet onClose={closeBottomSheet} />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableDynamicSizing: true,
        backgroundStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        handleStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        },
        paddingBottom: bottomOffset,
      }
    );
  }, [openBottomSheet, closeBottomSheet, isDark, bottomOffset]);

  const scrollToTab = useCallback((tab: 'payment' | 'subscription') => {
    const index = TAB_INDEX[tab];
    setActiveTab(tab);
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageScroll = useCallback(
    (e: { nativeEvent: { position: number; offset: number } }) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setActiveTab(position === 0 ? 'payment' : 'subscription');
    },
    [progress]
  );

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

  const indicatorWidth = tabWidth * 0.5;
  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View
        style={{
          height: insets.top,
          backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <Header
            title={t('settings.payment.headerTitle')}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
          />

          <VStack flex={1} py="$2" space="md">
            {/* Tabs - WalletScreen ile aynı yapı */}
            <VStack bg={isDark ? '#000' : '#FFF'}>
              <HStack
                borderBottomWidth={1}
                borderColor="#ECECEC"
                p={0}
                m={0}
                position="relative"
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  setTabContainerWidth(width);
                }}
              >
                <Pressable
                  onPress={() => scrollToTab('payment')}
                  flex={1}
                  alignItems="center"
                  pb={8}
                >
                  <VStack alignItems="center" space="xs">
                    <Animated.Text
                      style={[
                        { fontSize: 14, fontWeight: 'bold' },
                        tab1Style,
                      ]}
                    >
                      {t('settings.payment.tabPaymentMethods')}
                    </Animated.Text>
                  </VStack>
                </Pressable>
                <Pressable
                  onPress={() => scrollToTab('subscription')}
                  flex={1}
                  alignItems="center"
                  pb={8}
                >
                  <VStack alignItems="center" space="xs">
                    <Animated.Text
                      style={[
                        { fontSize: 14, fontWeight: 'bold' },
                        tab2Style,
                      ]}
                    >
                      {t('settings.payment.tabPremiumPlans')}
                    </Animated.Text>
                  </VStack>
                </Pressable>

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

            {/* PagerView - Native swipe (WalletScreen gibi) */}
            <AnimatedPagerView
              ref={pagerRef}
              style={{ flex: 1 }}
              initialPage={0}
              onPageScroll={handlePageScroll}
              onPageSelected={handlePageSelected}
              scrollEnabled={true}
              overScrollMode="never"
            >
              <Box key="0" flex={1} px="$4">
                <PaymentTab onAddPaymentMethod={handleAddPaymentMethod} />
              </Box>
              <Box key="1" flex={1} px="$4">
                <SubscriptionTab />
              </Box>
            </AnimatedPagerView>
          </VStack>
        </Box>
      </SafeAreaView>
      <View
        style={{
          height: insets.bottom,
          backgroundColor,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      />
    </View>
  );
};

export default PaymentAndSubscriptionScreen;
