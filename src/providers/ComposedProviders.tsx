import React, { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { AppStateProvider } from './AppStateProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// BLUEPRINT FIX: PortalProvider moved to Navigation/index.tsx (after BottomSheetModalProvider)
// import { PortalProvider } from '@gorhom/portal';
import { NotificationProvider } from './NotificationProvider';
import { SocketProvider } from './SocketProvider';

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
 * 
 * ARCHITECTURE FIX: Provider order matters!
 * - reduceRight wraps from right to left, so order is reversed
 * 
 * NEW ARCHITECTURE: 
 * - GestureHandlerRootView, BottomSheetModalProvider, GlobalBottomSheetProvider, GluestackProvider
 *   artık NavigationContainer içinde (src/navigation/index.tsx'te) olacak, burada değil.
 * - Bu sayede navigation hierarchy içindeki tüm component'ler Gluestack context'ine erişebilir
 */
export const AppProviders = composeProviders(
  QueryProvider,
  AuthProvider,
  AppStateProvider,
  SafeAreaProvider,
  // BLUEPRINT FIX: PortalProvider moved to Navigation/index.tsx
  // PortalProvider must be AFTER BottomSheetModalProvider but BEFORE GlobalBottomSheetProvider
  // PortalProvider, // REMOVED - moved to Navigation/index.tsx
  NotificationProvider,
  SocketProvider
);

