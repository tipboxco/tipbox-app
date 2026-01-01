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
// Toast kaldırıldı - Expo bildirimleri kullanılıyor

/**
 * Navigation ref - DEPRECATED
 * 
 * @deprecated Use NavigationService instead
 * Bu ref backward compatibility için korunuyor.
 * Yeni kod için: import { navigationService } from '@/src/services/NavigationService';
 */
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Navigation helper function - DEPRECATED
 * 
 * @deprecated Use NavigationService.navigate() instead
 * 
 * Örnek:
 * ```typescript
 * import { navigationService } from '@/src/services/NavigationService';
 * import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
 * 
 * navigationService.navigate(ROOT_ROUTES.POST, { screen: 'PostDetailScreen', params: { ... } });
 * ```
 */
export function navigate(name: string, params?: any) {
  console.warn(
    '[NotificationProvider] ⚠️ navigate() is deprecated. Use NavigationService.navigate() instead.'
  );
  navigationRef.current?.navigate(name as never, params as never);
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
  
  // Toast kaldırıldı - Expo bildirimleri kullanılıyor

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
      console.log('[NotificationProvider] ⏳ Socket listener not ready:', {
        isAuthenticated,
        isInitialized: state.isInitialized,
      });
      return;
    }

    console.log('[NotificationProvider] ✅ Registering socket notification listener');

    const handleSocketNotification = async (notification: Notification) => {
      console.log('[NotificationProvider] 📨 Socket notification received:', notification);

      // Analytics: Notification received tracking
      await notificationAnalytics.trackReceived(
        notification.id,
        notification.type,
        { source: 'socket' }
      );

      // Domain Service'e yönlendir (EventService → NotificationService)
      // Bu katmanlı mimari: Transport → Domain → State + Navigation
      const { eventService } = await import('@/src/services/EventService');
      
      eventService.handleSocketEvent(
        {
          type: 'notification',
          payload: notification,
        },
        {
          isForeground,
          shouldNavigate: false, // Socket notification'da otomatik navigate yok, kullanıcı tıklayınca olur
        }
      );

      // React Query cache'i invalidate et (notificationStateSync periyodik sync yapıyor)
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    // Register socket notification listener
    console.log('[NotificationProvider] 🔌 Registering socket notification listener...');
    socketService.onNotification(handleSocketNotification);
    console.log('[NotificationProvider] ✅ Socket notification listener registered');

    // Test: Socket bağlantısını kontrol et
    const socket = socketService.getSocket();
    console.log('[NotificationProvider] 🔍 Socket connection status:', {
      isConnected: socket?.connected,
      socketId: socket?.id,
    });

    return () => {
      console.log('[NotificationProvider] 🧹 Cleaning up socket notification listener');
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

      // Domain Service'e yönlendir (NotificationService)
      // Push notification → Domain Service → Navigation kararı
      const { notificationService } = await import('@/src/services/NotificationService');
      
      // Push payload'ını domain modeline map et
      const domainNotification: Notification = {
        id: notificationId || `push-${Date.now()}`,
        type: (notificationType as Notification['type']) || 'SYSTEM_ANNOUNCEMENT',
        title: notification.data?.title || notification.title || '',
        message: notification.data?.body || notification.body || '',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: notification.data?.metadata || notification.data || {},
        navigation: notification.data?.navigation as any,
      };

      // NotificationService handle et (State + Navigation kararı)
      notificationService.handleNotification(domainNotification, {
        isForeground: true, // Push notification'a tıklandığında foreground'dayız
        shouldNavigate: true, // Push notification'a tıklandığında navigate et
      });

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

