import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { socketService } from '@/src/services/SocketService';
import { notificationEventService } from '@/src/services/NotificationEventService';
import { notificationGroupingService } from '@/src/services/NotificationGroupingService';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { notificationAnalytics } from '@/src/services/NotificationAnalytics';
import { notificationStateSync } from '@/src/services/NotificationStateSync';
import { useAppStore } from '@/src/store/appStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useAuth } from './AuthProvider';
import { useAppState } from './AppStateProvider';
import { notificationKeys, useUnreadCount } from '@/src/features/notifications/api/hooks';
import type { Notification } from '@/src/features/notifications/api/types';
import type { NotificationPayload } from '@/src/types/notification';
import { NotificationToast } from '@/src/components/NotificationToast';

/**
 * Navigation ref - NavigationContainer dışından navigation yapmak için
 */
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Screen name mapping - DeepLinkService'den gelen screen adlarını TabNavigator'daki screen adlarıyla eşleştir
 */
function mapScreenName(screen: string): string | null {
  const screenMap: Record<string, string> = {
    'Notifications': 'NotificationStack',
    'Notification': 'NotificationStack',
    'Inbox': 'InboxStack',
    'Messages': 'InboxStack',
    'MessageDetail': 'InboxStack', // InboxStack içinde MessageDetail screen'i var
    'Feed': 'FeedStack',
    'PostDetail': 'Post', // Shared screen
    'Profile': 'Profile', // Shared screen
    'Explore': 'ExploreStack',
    'Catalog': 'CatalogStack',
    'Events': 'EventsStack',
    'EventDetail': 'EventsStack',
    'Wallet': 'Wallet', // Shared screen
    'Settings': 'Settings', // Shared screen
  };

  return screenMap[screen] || null;
}

/**
 * Navigation helper function
 */
export function navigate(name: string, params?: any) {
  if (!name) {
    console.error('[NotificationProvider] ❌ Navigation error: Screen name is required');
    return;
  }

  if (!navigationRef.current) {
    console.error('[NotificationProvider] ❌ Navigation error: Navigation ref is not ready');
    return;
  }

  try {
    navigationRef.current.navigate(name as never, params as never);
  } catch (error) {
    console.error('[NotificationProvider] ❌ Navigation error:', {
      screen: name,
      params,
      error,
    });
  }
}

/**
 * Notification Context Type
 */
interface NotificationContextType {
  isInitialized: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  expoPushToken?: string;
}

/**
 * Notification Context
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Notification Provider Props
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification Provider Component
 * Tüm uygulamada notification sistemini yönetir
 * - Expo Push Notifications setup
 * - Socket.IO notification listener
 * - Notification navigation handling
 * 
 * Kritik: Auth hazır olmadan başlamaz!
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppStore();
  const { isAuthReady } = useAuth();
  const { isForeground } = useAppState();
  const [state, setState] = React.useState<NotificationContextType>({
    isInitialized: false,
    permissionStatus: 'undetermined',
  });
  
  // Unread count için query - badge sync için
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.data?.count || 0;
  
  // Toast state - WhatsApp/Instagram tarzı in-app notification
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastData, setToastData] = React.useState<{
    title: string;
    message: string;
    avatar?: string | number;
    onPress?: () => void;
  } | null>(null);

  // Notification service initialization
  // ⚠️ Auth hazır olmadan başlamaz!
  useEffect(() => {
    if (!isAuthReady) {
      console.log('[NotificationProvider] ⏳ Waiting for auth to be ready...');
      return;
    }

    // Authenticated değilse sadece permission iste, token kaydetme
    if (!isAuthenticated) {
      console.log('[NotificationProvider] ⏳ User not authenticated, skipping token registration');
      return;
    }

    console.log('[NotificationProvider] ========================================');
    console.log('[NotificationProvider] 🔔 Notification Service Initialization Started');
    console.log('[NotificationProvider] ========================================');
    console.log('[NotificationProvider]    - Auth Ready: ✅');
    console.log('[NotificationProvider]    - Is Authenticated:', isAuthenticated);

    const initializeNotifications = async () => {
      try {
        console.log('[NotificationProvider] 📋 Step 1: Requesting notification permission...');
        const notificationState = await notificationService.initialize();
        
        setState({
          isInitialized: notificationState.isInitialized,
          permissionStatus: notificationState.permissionStatus,
          expoPushToken: notificationState.expoPushToken,
        });
        
        console.log('[NotificationProvider] ✅ Notification service initialized');
        console.log('[NotificationProvider]    - Permission Status:', notificationState.permissionStatus);
        console.log('[NotificationProvider]    - Push Token:', notificationState.expoPushToken ? '✅' : '❌');
        console.log('[NotificationProvider] ========================================');

        // Pending token varsa tekrar dene
        await notificationService.retryPendingPushToken();
      } catch (error) {
        console.error('[NotificationProvider] ❌ Failed to initialize notification service:', error);
      }
    };

    initializeNotifications();
  }, [isAuthReady, isAuthenticated]);

  // Token refresh - App foreground'a geldiğinde token'ı kontrol et
  useEffect(() => {
    if (!state.isInitialized || !isAuthenticated || !isForeground) {
      return;
    }

    // App foreground'a geldiğinde token'ı refresh et
    const refreshToken = async () => {
      try {
        const newToken = await notificationService.refreshPushToken();
        if (newToken && newToken !== state.expoPushToken) {
          setState(prev => ({ ...prev, expoPushToken: newToken }));
          console.log('[NotificationProvider] 🔄 Push token refreshed');
        }
      } catch (error) {
        console.error('[NotificationProvider] ❌ Error refreshing push token:', error);
      }
    };

    // Foreground'a geldikten 2 saniye sonra refresh et (network bağlantısı kurulması için)
    const timeout = setTimeout(refreshToken, 2000);
    return () => clearTimeout(timeout);
  }, [isForeground, state.isInitialized, isAuthenticated, state.expoPushToken]);

  // Notification State Sync initialization
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) {
      return;
    }

    // State sync servisini initialize et
    notificationStateSync.initialize(queryClient);

    return () => {
      notificationStateSync.cleanup();
    };
  }, [isAuthenticated, state.isInitialized, queryClient]);

  // Socket.IO notification listener with Event-Driven Architecture
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) {
      return;
    }

    const handleSocketNotification = async (notification: Notification) => {
      console.log('[NotificationProvider] 📨 Socket notification received:', notification);

      // Analytics: Notification received tracking
      await notificationAnalytics.trackReceived(
        notification.id,
        notification.type,
        { source: 'socket' }
      );

      // State Sync: Zustand store'a ekle (instant UI update)
      notificationStateSync.addNotification(notification);

      // Event-driven: Notification event oluştur ve dispatch et
      const event = notificationEventService.createEvent(notification, 'socket');
      await notificationEventService.dispatch(event);

      // Notification içeriğini hazırla (notification item ile aynı format)
      const notificationTitle = notification.title || notification.metadata?.userName || 'Bildirim';
      const notificationMessage = notification.message || '';
      const notificationAvatar = notification.metadata?.userAvatar;

      // Grouping: Event'i grupla veya hemen gönder
      const groupingEvent = {
        type: notification.type,
        userId: notification.metadata?.userId || '',
        priority: event.priority,
        channels: ['IN_APP', 'PUSH'],
        metadata: {
          notificationId: notification.id,
          navigation: notification.navigation,
          ...notification.metadata,
        },
        timestamp: new Date(notification.createdAt || new Date()),
      };

      const grouped = await notificationGroupingService.groupOrSend(groupingEvent);

      if (grouped) {
        // Gruplanmış bildirim göster
        const groupedTitle = grouped.groupedTitle || notificationTitle;
        const groupedBody = grouped.groupedBody || notificationMessage;

        // Foreground'da toast göster
        if (isForeground) {
          setToastData({
            title: groupedTitle,
            message: groupedBody,
            avatar: notificationAvatar,
            onPress: () => {
              // Notifications screen'e git
              try {
                navigate('NotificationStack', { screen: 'NotificationsScreen' });
              } catch (error) {
                console.error('[NotificationProvider] ❌ Navigation error:', error);
              }
              setToastVisible(false);
            },
          });
          setToastVisible(true);
        }

        // Her zaman push notification gönder (foreground/background/app closed)
        try {
          await notificationService.sendLocalNotification({
            title: groupedTitle,
            body: groupedBody,
            data: {
              notificationId: notification.id,
              type: notification.type,
              navigation: notification.navigation,
              grouped: true,
              count: grouped.count,
              metadata: notification.metadata,
            },
          });
          console.log('[NotificationProvider] ✅ Grouped push notification sent');
        } catch (error) {
          console.error('[NotificationProvider] ❌ Error sending grouped push notification:', error);
        }
      } else {
        // Tekil bildirim göster
        const store = useNotificationStore.getState();
        const isGrouped = store.isNotificationGrouped(notification.type);
        
        if (!isGrouped) {
          // Foreground'da toast göster
          if (isForeground && notificationTitle && notificationMessage) {
            setToastData({
              title: notificationTitle,
              message: notificationMessage,
              avatar: notificationAvatar,
              onPress: () => {
                // Deep link ile navigation
                const route = deepLinkService.parseNotificationData({
                  navigation: notification.navigation,
                  metadata: notification.metadata,
                });
                if (route?.screen) {
                  // Screen adını TabNavigator'daki screen adlarıyla eşleştir
                  const mappedScreen = mapScreenName(route.screen);
                  if (mappedScreen) {
                    navigate(mappedScreen, route.params);
                  } else {
                    // Fallback: NotificationStack'a git
                    navigate('NotificationStack', { screen: 'NotificationsScreen' });
                  }
                } else {
                  // Fallback: NotificationStack'a git
                  navigate('NotificationStack', { screen: 'NotificationsScreen' });
                }
                setToastVisible(false);
              },
            });
            setToastVisible(true);
          }

          // Her zaman push notification gönder (foreground/background/app closed)
          try {
            await notificationService.sendLocalNotification({
              title: notificationTitle,
              body: notificationMessage,
              data: {
                notificationId: notification.id,
                type: notification.type,
                navigation: notification.navigation,
                metadata: notification.metadata,
              },
            });
            console.log('[NotificationProvider] ✅ Push notification sent');
          } catch (error) {
            console.error('[NotificationProvider] ❌ Error sending push notification:', error);
          }
        }
      }

      // React Query cache'i invalidate et (notificationStateSync periyodik sync yapıyor)
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    // Register socket notification listener
    socketService.onNotification(handleSocketNotification);

    return () => {
      socketService.off('notification', handleSocketNotification);
    };
  }, [isAuthenticated, state.isInitialized, isForeground, queryClient]);

  // Expo Push notification handlers
  useEffect(() => {
    if (!state.isInitialized) {
      return;
    }

    const handleNotificationReceived = (notification: NotificationPayload) => {
      console.log('[NotificationProvider] 📱 Push notification received (foreground):', notification);
      
      // Foreground'da notification geldiğinde query'leri refresh et
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handleNotificationResponse = async (notification: NotificationPayload) => {
      console.log('[NotificationProvider] 👆 Push notification tapped:', notification);
      
      const notificationId = notification.data?.notificationId as string;
      const notificationType = notification.data?.type as string;

      // Analytics: Notification opened tracking
      if (notificationId && notificationType) {
        await notificationAnalytics.trackOpened(
          notificationId,
          notificationType,
          { source: 'push' }
        );
      }

      // Deep Linking: Gelişmiş deep link parsing
      const route = deepLinkService.parseNotificationData(notification.data || {});
      
      if (route && route.screen) {
        try {
          // Screen adını TabNavigator'daki screen adlarıyla eşleştir
          const mappedScreen = mapScreenName(route.screen);
          if (mappedScreen) {
            // Navigation ref hazır olana kadar bekle
            const navigateWithDelay = () => {
              if (navigationRef.current) {
                navigate(mappedScreen, route.params);
                console.log('[NotificationProvider] ✅ Navigated to:', mappedScreen, route.params);
              } else {
                // Ref hazır değilse 500ms bekle ve tekrar dene
                setTimeout(navigateWithDelay, 500);
              }
            };
            navigateWithDelay();
          } else {
            // Fallback: NotificationStack'a git
            const navigateWithDelay = () => {
              if (navigationRef.current) {
                navigate('NotificationStack', { screen: 'NotificationsScreen' });
                console.log('[NotificationProvider] ✅ Navigated to NotificationStack (fallback)');
              } else {
                setTimeout(navigateWithDelay, 500);
              }
            };
            navigateWithDelay();
          }
        } catch (error) {
          console.error('[NotificationProvider] ❌ Navigation error:', error);
        }
      } else {
        // Fallback: Eski navigation data formatı
        const navigationData = notification.data?.navigation as { screen: string; params?: Record<string, any> };
        if (navigationData?.screen) {
          try {
            const mappedScreen = mapScreenName(navigationData.screen);
            const navigateWithDelay = () => {
              if (navigationRef.current) {
                if (mappedScreen) {
                  navigate(mappedScreen, navigationData.params);
                } else {
                  // Fallback: NotificationStack'a git
                  navigate('NotificationStack', { screen: 'NotificationsScreen' });
                }
              } else {
                setTimeout(navigateWithDelay, 500);
              }
            };
            navigateWithDelay();
          } catch (error) {
            console.error('[NotificationProvider] Navigation error:', error);
          }
        } else {
          // Final fallback: NotificationStack'a git
          const navigateWithDelay = () => {
            if (navigationRef.current) {
              navigate('NotificationStack', { screen: 'NotificationsScreen' });
            } else {
              setTimeout(navigateWithDelay, 500);
            }
          };
          navigateWithDelay();
        }
      }

      // Mark notification as read if notificationId is provided
      if (notificationId) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      }
    };

    // Set notification handlers
    notificationService.setNotificationHandler({
      onNotificationReceived: handleNotificationReceived,
      onNotificationResponseReceived: handleNotificationResponse,
    });

    return () => {
      notificationService.cleanup();
    };
  }, [state.isInitialized, queryClient]);

  // Badge sync - Unread count ile badge count'u sync et
  useEffect(() => {
    if (!state.isInitialized || state.permissionStatus !== 'granted') {
      return;
    }

    const syncBadge = async () => {
      try {
        await notificationService.setBadgeCount(unreadCount);
        console.log('[NotificationProvider] ✅ Badge count synced:', unreadCount);
      } catch (error) {
        console.error('[NotificationProvider] ❌ Error syncing badge count:', error);
      }
    };

    syncBadge();
  }, [unreadCount, state.isInitialized, state.permissionStatus]);

  const value: NotificationContextType = {
    isInitialized: state.isInitialized,
    permissionStatus: state.permissionStatus,
    expoPushToken: state.expoPushToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* WhatsApp/Instagram tarzı in-app notification toast */}
      {toastData && (
        <NotificationToast
          visible={toastVisible}
          title={toastData.title}
          message={toastData.message}
          avatar={toastData.avatar}
          onPress={toastData.onPress}
          onDismiss={() => {
            setToastVisible(false);
            setToastData(null);
          }}
          duration={3000} // 3 saniye
        />
      )}
    </NotificationContext.Provider>
  );
};

/**
 * useNotificationContext Hook
 * Notification context'ini kullanmak için hook
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext hook must be used within NotificationProvider');
  }
  
  return context;
};

