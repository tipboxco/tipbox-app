# Notification System Architecture

## 🏗️ Mimari Genel Bakış

Bu notification sistemi, Expo Notifications API'sini kullanarak production-ready, sürdürülebilir ve test edilebilir bir mimari sunar.

## 📦 Katmanlar

### 1. Core Layer (`core/`)

#### NotificationService
- **Sorumluluk**: Token yönetimi, permission handling, channel/category yönetimi
- **Özellikler**:
  - Expo Push Token ve Device Push Token yönetimi
  - Permission request ve status kontrolü
  - Android notification channels oluşturma/yönetme
  - iOS notification categories oluşturma/yönetme
  - Local notification gönderme
  - Scheduled notification yönetimi
  - Badge count yönetimi
  - Background task registration

#### NotificationManager
- **Sorumluluk**: Business logic, notification routing, state management
- **Özellikler**:
  - Notification handling (foreground/background/killed state)
  - Navigation action mapping
  - State management entegrasyonu (Zustand)
  - Analytics event tracking
  - Idempotency kontrolü
  - Badge count sync

#### NotificationHandlers
- **Sorumluluk**: Event handling, app state tracking
- **Özellikler**:
  - Foreground notification handler
  - Background notification handler
  - Killed state notification handler
  - Notification response handler (tap)
  - Notifications dropped handler

### 2. Configuration Layer (`config/`)

#### Default Channels (Android)
- `default`: Genel bildirimler (HIGH priority)
- `high_priority`: Önemli bildirimler (MAX priority)
- `messages`: Mesaj bildirimleri (MAX priority)
- `events`: Etkinlik bildirimleri (HIGH priority)
- `low_priority`: Düşük öncelikli bildirimler (LOW priority)

#### Default Categories (iOS)
- `MESSAGE`: Mesaj yanıtla aksiyonu
- `DM_REQUEST`: DM request kabul/reddet aksiyonları
- `POST_INTERACTION`: Post görüntüle/beğen aksiyonları

### 3. Hooks Layer (`hooks/`)

#### useNotificationSetup
- Service initialization
- Token registration
- Permission handling
- App state tracking
- Token refresh

#### useNotificationHandlers
- Event listener management
- Last notification response handling

### 4. Utilities Layer (`utils/`)

#### Background Task
- Headless notification processing
- Background task registration/unregistration

#### Scheduling
- Date-based scheduling
- Interval-based scheduling
- Recurring notifications (daily, weekly, monthly, yearly)
- Calendar-based scheduling

#### Navigation
- Navigation ref management
- Notification tap handling
- Pending navigation management

## 🔄 Data Flow

### 1. Initialization Flow

```
App Start
  └─> useNotificationSetup.initialize()
      └─> NotificationService.initialize()
          ├─> Configure foreground handler
          ├─> Setup Android channels
          ├─> Setup iOS categories
          ├─> Request permission
          ├─> Get Expo Push Token
          ├─> Get Device Push Token
          └─> Register background task
      └─> NotificationService.registerPushTokenToBackend()
          └─> Backend API call (with retry)
```

### 2. Notification Received Flow

```
Push Notification Received
  ├─> Foreground State
  │   └─> NotificationHandlers.createForegroundHandler()
  │       └─> NotificationManager.handleNotification()
  │           ├─> Idempotency check
  │           ├─> State update (Zustand)
  │           ├─> Navigation action mapping
  │           ├─> Immediate navigation
  │           ├─> Analytics tracking
  │           └─> Badge count update
  │
  ├─> Background State
  │   └─> Background Task Handler
  │       └─> NotificationManager.handleNotification()
  │           ├─> State update
  │           └─> Pending navigation (app açıldığında)
  │
  └─> Killed State
      └─> App açıldığında
          └─> NotificationHandlers.handleKilledStateNotification()
              └─> NotificationManager.handleNotificationResponse()
```

### 3. Notification Tap Flow

```
User Taps Notification
  └─> NotificationHandlers.createResponseHandler()
      └─> NotificationManager.handleNotificationResponse()
          ├─> Interactive action handling (if applicable)
          ├─> Navigation action mapping
          ├─> Navigate to screen
          ├─> Mark as read
          └─> Analytics tracking
```

## 🔐 Security & Performance

### Security
- Token'lar SecureStore'da saklanır
- Pending token'lar encrypted storage'da tutulur
- Permission kontrolü her işlemde yapılır

### Performance
- Idempotency kontrolü ile duplicate notification'lar önlenir
- Processed notification ID cache'i (memory management)
- Lazy initialization
- Token refresh interval kontrolü

### Error Handling
- Retry mechanism (exponential backoff)
- Error logging
- Graceful degradation
- Pending token persistence

## 🧪 Testability

### Unit Testing
- Service methods mock'lanabilir
- Manager logic test edilebilir
- Handler'lar test edilebilir

### Integration Testing
- End-to-end notification flow test edilebilir
- Navigation integration test edilebilir
- Background task test edilebilir

### Mock Service
```typescript
const mockService = new NotificationService({
  defaultSound: false,
  defaultVibrate: false,
});
```

## 📊 State Management

### Zustand Store Integration
- Realtime notifications
- Unread count cache
- Pending navigation
- Notification grouping

### React Query Integration
- Server state (API data)
- Cache management
- Optimistic updates

## 🔗 Integration Points

### Navigation
- Navigation ref set edilir
- Pending navigation queue yönetilir
- Deep linking support

### Analytics
- Notification received events
- Notification opened events
- Notification action events

### Backend API
- Token registration
- Notification settings sync
- Unread count sync

## 🚀 Deployment Checklist

- [ ] app.json'da projectId tanımlı
- [ ] Android channels yapılandırılmış
- [ ] iOS categories yapılandırılmış
- [ ] Background task app.json'da tanımlı
- [ ] Permission strings tanımlı
- [ ] Navigation ref set edilmiş
- [ ] Service initialize edilmiş
- [ ] Token registration çalışıyor
- [ ] Error handling test edilmiş
- [ ] Analytics entegrasyonu yapılmış

## 📝 Best Practices

1. **Service Initialization**: App başlangıcında initialize edin
2. **Token Registration**: Authenticated olduğunda token'ı kaydedin
3. **Permission Handling**: Kullanıcıya uygun zamanda permission isteyin
4. **Error Handling**: Tüm async işlemlerde error handling yapın
5. **State Sync**: Zustand store ile state senkronizasyonu yapın
6. **Navigation**: Pending navigation'ı handle edin
7. **Analytics**: Event'leri track edin
8. **Testing**: Unit ve integration testleri yazın
