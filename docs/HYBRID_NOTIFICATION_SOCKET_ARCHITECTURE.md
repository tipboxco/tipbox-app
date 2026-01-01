# Hibrit Notification + Socket Mimarisi

## Mimari Prensip

**Socket ve Notification sistemleri UI'ya değil, Navigation'a ve State'e konuşur.**

```
Socket / Push
   ↓
Domain-level Service
   ↓
Global State (Zustand)
   ↓
NavigationService (Root Stack)
```

## Katmanlı Mimari Akış

```
┌──────────────────────────┐
│ External Events          │
│ - WebSocket              │
│ - Push Notification      │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│ Transport Layer          │
│ - SocketClient           │
│ - Push Handler           │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│ Domain Services          │
│ - NotificationService    │
│ - MessageService         │
│ - EventService           │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│ Global State (Zustand)   │
│ - unreadCount            │
│ - pendingNavigation      │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│ NavigationService        │
│ (Root Stack)             │
└──────────────────────────┘
```

## Domain Services

### NotificationService

**Konum:** `src/services/NotificationService/index.ts`

**Sorumluluklar:**
- Notification type'a göre navigation action oluşturma
- State update kararları
- UI context kontrolü (foreground/background)
- Navigation karar matrisi

**Kullanım:**
```typescript
import { notificationService } from '@/src/services/NotificationService';

// Notification handle et
notificationService.handleNotification(notification, {
  isForeground: true,
  shouldNavigate: true,
});

// Pending navigation consume et
notificationService.consumePendingNavigation();
```

### MessageService

**Konum:** `src/services/MessageService/index.ts`

**Sorumluluklar:**
- Incoming message handling
- Navigation kararları
- State updates

### EventService

**Konum:** `src/services/EventService/index.ts`

**Sorumluluklar:**
- Socket event normalization
- Domain routing (NotificationService, MessageService)
- Event type'a göre yönlendirme

## Zustand State Yapısı

**Konum:** `src/store/notificationStore.ts`

```typescript
{
  notifications: {
    unreadCount,
    realtimeNotifications,
    groupedNotifications
  },
  navigation: {
    pendingNavigation: {
      route: string;
      params?: any;
    } | null
  }
}
```

**Pending Navigation:**
- Navigation ready değilse navigation action state'e yazılır
- Navigation ready olduğunda consume edilir
- Crash riskini ve lost navigation sorunlarını önler

## Socket Mimarisi

### Socket Nerede Yaşar?

```
App Root
 └── SocketProvider
     └── SocketClient (singleton)
```

**Kurallar:**
- App açıldığında 1 kez bağlanır
- Tab değişiminde reconnect olmaz
- Background / foreground state yönetilir
- Screen/Feature/Tab içinde YAŞAMAZ

### Socket Event Handling

**Akış:**
1. **Event Normalize** - Event type'ı normalize et
2. **Domain Routing** - EventService'e yönlendir
3. **Karar (State + Navigation)** - Domain service karar verir

**Örnek:**
```typescript
// Socket notification geldiğinde
socketService.onNotification((notification) => {
  // EventService'e yönlendir
  eventService.handleSocketEvent(
    { type: 'notification', payload: notification },
    { isForeground, shouldNavigate: false }
  );
});
```

## Notification Mimarisi

### Tek Notification Kaynağı

Push notification, Socket notification ve In-app notification aynı domain modeline map edilir:

```typescript
type AppNotification = {
  id: string;
  type: 'MESSAGE' | 'POST' | 'EVENT' | ...;
  entityId: string;
  metadata?: any;
  navigation?: NotificationNavigation;
};
```

### NotificationProvider Sorumlulukları

**YAPAR:**
- Push permission yönetir
- App state (foreground/background) izler
- Push payload'ını domain service'e iletir

**YAPMAZ:**
- ❌ navigate etmez
- ❌ UI render etmez
- ❌ Navigation kararı vermez

### Push → Navigation Akış

```
Push geldi
│
├─ App killed
│   └─ payload parse
│       └─ NotificationService.handleNotification()
│           └─ NavigationService.navigate(...)
│
├─ App background
│   └─ user tap
│       └─ NotificationService.handleNotification()
│           └─ NavigationService.navigate(...)
│
└─ App foreground
    ├─ aktif ekranda mı?
    │   ├─ Evet → state update
    │   └─ Hayır → optional navigate
```

## NavigationService Entegrasyonu

### Global Navigation İlkesi

Socket ve notification:
- Sadece Root route isimlerini bilir
- Tab veya feature path bilmez

```typescript
// ✅ DOĞRU
navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, { messageId });

// ❌ YANLIŞ
navigationService.navigate('InboxStack', { screen: 'MessageDetailScreen' });
```

### Deferred Navigation

Navigation ready değilse pendingNavigation'a yazılır:

```typescript
if (!navigationReady) {
  setPendingNavigation(route);
}

// Navigation ready olduğunda
consumePendingNavigation();
```

**Avantajlar:**
- Crash riskini önler
- Lost navigation sorunlarını önler
- Deterministic navigation

## Navigation Karar Matrisi

```
Event geldi
│
├─ App foreground mu?
│   ├─ Evet → UI context uygun mu?
│   │   ├─ Evet → navigate
│   │   └─ Hayır → badge / state update
│   └─ Hayır → sadece state update
│
└─ Push fallback
```

Bu karar **NotificationService** içinde alınır.

## Performans Odaklı Sonuçlar

Bu mimari sayesinde:

✅ **Socket event flood'ları UI'yi kilitlemez**
- Event'ler domain service'e yönlendirilir
- UI render'ları socket event'lerinden izole edilir

✅ **Navigation stack şişmez**
- GlobalStackGroup ile tek instance
- Tab state resetlenmez

✅ **Memory footprint kontrol altında**
- Shared screens tek instance
- Zustand minimal re-render

✅ **Push + socket aynı akışı paylaşır**
- Tek domain model
- Tek navigation karar matrisi

## Ulaşılabilirlik Garantisi

Bu yapıda:

✅ **Socket her zaman ulaşılabilir** (App root)
✅ **Navigation her zaman ulaşılabilir** (Root Stack)
✅ **UI context gerekmez**
✅ **Tab / screen lifecycle'ına bağlılık yok**

**Sonuç:** "Uygulama nerede olursa olsun, doğru ekrana güvenle gidebilirim."

## Dosya Yapısı

```
src/
├── services/
│   ├── NotificationService/
│   │   └── index.ts          [Domain Service]
│   ├── MessageService/
│   │   └── index.ts          [Domain Service]
│   ├── EventService/
│   │   └── index.ts          [Domain Service]
│   ├── NavigationService/
│   │   └── index.ts          [Navigation Wrapper]
│   └── SocketService/
│       └── index.ts          [Transport Layer]
│
├── providers/
│   ├── NotificationProvider.tsx  [Transport Layer]
│   └── SocketProvider.tsx        [Transport Layer]
│
├── store/
│   └── notificationStore.ts     [Global State]
│
└── navigation/
    └── index.tsx                 [Navigation Ready Handler]
```

## Kullanım Örnekleri

### Socket Notification

```typescript
// NotificationProvider.tsx
socketService.onNotification((notification) => {
  eventService.handleSocketEvent(
    { type: 'notification', payload: notification },
    { isForeground, shouldNavigate: false }
  );
});
```

### Push Notification

```typescript
// NotificationProvider.tsx
handleNotificationResponse((notification) => {
  notificationService.handleNotification(domainNotification, {
    isForeground: true,
    shouldNavigate: true,
  });
});
```

### UI'dan Notification Navigation

```typescript
// NotificationsScreen.tsx
const handleNotificationPress = (notification) => {
  notificationService.handleNotification(notification, {
    isForeground: true,
    shouldNavigate: true,
  });
};
```

## Idempotency Kontrolü

**Problem:** Socket ve Push bazen aynı bildirimi gönderebilir (Network gecikmesi nedeniyle).

**Çözüm:** NotificationService içinde `lastProcessedEventIds` cache'i tutulur.

**Implementasyon:**
```typescript
// NotificationService
private lastProcessedEventIds: Set<string> = new Set();
private readonly MAX_CACHE_SIZE = 100;

handleNotification(notification) {
  // Idempotency kontrolü
  if (this.isEventProcessed(notification.id)) {
    return; // Duplicate notification ignored
  }
  
  this.markEventAsProcessed(notification.id);
  // ... işleme devam eder
}
```

**Avantajlar:**
- Aynı bildirim iki kez işlenmez
- Aynı ekran iki kez açılmaya çalışılmaz
- Memory efficient (FIFO cache, max 100 event)

## App State Awareness

**Problem:** Kullanıcı kritik ekrandayken (form, ödeme vb.) navigation kullanıcının verisini kaybetmesine neden olabilir.

**Çözüm:** NavigationService içinde Safety Check mekanizması.

**Implementasyon:**
```typescript
// appStore.ts
{
  isUserBusy: boolean;
  busyReason?: 'form' | 'payment' | 'critical-action' | string;
  setUserBusy: (busy: boolean, reason?: string) => void;
}

// NavigationService.navigate()
if (appState.isUserBusy && !options?.force) {
  // Deferred navigation
  setPendingNavigation(action);
  return;
}
```

**Kullanım:**
```typescript
// Kritik ekranda (Form, Ödeme, vb.)
useAppStore.getState().setUserBusy(true, 'form');

// İşlem tamamlandığında
useAppStore.getState().setUserBusy(false);

// Pending navigation consume edilir
notificationService.consumePendingNavigation();
```

**Avantajlar:**
- Kullanıcı verisi korunur
- Navigation güvenli şekilde defer edilir
- Priority sistemi ile acil navigation'lar yine de çalışabilir

## Nihai Mimari Özet

✅ **Socket:** Root-level singleton, domain service'e konuşur
✅ **Notification:** Push + in-app birleşik domain modeli
✅ **State:** Zustand ile minimal ve hedefli
✅ **Navigation:** Root Stack + GlobalStackGroup
✅ **Performans:** Tek instance, minimal re-render, deterministic flow
✅ **Idempotency:** Duplicate event kontrolü
✅ **Safety:** App State Awareness ile güvenli navigation

Bu mimari:
- Büyük ölçekli
- Event yoğun
- Uzun ömürlü
- AI destekli geliştirilen

mobil uygulamalar için doğru ve sürdürülebilir bir çözümdür.

## Pratik Uygulama Özeti

**"Bizim uygulamamızda UI pasiftir. Socket ve Push, veriyi Service'e verir. Service, Zustand'ı günceller ve eğer gerekiyorsa NavigationService üzerinden Root Stack'teki bir ekranı tetikler. Hiçbir ekran (Screen) kendi başına socket dinlemez veya navigate kararı vermez."**

**Çözülen Problemler:**
- ✅ **Race Condition:** "Uygulama açılmadan bildirim geldi, nereye gideceğim?" → `pendingNavigation` ile çözülür
- ✅ **State Sync:** Socket'ten gelen mesaj anında Zustand'a işlendiği için kullanıcı mesaj detayına gittiğinde veriyi hazır bulur
- ✅ **UI Performance:** Render yükü UI'dan alınıp logic katmanına taşındığı için takılmalar minimize edilir
- ✅ **Idempotency:** Aynı bildirim iki kez işlenmez
- ✅ **Safety:** Kullanıcı kritik ekrandayken navigation güvenli şekilde defer edilir

