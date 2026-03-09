import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationProvider, useNavigationRef } from '@/src/providers/NavigationProvider';
import { RootNavigator } from './stacks/RootNavigator';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { navigationService } from '@/src/services/NavigationService';
import { StatusBar } from 'expo-status-bar';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ScrollProvider } from '@/src/providers/ScrollProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GlobalBottomSheetProvider } from '@/src/providers/GlobalBottomSheetProvider';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GlobalBottomSheet } from '@/src/components/GlobalBottomSheet';
// Drawer artık React Navigation DrawerNavigator içinde
// FIX: SafeAreaView'ler TabNavigator içine taşındı - Drawer full height olabilmesi için

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
      }
    });

    return removeListener;
  }, []);

  // PERFORMANCE FIX: Shared function for consuming pending navigation
  // Eliminates code duplication and centralizes the logic
  const checkAndConsumePendingNavigation = React.useCallback(() => {
    // Eğer zaten consume edildiyse tekrar etme
    if (hasConsumedPendingNavigationRef.current) {
      return;
    }

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
  }, []);

  // PERFORMANCE FIX: Remove polling interval - use onReady event instead
  // This eliminates unnecessary CPU usage from 500ms intervals
  // Navigation ready is handled via onReady callback below

  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <>
      {/* FIX: SafeAreaView'ler TabNavigator içine taşındı - Drawer full height olabilmesi için */}
      {/* Drawer SafeAreaView'lerin dışında kalır ve tam ekranı kaplar */}
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
        translucent={true}
      />
      {/* CRITICAL FIX: Provider hierarchy - NavigationContainer içinde */}
      {/* CRITICAL ORDER: NavigationContainer -> BottomSheetModalProvider -> GlobalBottomSheetProvider -> KeyboardProvider */}
      <ScrollProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // ARCHITECTURE FIX: Event-driven navigation ready handling
            // Navigation ready olduğunda pending navigation queue'yu consume et
            checkAndConsumePendingNavigation();
            // NavigationService queue'sunu da consume et
            navigationService.consumePendingNavigationQueue();
          }}
          onStateChange={(state) => {
            // ARCHITECTURE FIX: Navigation state change event listener
            // Navigation state değiştiğinde pending navigation'ı tekrar kontrol et
            // (race condition önlemek için)
            if (navigationRef.current?.isReady()) {
              checkAndConsumePendingNavigation();
              navigationService.consumePendingNavigationQueue();
            }
          }}
        >
          <BottomSheetModalProvider>
            <GlobalBottomSheetProvider>
              <KeyboardProvider>
                <RootNavigator />
                <GlobalBottomSheet />
              </KeyboardProvider>
            </GlobalBottomSheetProvider>
          </BottomSheetModalProvider>
        </NavigationContainer>
      </ScrollProvider>
    </>
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