// Promise polyfill for Hermes
if (typeof global.Promise === 'undefined') {
  global.Promise = require('promise');
}
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import Navigation from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
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

export default function App() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // AppState yönetimi artık AppStateProvider'da yapılıyor
  // Token kontrolü artık AuthProvider'da yapılıyor

  // Android navigation bar'ı theme'e göre ayarla
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (isDark) {
        NavigationBar.setBackgroundColorAsync('#000000');
        NavigationBar.setButtonStyleAsync('light'); // ikonlar beyaz
      } else {
        NavigationBar.setBackgroundColorAsync('#ffffff');
        NavigationBar.setButtonStyleAsync('dark'); // ikonlar siyah
      }
    }
  }, [isDark]);

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
                          <StatusBar
                            translucent
                            backgroundColor={isDark ? '#000000' : '#ffffff'}
                            barStyle={isDark ? 'light-content' : 'dark-content'}
                          />
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
