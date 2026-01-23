# Bildirim API Optimize Format Dokümantasyonu

Bu dokümantasyon, bildirim API'sinin optimize edilmiş response formatını açıklar. Bu format WhatsApp ve Instagram gibi modern uygulamalarda kullanılan yapıya benzer şekilde tasarlanmıştır.

## Optimize Format Avantajları

1. **Daha Az Veri Transferi**: Kullanıcı bilgileri tekrar edilmez, `participants` objesinde bir kez gönderilir
2. **Tarih Grupları**: Bildirimler tarihe göre otomatik gruplandırılır (Today, Yesterday, This Week, etc.)
3. **Aktivite Grupları**: Aynı post'a yapılan beğeniler/yorumlar otomatik gruplandırılır
4. **Daha Hızlı Rendering**: Frontend'de daha az işlem yapılır, backend'de optimize edilmiş veri gelir

## Response Format

### Optimize Format (Önerilen)

```json
{
  "success": true,
  "participants": {
    "7413549b-126e-4b41-a06b-c22600a85f67": {
      "id": "7413549b-126e-4b41-a06b-c22600a85f67",
      "username": "Tunab",
      "avatar": "http://192.168.1.178:9000/tipbox-media/profile-pictures/7413549b-126e-4b41-a06b-c22600a85f67/d0c09ded-0671-4b33-a561-3cb67e9d3f90.jpg",
      "title": null
    },
    "22222222-2222-4222-a222-222222222222": {
      "id": "22222222-2222-4222-a222-222222222222",
      "username": "trustuser2",
      "avatar": "http://192.168.1.178:9000/tipbox-media/profile-pictures/22222222-2222-4222-a222-222222222222/seed-avatar.jpg",
      "title": "Product Coach"
    }
  },
  "dateGroups": [
    {
      "date": {
        "timestamp": "2026-01-23T00:00:00.000Z",
        "displayText": "Today",
        "dayKey": "2026-01-23"
      },
      "activityGroups": [
        {
          "groupId": "post-liked-01KFDRHPHRQ3R63WE94CVAGF3N",
          "type": "POST_LIKED",
          "targetId": "01KFDRHPHRQ3R63WE94CVAGF3N",
          "createdAt": "2026-01-23T16:43:45.119Z",
          "read": true,
          "primaryUser": {
            "id": "22222222-2222-4222-a222-222222222222",
            "username": "trustuser2",
            "avatar": "http://192.168.1.178:9000/tipbox-media/profile-pictures/22222222-2222-4222-a222-222222222222/seed-avatar.jpg"
          },
          "otherUsers": [
            {
              "id": "99999999-9999-4999-9999-999999999999",
              "username": "juliahavk",
              "avatar": "http://192.168.1.178:9000/tipbox-media/profile-pictures/99999999-9999-4999-9999-999999999999/avatar.jpg"
            }
          ],
          "count": 2,
          "notifications": []
        }
      ],
      "ungroupedNotifications": [
        {
          "id": "8639ab43-dc67-4396-9846-4311a5181271",
          "type": "DM_REQUEST_RECEIVED",
          "userId": "7413549b-126e-4b41-a06b-c22600a85f67",
          "createdAt": "2026-01-23T17:37:10.042Z",
          "read": true,
          "content": {
            "threadId": "47541722-75d6-4f64-ab49-9342ba0b8bd4",
            "username": "Tunab"
          }
        },
        {
          "id": "3c4422c1-c209-4294-a39c-ffb6a0da3063",
          "type": "TIPS_SENT",
          "userId": "7413549b-126e-4b41-a06b-c22600a85f67",
          "createdAt": "2026-01-23T17:24:24.527Z",
          "read": true,
          "content": {
            "amount": 1,
            "reason": "Bbb",
            "recipientName": "Tuna",
            "transactionId": "c89b3920-b6bc-48e4-bad4-74f7767522dc",
            "recipientUserId": "7413549b-126e-4b41-a06b-c22600a85f67",
            "username": "Tunab"
          }
        }
      ]
    },
    {
      "date": {
        "timestamp": "2026-01-20T00:00:00.000Z",
        "displayText": "January 20, 2026",
        "dayKey": "2026-01-20"
      },
      "activityGroups": [],
      "ungroupedNotifications": [
        {
          "id": "4f0f6e9c-ae1c-4c4a-b220-bc7c04fe73e1",
          "type": "EVENT_STARTED",
          "createdAt": "2026-01-20T21:21:33.339Z",
          "read": true,
          "content": {
            "eventId": "01KFEMHGHK71R9WNGKQD7V6KJW",
            "imageUrl": "http://192.168.1.178:9000/events/event.png"
          }
        }
      ]
    }
  ],
  "pagination": {
    "hasMore": false,
    "limit": 20,
    "offset": 0,
    "totalCount": 15,
    "nextCursor": null
  }
}
```

## Gruplandırma Kuralları

### Aktivite Grupları (Activity Groups)

Aşağıdaki bildirim tipleri aynı `targetId` (postId, commentId, eventId, etc.) için gruplandırılabilir:

- `POST_LIKED`: Aynı post'a yapılan beğeniler
- `POST_COMMENTED`: Aynı post'a yapılan yorumlar (farklı kullanıcılar)
- `COMMENT_LIKED`: Aynı yoruma yapılan beğeniler
- `POST_FAVORITED`: Aynı post'a yapılan favoriler

**Gruplandırma Kriterleri:**
- Aynı `type` olmalı
- Aynı `targetId` olmalı (postId, commentId, etc.)
- 24 saat içinde oluşturulmuş olmalı
- En az 2 farklı kullanıcı olmalı

### Tarih Grupları (Date Groups)

Bildirimler otomatik olarak şu tarih gruplarına ayrılır:

- **Today**: Bugün oluşturulan bildirimler
- **Yesterday**: Dün oluşturulan bildirimler
- **This Week**: Bu hafta oluşturulan bildirimler (bugün ve dün hariç)
- **This Month**: Bu ay oluşturulan bildirimler (bu hafta hariç)
- **Older**: Daha eski bildirimler (ay ve yıl formatında: "January 2026")

## Backward Compatibility

Frontend hem optimize format'ı hem de eski format'ı destekler:

- **Optimize Format**: `dateGroups` ve `participants` varsa optimize format kullanılır
- **Eski Format**: `data` array'i varsa eski format kullanılır (backward compatibility)

## Migration Guide

Backend'den optimize format göndermek için:

1. Bildirimleri tarihe göre grupla (`dateGroups`)
2. Aynı post/comment'a yapılan beğenileri/yorumları grupla (`activityGroups`)
3. Kullanıcı bilgilerini `participants` objesinde topla
4. Bildirimlerde sadece `userId` gönder, user bilgileri `participants`'tan alınsın

## Örnek Backend Implementation

```typescript
// Backend'de optimize format oluşturma örneği
const createOptimizedResponse = (notifications: Notification[]) => {
  // 1. Participants'ı topla
  const participants = {};
  notifications.forEach(notif => {
    if (notif.userId && !participants[notif.userId]) {
      participants[notif.userId] = {
        id: notif.userId,
        username: notif.username,
        avatar: notif.avatar,
        title: notif.title,
      };
    }
  });
  
  // 2. Tarihe göre grupla
  const dateGroups = groupByDate(notifications);
  
  // 3. Aktivite grupları oluştur
  dateGroups.forEach(dateGroup => {
    dateGroup.activityGroups = groupByActivity(dateGroup.notifications);
    dateGroup.ungroupedNotifications = dateGroup.notifications.filter(
      n => !isGroupable(n)
    );
  });
  
  return {
    success: true,
    participants,
    dateGroups,
    pagination: { ... }
  };
};
```
