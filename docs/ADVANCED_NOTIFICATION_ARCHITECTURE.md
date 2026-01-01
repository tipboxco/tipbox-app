# Advanced Notification Architecture - Production-Grade Implementation

## 🎯 Overview

Bu dokümantasyon, production-grade, scalable ve performanslı bir notification mimarisinin teknik detaylarını içerir. Sistem, **veri tutarlılığı**, **düşük gecikme süresi (latency)** ve **mükemmel kullanıcı deneyimi** prensiplerine dayanır.

## 📐 Mimari Diyagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Event      │  │   BullMQ     │  │  Worker      │     │
│  │  Trigger    │─▶│   Queue      │─▶│  Process    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                              │                              │
│                              ▼                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Notification │  │   Socket.IO  │  │  Expo Push   │     │
│  │   Factory    │  │   (Realtime) │  │  (Mobile)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Client (React Native + Expo)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Deep Link   │  │   Zustand    │  │  React Query │     │
│  │   Service    │  │    Store     │  │    Cache     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                              │                              │
│                              ▼                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Event       │  │  Grouping    │  │   State      │     │
│  │  Service     │  │   Service    │  │   Sync       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                              │                              │
│                              ▼                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  FlashList   │  │ Asset Cache  │  │  Analytics   │     │
│  │  (UI)        │  │   Service    │  │   Service   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Core Services

### 1. DeepLinkService (`src/services/DeepLinkService/`)

**Sorumluluklar:**
- URL schema parsing (`tipboxapp://`)
- Initial URL handling (killed state)
- Notification data parsing
- Navigation route mapping

**Özellikler:**
- ✅ Killed state'den açılışta URL yakalama
- ✅ Foreground state'de URL change listener
- ✅ Smart route mapping (screen + params)
- ✅ Fallback navigation logic

**Kullanım:**
```typescript
// Initial URL (killed state)
const url = await deepLinkService.getInitialURL();
const route = deepLinkService.parseURL(url);

// Notification data parsing
const route = deepLinkService.parseNotificationData(notification.data);
```

### 2. NotificationStore (`src/store/notificationStore.ts`)

**Sorumluluklar:**
- Realtime notification state (Socket.IO events)
- Optimistic updates
- Notification grouping state
- Unread count cache

**State Management Rules:**
- Zustand = CLIENT STATE (UI state, realtime flags)
- React Query = SERVER STATE (API data, cache)
- Store syncs with React Query but provides instant UI updates

**Kullanım:**
```typescript
const store = useNotificationStore();
store.addRealtimeNotification(notification);
store.incrementUnreadCount(); // Optimistic update
```

### 3. NotificationEventService (`src/services/NotificationEventService/`)

**Sorumluluklar:**
- Event dispatching
- Event listeners (type-based, priority-based, wildcard)
- Event filtering
- Event queue management

**Event-Driven Architecture:**
```typescript
// Event listener ekle
notificationEventService.on('POST_LIKED', (event) => {
  // Handle event
});

// Event dispatch
const event = notificationEventService.createEvent(notification, 'socket');
await notificationEventService.dispatch(event);
```

### 4. NotificationGroupingService (`src/services/NotificationGroupingService/`)

**Sorumluluklar:**
- Debouncing mechanism (1 dakika window)
- Notification aggregation
- Rate limiting (spam prevention)
- Group template generation

**Grouping Logic:**
- Groupable types: `POST_LIKED`, `POST_COMMENTED`, `COMMENT_LIKED`, `NEW_TRUSTER`, `POST_SHARED`
- High priority notifications: Hemen gönder (grouping yapma)
- Normal priority: 1 dakika içinde grupla
- Max group size: 50

**Örnek:**
```
100 beğeni → "X ve 50 kişi daha fotoğrafınızı beğendi ❤️"
```

### 5. NotificationStateSync (`src/services/NotificationStateSync/`)

**Sorumluluklar:**
- Zustand store ↔ React Query cache sync
- Optimistic updates
- Cache invalidation
- State consistency

**Sync Mechanism:**
- Periyodik sync (5 saniyede bir)
- Realtime notifications'ı React Query cache'e merge et
- Unread count sync

### 6. NotificationAnalytics (`src/services/NotificationAnalytics/`)

**Sorumluluklar:**
- Notification received tracking
- Notification opened tracking
- Delivery rate calculation
- Open rate calculation

**Metrics:**
- Delivery rate: `received / sent * 100`
- Open rate: `opened / received * 100`

### 7. NotificationAssetCache (`src/services/NotificationAssetCache/`)

**Sorumluluklar:**
- Rich notification images pre-caching
- User avatars caching
- Post images caching
- expo-image integration

**Caching Strategy:**
- Memory + disk cache
- Batch caching (birden fazla notification için)
- Queue-based processing

## 🔄 Notification Flow

### Foreground (App Açık)

```
Socket.IO Event
  └─> NotificationProvider.handleSocketNotification()
      ├─> Analytics.trackReceived()
      ├─> StateSync.addNotification() (instant UI update)
      ├─> EventService.dispatch() (event-driven)
      ├─> GroupingService.groupOrSend() (debouncing)
      └─> NotificationService.sendLocalNotification() (in-app)
```

### Background/Killed (App Kapalı)

```
Expo Push Service
  └─> OS Push Notification
      └─> User taps notification
          └─> DeepLinkService.parseNotificationData()
              └─> Navigation (deep linking)
```

## 🚀 Performance Optimizations

### 1. FlashList Integration

**NotificationsScreen** artık `@shopify/flash-list` kullanıyor:

```typescript
<FlashList
  data={filteredNotifications}
  renderItem={renderNotificationItem}
  estimatedItemSize={100}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  initialNumToRender={10}
  windowSize={10}
/>
```

**Avantajlar:**
- ✅ Cell recycling (sadece görünen items render)
- ✅ 60 FPS smooth scrolling (binlerce notification)
- ✅ Memory efficient

### 2. Asset Pre-caching

**Rich notification images** önceden cache'leniyor:

```typescript
// Notification yüklendiğinde
notificationAssetCache.cacheBatchNotifications(notifications);

// expo-image ile efficient caching
await Image.prefetch(url, {
  cachePolicy: 'memory-disk',
});
```

**Avantajlar:**
- ✅ Notification'a tıklandığında image "pat" diye gelir
- ✅ Network latency yok
- ✅ Smooth UX

### 3. Optimistic Updates

**Zustand store** ile instant UI updates:

```typescript
// Socket event geldiğinde
store.addRealtimeNotification(notification);
store.incrementUnreadCount(); // Instant badge update

// React Query cache sonra sync olur (5 saniyede bir)
```

## 🔐 Security & Best Practices

### 1. Token Invalidation

**ExpoNotificationService** token invalidation handling:

```typescript
// Backend'den DeviceNotRegistered hatası geldiğinde
// Token'ı SecureStore'dan temizle
await SecureStore.deleteItemAsync(PENDING_PUSH_TOKEN_KEY);
```

### 2. Idempotency Key

**Backend'de** her notification isteğine benzersiz idempotency key atanmalı:

```typescript
// Backend (örnek)
{
  idempotencyKey: `${userId}-${notificationId}-${timestamp}`,
  // ...
}
```

### 3. Rate Limiting

**NotificationGroupingService** ile spam prevention:

- Grouping window: 1 dakika
- Max group size: 50
- High priority: Hemen gönder

## 📊 Monitoring & Analytics

### Log Points

- `[NotificationProvider]` - Provider lifecycle
- `[DeepLinkService]` - Deep linking operations
- `[NotificationEventService]` - Event dispatching
- `[NotificationGroupingService]` - Grouping operations
- `[NotificationStateSync]` - State sync operations
- `[NotificationAnalytics]` - Analytics tracking
- `[NotificationAssetCache]` - Asset caching

### Metrics to Track

- Token registration success rate
- Badge sync accuracy
- Deep linking success rate
- Notification delivery rate
- Open rate
- Grouping efficiency
- Asset cache hit rate

## 🧪 Testing

### Manual Test Checklist

- [ ] Deep linking (killed state)
- [ ] Deep linking (foreground state)
- [ ] Socket.IO realtime notification
- [ ] Notification grouping (1 dakika window)
- [ ] Badge sync (optimistic + React Query)
- [ ] Asset pre-caching
- [ ] FlashList performance (1000+ notifications)
- [ ] Token refresh (app foreground)
- [ ] State sync (Zustand ↔ React Query)

### Performance Benchmarks

- **FlashList**: 1000+ notifications, 60 FPS
- **Asset Cache**: < 100ms image load time
- **State Sync**: < 5s sync interval
- **Deep Linking**: < 500ms navigation delay

## 📚 References

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Shopify FlashList](https://shopify.github.io/flash-list/)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Oluşturma Tarihi:** 30 Aralık 2025  
**Son Güncelleme:** 30 Aralık 2025  
**Versiyon:** 2.0.0 (Advanced Architecture)
