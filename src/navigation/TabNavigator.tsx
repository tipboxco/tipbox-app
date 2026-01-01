import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { useUnreadCount, useMarkAllNotificationsAsRead } from '@/src/features/notifications/api/hooks';
import { useNavigation } from '@react-navigation/native';

import { FeedNavigator } from '@/src/features/feed/navigation';
import { ExploreNavigator } from '@/src/features/explore/navigation';
import { CatalogNavigator } from '@/src/features/catalog/navigation';
import { EventsNavigator } from '@/src/features/events/navigation';
import { NotificationsNavigator } from '@/src/features/notifications/navigation';
import { InboxNavigator } from '@/src/features/inbox/navigation';
import { buildFeatureStack } from './build-stack';

export type TabParamList = {
  FeedStack: undefined;
  ExploreStack: undefined;
  CatalogStack: undefined;
  EventsStack: undefined;
  NotificationStack: undefined;
  InboxStack: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Her feature stack'i tek satırda oluşturuyoruz
const FeedStackNavigator = buildFeatureStack('Feed', FeedNavigator);
const ExploreStackNavigator = buildFeatureStack('Explore', ExploreNavigator);
const CatalogStackNavigator = buildFeatureStack('Catalog', CatalogNavigator);
const EventsStackNavigator = buildFeatureStack('Events', EventsNavigator);
const NotificationStackNavigator = buildFeatureStack('Notification', NotificationsNavigator);
const InboxStackNavigator = buildFeatureStack('Inbox', InboxNavigator);

export const TabNavigator = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Global navigation UI state'ten tab bar visibility'yi al
  const isTabBarVisible = useNavigationUIStore((state) => state.isTabBarVisible);
  
  // Unread notification count - badge için
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.data?.count || 0;
  
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
