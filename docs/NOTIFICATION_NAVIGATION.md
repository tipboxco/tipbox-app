# Notification Navigation Yapısı

Bu dokümantasyon, bildirimlere tıklandığında kullanıcının ilgili ekrana yönlendirilmesi için kullanılan navigation yapısını açıklar.

## 📋 Genel Bakış

Bildirimlere tıklandığında, kullanıcı ilgili ekrana yönlendirilir. Bu yönlendirme iki şekilde yapılabilir:

1. **Backend'den Navigation Field'ı Gelirse**: Backend'den gelen `navigation` field'ı direkt kullanılır.
2. **Backend'den Navigation Field'ı Gelmezse**: Notification type ve metadata'ya göre otomatik navigation oluşturulur.

## 🏗️ Mimari

### NotificationNavigationService

`src/services/NotificationNavigationService/index.ts` dosyasında tanımlı service, tüm notification navigation logic'ini yönetir.

**Temel Fonksiyonlar:**

- `getNavigationAction(notification)`: Notification'a göre navigation action oluşturur
- `navigate(notification)`: Notification'a tıklandığında navigate eder
- `mapScreenName(screenName)`: Backend'den gelen screen name'leri uygulama içindeki stack name'lerine map eder

### NotificationsScreen Entegrasyonu

`src/features/notifications/screens/NotificationsScreen.tsx` dosyasında `handleNotificationPress` fonksiyonu `NotificationNavigationService.navigate()` kullanarak navigation yapar.

## 📱 Notification Type'larına Göre Navigation Mapping

### Post İle İlgili Bildirimler

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `POST_LIKED` | FeedScreen (post highlight) | `postId` |
| `POST_COMMENTED` | FeedScreen (post highlight) | `postId` |
| `POST_SHARED` | FeedScreen (post highlight) | `postId` |
| `POST_FAVORITED` | FeedScreen (post highlight) | `postId` |

**Not:** PostDetailScreen'e navigate etmek için `postData` objesi gerekiyor. Bu yüzden backend'den `navigation` field'ı ile `postData` gönderilmeli. Eğer gelmezse, `postId` ile FeedScreen'e yönlendirilir.

### Comment İle İlgili Bildirimler

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `COMMENT_LIKED` | FeedScreen (post + comment highlight) | `postId`, `commentId` |
| `COMMENT_REPLIED` | FeedScreen (post + comment highlight) | `postId`, `commentId` |

### Mesaj Bildirimleri

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `NEW_MESSAGE` | MessageDetailScreen | `threadId`, `userId`, `userName`, `userAvatar` |
| `DM_REQUEST_RECEIVED` | MessageDetailScreen | `threadId`, `userId` |
| `DM_REQUEST_ACCEPTED` | MessageDetailScreen | `threadId`, `userId` |

**Navigation Format:**
```typescript
{
  screen: 'Inbox',
  params: {
    screen: 'MessageDetailScreen',
    params: {
      messageId: threadId,
      recipientUserId: userId,
      senderName: userName,
      senderTitle: '',
      senderAvatar: userAvatar,
    },
  },
}
```

### Trust Bildirimleri

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `NEW_TRUSTER` | ProfileMain | `userId` |
| `NEW_TRUSTED_BY` | ProfileMain | `userId` |

**Navigation Format:**
```typescript
{
  screen: 'Profile',
  params: {
    screen: 'ProfileMain',
    params: {
      userId: userId,
    },
  },
}
```

### Badge/Achievement Bildirimleri

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `NEW_BADGE` | ProfileMain | `userId` (opsiyonel - yoksa kendi profili) |
| `ACHIEVEMENT_UNLOCKED` | ProfileMain | `userId` (opsiyonel - yoksa kendi profili) |

### TIPS Bildirimleri

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `TIPS_RECEIVED` | WalletScreen | - |
| `TIPS_SENT` | WalletScreen | - |
| `REWARD_EARNED` | WalletScreen | - |

**Navigation Format:**
```typescript
{
  screen: 'Wallet',
  params: {
    screen: 'WalletScreen',
  },
}
```

### Expert Request Bildirimleri

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `EXPERT_REQUEST_AVAILABLE` | SupportMessageDetail | `threadId` veya `requestId`, `userId` |
| `EXPERT_REQUEST_ANSWERED` | SupportMessageDetail | `threadId` veya `requestId`, `userId` |

**Navigation Format:**
```typescript
{
  screen: 'Inbox',
  params: {
    screen: 'SupportMessageDetail',
    params: {
      requestId: requestId || threadId,
      recipientUserId: userId,
      expertName: expertName || userName,
      expertTitle: expertTitle || '',
      expertAvatar: expertAvatar || null,
    },
  },
}
```

### System Announcement

| Notification Type | Hedef Ekran | Gerekli Metadata |
|------------------|-------------|------------------|
| `SYSTEM_ANNOUNCEMENT` | FeedScreen | - |

## 🔧 Backend Entegrasyonu

### Backend'den Navigation Field'ı Gönderme

Backend'den notification response'unda `navigation` field'ı gönderilebilir:

```json
{
  "id": "notification-id",
  "type": "POST_LIKED",
  "title": "Post Beğenildi",
  "message": "Kullanıcı postunuzu beğendi",
  "data": {
    "postId": "post-id",
    "userId": "user-id",
    "navigation": {
      "screen": "Post",
      "params": {
        "screen": "PostDetailScreen",
        "params": {
          "postData": {
            "id": "post-id",
            "type": "post",
            // ... post data
          },
          "type": "post"
        }
      }
    }
  }
}
```

### Navigation Field Formatı

```typescript
interface NotificationNavigation {
  screen: string; // Stack name (örn: 'Post', 'Inbox', 'Profile')
  params?: {
    screen?: string; // Nested screen name (örn: 'PostDetailScreen')
    params?: Record<string, any>; // Screen params
  } | Record<string, any>; // Direct params (nested screen yoksa)
}
```

## 📝 Kullanım Örnekleri

### NotificationsScreen'de Kullanım

```typescript
import { NotificationNavigationService } from '@/src/services/NotificationNavigationService';

const handleNotificationPress = useCallback((notification: Notification) => {
  const success = NotificationNavigationService.navigate(notification);
  
  if (!success) {
    console.warn('Navigation failed for notification:', notification.id);
  }
}, []);
```

### Manuel Navigation Action Oluşturma

```typescript
import { NotificationNavigationService } from '@/src/services/NotificationNavigationService';

const navigationAction = NotificationNavigationService.getNavigationAction(notification);

if (navigationAction) {
  // Custom navigation logic
  navigation.navigate(navigationAction.screen, navigationAction.params);
}
```

## ⚠️ Önemli Notlar

1. **PostDetailScreen**: PostDetailScreen'e navigate etmek için `postData` objesi gerekiyor. Sadece `postId` yeterli değil. Bu yüzden backend'den `navigation` field'ı ile `postData` gönderilmeli.

2. **Nested Navigation**: React Navigation'da nested navigation için `{ screen: 'StackName', params: { screen: 'ScreenName', params: {...} } }` formatı kullanılır.

3. **Navigation Ref**: `NotificationNavigationService` `navigationRef` kullanır. Bu ref `NotificationProvider` içinde tanımlıdır ve `NavigationContainer`'a bağlıdır.

4. **Fallback**: Eğer navigation başarısız olursa veya navigation action bulunamazsa, kullanıcı FeedScreen'e yönlendirilir (default).

## 🔄 Gelecek İyileştirmeler

1. **Post Fetching**: PostDetailScreen için `postId` varsa, post'u fetch edip navigate etme özelliği eklenebilir.

2. **Deep Linking**: Notification navigation'ı deep linking ile entegre edilebilir.

3. **Analytics**: Navigation başarı/başarısızlık durumları analytics'e gönderilebilir.

4. **Error Handling**: Navigation hatalarında kullanıcıya bilgi gösterilebilir.







