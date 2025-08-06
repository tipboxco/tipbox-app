import React from 'react';
import { Navigation } from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { PortalProvider } from '@gorhom/portal';
import { useColorMode } from '@/src/hooks/useColorMode';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';

export default function App() {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const backgroundColor = isDark 
    ? config.tokens.colors.backgroundDark50 
    : config.tokens.colors.backgroundLight0;

  return (
    <SafeAreaProvider>
      <PortalProvider>
        <GluestackProvider>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundColor}
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
      </PortalProvider>
    </SafeAreaProvider>
  );
}
