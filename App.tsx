// PERFORMANCE FIX: Removed Promise polyfill - Hermes engine already supports Promise natively
// This reduces bundle size and startup time
import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import Navigation from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PortalProvider } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { AppStateProvider } from '@/src/providers/AppStateProvider';
import { GlobalBottomSheetProvider } from '@/src/providers/GlobalBottomSheetProvider';
import { NotificationProvider } from '@/src/providers/NotificationProvider';
import { SocketProvider } from '@/src/providers/SocketProvider';
import { useAppStore } from '@/src/store/appStore';

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

export default function App() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // AppState yönetimi artık AppStateProvider'da yapılıyor
  // Token kontrolü artık AuthProvider'da yapılıyor

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

  return (
    <QueryProvider>
      <AuthProvider>
        <AppStateProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <PortalProvider>
                <BottomSheetModalProvider>
                  <GlobalBottomSheetProvider>
                    <NotificationProvider>
                      <SocketProvider>
                        <GluestackProvider>
                          <StatusBarComponent isDark={isDark} />
                          <Navigation />
                        </GluestackProvider>
                      </SocketProvider>
                    </NotificationProvider>
                  </GlobalBottomSheetProvider>
                </BottomSheetModalProvider>
              </PortalProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </AppStateProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
