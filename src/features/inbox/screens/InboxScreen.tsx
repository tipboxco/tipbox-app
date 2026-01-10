import React, { useRef, useCallback, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import {
  Box,
  VStack,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import MessagesScreen from './MessagesScreen';
import SupportRequestsScreen from './SupportRequestsScreen';
import { useDrawerStore } from '@/src/store/drawerStore';

type InboxScreenNavigationProp = NativeStackNavigationProp<any, 'InboxScreen'>;

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const InboxScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<InboxScreenNavigationProp>();
  const pagerRef = useRef<PagerView>(null);
  const tabContainerRef = useRef<any>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  
  // CRITICAL: Drawer gesture'ı disable et (yatay PagerView swipe ile çakışmasını önle)
  const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);
  
  useFocusEffect(
    useCallback(() => {
      // Ekran focus aldığında drawer gesture'ı disable et
      setGestureEnabled(false);
      if (__DEV__) {
      }
      return () => {
        // Ekran blur olduğunda drawer gesture'ı tekrar enable et
        setGestureEnabled(true);
        if (__DEV__) {
        }
      };
    }, [setGestureEnabled])
  );
  
  // 🎯 CORE: Shared progress value (0 = Messages, 1 = Support)
  const progress = useSharedValue(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // PERFORMANCE FIX: Memoize background colors to prevent re-renders
  const backgroundColor = useMemo(() => isDark ? '$backgroundDark950' : '$backgroundLight0', [isDark]);
  const tabHeaderBgColor = useMemo(() => isDark ? '#000' : '#FFF', [isDark]);

  // Drawer açma fonksiyonu
  const openDrawer = useCallback(() => {
    try {
      (navigation as any).openDrawer?.();
    } catch {
      const drawerNavigation = navigation.getParent();
      if (drawerNavigation) {
        drawerNavigation.dispatch(DrawerActions.openDrawer());
      }
    }
  }, [navigation]);


  // Tab press handler - PagerView native animasyonu ile geçiş
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // PagerView scroll handler - realtime progress güncelleme
  const handlePageScroll = useCallback(
    (e: any) => {
      'worklet';
      const { position, offset } = e.nativeEvent;
      progress.value = position + offset;
    },
    [progress]
  );

  // PagerView page selected handler - snap sonrası progress'i sync et
  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      progress.value = withTiming(position, { duration: 0 });
      setCurrentPage(position); // Current page'i güncelle
    },
    [progress]
  );

  // Tab 1 (Messages) label color animation
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

  // Tab 2 (Support) label color animation
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
  const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i
  const indicatorStyle = useAnimatedStyle(() => {
    // Indicator'ı tab genişliğine göre translate et
    // Her tab'in ortasına yerleştirmek için: tabWidth * progress + (tabWidth - indicatorWidth) / 2
    const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
    return {
      transform: [{ translateX }],
    };
  });



  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={backgroundColor}>
        <Header
          title="Inbox"
          leftAction="menu"
        />

        <VStack flex={1} py="$2" space="md">
          {/* Tab Header */}
          <VStack pt="$4" bg={tabHeaderBgColor}>
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
              {/* Messages Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(0)}
                alignItems="center"
                py="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: 'bold',
                      },
                      tab1Style,
                    ]}
                  >
                    Messages
                  </Animated.Text>
                </VStack>
              </Pressable>

              {/* Support Requests Tab Label */}
              <Pressable
                flex={1}
                onPress={() => handleTabPress(1)}
                alignItems="center"
                pb="$1"
              >
                <VStack alignItems="center" space="xs">
                  <Animated.Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: 'bold',
                      },
                      tab2Style,
                    ]}
                  >
                    1-on-1 Support Requests
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
          >
            {/* Messages Tab */}
            <Box key="0" flex={1}>
              <MessagesScreen onDrawerOpen={openDrawer} isActiveTab={currentPage === 0} />
            </Box>

            {/* Support Requests Tab */}
            <Box key="1" flex={1}>
              <SupportRequestsScreen />
            </Box>
          </AnimatedPagerView>
        </VStack>
      </Box>
    </SafeAreaView>
  );
};

InboxScreen.displayName = 'InboxScreen';

// PERFORMANCE FIX: Memoize InboxScreen to prevent unnecessary re-renders during tab transitions
export default React.memo(InboxScreen);
