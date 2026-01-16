import React, { useMemo, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { MessageBadge } from '@/src/components/MessageBadge';
import { useUnreadCount, useMarkAllNotificationsAsRead } from '@/src/features/notifications/api/hooks';
import { useMessages } from '@/src/features/inbox/api/hooks';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useAppStore } from '@/src/store/appStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/src/providers/AuthProvider';
import { getHeavyTabFreezeRule } from './rules/freezeRules';
import { ScrollRegistry } from '@/src/services/ScrollRegistry';
// Heroicons imports
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  CalendarIcon as CalendarIconSolid,
  BellIcon as BellIconSolid,
  InboxIcon as InboxIconSolid,
} from 'react-native-heroicons/solid';
import {
  HomeIcon as HomeIconOutline,
  MagnifyingGlassIcon as MagnifyingGlassIconOutline,
  Squares2X2Icon as Squares2X2IconOutline,
  CalendarIcon as CalendarIconOutline,
  BellIcon as BellIconOutline,
  InboxIcon as InboxIconOutline,
} from 'react-native-heroicons/outline';

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
  const { data: messages } = useMessages();
  const hasUnreadMessages = useMemo(() => {
    if (!messages || messages.length === 0) return false;
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

  // tabBarStyle'ı useMemo ile optimize et - sürekli re-render'ı önle
  // Tab bar visibility'ye göre display kontrolü yap
  const tabBarStyle = useMemo(() => {
    const androidBottomPadding = insets.bottom;
    
    // Tab bar gizliyse display: 'none' kullan
    if (!isTabBarVisible) {
      return { display: 'none' as const };
    }
    
    return {
      backgroundColor: isDark ? '#000000' : '#FAFAFA',
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#E9E9E9',
      height: Platform.OS === 'ios' ? 45 + insets.bottom : 45 + androidBottomPadding,
      paddingTop: 4,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom : androidBottomPadding,
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
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
        IconComponent = focused ? MagnifyingGlassIconSolid : MagnifyingGlassIconOutline;
        break;
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

  // PERFORMANCE FIX: Tab press handler'ını useCallback ile memoize et
  const handleNotificationTabPress = useCallback(() => {
    // Bildirim ikonuna tıklandığında tüm bildirimleri read olarak işaretle
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate(undefined, {
        onSuccess: () => {
          console.log('[TabNavigator] ✅ All notifications marked as read');
        },
      });
    }
  }, [unreadCount, markAllAsReadMutation]);

  // CRITICAL FIX: Instagram-style scroll-to-top handler
  // Home icon'a tıklandığında Feed'i en üste scroll et
  // React Navigation'ın useScrollToTop hook'u sadece aktif tab için çalışır
  // Bu handler hem aktif hem inactive durumda çalışır
  // 
  // IMPORTANT: Tab press event'i zaten FeedStack'e navigate edecek
  // Bu handler sadece scroll yapmak için - navigation otomatik
  const handleFeedTabPress = useCallback(() => {
    // CRITICAL FIX: Double requestAnimationFrame - native view'in mount olmasını bekle
    // React Navigation tab press event'i FeedStack'e navigate edecek
    // Navigate tamamlandıktan sonra scroll yapmak için delay ekle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Ekstra delay - screen transition tamamlanmasını bekle
        setTimeout(() => {
          ScrollRegistry.scrollToTop('feed', true);
        }, 50);
      });
    });
  }, []);

  // Heavy tab'ler için freeze rule
  const heavyTabFreezeRule = getHeavyTabFreezeRule();

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
          screenOptions={({ route }) => ({
            // ARCHITECTURE FIX: Tab state persistence
            // Prevent tabs from unmounting on blur to preserve scroll position and state
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
          />
          <Tab.Screen
            name="CatalogStack"
            component={CatalogNavigator}
            options={{
              // Heavy tab: freeze on blur
              freezeOnBlur: heavyTabFreezeRule.freezeOnBlur,
            }}
          />
          <Tab.Screen
            name="EventsStack"
            component={EventsNavigator}
            options={{
              // Heavy tab: freeze on blur
              freezeOnBlur: heavyTabFreezeRule.freezeOnBlur,
            }}
          />
          <Tab.Screen
            name="NotificationStack"
            component={NotificationsNavigator}
            listeners={{
              tabPress: handleNotificationTabPress,
            }}
          />
          <Tab.Screen
            name="InboxStack"
            component={InboxNavigator}
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
