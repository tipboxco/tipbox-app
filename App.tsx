// Promise polyfill for Hermes
if (typeof global.Promise === 'undefined') {
  global.Promise = require('promise');
}
import React from 'react';
import Navigation from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { PortalProvider } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function App() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const backgroundColor = isDark
    ? config.tokens.colors.backgroundDark950
    : config.tokens.colors.backgroundLight0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PortalProvider>
          <BottomSheetModalProvider>
            <GluestackProvider>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={isDark ? 'light-content' : 'dark-content'}
              />
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor
                }}
              >
                <Navigation />
              </SafeAreaView>
            </GluestackProvider>
          </BottomSheetModalProvider>
        </PortalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView >
  );
}
