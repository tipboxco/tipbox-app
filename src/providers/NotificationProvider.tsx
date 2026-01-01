import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { socketService } from '@/src/services/SocketService';
import { useAppStore } from '@/src/store/appStore';
import { useAuth } from './AuthProvider';
import { notificationKeys } from '@/src/features/notifications/api/hooks';
import type { Notification } from '@/src/features/notifications/api/types';
import type { NotificationPayload } from '@/src/types/notification';

/**
 * Navigation ref - NavigationContainer dışından navigation yapmak için
 */
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Navigation helper function
 */
export function navigate(name: string, params?: any) {
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
  const [state, setState] = React.useState<NotificationContextType>({
    isInitialized: false,
    permissionStatus: 'undetermined',
  });

  // Notification service initialization
  // ⚠️ Auth hazır olmadan başlamaz!
  useEffect(() => {
    if (!isAuthReady) {
      console.log('[NotificationProvider] ⏳ Waiting for auth to be ready...');
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
      } catch (error) {
        console.error('[NotificationProvider] ❌ Failed to initialize notification service:', error);
      }
    };

    initializeNotifications();
  }, [isAuthReady, isAuthenticated]);

  // Socket.IO notification listener
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleSocketNotification = (notification: Notification) => {
      console.log('[NotificationProvider] 📨 Socket notification received:', notification);

      // Invalidate notification queries to refresh the list
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

      // Show in-app notification if app is in foreground
      if (notification.title && notification.message) {
        notificationService.sendLocalNotification({
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            type: notification.type,
            navigation: notification.navigation,
          },
        });
      }
    };

    // Register socket notification listener
    socketService.onNotification(handleSocketNotification);

    return () => {
      socketService.off('notification', handleSocketNotification);
    };
  }, [isAuthenticated, queryClient]);

  // Expo Push notification handlers
  useEffect(() => {
    if (!state.isInitialized) {
      return;
    }

    const handleNotificationReceived = (notification: NotificationPayload) => {
      console.log('[NotificationProvider] 📱 Push notification received (foreground):', notification);
      // Notification zaten gösterildi, sadece log
    };

    const handleNotificationResponse = (notification: NotificationPayload) => {
      console.log('[NotificationProvider] 👆 Push notification tapped:', notification);
      
      // Navigate based on notification data
      const navigationData = notification.data?.navigation as { screen: string; params?: Record<string, any> };
      if (navigationData?.screen && navigationRef.current) {
        try {
          navigate(navigationData.screen, navigationData.params);
        } catch (error) {
          console.error('[NotificationProvider] Navigation error:', error);
        }
      }

      // Mark notification as read if notificationId is provided
      const notificationId = notification.data?.notificationId as string;
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

