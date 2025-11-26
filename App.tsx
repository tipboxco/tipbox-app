// Promise polyfill for Hermes
if (typeof global.Promise === 'undefined') {
  global.Promise = require('promise');
}
import React from 'react';
import Navigation from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { PortalProvider } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryProvider } from '@/src/providers/QueryProvider';

export default function App() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <QueryProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PortalProvider>
            <BottomSheetModalProvider>
              <GluestackProvider>
                <StatusBar
                  translucent
                  backgroundColor={isDark ? '#000000' : '#FAFAFA'}
                  barStyle={isDark ? 'light-content' : 'dark-content'}
                />
                <Navigation />
              </GluestackProvider>
            </BottomSheetModalProvider>
          </PortalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}
