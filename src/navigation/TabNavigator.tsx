import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { colors, getColor } from '@/src/constants/colors';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { MessageBadge } from '@/src/components/MessageBadge';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useMessages } from '@/src/features/inbox/api/hooks';
import { useNavigation, CommonActions } from '@react-navigation/native';


// freezeOnBlur is now set globally in screenOptions for all tabs
import { ScrollRegistry } from '@/src/services/ScrollRegistry';
// Heroicons imports
import {
  HomeIcon as HomeIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  CalendarIcon as CalendarIconSolid,
  InboxIcon as InboxIconSolid,
  BellIcon as BellIconSolid,
} from 'react-native-heroicons/solid';
import {
  HomeIcon as HomeIconOutline,
  CreditCardIcon as CreditCardIconOutline,
  CalendarIcon as CalendarIconOutline,
  InboxIcon as InboxIconOutline,
  BellIcon as BellIconOutline,
} from 'react-native-heroicons/outline';
// Ionicons for Explore tab (Heroicons doesn't have binoculars)
import Ionicons from '@expo/vector-icons/Ionicons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { WalletNavigator } from '@/src/features/wallet';
import { EventsNavigator } from '@/src/features/events/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { InboxNavigator } from '@/src/features/inbox/navigation';
import type { TabParamList } from './types/tab.types';

const Tab = createBottomTabNavigator<TabParamList>();

// PERFORMANCE FIX: Removed unnecessary FeatureStack wrapper layer
// Directly use FeedNavigator, ExploreNavigator, etc. - they already return StackNavigators
// This eliminates one nesting level: Tab > FeatureStack > FeedNavigator → Tab > FeedNavigator
// Reduces mounting time and React diffing complexity

// Custom Tab Bar Component with Liquid Glass Effect
const CustomTabBar = (props: BottomTabBarProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const isTabBarVisible = useNavigationUIStore((state) => state.isTabBarVisible);
  
  // Gesture animasyon değerleri
  const panX = useSharedValue(0);
  const isPressing = useSharedValue(false);
  const [tabBarWidth, setTabBarWidth] = useState(0);
  
  const tabCount = props.state.routes.length;
  const tabWidth = tabBarWidth > 0 ? tabBarWidth / tabCount : 0;
  
  // Tab değiştirme fonksiyonu
  const navigateToTab = useCallback((index: number) => {
    const route = props.state.routes[index];
    if (route && index !== props.state.index) {
      props.navigation.navigate(route.name, route.params);
    }
  }, [props.navigation, props.state.routes, props.state.index]);
  
  // Pan gesture handler - tab'lar arasında sürükleme
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          isPressing.value = true;
        })
        .onUpdate((event) => {
          'worklet';
          // Yatay hareketi takip et
          panX.value = event.translationX;
        })
        .onEnd((event) => {
          'worklet';
          isPressing.value = false;
          
          // Hangi tab'a sürüklendiğini hesapla
          const currentIndex = props.state.index;
          const translationX = event.translationX;
          
          // Threshold: Tab genişliğinin %30'u
          const threshold = tabWidth * 0.3;
          
          let targetIndex = currentIndex;
          
          if (Math.abs(translationX) > threshold) {
            if (translationX > 0 && currentIndex > 0) {
              // Sağa sürükleme - önceki tab
              targetIndex = currentIndex - 1;
            } else if (translationX < 0 && currentIndex < tabCount - 1) {
              // Sola sürükleme - sonraki tab
              targetIndex = currentIndex + 1;
            }
          }
          
          // Tab değiştir
          if (targetIndex !== currentIndex) {
            runOnJS(navigateToTab)(targetIndex);
          }
          
          // Animasyonu sıfırla
          panX.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
          });
        })
        .onFinalize(() => {
          'worklet';
          isPressing.value = false;
          panX.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
          });
        }),
    [tabWidth, tabCount, props.state.index, navigateToTab]
  );
  
  // Tab bar gizliyse render etme (tüm hook'lardan sonra)
  if (!isTabBarVisible) {
    return null;
  }
  
  const androidBottomPadding = insets.bottom;
  const tabBarHeight = Platform.OS === 'ios' ? 45 + insets.bottom : 45 + androidBottomPadding;
  
  // Tab bar container style - yuvarlatılmış üst köşeler (su damlası efekti)
  const containerStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: tabBarHeight,
    zIndex: 1000,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden' as const,
    // Shadow efekti - daha belirgin görünüm için
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  };
  
  // Normal tab bar - yuvarlatılmış köşeler (expo-glass-effect kaldırıldı)
  return (
    <GestureDetector gesture={panGesture}>
      <View style={containerStyle}>
        <BottomTabBar 
          {...props} 
          style={[
            props.style,
            {
              backgroundColor: getColor(colors.tabBar.background, isDark),
              borderTopWidth: 0,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
            },
          ]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              setTabBarWidth(width);
            }
          }}
        />
      </View>
    </GestureDetector>
  );
};

export const TabNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Global navigation UI state'ten tab bar visibility'yi al
  const isTabBarVisible = useNavigationUIStore((state) => state.isTabBarVisible);

  // PERFORMANCE FIX: Unread messages - inbox badge için
  // CRITICAL OPTIMIZATION: Inbox'a girilmeden mesajları yükleme (lazy loading)
  const [hasVisitedInbox, setHasVisitedInbox] = React.useState(false);
  const { data: messages } = useMessages(hasVisitedInbox);
  const unreadNotificationCount = useNotificationStore((s) => s.unreadCountCache ?? 0);

  const hasUnreadMessages = useMemo(() => {
    // CRITICAL FIX: messages undefined veya array değilse false döndür
    if (!messages || !Array.isArray(messages) || messages.length === 0) return false;
    return messages.some((message) => message.isUnread || message.unreadCount > 0);
  }, [messages]);
  
  // Debug: Android'de insets.bottom değerini logla (sadece ilk render'da)
  useMemo(() => {
    if (Platform.OS === 'android') {
      console.log('[TabNavigator] Android insets.bottom:', insets.bottom);
    }
  }, []);

  // tabBarStyle'ı useMemo ile optimize et - sürekli re-render'ı önle
  // Tab bar visibility'ye göre display kontrolü yap
  // Liquid Glass kullanılıyorsa backgroundColor transparent olmalı
  const tabBarStyle = useMemo(() => {
    const androidBottomPadding = insets.bottom;
    
    // Tab bar gizliyse display: 'none' kullan
    if (!isTabBarVisible) {
      return { display: 'none' as const };
    }
    
    const backgroundColor = getColor(colors.tabBar.background, isDark);
    
    return {
      backgroundColor,
      borderTopWidth: 0, // Border'ı kaldırdık, yuvarlatılmış köşeler var
      borderTopLeftRadius: 24, // Yuvarlatılmış üst köşeler (su damlası efekti)
      borderTopRightRadius: 24,
      height: Platform.OS === 'ios' ? 45 + insets.bottom : 45 + androidBottomPadding,
      paddingTop: 8, // Üst padding artırıldı
      paddingBottom: Platform.OS === 'ios' ? insets.bottom : androidBottomPadding,
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      overflow: 'hidden' as const, // Yuvarlatılmış köşeler için
    };
  }, [insets.bottom, isTabBarVisible, isDark]);

  // PERFORMANCE FIX: Tab bar icon render fonksiyonunu useCallback ile memoize et
  // Her tab değişiminde tüm tab'lar için çalışmasını önler
  const renderTabBarIcon = useCallback(({ route, focused, color, size }: {
    route: { name: keyof TabParamList };
    focused: boolean;
    color: string;
    size: number;
  }) => {
    // Icon boyutunu artır
    const iconSize = size * 1.1;
    // Heroicons: focused durumda solid, unfocused durumda outline kullan
    const iconProps = {
      color,
      width: iconSize,
      height: iconSize,
    };

    let IconComponent: React.ComponentType<any> | null = null;

    switch (route.name) {
      case 'FeedStack':
        IconComponent = focused ? HomeIconSolid : HomeIconOutline;
        break;
      case 'ExploreStack':
        // Ionicons stroke Heroicons'a göre daha kalın - boyutu küçülterek görsel ağırlığı eşitle
        return <Ionicons name={focused ? 'binoculars' : 'binoculars-outline'} size={iconSize * 0.85} color={color} />;

      case 'WalletStack':
        IconComponent = focused ? CreditCardIconSolid : CreditCardIconOutline;
        break;
      case 'EventsStack':
        IconComponent = focused ? CalendarIconSolid : CalendarIconOutline;
        break;
      case 'NotificationStack':
        IconComponent = focused ? BellIconSolid : BellIconOutline;
        break;
      case 'InboxStack':
        IconComponent = focused ? InboxIconSolid : InboxIconOutline;
        break;
    }

    if (!IconComponent) {
      return null;
    }

    // Notification icon için badge ekle
    if (route.name === 'NotificationStack') {
      return (
        <View style={{ position: 'relative' }}>
          <IconComponent {...iconProps} />
          <MessageBadge hasUnread={unreadNotificationCount > 0} />
        </View>
      );
    }

    // Inbox icon için badge ekle (sadece nokta, count yok)
    if (route.name === 'InboxStack') {
      return (
        <View style={{ position: 'relative' }}>
          <IconComponent {...iconProps} />
          <MessageBadge hasUnread={hasUnreadMessages} />
        </View>
      );
    }

    return <IconComponent {...iconProps} />;
  }, [hasUnreadMessages]);


  // PERFORMANCE FIX: Timeout ref for cleanup on unmount
  const feedScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedScrollTimeoutRef.current) {
        clearTimeout(feedScrollTimeoutRef.current);
      }
    };
  }, []);

  // PERFORMANCE FIX: Generic tab press handler with stack reset
  // Her tab için: başka tab'dayken o tab'a basıldığında stack'i reset et
  const createTabPressHandler = useCallback((tabName: string, additionalAction?: () => void) => {
    return () => {
      try {
        const state = navigation.getState();
        const currentRoute = state?.routes?.[state?.index];
        const currentTabName = currentRoute?.name;

        // Eğer zaten bu tab'dayken tekrar basıldıysa
        if (currentTabName === tabName) {
          const tabRoute = state?.routes?.find((route: any) => route.name === tabName);

          // Stack'te birden fazla ekran varsa reset et
          if (tabRoute?.state?.routes && tabRoute.state.routes.length > 1) {
            const firstScreenName = tabRoute.state.routes[0]?.name;
            if (firstScreenName) {
              navigation.dispatch({
                ...CommonActions.reset({
                  index: 0,
                  routes: [{ name: firstScreenName }],
                }),
                source: tabRoute.key,
                target: tabRoute.state.key,
              });
            }
          }
        }

        // Ek aksiyonları çalıştır (örn: scroll to top, lazy load)
        if (additionalAction) {
          additionalAction();
        }
      } catch (error) {
        console.warn(`[TabNavigator] ${tabName} tab press error:`, error);
      }
    };
  }, [navigation]);

  // Feed tab için özel scroll-to-top action
  const feedScrollAction = useCallback(() => {
    // Clear any previous pending timeout
    if (feedScrollTimeoutRef.current) {
      clearTimeout(feedScrollTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        feedScrollTimeoutRef.current = setTimeout(() => {
          ScrollRegistry.scrollToTop('feed', true);
          feedScrollTimeoutRef.current = null;
        }, 50);
      });
    });
  }, []);

  // Feed tab press: Stack reset + scroll to top
  const handleFeedTabPress = createTabPressHandler('FeedStack', feedScrollAction);

  // Diğer tab'lar için press handler'lar
  const handleExploreTabPress = createTabPressHandler('ExploreStack');
  const handleWalletTabPress = createTabPressHandler('WalletStack');
  const handleEventsTabPress = createTabPressHandler('EventsStack');
  const handleNotificationsTabPress = createTabPressHandler('NotificationStack');

  // PERFORMANCE FIX: Inbox tab press handler
  // Inbox'a ilk kez girildiğinde mesajları yükle (lazy loading)
  const handleInboxTabPress = useCallback(() => {
    if (!hasVisitedInbox) {
      setHasVisitedInbox(true);
    }
    // Stack reset'i generic handler ile yapılıyor
  }, [hasVisitedInbox]);

  const handleInboxTabPressWithReset = useCallback(() => {
    // Stack reset
    createTabPressHandler('InboxStack')();
    // Lazy loading
    handleInboxTabPress();
  }, [createTabPressHandler, handleInboxTabPress]);

  // ARCHITECTURE FIX: Edge-to-Edge Design Pattern
  // Manual inset management for full-bleed design with controlled background colors
  // Drawer can extend full height without SafeAreaView constraints
  const backgroundColor = getColor(colors.background.primary, isDark);
  const bottomBarColor = getColor(colors.tabBar.safeAreaBackground, isDark);

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Üst Güvenli Alan - Status Bar arkasını boyar */}
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

      {/* Tab Navigator - Tam ekranı kaplar, Drawer buraya kadar uzanabilir */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={({ route }) => ({
            // PERFORMANCE FIX: Freeze inactive tabs to stop rendering while preserving state
            // freezeOnBlur: true uses react-native-screens to suspend inactive tab rendering
            // This prevents 6 tabs from consuming CPU/memory simultaneously
            freezeOnBlur: true,
            unmountOnBlur: false,
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => renderTabBarIcon({ route, focused, color, size }),
            tabBarActiveTintColor: colors.tabBar.active,
            tabBarInactiveTintColor: getColor(colors.tabBar.inactive, isDark),
            tabBarShowLabel: false,
            tabBarStyle,
          })}
        >
          <Tab.Screen
            name="FeedStack"
            component={FeedNavigator}
            listeners={{ tabPress: handleFeedTabPress }}
          />
          <Tab.Screen
            name="ExploreStack"
            component={ExploreNavigator}
            listeners={{ tabPress: handleExploreTabPress }}
          />
          <Tab.Screen
            name="WalletStack"
            component={WalletNavigator}
            listeners={{ tabPress: handleWalletTabPress }}
          />
          <Tab.Screen
            name="EventsStack"
            component={EventsNavigator}
            listeners={{ tabPress: handleEventsTabPress }}
          />
          <Tab.Screen
            name="NotificationStack"
            component={NotificationsNavigator}
            listeners={{ tabPress: handleNotificationsTabPress }}
          />
          <Tab.Screen
            name="InboxStack"
            component={InboxNavigator}
            listeners={{ tabPress: handleInboxTabPressWithReset }}
          />
        </Tab.Navigator>
      </View>

      {/* Alt Güvenli Alan - Home Indicator arkasını boyar (Tab Bar altı) */}
      <View
        style={{
          height: insets.bottom,
          backgroundColor: bottomBarColor,
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
