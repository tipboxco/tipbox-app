# 📱 Notification Response Formatları - Mobil Entegrasyon Rehberi

## 📋 Genel Response Yapısı

Tüm bildirimler aşağıdaki temel yapıya sahiptir:

```typescript
interface Notification {
  id: string;                    // Bildirim ID'si
  userId: string;                 // Etkileşim yapan kullanıcı ID'si (avatar ile eşleşir)
  type: NotificationType;         // Bildirim tipi
  avatar: string | null;          // Kullanıcı avatar URL'i
  data: NotificationData;         // Tip'e özel data
  read: boolean;                  // Okundu mu?
  createdAt: string;              // ISO 8601 tarih
}
```

**ÖNEMLİ:** `message` field'ı yoktur. Tüm bilgiler `data` objesi içinde ve `type`'a göre değişir.

---

## 📬 Bildirim Tipleri ve Response Formatları

### 1️⃣ POST ETKİLEŞİMLERİ

#### `POST_LIKED` - Post Beğenildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Beğenen kullanıcı ID'si
  "type": "POST_LIKED",
  "avatar": "https://...",        // Beğenen kullanıcının avatar'ı
  "data": {
    "postId": "uuid",            // Post ID'si (navigation için)
    "imageUrl": "https://...",    // Post görseli
    "username": "kullanici_adi"  // Beğenen kullanıcının username'i
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} beğendi` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId)`
- Avatar: `avatar` field'ından göster

---

#### `POST_COMMENTED` - Post'a Yorum Yapıldı
```json
{
  "id": "uuid",
  "userId": "uuid",              // Yorum yapan kullanıcı ID'si
  "type": "POST_COMMENTED",
  "avatar": "https://...",
  "data": {
    "postId": "uuid",
    "imageUrl": "https://...",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} yorum yaptı` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId)`

---

#### `POST_SHARED` - Post Paylaşıldı
```json
{
  "id": "uuid",
  "userId": "uuid",              // Paylaşan kullanıcı ID'si
  "type": "POST_SHARED",
  "avatar": "https://...",
  "data": {
    "postId": "uuid",
    "imageUrl": "https://...",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} paylaştı` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId)`

---

#### `POST_FAVORITED` - Post Favorilere Eklendi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Favorilere ekleyen kullanıcı ID'si
  "type": "POST_FAVORITED",
  "avatar": "https://...",
  "data": {
    "postId": "uuid",
    "imageUrl": "https://...",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} favorilere ekledi` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId)`

---

### 2️⃣ YORUM ETKİLEŞİMLERİ

#### `COMMENT_LIKED` - Yorum Beğenildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Beğenen kullanıcı ID'si
  "type": "COMMENT_LIKED",
  "avatar": "https://...",
  "data": {
    "postId": "uuid",            // Post ID'si (navigation için)
    "commentId": "uuid",         // Yorum ID'si
    "imageUrl": "https://...",    // Post görseli
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} yorumunu beğendi` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId, commentId: data.commentId)`

---

#### `COMMENT_REPLIED` - Yorum'a Cevap Verildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Cevap veren kullanıcı ID'si
  "type": "COMMENT_REPLIED",
  "avatar": "https://...",
  "data": {
    "postId": "uuid",
    "commentId": "uuid",
    "imageUrl": "https://...",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} cevap verdi` + post görseli
- Navigation: `PostDetailScreen(postId: data.postId, commentId: data.commentId)`

---

### 3️⃣ TRUST/FOLLOW BİLDİRİMLERİ

#### `NEW_TRUSTER` - Yeni Takipçi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Takipçi kullanıcı ID'si
  "type": "NEW_TRUSTER",
  "avatar": "https://...",        // Takipçinin avatar'ı
  "data": {
    "username": "kullanici_adi"  // Takipçinin username'i
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} seni takip etmeye başladı` + avatar
- Navigation: `UserProfileScreen(userId: userId)`

---

#### `NEW_TRUSTED_BY` - Takip Edilen
```json
{
  "id": "uuid",
  "userId": "uuid",              // Takip edilen kullanıcı ID'si
  "type": "NEW_TRUSTED_BY",
  "avatar": "https://...",
  "data": {
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} seni takip ediyor` + avatar
- Navigation: `UserProfileScreen(userId: userId)`

---

### 4️⃣ MESAJLAŞMA BİLDİRİMLERİ

#### `DM_REQUEST_RECEIVED` - DM İsteği Alındı
```json
{
  "id": "uuid",
  "userId": "uuid",              // İstek gönderen kullanıcı ID'si
  "type": "DM_REQUEST_RECEIVED",
  "avatar": "https://...",
  "data": {
    "threadId": "uuid",          // Thread ID'si (navigation için)
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} mesaj isteği gönderdi` + avatar
- Navigation: `InboxScreen()` veya `ChatScreen(threadId: data.threadId)`

---

#### `DM_REQUEST_ACCEPTED` - DM İsteği Kabul Edildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // İsteği kabul eden kullanıcı ID'si
  "type": "DM_REQUEST_ACCEPTED",
  "avatar": "https://...",
  "data": {
    "threadId": "uuid",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} mesaj isteğini kabul etti` + avatar
- Navigation: `ChatScreen(threadId: data.threadId)`

---

#### `DM_REQUEST_DECLINED` - DM İsteği Reddedildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // İsteği reddeden kullanıcı ID'si
  "type": "DM_REQUEST_DECLINED",
  "avatar": "https://...",
  "data": {
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} mesaj isteğini reddetti` + avatar
- Navigation: `UserProfileScreen(userId: userId)` (opsiyonel)

---

#### `SUPPORT_REQUEST_ACCEPTED` - Destek İsteği Kabul Edildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // İsteği kabul eden expert ID'si
  "type": "SUPPORT_REQUEST_ACCEPTED",
  "avatar": "https://...",
  "data": {
    "threadId": "uuid",
    "requestId": "uuid",
    "expertName": "Expert Adı",
    "expertTitle": "Expert Unvanı",
    "expertAvatar": "https://...",
    "username": "kullanici_adi"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{expertName} destek isteğini kabul etti` + expert avatar
- Navigation: `SupportChatScreen(threadId: data.threadId, requestId: data.requestId)`

---

### 5️⃣ TIPS BİLDİRİMLERİ

#### `TIPS_RECEIVED` - Tips Alındı
```json
{
  "id": "uuid",
  "userId": "uuid",              // Gönderen kullanıcı ID'si
  "type": "TIPS_RECEIVED",
  "avatar": "https://...",        // Gönderen kullanıcının avatar'ı
  "data": {
    "amount": 100,                // Tips miktarı
    "username": "kullanici_adi"   // Gönderen kullanıcının username'i
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} {amount} TIPS gönderdi` + avatar
- Navigation: `UserProfileScreen(userId: userId)` veya `WalletScreen()`

---

#### `TIPS_SENT` - Tips Gönderildi
```json
{
  "id": "uuid",
  "userId": "uuid",              // Alıcı kullanıcı ID'si
  "type": "TIPS_SENT",
  "avatar": "https://...",        // Alıcı kullanıcının avatar'ı
  "data": {
    "amount": 100,
    "username": "kullanici_adi"   // Alıcı kullanıcının username'i
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{username} kullanıcısına {amount} TIPS gönderildi` + avatar
- Navigation: `UserProfileScreen(userId: userId)` veya `WalletScreen()`

---

### 6️⃣ GAMIFICATION BİLDİRİMLERİ

#### `NEW_BADGE` - Yeni Rozet Kazanıldı
```json
{
  "id": "uuid",
  "userId": "uuid",              // Rozet kazanan kullanıcı (bildirim alan)
  "type": "NEW_BADGE",
  "avatar": null,                 // Gamification bildirimlerinde avatar yok
  "data": {
    "badgeId": "uuid",            // Rozet ID'si
    "imageUrl": "https://..."     // Rozet görseli
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Yeni rozet kazandın!` + rozet görseli
- Navigation: `BadgeDetailScreen(badgeId: data.badgeId)` veya `ProfileScreen()`

---

#### `ACHIEVEMENT_UNLOCKED` - Başarı Açıldı
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "ACHIEVEMENT_UNLOCKED",
  "avatar": null,
  "data": {
    "badgeId": "uuid",
    "imageUrl": "https://..."
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Başarı açıldı!` + rozet görseli
- Navigation: `BadgeDetailScreen(badgeId: data.badgeId)`

---

#### `REWARD_EARNED` - Ödül Kazanıldı
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "REWARD_EARNED",
  "avatar": null,
  "data": {
    "amount": 50                  // TIPS miktarı
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{amount} TIPS ödülü kazandın!`
- Navigation: `WalletScreen()`

---

### 7️⃣ EXPERT BİLDİRİMLERİ

#### `EXPERT_REQUEST_AVAILABLE` - Yeni Expert Sorusu
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EXPERT_REQUEST_AVAILABLE",
  "avatar": null,                 // Expert bildirimlerinde avatar yok
  "data": {
    "requestId": "uuid",
    "expertName": "Kullanıcı Adı",
    "expertTitle": "Unvan",
    "expertAvatar": "https://..."
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Yeni expert sorusu mevcut` + expert bilgileri
- Navigation: `ExpertRequestDetailScreen(requestId: data.requestId)`

---

#### `EXPERT_REQUEST_ANSWERED` - Expert Sorusu Cevaplandı
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EXPERT_REQUEST_ANSWERED",
  "avatar": null,
  "data": {
    "requestId": "uuid",
    "threadId": "uuid" | null,
    "expertName": "Expert Adı",
    "expertTitle": "Expert Unvanı",
    "expertAvatar": "https://..."
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `{expertName} sorunu cevapladı` + expert avatar
- Navigation: `ExpertRequestDetailScreen(requestId: data.requestId)`

---

### 8️⃣ EVENT BİLDİRİMLERİ

#### `EVENT_STARTED` - Etkinlik Başladı
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EVENT_STARTED",
  "avatar": null,                 // Event bildirimlerinde avatar yok
  "data": {
    "eventId": "uuid",
    "imageUrl": "https://..."     // Event görseli
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Etkinlik başladı!` + event görseli
- Navigation: `EventDetailScreen(eventId: data.eventId)`

---

#### `EVENT_ENDING_SOON` - Etkinlik Yakında Bitiyor
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EVENT_ENDING_SOON",
  "avatar": null,
  "data": {
    "eventId": "uuid",
    "imageUrl": "https://..."
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Etkinlik yakında bitiyor!` + event görseli
- Navigation: `EventDetailScreen(eventId: data.eventId)`

---

#### `EVENT_REWARD_AVAILABLE` - Etkinlik Ödülü Mevcut
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "EVENT_REWARD_AVAILABLE",
  "avatar": null,
  "data": {
    "eventId": "uuid",
    "imageUrl": "https://..."
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Etkinlik ödülü mevcut!` + event görseli
- Navigation: `EventDetailScreen(eventId: data.eventId)`

---

### 9️⃣ COLLECTION BİLDİRİMLERİ

#### `COLLECTION_POST_ADDED` - Post Koleksiyona Eklendi
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "COLLECTION_POST_ADDED",
  "avatar": null,                 // Collection bildirimlerinde avatar yok
  "data": {
    "collectionId": "uuid"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Post koleksiyona eklendi`
- Navigation: `CollectionDetailScreen(collectionId: data.collectionId)`

---

#### `COLLECTION_SHARED` - Koleksiyon Paylaşıldı
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "COLLECTION_SHARED",
  "avatar": null,
  "data": {
    "collectionId": "uuid"
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: `Koleksiyon paylaşıldı`
- Navigation: `CollectionDetailScreen(collectionId: data.collectionId)`

---

### 🔟 SYSTEM BİLDİRİMLERİ

#### `SYSTEM_ANNOUNCEMENT` - Sistem Duyurusu
```json
{
  "id": "uuid",
  "userId": "uuid",              // Duyuruyu gönderen (opsiyonel)
  "type": "SYSTEM_ANNOUNCEMENT",
  "avatar": "https://..." | null,
  "data": {
    "amount": 0                   // Opsiyonel
  },
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
**Mobil Entegrasyon:**
- UI: Sistem duyurusu mesajı
- Navigation: `AnnouncementScreen()` veya `HomeScreen()`

---

## 🎯 Mobil Entegrasyon Örnekleri

### TypeScript/React Native Örnek

```typescript
interface Notification {
  id: string;
  userId: string;
  type: string;
  avatar: string | null;
  data: any;
  read: boolean;
  createdAt: string;
}

// Notification item component
const NotificationItem = ({ notification }: { notification: Notification }) => {
  const handlePress = () => {
    switch (notification.type) {
      case 'POST_LIKED':
      case 'POST_COMMENTED':
      case 'POST_SHARED':
      case 'POST_FAVORITED':
        navigation.navigate('PostDetail', { postId: notification.data.postId });
        break;
      
      case 'COMMENT_LIKED':
      case 'COMMENT_REPLIED':
        navigation.navigate('PostDetail', {
          postId: notification.data.postId,
          commentId: notification.data.commentId,
        });
        break;
      
      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
      case 'TIPS_RECEIVED':
      case 'TIPS_SENT':
        navigation.navigate('UserProfile', { userId: notification.userId });
        break;
      
      case 'DM_REQUEST_ACCEPTED':
      case 'DM_REQUEST_RECEIVED':
        navigation.navigate('Chat', { threadId: notification.data.threadId });
        break;
      
      case 'SUPPORT_REQUEST_ACCEPTED':
        navigation.navigate('SupportChat', {
          threadId: notification.data.threadId,
          requestId: notification.data.requestId,
        });
        break;
      
      case 'NEW_BADGE':
      case 'ACHIEVEMENT_UNLOCKED':
        navigation.navigate('BadgeDetail', { badgeId: notification.data.badgeId });
        break;
      
      case 'EVENT_STARTED':
      case 'EVENT_ENDING_SOON':
      case 'EVENT_REWARD_AVAILABLE':
        navigation.navigate('EventDetail', { eventId: notification.data.eventId });
        break;
      
      case 'COLLECTION_POST_ADDED':
      case 'COLLECTION_SHARED':
        navigation.navigate('CollectionDetail', {
          collectionId: notification.data.collectionId,
        });
        break;
      
      default:
        break;
    }
  };

  const getTitle = () => {
    const username = notification.data.username || 'Kullanıcı';
    
    switch (notification.type) {
      case 'POST_LIKED':
        return `${username} beğendi`;
      case 'POST_COMMENTED':
        return `${username} yorum yaptı`;
      case 'TIPS_RECEIVED':
        return `${username} ${notification.data.amount} TIPS gönderdi`;
      case 'NEW_TRUSTER':
        return `${username} seni takip etmeye başladı`;
      // ... diğer tipler
      default:
        return 'Yeni bildirim';
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Image source={{ uri: notification.avatar }} />
      <Text>{getTitle()}</Text>
      {notification.data.imageUrl && (
        <Image source={{ uri: notification.data.imageUrl }} />
      )}
    </TouchableOpacity>
  );
};
```

---

## 📝 Önemli Notlar

1. **Message Field Yok:** `message` field'ı response'da yok. Tüm bilgiler `data` objesi içinde.

2. **Avatar Field:**
   - User etkileşimlerinde: `avatar` field'ı var (kullanıcı avatar'ı)
   - Gamification/Event/Expert bildirimlerinde: `avatar` = `null`

3. **ImageUrl:**
   - Post bildirimlerinde: `data.imageUrl` (post görseli)
   - Badge bildirimlerinde: `data.imageUrl` (badge görseli)
   - Event bildirimlerinde: `data.imageUrl` (event görseli)
   - Mesajlaşma bildirimlerinde: `imageUrl` yok

4. **Username:**
   - Tüm user etkileşim bildirimlerinde: `data.username` mevcut
   - Gamification/Event/Expert bildirimlerinde: `username` yok

5. **Navigation:**
   - Her bildirim tipi için `data` objesi içinde navigation için gerekli ID'ler var
   - `userId` root seviyede her zaman mevcut (avatar ile eşleşir)

---

## 🔄 API Endpoint

```
GET /notifications
Query Params:
  - limit: number (default: 20)
  - offset: number (default: 0)
  - unreadOnly: boolean (default: false)
  - type: string (all, tips, truster, replies, veya NotificationType)
  - search: string

Response:
{
  "success": true,
  "data": Notification[],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

---

## ✅ Checklist - Mobil Entegrasyon

- [ ] Notification listesi component'i oluştur
- [ ] Her bildirim tipi için UI render et
- [ ] Avatar gösterimi (null kontrolü yap)
- [ ] ImageUrl gösterimi (varsa)
- [ ] Username gösterimi (varsa)
- [ ] Navigation implementasyonu
- [ ] Read/Unread durumu gösterimi
- [ ] Pull to refresh
- [ ] Pagination (infinite scroll)
- [ ] Mark as read endpoint'i çağır
- [ ] Socket ile real-time güncelleme
