// PERFORMANCE FIX: Removed Promise polyfill - Hermes engine already supports Promise natively
// This reduces bundle size and startup time
import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import Navigation from '@/src/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { AppProviders } from '@/src/providers/ComposedProviders';
import { TranslationCacheService } from '@/src/services/TranslationCacheService';



// PERFORMANCE FIX: Keep splash screen visible until auth is ready
// Prevents showing blank screen during initialization
SplashScreen.preventAutoHideAsync();

// PERFORMANCE FIX: Memoize status bar style to prevent unnecessary re-renders
const StatusBarComponent = React.memo<{ isDark: boolean }>(({ isDark }) => (
  <>
    <SafeAreaView 
      edges={['top']} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: isDark ? '#000000' : '#FFFFFF' 
      }} 
    />
    <StatusBar 
      style={isDark ? 'light' : 'dark'} 
      backgroundColor={isDark ? '#000000' : '#FFFFFF'} 
    />
  </>
));
StatusBarComponent.displayName = 'StatusBarComponent';

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

  return (
    <>
      <StatusBarComponent isDark={isDark} />
      <Navigation />
    </>
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
