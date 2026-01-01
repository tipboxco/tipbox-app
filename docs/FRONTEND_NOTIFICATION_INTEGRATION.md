# Frontend Notification Integration - Implementation Guide

## ✅ Tamamlanan Özellikler

### 1. ExpoNotificationService Geliştirmeleri

#### Badge Management
- ✅ `setBadgeCount(count)` - Badge count'u güncelle
- ✅ `clearBadge()` - Badge'i sıfırla
- ✅ `getBadgeCount()` - Mevcut badge count'u al
- ✅ iOS badge count sync
- ✅ Android notification channel badge support

#### Token Management
- ✅ `refreshPushToken()` - Token'ı yenile ve backend'e kaydet
- ✅ Token değişikliklerini dinleme (gelecek için hazır)
- ✅ Retry mekanizması ile token registration
- ✅ Pending token persistence (SecureStore)

#### Android Notification Channels
- ✅ `default` channel - Genel bildirimler (HIGH priority)
- ✅ `high_priority` channel - Önemli bildirimler (MAX priority)
- ✅ Vibration patterns
- ✅ Sound configuration
- ✅ Badge support

### 2. NotificationProvider Geliştirmeleri

#### App State Handling
- ✅ Foreground/Background state tracking
- ✅ Foreground'da in-app notification gösterimi
- ✅ Background'da OS push notification (backend'den)
- ✅ App state değişiminde token refresh

#### Badge Sync
- ✅ Unread notification count ile badge count sync
- ✅ Otomatik badge güncelleme (unread count değiştiğinde)
- ✅ Permission kontrolü ile güvenli badge update

#### Token Management
- ✅ Auth ready olduğunda token registration
- ✅ Authenticated olduğunda token kaydı
- ✅ App foreground'a geldiğinde token refresh
- ✅ Pending token retry mekanizması

#### Deep Linking
- ✅ Notification tap handling
- ✅ Navigation ref ile deep linking
- ✅ Navigation data parsing
- ✅ Error handling ve retry mekanizması

### 3. app.json Configuration

#### iOS Permissions
- ✅ `NSUserNotificationsUsageDescription` eklendi
- ✅ Notification permission description

#### Android Permissions
- ✅ `android.permission.POST_NOTIFICATIONS` eklendi (Android 13+)
- ✅ `android.permission.VIBRATE` eklendi

#### Expo Notifications Plugin
- ✅ `expo-notifications` plugin yapılandırması
- ✅ Icon ve color ayarları

## 📋 Kullanım Örnekleri

### Badge Count Sync

```typescript
// NotificationProvider içinde otomatik sync
useEffect(() => {
  if (!state.isInitialized || state.permissionStatus !== 'granted') {
    return;
  }

  const syncBadge = async () => {
    await notificationService.setBadgeCount(unreadCount);
  };

  syncBadge();
}, [unreadCount, state.isInitialized, state.permissionStatus]);
```

### Token Refresh

```typescript
// App foreground'a geldiğinde token refresh
useEffect(() => {
  if (!state.isInitialized || !isAuthenticated || !isForeground) {
    return;
  }

  const refreshToken = async () => {
    const newToken = await notificationService.refreshPushToken();
    if (newToken && newToken !== state.expoPushToken) {
      setState(prev => ({ ...prev, expoPushToken: newToken }));
    }
  };

  const timeout = setTimeout(refreshToken, 2000);
  return () => clearTimeout(timeout);
}, [isForeground, state.isInitialized, isAuthenticated]);
```

### Deep Linking

```typescript
// Notification tap handling
const handleNotificationResponse = (notification: NotificationPayload) => {
  const navigationData = notification.data?.navigation as {
    screen: string;
    params?: Record<string, any>;
  };
  
  if (navigationData?.screen && navigationRef.current) {
    navigate(navigationData.screen, navigationData.params);
  }
};
```

## 🔄 Notification Flow

### Foreground (App Açık)
```
Backend Event
  └─> Socket.IO Event
      └─> NotificationProvider.handleSocketNotification()
          ├─> Invalidate React Query cache
          └─> notificationService.sendLocalNotification()
              └─> Expo Notifications (in-app notification)
```

### Background (App Arka Planda)
```
Backend Event
  └─> Expo Push Service
      └─> OS Push Notification
          └─> User taps notification
              └─> NotificationProvider.handleNotificationResponse()
                  └─> Deep linking navigation
```

### Killed (App Kapatılmış)
```
Backend Event
  └─> Expo Push Service
      └─> OS Push Notification
          └─> User taps notification
              └─> App cold start
                  └─> NotificationProvider.handleNotificationResponse()
                      └─> Deep linking navigation
```

## 🎯 Best Practices

### 1. Token Registration
- ✅ Auth ready olduğunda başlat
- ✅ Authenticated olduğunda kaydet
- ✅ Token değişikliklerini dinle
- ✅ Retry mekanizması ile güvenli kayıt

### 2. Badge Management
- ✅ Unread count ile sync et
- ✅ Permission kontrolü yap
- ✅ iOS ve Android için farklı davranış

### 3. App State Handling
- ✅ Foreground'da in-app notification
- ✅ Background'da OS push notification
- ✅ App state değişiminde token refresh

### 4. Deep Linking
- ✅ Navigation ref kullan
- ✅ Error handling ekle
- ✅ Retry mekanizması ile güvenli navigation

### 5. Error Handling
- ✅ Retry mekanizması (exponential backoff)
- ✅ Pending token persistence
- ✅ Graceful degradation

## 📱 Platform-Specific Notes

### iOS
- ✅ Badge count native support
- ✅ Notification permission required
- ✅ Token refresh on app update/OS update
- ✅ Deep linking via notification data

### Android
- ✅ Notification channels (Android 8.0+)
- ✅ POST_NOTIFICATIONS permission (Android 13+)
- ✅ Badge count via notification channels
- ✅ Deep linking via notification data

## 🔧 Configuration

### Notification Channels (Android)

```typescript
// Default channel - Genel bildirimler
{
  name: 'Genel Bildirimler',
  importance: AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default',
  enableVibrate: true,
  showBadge: true,
}

// High priority channel - Önemli bildirimler
{
  name: 'Önemli Bildirimler',
  importance: AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default',
  enableVibrate: true,
  showBadge: true,
}
```

### Notification Handler (Foreground)

```typescript
{
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,
  shouldShowList: true,
}
```

## 🚀 Testing

### Manual Test Checklist

- [ ] Permission request çalışıyor mu?
- [ ] Token backend'e kaydediliyor mu?
- [ ] Badge count sync çalışıyor mu?
- [ ] Foreground notification gösteriliyor mu?
- [ ] Background notification gösteriliyor mu?
- [ ] Deep linking çalışıyor mu?
- [ ] Token refresh çalışıyor mu?
- [ ] Retry mekanizması çalışıyor mu?

### Test Senaryoları

1. **Permission Test**
   - App ilk açılışta permission iste
   - Permission reddedilirse ne oluyor?
   - Permission verilirse token kaydediliyor mu?

2. **Badge Sync Test**
   - Unread count değiştiğinde badge güncelleniyor mu?
   - Badge sıfırlanıyor mu?

3. **Token Refresh Test**
   - App foreground'a geldiğinde token refresh ediliyor mu?
   - Token değiştiğinde backend'e kaydediliyor mu?

4. **Deep Linking Test**
   - Notification'a tıklandığında doğru ekrana gidiyor mu?
   - Navigation params doğru geçiyor mu?

## 📊 Monitoring

### Log Points

- `[NotificationProvider]` - Provider lifecycle
- `[ExpoNotificationService]` - Service operations
- `[NotificationProvider] 📨` - Socket notifications
- `[NotificationProvider] 📱` - Push notifications
- `[NotificationProvider] 👆` - Notification taps
- `[NotificationProvider] ✅` - Badge sync

### Metrics to Track

- Token registration success rate
- Badge sync accuracy
- Deep linking success rate
- Notification delivery rate
- Permission grant rate

## 🔐 Security Considerations

- ✅ Token SecureStore'da saklanıyor (pending tokens)
- ✅ JWT authentication tüm API calls'da
- ✅ Permission kontrolü badge update'lerde
- ✅ Error handling ile sensitive data exposure önleniyor

## 🐛 Known Issues & Limitations

1. **Token Change Listener**: Expo Notifications API'de token change listener yok, periyodik kontrol gerekebilir
2. **Android Badge**: Android'de native badge support yok, notification channels üzerinden gösteriliyor
3. **Deep Linking Delay**: Navigation ref hazır olana kadar bekleme mekanizması var (500ms retry)

## 📚 References

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [iOS User Notifications](https://developer.apple.com/documentation/usernotifications)

---

**Oluşturma Tarihi:** 30 Aralık 2025  
**Son Güncelleme:** 30 Aralık 2025  
**Versiyon:** 1.0.0

