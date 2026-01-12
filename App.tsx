// PERFORMANCE FIX: Removed Promise polyfill - Hermes engine already supports Promise natively
// This reduces bundle size and startup time
import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalProvider, PortalHost } from '@gorhom/portal';
import { GluestackProvider } from '@/src/components/ui';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Navigation from '@/src/navigation';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { AppProviders } from '@/src/providers/ComposedProviders';
import { GlobalBottomSheetProvider } from '@/src/providers/GlobalBottomSheetProvider';
import { GlobalUIHost } from '@/src/components/GlobalUIHost';
import { TranslationCacheService } from '@/src/services/TranslationCacheService';



// PERFORMANCE FIX: Keep splash screen visible until auth is ready
// Prevents showing blank screen during initialization
SplashScreen.preventAutoHideAsync();

// FIX: SafeAreaView'ler NavigationContainer içine taşındı (src/navigation/index.tsx)
// Bu sayede Drawer SafeAreaView'lerin üstünde görünür

/**
 * ARCHITECTURE FIX: AppInner moved inside AppProviders
 * 
 * Hook calls (useColorMode, useAuth) must execute AFTER providers initialize.
 * Previously, AppInner was calling hooks before AppProviders mounted,
 * which could cause undefined errors or stale values.
 * 
 * PERFORMANCE FIX: Removed duplicate AuthProvider from App.tsx
 * AuthProvider is already included in AppProviders, so we don't need it here.
 * This prevents double initialization and reduces unnecessary TokenService calls.
 * 
 * New structure:
 * App() 
 *   -> QueryProvider
 *     -> AppProviders (includes AuthProvider + all other providers)
 *       -> AppInner (hooks called here - SAFE!)
 */
const AppInner = () => {
  // ARCHITECTURE FIX: These hooks now execute AFTER AppProviders mount
  // AppProviders includes AppStateProvider which initializes Zustand store
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { isAuthReady } = useAuth();

  // PERFORMANCE FIX: Memoize navigation bar style object
  const navigationBarStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#000000' : '#ffffff',
      buttonStyle: isDark ? 'light' as const : 'dark' as const,
    }),
    [isDark]
  );

  // Android navigation bar'ı theme'e göre ayarla
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(navigationBarStyle.backgroundColor);
      NavigationBar.setButtonStyleAsync(navigationBarStyle.buttonStyle);
    }
  }, [navigationBarStyle]);

  // Translation cache cleanup on app start
  useEffect(() => {
    // Expired translation cache'lerini temizle
    TranslationCacheService.cleanupExpired();
  }, []);

  // PERFORMANCE FIX: Hide splash screen immediately after auth initialization
  // Removed 100ms delay - UI is already ready, delay was causing header render delay
  useEffect(() => {
    if (isAuthReady) {
      const hideSplash = async () => {
        try {
          // ARCHITECTURE FIX: Hide splash immediately - no delay needed
          // Header and screens are ready to render, delay was causing visible lag
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('[App] Failed to hide splash screen:', error);
        }
      };
      
      // Hide immediately - no delay
      hideSplash();
    }
  }, [isAuthReady]);

  // CRITICAL FIX: GestureHandlerRootView EN DIŞTA olmalı
  // Provider'lar NavigationContainer dışında ama GestureHandlerRootView içinde
  // Bu sayede gesture handler hatası çözülür
  // CRITICAL ORDER: GluestackProvider -> PortalProvider -> NavigationContainer -> BottomSheetModalProvider -> GlobalBottomSheetProvider
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackProvider>
        <PortalProvider>
          <Navigation />
        </PortalProvider>
      </GluestackProvider>
    </GestureHandlerRootView>
  );
};

export default function App() {
  return (
    <QueryProvider>
      <AppProviders>
        <AppInner />
      </AppProviders>
    </QueryProvider>
  );
}
