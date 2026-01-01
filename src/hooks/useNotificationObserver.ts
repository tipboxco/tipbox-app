import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { NotificationNavigationService } from '@/src/services/NotificationNavigationService';
import type { Notification } from '@/src/features/notifications/api/types';
import { useMarkNotificationAsRead } from '@/src/features/notifications/api/hooks';

/**
 * Merkezi Notification Observer Hook
 * 
 * Tüm bildirim etkileşimlerini (uygulama içindeyken veya dışındayken) 
 * tek bir noktadan yönetir.
 * 
 * Özellikler:
 * - Uygulama AÇIKKEN bildirime tıklanırsa yönlendirme yapar
 * - Uygulama KAPALIYKEN bildirimle açılırsa (Initial Notification) yönlendirme yapar
 * - Bildirimi otomatik olarak okundu olarak işaretler
 * 
 * @example
 * ```tsx
 * function App() {
 *   useNotificationObserver();
 *   return <YourApp />;
 * }
 * ```
 */
export const useNotificationObserver = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const markAsReadMutation = useMarkNotificationAsRead();
  const isInitialized = useRef(false);

  useEffect(() => {
    // NavigationContainer hazır olmadan hook'u çalıştırma
    // if (!navigation.getState().isReady) {
    //   console.log('[useNotificationObserver] ⏳ Waiting for navigation to be ready...');
    //   return;
    // }

    if (isInitialized.current) {
      return;
    }

    console.log('[useNotificationObserver] 🔔 Initializing notification observer');

    // Notification işleme fonksiyonu (hem foreground hem killed state için)
    const handleNotification = async (response: Notifications.NotificationResponse) => {
      // Navigation hazır olana kadar bekle
      // if (!navigation.getState().isReady) {
      //   console.warn('[useNotificationObserver] ⚠️ Navigation not ready, retrying in 500ms...');
      //   setTimeout(() => handleNotification(response), 500);
      //   return;
      // }

      const data = response.notification.request.content.data;
      console.log('[useNotificationObserver] 👆 Notification tapped:', data);

      // Notification objesi oluştur (data'dan)
      const notification: Notification = {
        id: (data.notificationId as string) || `temp-${Date.now()}`,
        type: (data.type as Notification['type']) || 'SYSTEM_ANNOUNCEMENT',
        title: response.notification.request.content.title || '',
        message: response.notification.request.content.body || '',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(data as any),
        },
        navigation: data.navigation as any,
      };

      // Bildirimi okundu olarak işaretle (eğer notificationId varsa)
      if (notification.id && !notification.id.startsWith('temp-')) {
        markAsReadMutation.mutate(notification.id, {
          onSuccess: () => {
            console.log('[useNotificationObserver] ✅ Notification marked as read');
          },
        });
      }

      // Yönlendirme yap
      try {
        const success = await NotificationNavigationService.navigate(notification);
        if (success) {
          console.log('[useNotificationObserver] ✅ Navigation successful');
        } else {
          console.warn('[useNotificationObserver] ⚠️ Navigation failed');
        }
      } catch (error) {
        console.error('[useNotificationObserver] ❌ Navigation error:', error);
      }
    };

    // 1. Uygulama AÇIKKEN bildirime tıklanırsa
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      handleNotification
    );

    // 2. Uygulama KAPALIYKEN bildirimle açılırsa (Initial Notification)
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          console.log('[useNotificationObserver] 📱 Initial notification (killed state)');
          // İlk denemeyi biraz geciktir (app başlangıcında navigation hazır olmayabilir)
          setTimeout(() => handleNotification(response), 1000);
        }
      })
      .catch((error) => {
        console.error('[useNotificationObserver] ❌ Error getting initial notification:', error);
      });

    isInitialized.current = true;

    return () => {
      console.log('[useNotificationObserver] 🧹 Cleaning up notification observer');
      // Subscription objesinin remove() metodunu çağır
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [navigation, markAsReadMutation]);
};

