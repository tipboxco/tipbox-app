import Constants from 'expo-constants';

/**
 * Sentry Konfigürasyonu
 *
 * Error tracking için Sentry'yi başlatır.
 * Development'ta (Expo Go) devre dışı, production'da aktif.
 *
 * EXPO GO UYUMLULUK:
 * - Development modda Sentry native modülleri import edilmez
 * - Mock objeler kullanılarak TypeScript hataları önlenir
 * - Production build'de normal Sentry kullanılır
 */

// Development modda mı kontrol et
const isDevelopment = __DEV__;

// Mock Sentry objeleri - Expo Go için
const mockSentry = {
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  setTag: () => {},
  setContext: () => {},
  addBreadcrumb: () => {},
  ReactNavigationInstrumentation: class MockInstrumentation {
    registerNavigationContainer() {}
  },
  ReactNativeTracing: class MockTracing {
    constructor() {}
  },
};

const mockRoutingInstrumentation = {
  registerNavigationContainer: () => {},
};

// Development modda mock objeler kullan, production'da gerçek Sentry
let Sentry: any;
let routingInstrumentation: any;

if (isDevelopment) {
  // Development modda (Expo Go) - Mock objeler kullan
  Sentry = mockSentry;
  routingInstrumentation = mockRoutingInstrumentation;
  console.log('[Sentry] 🚧 Running in development mode with Expo Go - using mock Sentry');
} else {
  // Production modda - Gerçek Sentry kullan
  try {
    // Sadece production'da import et
    const SentryModule = require('@sentry/react-native');
    Sentry = SentryModule;
    routingInstrumentation = new SentryModule.ReactNavigationInstrumentation();
    console.log('[Sentry] 🚀 Running in production mode - real Sentry loaded');
  } catch (error) {
    console.error('[Sentry] ❌ Failed to load Sentry module:', error);
    // Fallback to mock
    Sentry = mockSentry;
    routingInstrumentation = mockRoutingInstrumentation;
  }
}

// Sentry DSN - Environment variable'dan alınır
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

// Sentry'yi sadece production'da ve DSN varsa başlat
const isProduction = process.env.NODE_ENV === 'production';
const shouldInitializeSentry = isProduction && SENTRY_DSN && !isDevelopment;

export const initSentry = () => {
  if (!shouldInitializeSentry) {
    console.log('[Sentry] ⏭️  Skipped initialization (development mode or no DSN)');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: Constants.expoConfig?.version || '1.0.0',
      dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',

      // Performance Monitoring
      tracesSampleRate: 0.2, // %20 transaction sampling (production'da düşük tut)

      // Session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 saniye

      // Error filtering
      beforeSend(event, hint) {
        // Development'ta Sentry'ye gönderme
        if (__DEV__) {
          console.log('[Sentry] Error caught (dev mode, not sent):', hint.originalException);
          return null;
        }

        // Network errors'ı filtrele (çok fazla gürültü yaratabilir)
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message;
          if (message?.includes('Network request failed') ||
              message?.includes('timeout') ||
              message?.includes('ECONNREFUSED')) {
            return null; // Network hatalarını gönderme
          }
        }

        return event;
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Console log breadcrumb'larını filtreleyebilirsiniz
        if (breadcrumb.category === 'console') {
          return null;
        }
        return breadcrumb;
      },

      // Debug mode (sadece geliştirme için)
      debug: false,

      // Native crash handling
      enableNative: true,
      enableNativeCrashHandling: true,

      // Auto instrumentation
      enableAutoPerformanceTracing: true,
      enableWatchdogTerminationTracking: true,

      // Integrations
      integrations: [
        new Sentry.ReactNativeTracing({
          // Routing instrumentation
          routingInstrumentation,
          tracePropagationTargets: ['api-test.tipbox.co', 'api.tipbox.co'],
        }),
      ],
    });

    console.log('[Sentry] ✅ Initialized successfully');
  } catch (error) {
    console.error('[Sentry] ❌ Initialization failed:', error);
  }
};

// Navigation tracking için routing instrumentation'ı export et
export { routingInstrumentation };

// Sentry instance'ını export et (manuel error logging için)
export { Sentry };
