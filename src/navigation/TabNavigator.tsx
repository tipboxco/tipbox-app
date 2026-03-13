import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { MessageBadge } from '@/src/components/MessageBadge';
import { useUnreadCount, useMarkAllNotificationsAsRead } from '@/src/features/notifications/api/hooks';
import { useMessages } from '@/src/features/inbox/api/hooks';
import { useNavigation, useNavigationState, CommonActions } from '@react-navigation/native';
import { useAppStore } from '@/src/store/appStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/src/providers/AuthProvider';
// freezeOnBlur is now set globally in screenOptions for all tabs
import { ScrollRegistry } from '@/src/services/ScrollRegistry';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
// Heroicons imports
import {
  HomeIcon as HomeIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  CalendarIcon as CalendarIconSolid,
  BellIcon as BellIconSolid,
  InboxIcon as InboxIconSolid,
} from 'react-native-heroicons/solid';
import {
  HomeIcon as HomeIconOutline,
  Squares2X2Icon as Squares2X2IconOutline,
  CalendarIcon as CalendarIconOutline,
  BellIcon as BellIconOutline,
  InboxIcon as InboxIconOutline,
} from 'react-native-heroicons/outline';
// Ionicons for Explore tab (Heroicons doesn't have binoculars)
import Ionicons from '@expo/vector-icons/Ionicons';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
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
  
  // Liquid Glass availability check
  const isGlassAvailable = useMemo(() => {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
  }, []);
  
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
  
  // Animasyonlu overlay - sürüklerken glass efekti daha belirgin olur
  const animatedOverlay = useAnimatedStyle(() => {
    const intensity = isPressing.value 
      ? Math.min(1, Math.abs(panX.value) / (tabWidth * 0.5))
      : 0;
    
    // Sürüklerken overlay opacity artar (glass efekti daha belirgin)
    const overlayOpacity = withTiming(intensity * 0.2, { duration: 100 });
    
    return {
      opacity: overlayOpacity,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    };
  });
  
  // Tab bar gizliyse render etme (tüm hook'lardan sonra)
  if (!isTabBarVisible) {
    return null;
  }
  
  const androidBottomPadding = insets.bottom;
  const tabBarHeight = Platform.OS === 'ios' ? 45 + insets.bottom : 45 + androidBottomPadding;
  
  // Liquid Glass için base tint color
  const baseTintColor = isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
  
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
  
  // Liquid Glass kullanılabilirse GlassView ile sarmala
  if (isGlassAvailable) {
    return (
      <GestureDetector gesture={panGesture}>
        <GlassView
          style={containerStyle}
          glassEffectStyle="clear" // "clear" daha şeffaf ve su damlası gibi görünür
          isInteractive={true} // Interactive yapıldı - dokunma efekti için
          tintColor={baseTintColor}
        >
          <View style={{ flex: 1, position: 'relative' }}>
            <BottomTabBar 
              {...props} 
              style={[
                props.style,
                {
                  backgroundColor: 'transparent',
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
            {/* Animasyonlu overlay - sürüklerken glass efekti daha belirgin */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                  pointerEvents: 'none',
                },
                animatedOverlay,
              ]}
            />
          </View>
        </GlassView>
      </GestureDetector>
    );
  }
  
  // Fallback: Normal tab bar (Android veya iOS'ta liquid glass mevcut değilse)
  // Fallback'te de yuvarlatılmış köşeler ekle
  return (
    <GestureDetector gesture={panGesture}>
      <View style={containerStyle}>
        <BottomTabBar 
          {...props} 
          style={[
            props.style,
            {
              backgroundColor: isDark ? '#000000' : '#FAFAFA',
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
  
  // PERFORMANCE FIX: Zustand selector'ını shallow ile memoize et
  const isAuthenticated = useAppStore(useShallow((state) => state.isAuthenticated));
  const { isAuthReady } = useAuth();
  
  // Global navigation UI state'ten tab bar visibility'yi al
  const isTabBarVisible = useNavigationUIStore((state) => state.isTabBarVisible);
  
  // PERFORMANCE FIX: Unread notification count - badge için
  // Sadece authenticated ve auth ready ise çalıştır
  const shouldFetchNotifications = isAuthenticated && isAuthReady;
  const { data: unreadCountData } = useUnreadCount(shouldFetchNotifications);
  
  // Zustand store'dan optimistic count'u al (realtime update için)
  const storeUnreadCount = useNotificationStore((state) => state.unreadCountCache);
  
  // ÖNEMLİ: Store count ile API count'u karşılaştır, daha büyük olanı kullan
  // Bu sayede hem optimistic update hem de API sync doğru çalışır
  const unreadCount = useMemo(() => {
    const apiCount = unreadCountData?.data?.count || 0;
    
    // Store count null ise API count'u kullan
    if (storeUnreadCount === null) {
      return apiCount;
    }
    
    // Store count ile API count'u karşılaştır, daha büyük olanı kullan
    // Bu sayede:
    // - Yeni bildirim geldiğinde store count daha büyük olur (optimistic update)
    // - API sync olduğunda API count daha büyük olabilir (başka cihazdan bildirim)
    // - Her iki durumda da doğru count gösterilir
    return Math.max(storeUnreadCount, apiCount);
  }, [storeUnreadCount, unreadCountData?.data?.count]);
  
  // PERFORMANCE FIX: Unread messages - inbox badge için
  // Sadece authenticated ve auth ready ise çalıştır
  // CRITICAL OPTIMIZATION: Inbox'a girilmeden mesajları yükleme (lazy loading)
  // Badge için inbox tab'ına en az bir kez girilmesi gerekiyor
  const [hasVisitedInbox, setHasVisitedInbox] = React.useState(false);
  const { data: messages } = useMessages(hasVisitedInbox);
  const hasUnreadMessages = useMemo(() => {
    // CRITICAL FIX: messages undefined veya array değilse false döndür
    if (!messages || !Array.isArray(messages) || messages.length === 0) return false;
    return messages.some((message) => message.isUnread || message.unreadCount > 0);
  }, [messages]);
  
  // Mark all as read mutation - bildirim ikonuna tıklandığında
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Debug: Android'de insets.bottom değerini logla (sadece ilk render'da)
  useMemo(() => {
    if (Platform.OS === 'android') {
      console.log('[TabNavigator] Android insets.bottom:', insets.bottom);
    }
  }, []);

  // Liquid Glass availability check - TabNavigator içinde de kullanılıyor
  const isGlassAvailable = useMemo(() => {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
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
    
    // Liquid Glass kullanılıyorsa backgroundColor transparent yap
    const backgroundColor = isGlassAvailable 
      ? 'transparent' 
      : (isDark ? '#000000' : '#FAFAFA');
    
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
  }, [insets.bottom, isTabBarVisible, isDark, isGlassAvailable]);

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
        return <Ionicons name={focused ? 'binoculars' : 'binoculars-outline'} size={iconSize} color={color} />;

      case 'CatalogStack':
        IconComponent = focused ? Squares2X2IconSolid : Squares2X2IconOutline;
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
          <NotificationBadge count={unreadCount} />
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
  }, [unreadCount, hasUnreadMessages]);


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
  const handleCatalogTabPress = createTabPressHandler('CatalogStack');
  const handleEventsTabPress = createTabPressHandler('EventsStack');
  const handleNotificationsTabPress = useCallback(() => {
    // Stack reset
    createTabPressHandler('NotificationStack')();
    // Bildirim ikonuna tıklandığında tüm bildirimleri read olarak işaretle
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate(undefined, {
        onSuccess: () => {
          console.log('[TabNavigator] ✅ All notifications marked as read');
        },
      });
    }
  }, [unreadCount, markAllAsReadMutation, createTabPressHandler]);

  const handleInboxTabPressWithReset = useCallback(() => {
    // Stack reset
    createTabPressHandler('InboxStack')();
    // Lazy loading
    handleInboxTabPress();
  }, [createTabPressHandler, handleInboxTabPress]);

  // PERFORMANCE FIX: Inbox tab press handler
  // Inbox'a ilk kez girildiğinde mesajları yükle (lazy loading)
  const handleInboxTabPress = useCallback(() => {
    if (!hasVisitedInbox) {
      setHasVisitedInbox(true);
    }
    // Stack reset'i generic handler ile yapılıyor
  }, [hasVisitedInbox]);


  // ARCHITECTURE FIX: Edge-to-Edge Design Pattern
  // Manual inset management for full-bleed design with controlled background colors
  // Drawer can extend full height without SafeAreaView constraints
  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const bottomBarColor = isDark ? '#1A1A1A' : '#FAFAFA';

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
            tabBarActiveTintColor: '#758600',
            tabBarInactiveTintColor: isDark ? '#FFFFFF' : '#000000',
            tabBarShowLabel: false,
            tabBarStyle,
          })}
        >
          <Tab.Screen
            name="FeedStack"
            component={FeedNavigator}
            listeners={{
              tabPress: handleFeedTabPress,
            }}
          />
          <Tab.Screen
            name="ExploreStack"
            component={ExploreNavigator}
            listeners={{
              tabPress: handleExploreTabPress,
            }}
          />
          <Tab.Screen
            name="CatalogStack"
            component={CatalogNavigator}
            listeners={{
              tabPress: handleCatalogTabPress,
            }}
          />
          <Tab.Screen
            name="EventsStack"
            component={EventsNavigator}
            listeners={{
              tabPress: handleEventsTabPress,
            }}
          />
          <Tab.Screen
            name="NotificationStack"
            component={NotificationsNavigator}
            listeners={{
              tabPress: handleNotificationsTabPress,
            }}
          />
          <Tab.Screen
            name="InboxStack"
            component={InboxNavigator}
            listeners={{
              tabPress: handleInboxTabPressWithReset,
            }}
          />
        </Tab.Navigator>
      </View>

      {/* Alt Güvenli Alan - Home Indicator arkasını boyar (Tab Bar altı) */}
      {/* Liquid Glass kullanıldığında bu alan transparent olmalı */}
      {!isGlassAvailable && (
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
      )}
    </View>
  );
};
