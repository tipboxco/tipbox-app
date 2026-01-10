import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { notificationService as domainNotificationService } from '@/src/services/NotificationService';
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
import type { Notification, NotificationMetadata } from '@/src/features/notifications/api/types';
import type { NotificationPayload } from '@/src/types/notification';
// Toast kaldırıldı - Expo bildirimleri kullanılıyor

/**
 * Navigation ref - DEPRECATED
 * 
 * @deprecated Use NavigationService instead
 * Bu ref backward compatibility için korunuyor.
 * Yeni kod için: import { navigationService } from '@/src/services/NavigationService';
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
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
// eslint-disable-next-line @typescript-eslint/no-deprecated
export function navigate(name: string, params?: any) {
  console.warn(
    '[NotificationProvider] ⚠️ navigate() is deprecated. Use NavigationService.navigate() instead.'
  );
  // Deprecated function - using any to bypass type checking
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  (navigationRef.current as any)?.navigate(name, params);
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
  // Sadece authenticated olduğunda çalışır (logout durumunda API isteği yapılmaz)
  const { data: unreadCountData, error: unreadCountError } = useUnreadCount(isAuthenticated && isAuthReady);
  const unreadCount = unreadCountData?.data?.count || 0;
  
  // Hata durumunda log (ama uygulamayı durdurma)
  // ÖNEMLİ: Sadece authenticated olduğunda hata logla (login ekranında hata göstermemek için)
  if (unreadCountError && isAuthenticated && isAuthReady) {
    // Sadece bir kez log göster (log spam'ı önle)
    console.warn('[NotificationProvider] ⚠️ Unread count error (using default 0):', {
      status: (unreadCountError as any)?.response?.status,
      message: (unreadCountError as any)?.response?.data?.message || (unreadCountError as any)?.message,
    });
  }
  
  // Toast kaldırıldı - Expo bildirimleri kullanılıyor

  // Notification service initialization
  // ⚠️ Auth hazır olmadan başlamaz!
  // ⚠️ Login olmadan token kaydetme yapılmaz!
  useEffect(() => {
    if (!isAuthReady) {
      // Login ekranında hata göstermemek için sessizce return et
      return;
    }

    // Authenticated değilse hiçbir şey yapma (login ekranında hata göstermemek için)
    if (!isAuthenticated) {
      // Login ekranında hata göstermemek için sessizce return et
      return;
    }

    const initializeNotifications = async () => {
      try {
        const notificationState = await notificationService.initialize();
        
        setState({
          isInitialized: notificationState.isInitialized,
          permissionStatus: notificationState.permissionStatus,
          expoPushToken: notificationState.expoPushToken,
        });

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

  // Logout durumunda notification query'lerini temizle
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      // Logout durumunda tüm notification query'lerini temizle
      queryClient.removeQueries({ queryKey: notificationKeys.all });
      // Notification store'u da temizle
      const notificationStore = useNotificationStore.getState();
      notificationStore.clearRealtimeNotifications();
      notificationStore.clearAllGroupedNotifications();
      notificationStore.clearUnreadCountCache();
    }
  }, [isAuthenticated, isAuthReady, queryClient]);

  // Socket.IO notification listener with Event-Driven Architecture
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) {
      // Login ekranında hata göstermemek için sessizce return et
      // Log kaldırıldı - bu normal bir durum, hata değil
      return;
    }

    // Socket bağlantı durumunu kontrol et
    const socket = socketService.getSocket();
    const isSocketConnected = socketService.isConnected();
    
    if (!isSocketConnected || !socket) {
      console.warn('[NotificationProvider] ⚠️ Socket not connected, listener will not work:', {
        isSocketConnected,
        socketExists: !!socket,
        socketId: socket?.id,
      });
      // Socket bağlı değilse listener ekleme (socket bağlandığında tekrar denenecek)
      return;
    }

    const handleSocketNotification = async (notification: Notification) => {

      // Analytics: Notification received tracking
      await notificationAnalytics.trackReceived(
        notification.id,
        notification.type,
        { source: 'socket' }
      );

      // Mesaj bildirimleri için özel kontrol: Eğer kullanıcı MessageDetail ekranındaysa ve aynı thread'deyse notification gösterilmemeli
      const isMessageNotification = ['NEW_MESSAGE', 'DM_REQUEST_RECEIVED', 'DM_REQUEST_ACCEPTED'].includes(notification.type);
      let shouldShowNotification = true;

      if (isMessageNotification && isForeground) {
        try {
          // AppStore'dan aktif thread ID'sini kontrol et (MessageDetail ekranında set edilir)
          const { useAppStore } = await import('@/src/store/appStore');
          const activeThreadId = useAppStore.getState().activeThreadId;
          
          // Notification'dan thread ID'sini al
          const notificationThreadId = notification.metadata?.threadId || notification.metadata?.messageId || notification.metadata?.requestId;
          
          // Eğer aktif thread ID varsa ve notification thread ID ile eşleşiyorsa notification gösterilmemeli
          if (activeThreadId && notificationThreadId && activeThreadId === notificationThreadId) {
            shouldShowNotification = false;
          } else {
            // Fallback: NavigationService'den aktif route'u kontrol et (eski yöntem)
            const { navigationService } = await import('@/src/services/NavigationService');
            const currentRoute = navigationService.getCurrentRoute();
            
            // Eğer MessageDetail ekranındaysa ve threadId eşleşiyorsa notification gösterilmemeli
            if (currentRoute?.name === 'MessageDetail' || currentRoute?.params?.screen === 'MessageDetailScreen') {
              const currentThreadId = currentRoute?.params?.threadId || currentRoute?.params?.messageId;
              
              if (notificationThreadId && currentThreadId && notificationThreadId === currentThreadId) {
                shouldShowNotification = false;
              }
            }
          }
        } catch (error) {
          console.warn('[NotificationProvider] ⚠️ Error checking active thread:', error);
        }
      }

      // Foreground'da local notification göster (sadece gerekirse)
      if (shouldShowNotification && isForeground && state.permissionStatus === 'granted') {
        try {
          await notificationService.sendLocalNotification({
            title: notification.title || 'Yeni Bildirim',
            body: notification.message || '',
            data: {
              notificationId: notification.id,
              type: notification.type,
              metadata: notification.metadata || {},
              navigation: notification.navigation,
            },
          });
        } catch (error) {
          console.error('[NotificationProvider] ❌ Error sending local notification:', error);
        }
      } else if (!shouldShowNotification) {
      }

      // State Sync: Zustand store'a ekle (instant UI update için)
      // ÖNEMLİ: Bu optimistic update yapıyor, bildirim anında görünecek
      notificationStateSync.addNotification(notification);

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

      // React Query cache'i invalidate et (tüm parametreli query'ler için)
      // notificationKeys.lists() parametreli query key döndürür, bu yüzden tüm list query'lerini invalidate etmeliyiz
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    // Register socket notification listener
    socketService.onNotification(handleSocketNotification);

    // DEBUG: Tüm socket event'lerini dinle (sadece development için)
    if (__DEV__ && socket) {
      // Bilinen event'leri log'la (Socket.IO'da onAny yok, bu yüzden manuel dinliyoruz)
      const debugEvents = ['notification', 'new_notification', 'notifications', 'message', 'new_message'];
      debugEvents.forEach((eventName) => {
        socket.on(eventName, (data: any) => {
          console.log(`[NotificationProvider] 🔍 Socket event received: ${eventName}`, {
            data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
          });
        });
      });
    }

    return () => {
      socketService.off('notification', handleSocketNotification);
    };
  }, [isAuthenticated, state.isInitialized, isForeground, queryClient]);

  // Expo Push notification handlers
  useEffect(() => {
    if (!state.isInitialized) {
      return;
    }

    const handleNotificationReceived = async (notification: NotificationPayload) => {
      
      // Mesaj bildirimleri için özel kontrol: Eğer kullanıcı MessageDetail ekranındaysa ve aynı thread'deyse notification gösterilmemeli
      const notificationType = notification.data?.type as string;
      const isMessageNotification = ['NEW_MESSAGE', 'DM_REQUEST_RECEIVED', 'DM_REQUEST_ACCEPTED'].includes(notificationType);
      
      if (isMessageNotification && isForeground) {
        try {
          // AppStore'dan aktif thread ID'sini kontrol et (MessageDetail ekranında set edilir)
          const { useAppStore } = await import('@/src/store/appStore');
          const activeThreadId = useAppStore.getState().activeThreadId;
          
          // Notification'dan thread ID'sini al
          const metadata = notification.data?.metadata as NotificationMetadata | undefined;
          const notificationThreadId = metadata?.threadId || metadata?.messageId || metadata?.requestId;
          
          // Eğer aktif thread ID varsa ve notification thread ID ile eşleşiyorsa notification gösterilmemeli
          if (activeThreadId && notificationThreadId && activeThreadId === notificationThreadId) {
            // Query'leri yine de refresh et (state update için)
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            return;
          } else {
            // Fallback: NavigationService'den aktif route'u kontrol et (eski yöntem)
            const { navigationService } = await import('@/src/services/NavigationService');
            const currentRoute = navigationService.getCurrentRoute();
            
            // Eğer MessageDetail ekranındaysa ve threadId eşleşiyorsa notification gösterilmemeli
            if (currentRoute?.name === 'MessageDetail' || currentRoute?.params?.screen === 'MessageDetailScreen') {
              const currentThreadId = currentRoute?.params?.threadId || currentRoute?.params?.messageId;
              
              if (notificationThreadId && currentThreadId && notificationThreadId === currentThreadId) {
                // Query'leri yine de refresh et (state update için)
                queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
                queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
                return;
              }
            }
          }
        } catch (error) {
          console.warn('[NotificationProvider] ⚠️ Error checking active thread for push notification:', error);
        }
      }
      
      // Foreground'da notification geldiğinde query'leri refresh et
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handleNotificationResponse = async (notification: NotificationPayload) => {
      
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
      // Push payload'ını domain modeline map et
      const domainNotification: Notification = {
        id: notificationId || `push-${Date.now()}`,
        type: (notificationType as Notification['type']) || 'SYSTEM_ANNOUNCEMENT',
        title: (notification.data?.title as string) || (notification.title as string) || '',
        message: (notification.data?.body as string) || (notification.body as string) || '',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: notification.data?.metadata || notification.data || {},
        navigation: notification.data?.navigation as any,
      };

      // NotificationService handle et (State + Navigation kararı)
      domainNotificationService.handleNotification(domainNotification, {
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

