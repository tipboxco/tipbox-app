// PERFORMANCE FIX: Removed Promise polyfill - Hermes engine already supports Promise natively
// This reduces bundle size and startup time
import React, { useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import Navigation from '@/src/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorMode } from '@/src/hooks/useColorMode';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { AuthProvider, useAuth } from '@/src/providers/AuthProvider';
import { AppProviders } from '@/src/providers/ComposedProviders';
import { useAppStore } from '@/src/store/appStore';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

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
 * Inner App Component
 * Handles splash screen hiding after auth initialization
 */
const AppInner = () => {
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
    <AppProviders>
      <ErrorBoundary>
        <StatusBarComponent isDark={isDark} />
        <Navigation />
      </ErrorBoundary>
    </AppProviders>
  );
};

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </QueryProvider>
  );
}
