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

// CRITICAL FIX: Sadece Expo Go'da mock kullan, development build'de gerçek Sentry kullan
// Expo Go kontrolü için Constants.appOwnership veya execution environment kontrolü
const isExpoGo = Constants.appOwnership === 'expo';
const isDevelopment = __DEV__ && isExpoGo; // Sadece Expo Go + dev modda mock kullan

// Mock Sentry objeleri - Expo Go için
const mockSentry = {
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  setTag: () => {},
  setContext: () => {},
  addBreadcrumb: () => {},
  wrap: (fn: any) => fn, // CRITICAL FIX: wrap function for React Native integration
  withScope: (callback: any) => callback({}),
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

// Sadece Expo Go'da mock objeler kullan, development build'de de gerçek Sentry kullan
let Sentry: any;
let routingInstrumentation: any;

if (isDevelopment) {
  // Expo Go modda - Mock objeler kullan
  Sentry = mockSentry;
  routingInstrumentation = mockRoutingInstrumentation;
  console.log('[Sentry] 🚧 Running in Expo Go - using mock Sentry');
} else {
  // Development build veya production - Gerçek Sentry kullan
  try {
    const SentryModule = require('@sentry/react-native');
    // CRITICAL FIX: Use default export or all named exports
    Sentry = SentryModule.default || SentryModule;
    routingInstrumentation = new (SentryModule.ReactNavigationInstrumentation || SentryModule.default?.ReactNavigationInstrumentation)();
    console.log('[Sentry] 🚀 Real Sentry loaded - ready to track errors');
  } catch (error) {
    console.error('[Sentry] ❌ Failed to load Sentry module:', error);
    // Fallback to mock
    Sentry = mockSentry;
    routingInstrumentation = mockRoutingInstrumentation;
  }
}

// Sentry DSN - Environment variable'dan alınır
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

// CRITICAL FIX: Test ve production'da Sentry'yi başlat, sadece Expo Go'da başlatma
// DSN varsa ve Expo Go değilse Sentry'yi başlat
const shouldInitializeSentry = SENTRY_DSN && !isDevelopment;

export const initSentry = () => {
  if (!shouldInitializeSentry) {
    console.log('[Sentry] ⏭️  Skipped initialization (Expo Go or no DSN)', {
      isExpoGo,
      hasDSN: !!SENTRY_DSN,
      isDevelopment,
    });
    return;
  }

  try {
    // Release tracking - Sentry best practices
    // Format: app-name@version+build (e.g., tipbox@1.0.0+123)
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Constants.expoConfig?.ios?.buildNumber ||
                       Constants.expoConfig?.android?.versionCode?.toString() || '1';
    const releaseVersion = `tipbox@${appVersion}+${buildNumber}`;

    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment - More specific environment detection
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking - Unique identifier for this version
      release: releaseVersion,

      // Dist - Unique build identifier (should be unique for each build)
      dist: buildNumber,

      // Performance Monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Development'ta %100, production'da %20 sampling

      // User Interaction Tracing - Touch events ve UI interactions
      enableUserInteractionTracing: true,

      // Session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 saniye

      // Error filtering
      beforeSend(event, hint) {
        // CRITICAL FIX: Test environment'ta da event'leri gönder
        // Sadece development build'de log yap, event'i göndermeye devam et
        if (__DEV__) {
          console.log('[Sentry] 📤 Sending error to Sentry:', hint.originalException);
        }

        // Network errors'ı filtrele (çok fazla gürültü yaratabilir)
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message;
          if (message?.includes('Network request failed') ||
              message?.includes('timeout') ||
              message?.includes('ECONNREFUSED')) {
            console.log('[Sentry] 🚫 Filtered network error (not sent):', message);
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

      // Debug mode - development build'de aktif, production'da kapalı
      debug: __DEV__,

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

          // API trace propagation - Sentry trace header'larını bu domain'lere ekle
          tracePropagationTargets: ['api-test.tipbox.co', 'api.tipbox.co'],

          // Transaction timeout ayarları
          idleTimeoutMs: 1000, // Transaction idle olduğunda 1 saniye sonra sonlanır
          finalTimeoutMs: 600000, // Maximum transaction süresi: 10 dakika

          // Span filtering - Gereksiz span'ları filtrele
          shouldCreateSpanForRequest: (url) => {
            // Asset request'lerini ve static file'ları filtrele
            if (url.includes('/assets/') ||
                url.includes('.png') ||
                url.includes('.jpg') ||
                url.includes('.svg')) {
              return false;
            }
            return true;
          },

          // Span customization - Span'ları customize et
          beforeStartSpan: (context) => {
            // API request'lere ekstra tag'ler ekle
            if (context.name.includes('api')) {
              return {
                ...context,
                data: {
                  ...context.data,
                  'custom.api_version': 'v1',
                },
              };
            }
            return context;
          },
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

/**
 * Gesture Tracking Helper
 * React Native Gesture Handler gesture'larını Sentry'de track etmek için kullan
 *
 * @example
 * import { sentryTraceGesture } from '@/src/config/sentry.config';
 *
 * const gesture = Gesture.Race(
 *   sentryTraceGesture("pinch-to-zoom", pinch),
 *   sentryTraceGesture("long-press", longPress)
 * );
 */
export const sentryTraceGesture = (gestureName: string, gesture: any) => {
  // Expo Go veya mock Sentry kullanılıyorsa, gesture'ı olduğu gibi döndür
  if (isDevelopment || !Sentry.sentryTraceGesture) {
    return gesture;
  }

  // Gerçek Sentry'de gesture tracking'i aktif et
  try {
    return Sentry.sentryTraceGesture(gestureName, gesture);
  } catch (error) {
    console.warn('[Sentry] Failed to trace gesture:', gestureName, error);
    return gesture;
  }
};
