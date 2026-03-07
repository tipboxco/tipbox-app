import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

// Sentry'yi en başta başlat (error tracking için)
import { initSentry, Sentry } from './src/config/sentry.config';
import { ErrorUtils } from 'react-native';
initSentry();

// CRITICAL FIX: Global error handlers - Sentry'nin kaçırabileceği hataları yakala
// 1. Unhandled Promise Rejections
const originalPromiseRejectionHandler = global.Promise.prototype.catch;
global.Promise = class extends Promise<any> {
  catch(onRejected?: ((reason: any) => any) | null) {
    return super.catch((error) => {
      // Unhandled rejection - Sentry'e gönder
      if (!onRejected) {
        console.error('[Global] ❌ Unhandled Promise Rejection:', error);
        Sentry.captureException(error, {
          tags: {
            error_type: 'unhandled_promise_rejection',
          },
          level: 'error',
        });
      }
      return onRejected ? onRejected(error) : Promise.reject(error);
    });
  }
} as any;

// 2. Global Error Handler
if (ErrorUtils) {
  const originalGlobalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[Global] ❌ Global Error:', { error, isFatal });

    // Sentry'e gönder
    Sentry.captureException(error, {
      tags: {
        error_type: 'global_error',
        is_fatal: isFatal ? 'true' : 'false',
      },
      level: isFatal ? 'fatal' : 'error',
    });

    // Original handler'ı çağır
    if (originalGlobalHandler) {
      originalGlobalHandler(error, isFatal);
    }
  });
}

// 3. Unhandled Rejection Handler (additional safety)
if (typeof global.onunhandledrejection === 'function') {
  const originalUnhandledRejection = global.onunhandledrejection;
  global.onunhandledrejection = (event: any) => {
    console.error('[Global] ❌ Unhandled Rejection Event:', event);
    Sentry.captureException(event.reason || event, {
      tags: {
        error_type: 'unhandled_rejection_event',
      },
      level: 'error',
    });
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };
}

import App from './App';

// Suppress warnings
LogBox.ignoreLogs([
  // Reanimated warnings from @gorhom/bottom-sheet internal scroll operations
  // These warnings are harmless and occur when bottom sheet tries to scroll before ref is initialized
  '[Reanimated] Tried to dispatch command "scrollTo" with an uninitialized ref',
  // SafeAreaView deprecated warning - Proje zaten react-native-safe-area-context kullanıyor
  // Bu uyarı muhtemelen bir third-party dependency'den geliyor
  'SafeAreaView has been deprecated',
  // Expo Notifications Expo Go limitation - Development build kullanılıyor, bu uyarı sadece Expo Go için geçerli
  'expo-notifications: Android Push notifications',
  'expo-notifications',
  'functionality is not fully supported in Expo Go',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);