# Merkezi Bildirim Yönlendirme Motoru

Bu doküman, mobil uygulamada backend mimarisiyle tam uyumlu, ölçeklenebilir ve kullanıcı deneyimi yüksek bir bildirim yönlendirme sisteminin teknik detaylarını içerir.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Navigasyon Haritası (Mapper)](#navigasyon-haritası-mapper)
4. [Deep Linking Yapılandırması](#deep-linking-yapılandırması)
5. [Merkezi Notification Observer Hook](#merkezi-notification-observer-hook)
6. [NotificationScreen Optimizasyonu](#notificationscreen-optimizasyonu)
7. [Socket.IO Real-time Sync](#socketio-real-time-sync)
8. [Kullanım Örnekleri](#kullanım-örnekleri)

---

## 🎯 Genel Bakış

**Merkezi Yönlendirme Motoru** stratejisi, backend'den gelen zengin bildirim yapısını mobil tarafta anlamlı aksiyonlara dönüştüren profesyonel bir kurgudur.

### Temel Prensipler

1. **Tek Noktadan Yönetim**: Tüm bildirim yönlendirmeleri merkezi bir servis üzerinden yönetilir
2. **Type-Safe Navigation**: TypeScript ile tip güvenli navigasyon
3. **Deep Linking Desteği**: Uygulama kapalıyken bile doğru ekrana yönlendirme
4. **Performans Optimizasyonu**: FlashList ile yüksek performanslı liste render
5. **Real-time Sync**: Socket.IO ile anlık bildirim güncellemeleri

---

## 🏗️ Mimari Yapı

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NotificationFactory)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Notification │  │   Metadata   │  │  Navigation   │     │
│  │     Type     │  │     (IDs)     │  │   (Screen)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Mobil Uygulama (Merkezi Motor)                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  useNotificationObserver Hook                         │ │
│  │  - Foreground notification handling                   │ │
│  │  - Killed state notification handling                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  NotificationNavigationService                        │ │
│  │  - NavigationMap (Type -> Screen mapping)            │ │
│  │  - Parameter validation                               │ │
│  │  - Fallback handling                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  React Navigation + Deep Linking                       │ │
│  │  - linking.config.ts (URL schema mapping)             │ │
│  │  - NavigationContainer linking prop                   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Navigasyon Haritası (Mapper)

### NavigationMap Yapısı

`src/services/NotificationNavigationService/navigationMap.ts` dosyasında tüm bildirim tipleri için navigation yapılandırması bulunur.

```typescript
export const NOTIFICATION_NAVIGATION_MAP: Record<NotificationType, NavigationMapEntry> = {
  POST_LIKED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },
  // ... diğer bildirim tipleri
};
```

### Özellikler

- **Type-Safe**: Her bildirim tipi için tip güvenli navigation
- **Parameter Validation**: Gerekli parametrelerin kontrolü
- **Fallback Support**: Eksik parametre durumunda fallback ekran
- **Sürdürülebilirlik**: Yeni bildirim tipi eklemek için sadece map'e ekleme yeterli

### Yeni Bildirim Tipi Ekleme

```typescript
// navigationMap.ts
NEW_EVENT: {
  screen: 'Main',
  params: {
    screen: 'Events',
    params: {
      screen: 'EventDetailScreen',
      params: {},
    },
  },
  requiredParams: ['eventId'],
  fallback: {
    screen: 'Main',
    params: {
      screen: 'Events',
      params: {
        screen: 'EventsScreen',
      },
    },
  },
},
```

---

## 🔗 Deep Linking Yapılandırması

### React Navigation Linking Config

`src/navigation/linking.config.ts` dosyasında deep linking yapılandırması bulunur.

```typescript
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'tipboxapp://',
    'https://tipbox.app',
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Post: {
            screens: {
              PostDetailScreen: {
                path: 'post/:postId',
                parse: {
                  postId: (postId: string) => postId,
                },
              },
            },
          },
          // ... diğer ekranlar
        },
      },
    },
  },
};
```

### URL Formatları

- `tipboxapp://post/123` → PostDetailScreen (postId: 123)
- `tipboxapp://user/456` → ProfileScreen (userId: 456)
- `tipboxapp://notifications` → NotificationsScreen
- `tipboxapp://inbox/thread/789` → MessageDetailScreen (threadId: 789)

### Killed State Handling

Uygulama kapalıyken bildirime tıklandığında:

1. Expo notification data'sından URL parse edilir
2. React Navigation linking config ile route belirlenir
3. Navigation ref hazır olana kadar beklenir
4. Doğru ekrana yönlendirme yapılır

---

## 🎣 Merkezi Notification Observer Hook

### useNotificationObserver Hook

`src/hooks/useNotificationObserver.ts` dosyasında merkezi notification observer hook'u bulunur.

```typescript
export const useNotificationObserver = () => {
  const navigation = useNavigation();
  const markAsReadMutation = useMarkNotificationAsRead();

  useEffect(() => {
    // 1. Foreground notification handling
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const notification = createNotificationFromData(response.notification.request.content.data);
        
        // Mark as read
        markAsReadMutation.mutate(notification.id);
        
        // Navigate
        await NotificationNavigationService.navigate(notification);
      }
    );

    // 2. Killed state notification handling
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          const notification = createNotificationFromData(response.notification.request.content.data);
          await NotificationNavigationService.navigate(notification);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [navigation, markAsReadMutation]);
};
```

### Kullanım

```typescript
// src/navigation/index.tsx
import { useNotificationObserver } from '@/src/hooks/useNotificationObserver';

const Navigation = () => {
  useNotificationObserver(); // Merkezi observer hook'u
  
  return (
    <NavigationContainer ref={navigationRef} linking={linkingConfig}>
      <DrawerNavigator />
    </NavigationContainer>
  );
};
```

### Özellikler

- **Foreground Handling**: Uygulama açıkken bildirime tıklanırsa
- **Killed State Handling**: Uygulama kapalıyken bildirimle açılırsa
- **Auto Mark as Read**: Bildirimi otomatik olarak okundu olarak işaretler
- **Error Handling**: Navigation hatalarını yakalar ve loglar

---

## 📱 NotificationScreen Optimizasyonu

### FlashList Kullanımı

`src/features/notifications/screens/NotificationsScreen.tsx` dosyasında FlashList kullanılarak performans optimize edilmiştir.

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={filteredNotifications}
  renderItem={renderNotificationItem}
  keyExtractor={keyExtractor}
  estimatedItemSize={80}
  drawDistance={250}
  removeClippedSubviews={true}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
/>
```

### Performans İyileştirmeleri

- **FlashList**: FlatList yerine FlashList kullanımı (daha hızlı render)
- **Estimated Item Size**: Her item için tahmini boyut (80px)
- **Draw Distance**: Render edilecek mesafe (250px)
- **Remove Clipped Subviews**: Görünmeyen view'ları kaldır

### Bildirim İşaretleme

```typescript
const handleNotificationPress = useCallback((notification: Notification) => {
  // Mark as read
  if (!notification.read) {
    markAsReadMutation.mutate(notification.id);
  }
  
  // Navigate
  NotificationNavigationService.navigate(notification);
}, [markAsReadMutation]);
```

---

## 🔴 Socket.IO Real-time Sync

### Socket Notification Handler

`src/providers/NotificationProvider.tsx` dosyasında Socket.IO notification handler bulunur.

```typescript
useEffect(() => {
  const handleSocketNotification = async (notification: Notification) => {
    // State Sync: Zustand store'a ekle (instant UI update)
    notificationStateSync.addNotification(notification);
    
    // Event-driven: Notification event oluştur ve dispatch et
    const event = notificationEventService.createEvent(notification, 'socket');
    await notificationEventService.dispatch(event);
    
    // Grouping: Event'i grupla veya hemen gönder
    const grouped = await notificationGroupingService.groupOrSend(groupingEvent);
    
    // React Query cache'i invalidate et
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
  };

  socketService.onNotification(handleSocketNotification);
  
  return () => {
    socketService.off('notification', handleSocketNotification);
  };
}, [isAuthenticated, state.isInitialized]);
```

### Real-time Özellikler

- **Instant UI Update**: Bildirim geldiğinde anında UI güncellenir
- **Badge Count Sync**: Okunmamış bildirim sayısı anlık güncellenir
- **Grouping Support**: Benzer bildirimler gruplanır
- **Cache Invalidation**: React Query cache'i otomatik invalidate edilir

---

## 💡 Kullanım Örnekleri

### 1. Bildirim Yönlendirme

```typescript
// Notification'a tıklandığında
const handleNotificationPress = async (notification: Notification) => {
  // Mark as read
  await markNotificationAsRead(notification.id);
  
  // Navigate
  const success = await NotificationNavigationService.navigate(notification);
  
  if (!success) {
    console.warn('Navigation failed');
  }
};
```

### 2. Deep Link Test

```typescript
// Test için deep link oluştur
const url = deepLinkService.createURL('PostDetail', { postId: '123' });
// Result: tipboxapp://post/123

// URL parse et
const route = deepLinkService.parseURL(url);
// Result: { screen: 'PostDetail', params: { postId: '123' } }
```

### 3. Yeni Bildirim Tipi Ekleme

```typescript
// 1. navigationMap.ts'e ekle
NEW_EVENT_INVITE: {
  screen: 'Main',
  params: {
    screen: 'Events',
    params: {
      screen: 'EventDetailScreen',
      params: {},
    },
  },
  requiredParams: ['eventId'],
},

// 2. NotificationType'a ekle (types.ts)
export type NotificationType = 
  | 'POST_LIKED'
  | 'NEW_EVENT_INVITE' // Yeni tip
  | // ... diğer tipler
```

---

## 📊 Veri Akışı

### Bildirim Geldiğinde

1. **Backend**: NotificationFactory ile bildirim oluşturulur
2. **Socket.IO**: Real-time bildirim gönderilir
3. **NotificationProvider**: Socket notification handler çalışır
4. **State Sync**: Zustand store'a eklenir (instant UI update)
5. **Event Dispatch**: Notification event oluşturulur ve dispatch edilir
6. **Grouping**: Bildirim gruplanır veya hemen gönderilir
7. **UI Update**: React Query cache invalidate edilir

### Bildirime Tıklandığında

1. **useNotificationObserver**: Notification tap event'i yakalanır
2. **Mark as Read**: Bildirim okundu olarak işaretlenir
3. **NotificationNavigationService**: Navigation action oluşturulur
4. **NavigationMap**: Bildirim tipine göre hedef ekran belirlenir
5. **Parameter Validation**: Gerekli parametreler kontrol edilir
6. **Post Fetch**: PostId varsa post fetch edilir
7. **Navigation**: React Navigation ile yönlendirme yapılır

---

## 🎯 Özet

**Merkezi Yönlendirme Motoru** ile:

✅ **30+ bildirim tipi** tek bir merkezden yönetiliyor  
✅ **Type-safe navigation** ile tip güvenli yönlendirme  
✅ **Deep linking** ile killed state desteği  
✅ **FlashList** ile yüksek performanslı liste render  
✅ **Socket.IO** ile real-time bildirim sync  
✅ **Sürdürülebilir** kod yapısı ile kolay genişletilebilirlik  

---

## 📚 İlgili Dokümanlar

- [NOTIFICATION_FORMAT_AND_NAVIGATION.md](./NOTIFICATION_FORMAT_AND_NAVIGATION.md)
- [NOTIFICATION_SYSTEM_IMPLEMENTATION.md](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md)
- [COMPLETE_API_DOCUMENTATION.md](./COMPLETE_API_DOCUMENTATION.md)





