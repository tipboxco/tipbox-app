# Performance Monitoring Setup Guide

## Production Performance Metrics Configuration

### 1. React Native Performance Monitoring Tools

#### Option A: React Native Performance Monitor (Built-in)
- **Pros:** No additional dependencies, lightweight
- **Cons:** Limited metrics, requires manual implementation
- **Setup:** Custom hooks and performance markers

#### Option B: Flipper (Development)
- **Pros:** Comprehensive debugging, network inspection, performance profiling
- **Cons:** Development only, not for production
- **Setup:** Already configured in Expo projects

#### Option C: Sentry Performance Monitoring
- **Pros:** Production-ready, automatic error tracking, performance traces
- **Cons:** Requires Sentry account, additional bundle size (~50KB)
- **Setup:** `@sentry/react-native` package

#### Option D: Firebase Performance Monitoring
- **Pros:** Production-ready, automatic traces, network monitoring
- **Cons:** Requires Firebase account, Google services dependency
- **Setup:** `@react-native-firebase/perf` package

### 2. Recommended Setup: Sentry Performance Monitoring

#### Installation
```bash
npm install @sentry/react-native
```

#### Configuration (`App.tsx`)
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.APP_ENV || 'development',
  tracesSampleRate: 1.0, // 100% in development, 0.1 in production
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
});
```

#### Performance Monitoring
```typescript
// Custom performance tracking
const transaction = Sentry.startTransaction({
  name: 'FeedScreen Load',
  op: 'navigation',
});

// ... component logic ...

transaction.finish();
```

### 3. Custom Performance Hooks

#### `usePerformanceMetrics.ts`
```typescript
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export const usePerformanceMetrics = (screenName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const renderTimeRef = useRef<number>(0);

  useEffect(() => {
    const startTime = Date.now();
    
    InteractionManager.runAfterInteractions(() => {
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      renderTimeRef.current = renderTime;
      
      // Log to analytics
      console.log(`[Performance] ${screenName} render time: ${renderTime}ms`);
      
      // Send to monitoring service
      // analytics.track('screen_render_time', { screenName, renderTime });
    });
  }, []);

  return {
    renderTime: renderTimeRef.current,
  };
};
```

### 4. Key Metrics to Track

#### Startup Metrics
- **Cold Start Time:** App launch to first render
- **Auth Initialization Time:** Token read + auth state setup
- **First Screen Render Time:** Time to first interactive screen

#### Runtime Metrics
- **Screen Render Time:** Time to render each screen
- **API Request Latency:** Average response time per endpoint
- **List Scroll FPS:** Frame rate during scrolling
- **Memory Usage:** Peak and average memory consumption
- **Bundle Size:** JavaScript bundle size

#### User Experience Metrics
- **Time to Interactive:** Time until user can interact
- **Time to First Contentful Paint:** First content visible
- **Navigation Transition Time:** Screen transition duration

### 5. Implementation Steps

1. **Choose Monitoring Tool**
   - Development: Flipper (already available)
   - Production: Sentry or Firebase Performance

2. **Add Performance Markers**
   - Wrap critical operations with performance markers
   - Track API calls, navigation, and heavy computations

3. **Set Up Analytics Dashboard**
   - Configure alerts for performance degradation
   - Set thresholds (e.g., FPS < 55, API latency > 500ms)

4. **Regular Monitoring**
   - Weekly performance reviews
   - Track trends over time
   - Identify regressions early

### 6. Example: FeedScreen Performance Tracking

```typescript
import { usePerformanceMetrics } from '@/src/hooks/usePerformanceMetrics';

const FeedScreen = () => {
  const { renderTime } = usePerformanceMetrics('FeedScreen');
  
  // Track API call performance
  const { data, isLoading } = useFeed();
  
  useEffect(() => {
    if (!isLoading && data) {
      // Log performance metrics
      console.log('[Performance] FeedScreen loaded:', {
        renderTime,
        dataLoadTime: Date.now() - startTime,
        itemCount: data.length,
      });
    }
  }, [isLoading, data, renderTime]);
  
  // ... rest of component
};
```

### 7. Production Alerts

#### Recommended Thresholds
- **Cold Start:** > 2 seconds (alert)
- **API Latency:** > 1 second (alert)
- **Scroll FPS:** < 50 FPS (alert)
- **Memory Usage:** > 200MB (warning), > 300MB (alert)
- **Bundle Size:** > 5MB (warning)

### 8. Next Steps

1. **Immediate:** Add custom performance hooks for key screens
2. **Short-term:** Set up Sentry or Firebase Performance Monitoring
3. **Long-term:** Build internal dashboard for performance metrics

---

**Note:** This is a setup guide. Actual implementation requires:
- Monitoring service account (Sentry/Firebase)
- Environment variables configuration
- Team review and approval
- Gradual rollout to production


