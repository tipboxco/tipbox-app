import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { useAuth } from '@/src/providers/AuthProvider';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { EventsNavigator } from '@/src/features/events/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { InboxNavigator } from '@/src/features/inbox/navigation';
import type { TabParamList } from './types/tab.types';
import type { MainStackParamList } from './types/main.types';

const Tab = createBottomTabNavigator<TabParamList>();
const FeatureStack = createNativeStackNavigator<MainStackParamList>();

// Feature Stack Navigators - Shared screens YOK, sadece feature screens
const FeedStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Feed" component={FeedNavigator} />
  </FeatureStack.Navigator>
);

const ExploreStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Explore" component={ExploreNavigator} />
  </FeatureStack.Navigator>
);

const CatalogStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Catalog" component={CatalogNavigator} />
  </FeatureStack.Navigator>
);

const EventsStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Events" component={EventsNavigator} />
  </FeatureStack.Navigator>
);

const NotificationStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Notification" component={NotificationsNavigator} />
  </FeatureStack.Navigator>
);

const InboxStackNavigator = () => (
  <FeatureStack.Navigator screenOptions={{ headerShown: false }}>
    <FeatureStack.Screen name="Inbox" component={InboxNavigator} />
  </FeatureStack.Navigator>
);

export const TabNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isAuthenticated } = useAppStore();
  const { isAuthReady } = useAuth();
  
  // Global navigation UI state'ten tab bar visibility'yi al
  const isTabBarVisible = useNavigationUIStore((state) => state.isTabBarVisible);
  
  // Unread notification count - badge için
  // Sadece authenticated ve auth ready ise çalıştır
  const { data: unreadCountData } = useUnreadCount(
    isAuthenticated && isAuthReady
  );
  const unreadCount = unreadCountData?.data?.count || 0;
  
  // Unread messages - inbox badge için
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
      backgroundColor: '#FAFAFA',
      borderTopColor: '#E9E9E9',
      height: Platform.OS === 'ios' ? 45 + insets.bottom : 45 + androidBottomPadding,
      paddingTop: 4,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom : androidBottomPadding,
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    };
  }, [insets.bottom, isTabBarVisible]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
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
        },
        tabBarActiveTintColor: '#758600',
        tabBarInactiveTintColor: '#000000',
        tabBarShowLabel: false,
        tabBarStyle,
      })}
    >
      <Tab.Screen
        name="FeedStack"
        component={FeedStackNavigator}
      />
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStackNavigator}
      />
      <Tab.Screen
        name="CatalogStack"
        component={CatalogStackNavigator}
      />
      <Tab.Screen
        name="EventsStack"
        component={EventsStackNavigator}
      />
      <Tab.Screen
        name="NotificationStack"
        component={NotificationStackNavigator}
        listeners={{
          tabPress: () => {
            // Bildirim ikonuna tıklandığında tüm bildirimleri read olarak işaretle
            if (unreadCount > 0) {
              markAllAsReadMutation.mutate(undefined, {
                onSuccess: () => {
                  console.log('[TabNavigator] ✅ All notifications marked as read');
                },
              });
            }
          },
        }}
      />
      <Tab.Screen
        name="InboxStack"
        component={InboxStackNavigator}
      />
    </Tab.Navigator>
  );
};
