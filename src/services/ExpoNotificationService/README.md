# Expo Notification Service

Kapsamlı, sürdürülebilir ve test edilebilir notification sistemi mimarisi. Expo Notifications API'sini kullanarak production-ready notification yönetimi sağlar.

## 📋 Özellikler

### ✅ Core Features
- **Token Management**: Expo Push Token ve Device Push Token yönetimi
- **Permission Handling**: iOS ve Android permission yönetimi
- **Android Channels**: Farklı öncelik seviyeleri için notification channel'ları
- **iOS Categories**: Interactive notification'lar için category desteği
- **Local Scheduling**: Zamanlanmış local notification'lar
- **Badge Management**: iOS badge count yönetimi
- **Background Tasks**: Headless notification processing
- **Deep Linking**: Notification tap handling ve navigation

### ✅ Advanced Features
- **Retry Mechanism**: Token registration için exponential backoff retry
- **Token Refresh**: Otomatik token yenileme mekanizması
- **Idempotency**: Duplicate notification'ları önleme
- **State Management**: Zustand store entegrasyonu
- **Analytics**: Notification event tracking
- **Error Handling**: Kapsamlı error handling ve logging

## 🏗️ Mimari

```
ExpoNotificationService/
├── core/
│   ├── notification-service.ts      # Core service (token, permission, channels)
│   ├── notification-manager.ts      # Business logic (routing, navigation)
│   └── notification-handlers.ts     # Event handlers (foreground/background)
├── config/
│   ├── default-channels.ts          # Android notification channels
│   └── default-categories.ts        # iOS notification categories
├── hooks/
│   ├── useNotificationSetup.ts      # Service initialization hook
│   └── useNotificationHandlers.ts   # Event listener hooks
├── utils/
│   ├── background-task.ts           # Background task handler
│   ├── scheduling.ts                # Notification scheduling utilities
│   └── navigation.ts                # Navigation utilities
├── types.ts                          # TypeScript type definitions
└── index.ts                          # Main entry point
```

## 🚀 Kullanım

### 1. Service Initialization

```typescript
import { notificationService } from '@/services/ExpoNotificationService';

// Initialize service
await notificationService.initialize();

// Register push token to backend
await notificationService.registerPushTokenToBackend();
```

### 2. React Hook Kullanımı

```typescript
import { useNotificationSetup } from '@/services/ExpoNotificationService/hooks';

function App() {
  const {
    state,
    isLoading,
    error,
    initialize,
    registerToken,
    requestPermission,
  } = useNotificationSetup({
    autoInitialize: true,
    autoRegisterToken: true,
    onInitialized: (state) => {
      console.log('Notification service initialized:', state);
    },
    onError: (error) => {
      console.error('Notification service error:', error);
    },
  });

  // Service otomatik olarak initialize edilir
  // Token otomatik olarak backend'e kaydedilir (authenticated olduğunda)

  return null;
}
```

### 3. Local Notification Gönderme

```typescript
import { notificationService } from '@/services/ExpoNotificationService';

// Hemen göster
await notificationService.sendLocalNotification({
  title: 'Yeni Bildirim',
  body: 'Bildirim içeriği',
  data: {
    type: 'POST_LIKED',
    postId: '123',
  },
  priority: 'high',
  channelId: 'high_priority', // Android için
  categoryId: 'POST_INTERACTION', // iOS için
});
```

### 4. Scheduled Notification

```typescript
import {
  scheduleNotificationForDate,
  scheduleDailyNotification,
} from '@/services/ExpoNotificationService/utils';

// Belirli bir tarihte göster
await scheduleNotificationForDate(
  {
    title: 'Hatırlatma',
    body: 'Etkinlik başlıyor',
  },
  new Date('2024-12-25T10:00:00'),
  'event-reminder'
);

// Günlük hatırlatma
await scheduleDailyNotification(
  {
    title: 'Günlük Hatırlatma',
    body: 'Bugünkü görevlerinizi kontrol edin',
  },
  9, // Saat
  0, // Dakika
  'daily-reminder'
);
```

### 5. Background Task Handler

```typescript
// app.json configuration
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["default.wav"],
          "mode": "production"
        }
      ]
    ]
  }
}

// Background task otomatik olarak register edilir
// App kapalıyken notification geldiğinde çalışır
```

### 6. Navigation Integration

```typescript
import { setNavigationRef } from '@/services/ExpoNotificationService/utils/navigation';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Navigation ref'i set et
    setNavigationRef(navigationRef.current);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* ... */}
    </NavigationContainer>
  );
}
```

## ⚙️ Yapılandırma

### Android Channels

```typescript
import { DEFAULT_ANDROID_CHANNELS } from '@/services/ExpoNotificationService/config/default-channels';

// Default channels:
// - default: Genel bildirimler (HIGH priority)
// - high_priority: Önemli bildirimler (MAX priority)
// - messages: Mesaj bildirimleri (MAX priority)
// - events: Etkinlik bildirimleri (HIGH priority)
// - low_priority: Düşük öncelikli bildirimler (LOW priority)
```

### iOS Categories

```typescript
import { DEFAULT_IOS_CATEGORIES } from '@/services/ExpoNotificationService/config/default-categories';

// Default categories:
// - MESSAGE: Mesaj yanıtla aksiyonu
// - DM_REQUEST: DM request kabul/reddet aksiyonları
// - POST_INTERACTION: Post görüntüle/beğen aksiyonları
```

## 📱 Platform-Specific Features

### iOS
- Badge count management
- Interactive notifications (categories)
- Notification permissions
- Background fetch support

### Android
- Notification channels
- Custom notification sounds
- Vibration patterns
- Notification priority levels

## 🔧 API Reference

### NotificationService

```typescript
class NotificationService {
  // Initialization
  initialize(): Promise<NotificationServiceState>;
  
  // Permission
  requestPermission(): Promise<NotificationPermissionStatus>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  
  // Token Management
  registerPushTokenToBackend(options?: TokenRegistrationOptions): Promise<void>;
  refreshPushToken(): Promise<string | null>;
  retryPendingPushToken(): Promise<void>;
  
  // Local Notifications
  sendLocalNotification(payload: NotificationPayload): Promise<string>;
  scheduleNotification(input: ScheduledNotificationInput): Promise<string>;
  cancelScheduledNotification(identifier: string): Promise<void>;
  cancelAllScheduledNotifications(): Promise<void>;
  
  // Badge
  setBadgeCount(count: number): Promise<void>;
  clearBadge(): Promise<void>;
  getBadgeCount(): Promise<number>;
  
  // Channels (Android)
  getChannel(channelId: string): Promise<NotificationChannel | null>;
  getAllChannels(): Promise<NotificationChannel[]>;
  deleteChannel(channelId: string): Promise<void>;
  
  // Categories (iOS)
  getCategory(categoryId: string): Promise<NotificationCategory | null>;
  getAllCategories(): Promise<NotificationCategory[]>;
  deleteCategory(categoryId: string): Promise<void>;
  
  // State
  getState(): NotificationServiceState;
  getExpoPushTokenSync(): string | undefined;
  getDevicePushTokenSync(): DevicePushToken | undefined;
}
```

### NotificationManager

```typescript
class NotificationManager {
  handleNotification(
    notification: Notification,
    context: {
      isForeground: boolean;
      shouldNavigate?: boolean;
      source?: 'push' | 'local' | 'socket';
    }
  ): Promise<void>;
  
  handleNotificationResponse(response: NotificationResponse): Promise<void>;
}
```

## 🧪 Test

```typescript
// Test için mock service
import { NotificationService } from '@/services/ExpoNotificationService/core/notification-service';

const mockService = new NotificationService({
  defaultSound: false,
  defaultVibrate: false,
});

// Test initialization
await mockService.initialize();

// Test local notification
await mockService.sendLocalNotification({
  title: 'Test',
  body: 'Test notification',
});
```

## 📝 Best Practices

1. **Service Initialization**: App başlangıcında service'i initialize edin
2. **Token Registration**: Authenticated olduğunda token'ı backend'e kaydedin
3. **Permission Handling**: Kullanıcıya permission isteğini uygun zamanda gösterin
4. **Error Handling**: Tüm async işlemlerde error handling yapın
5. **State Management**: Zustand store ile state senkronizasyonu yapın
6. **Navigation**: Navigation ref'i set edin ve pending navigation'ı handle edin
7. **Background Tasks**: Background task'ı app.json'da tanımlayın
8. **Analytics**: Notification event'lerini track edin

## 🐛 Troubleshooting

### Token Registration Fails
- Permission'ın granted olduğundan emin olun
- Project ID'nin app.json'da tanımlı olduğunu kontrol edin
- Network bağlantısını kontrol edin
- Retry mekanizması otomatik olarak çalışır

### Notifications Not Showing
- Permission'ın granted olduğunu kontrol edin
- Android channel'ların oluşturulduğunu kontrol edin
- Foreground handler'ın doğru yapılandırıldığını kontrol edin

### Background Task Not Working
- app.json'da background task'ın tanımlı olduğunu kontrol edin
- Task name'in doğru olduğunu kontrol edin
- Background mode'un enable olduğunu kontrol edin

## 📚 Daha Fazla Bilgi

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Expo Background Tasks](https://docs.expo.dev/versions/latest/sdk/task-manager/)
