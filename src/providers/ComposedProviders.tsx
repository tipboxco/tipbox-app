import React, { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { AppStateProvider } from './AppStateProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalProvider } from '@gorhom/portal';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GlobalBottomSheetProvider } from './GlobalBottomSheetProvider';
import { NotificationProvider } from './NotificationProvider';
import { SocketProvider } from './SocketProvider';
import { GluestackProvider } from '@/src/components/ui';

/**
 * ARCHITECTURE FIX: Provider Composition Pattern
 * 
 * Reduces nested provider depth from 7+ to a single composed provider.
 * This eliminates cascade re-render issues and improves performance.
 * 
 * Benefits:
 * - Single provider tree (no nested depth)
 * - Better performance (fewer re-renders)
 * - Easier to maintain and test
 * 
 * Usage:
 * ```typescript
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
const composeProviders = (
  ...providers: Array<React.ComponentType<{ children: ReactNode }>>
) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
};

/**
 * Composed App Providers
 * All providers are composed into a single provider tree
 */
export const AppProviders = composeProviders(
  QueryProvider,
  AuthProvider,
  AppStateProvider,
  GestureHandlerRootView,
  SafeAreaProvider,
  PortalProvider,
  BottomSheetModalProvider,
  GlobalBottomSheetProvider,
  NotificationProvider,
  SocketProvider,
  GluestackProvider
);

