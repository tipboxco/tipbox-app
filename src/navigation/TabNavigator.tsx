import React, { useMemo, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { MessageBadge } from '@/src/components/MessageBadge';
import { useUnreadCount, useMarkAllNotificationsAsRead } from '@/src/features/notifications/api/hooks';
import { useMessages } from '@/src/features/inbox/api/hooks';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@/src/store/appStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/src/providers/AuthProvider';
import { getHeavyTabFreezeRule } from './rules/freezeRules';

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
  const unreadCount = useMemo(() => unreadCountData?.data?.count || 0, [unreadCountData?.data?.count]);
  
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
    let iconName: keyof typeof Feather.glyphMap = 'home';

    switch (route.name) {
      case 'FeedStack':
        iconName = 'home';
        break;
      case 'ExploreStack':
        iconName = 'search';
        break;
      case 'CatalogStack':
        iconName = 'grid';
        break;
      case 'EventsStack':
        iconName = 'calendar';
        break;
      case 'NotificationStack':
        iconName = 'bell';
        break;
      case 'InboxStack':
        iconName = 'inbox';
        break;
    }

    // Notification icon için badge ekle
    if (route.name === 'NotificationStack') {
      return (
        <View style={{ position: 'relative' }}>
          <Feather name={iconName} size={size} color={color} />
          <NotificationBadge count={unreadCount} />
        </View>
      );
    }

    // Inbox icon için badge ekle (sadece nokta, count yok)
    if (route.name === 'InboxStack') {
      return (
        <View style={{ position: 'relative' }}>
          <Feather name={iconName} size={size} color={color} />
          <MessageBadge hasUnread={hasUnreadMessages} />
        </View>
      );
    }

    return <Feather name={iconName} size={size} color={color} />;
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
