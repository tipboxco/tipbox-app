import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationProvider, useNavigationRef } from '@/src/providers/NavigationProvider';
import { RootNavigator } from './stacks/RootNavigator';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { navigationService } from '@/src/services/NavigationService';

/**
 * Navigation Component (Inner)
 * NavigationProvider içinde çalışır
 */
const NavigationInner = () => {
  const navigationRef = useNavigationRef();
  
  // Navigation'ın zaten yapıldığını takip et (sonsuz döngüyü önlemek için)
  const hasConsumedPendingNavigationRef = useRef(false);
  const isConsumingRef = useRef(false);

  // Initial URL handling (killed state)
  useEffect(() => {
    const handleInitialURL = async () => {
      const url = await deepLinkService.getInitialURL();
      if (url) {
        const route = deepLinkService.parseURL(url);
        if (route) {
          // NavigationService kullan (type-safe)
          navigationService.navigate(route.screen as any, route.params as any);
          console.log('[Navigation] ✅ Initial deep link navigated:', route);
        }
      }
    };

    handleInitialURL();
  }, []);

  // URL change listener (foreground state)
  useEffect(() => {
    const removeListener = deepLinkService.addURLListener((url) => {
      const route = deepLinkService.parseURL(url);
      if (route) {
        // NavigationService kullan (type-safe)
        navigationService.navigate(route.screen as any, route.params as any);
        console.log('[Navigation] ✅ Deep link navigated:', route);
      }
    });

    return removeListener;
  }, []);

  // Navigation ready olduğunda pending navigation'ı consume et
  // App State Awareness: Kullanıcı busy değilse pending navigation'ı consume et
  useEffect(() => {
    // Eğer zaten consume edildiyse tekrar etme
    if (hasConsumedPendingNavigationRef.current) {
      return;
    }

    const checkAndConsumePendingNavigation = () => {
      // Eğer şu anda consume işlemi devam ediyorsa, tekrar başlatma
      if (isConsumingRef.current) {
        return;
      }

      if (!navigationRef.current?.isReady()) {
        return;
      }

      // App State Awareness - Kullanıcı busy ise consume etme
      const { useAppStore } = require('@/src/store/appStore');
      const appState = useAppStore.getState();
      
      if (appState.isUserBusy) {
        console.log('[Navigation] ⏳ User is busy, pending navigation not consumed:', appState.busyReason);
        return;
      }

      // Pending navigation var mı kontrol et
      const { useNotificationStore } = require('@/src/store/notificationStore');
      const notificationStore = useNotificationStore.getState();
      const pending = notificationStore.getPendingNavigation();

      // Eğer pending navigation yoksa, işaretle ve çık
      if (!pending) {
        hasConsumedPendingNavigationRef.current = true;
        return;
      }

      // Consume işlemini başlat
      isConsumingRef.current = true;

      try {
        // Kullanıcı busy değilse pending navigation'ı consume et
        const { notificationService } = require('@/src/services/NotificationService');
        notificationService.consumePendingNavigation();
        
        // Başarılı olduysa işaretle
        hasConsumedPendingNavigationRef.current = true;
      } catch (error) {
        console.error('[Navigation] ❌ Error consuming pending navigation:', error);
      } finally {
        // Consume işlemi bitti
        isConsumingRef.current = false;
      }
    };

    // İlk kontrol
    checkAndConsumePendingNavigation();

    // Periyodik kontrol (navigation ready olana kadar)
    const interval = setInterval(() => {
      checkAndConsumePendingNavigation();
    }, 500);

    // 5 saniye sonra interval'i temizle (navigation ready olmalı)
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        console.log('[Navigation] ✅ NavigationContainer is ready');
        // Navigation ready olduğunda pending navigation'ı consume et
        // App State Awareness kontrolü yapılır (kullanıcı busy ise consume edilmez)
        const checkAndConsume = () => {
          // Eğer zaten consume edildiyse tekrar etme
          if (hasConsumedPendingNavigationRef.current || isConsumingRef.current) {
            return;
          }

          const { useAppStore } = require('@/src/store/appStore');
          const appState = useAppStore.getState();
          
          if (appState.isUserBusy) {
            console.log('[Navigation] ⏳ User is busy, pending navigation deferred:', appState.busyReason);
            return;
          }

          // Pending navigation var mı kontrol et
          const { useNotificationStore } = require('@/src/store/notificationStore');
          const notificationStore = useNotificationStore.getState();
          const pending = notificationStore.getPendingNavigation();

          // Eğer pending navigation yoksa, işaretle ve çık
          if (!pending) {
            hasConsumedPendingNavigationRef.current = true;
            return;
          }

          // Consume işlemini başlat
          isConsumingRef.current = true;

          try {
            const { notificationService } = require('@/src/services/NotificationService');
            notificationService.consumePendingNavigation();
            
            // Başarılı olduysa işaretle
            hasConsumedPendingNavigationRef.current = true;
          } catch (error) {
            console.error('[Navigation] ❌ Error consuming pending navigation:', error);
          } finally {
            // Consume işlemi bitti
            isConsumingRef.current = false;
          }
        };
        
        checkAndConsume();
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

/**
 * Navigation Component (Root)
 * NavigationProvider ile sarmalanmış
 */
const Navigation = () => {
  return (
    <NavigationProvider>
      <NavigationInner />
    </NavigationProvider>
  );
};

export default Navigation;