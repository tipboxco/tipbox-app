# Backend Gereksinimleri - DM Thread Sistemi

Bu dokümantasyon, mobil tarafta yapılan işlemlerden **backend tarafından organize edilmesi gerekenleri** listeler.

---

## 🔴 Kritik: Backend'de Yapılması Gerekenler

### 1. **GET /messages Endpoint'ine `recipientUserId` Eklensin**

**Sorun:** 
- Mobil tarafta inbox listesinden MessageDetail'e giderken `recipientUserId` hesaplamak için thread mesajlarını çekmek zorunda kalıyoruz.
- Bu ekstra bir API call ve performans sorunu yaratıyor.

**Çözüm:**
```typescript
// Şu anki response (eksik):
interface InboxMessage {
  id: string; // thread ID
  senderName: string;
  senderTitle?: string;
  senderAvatar: string | null;
  lastMessage: string;
  timestamp: string;
  isUnread: boolean;
  unreadCount: number;
}

// Olması gereken response:
interface InboxMessage {
  id: string; // thread ID
  recipientUserId: string; // ✅ Karşı tarafın (diğer kullanıcının) ID'si
  senderName: string;
  senderTitle?: string;
  senderAvatar: string | null;
  lastMessage: string;
  timestamp: string;
  isUnread: boolean;
  unreadCount: number;
}
```

**Backend'de Yapılacak:**
- `GET /messages` endpoint'inde her inbox item için `recipientUserId` hesaplanmalı
- Thread'deki diğer kullanıcının ID'si direkt response'da dönmeli
- Mobil taraf bu bilgiyi kullanarak direkt MessageDetail'e navigate edebilmeli

---

### 2. **GET /messages/threads/:threadId Endpoint'i Eklensin**

**Sorun:**
- Mobil tarafta thread'den diğer kullanıcıyı bulmak için `getOrCreateThread` kullanıyoruz ama bu sadece thread oluşturur/getirir.
- Thread detay bilgisi (userOneId, userTwoId) için ayrı bir endpoint yok.

**Çözüm:**
```typescript
// Yeni endpoint:
GET /messages/threads/:threadId

// Response:
interface ThreadDetailResponse {
  id: string;
  userOneId: string;
  userTwoId: string;
  isActive: boolean;
  startedAt: string;
  isSupportThread: boolean; // ✅ Support thread mi, normal DM thread mi?
}
```

**Backend'de Yapılacak:**
- Thread detay bilgisini dönen endpoint eklenmeli
- `isSupportThread` field'ı eklenmeli (normal DM thread mi, support thread mi?)

---

### 3. **Context Filtreleme Backend'de Yapılmalı**

**Sorun:**
- Mobil tarafta thread mesajlarını normalize ederken context filtreleme yapılıyor ama bu backend'de yapılmalı.

**Çözüm:**
```typescript
// GET /messages/:threadId endpoint'inde:
// - Normal DM thread ise → sadece context: "DM" veya context: null mesajlar dönmeli
// - Support thread ise → sadece context: "SUPPORT" mesajlar dönmeli

// Şu anki durum: Tüm mesajlar dönüyor, mobil taraf filtreliyor
// Olması gereken: Backend thread tipine göre filtreleyip dönmeli
```

**Backend'de Yapılacak:**
- `GET /messages/:threadId` endpoint'inde thread tipine göre context filtreleme yapılmalı
- Normal DM thread → sadece DM context mesajlar
- Support thread → sadece SUPPORT context mesajlar

---

### 4. **Support Request'lerde `fromUserId` ve `toUserId` Her Zaman Dönmeli**

**Sorun:**
- Support request'lerde `fromUserId` ve `toUserId` bilgisi bazen gelmiyor.
- Bu bilgiler recipientUserId hesaplamak için kritik.

**Çözüm:**
```typescript
// GET /messages/:threadId response'unda support-request item'larında:
interface SupportRequest {
  // ... diğer alanlar
  fromUserId: string; // ✅ Her zaman dönmeli (opsiyonel değil)
  toUserId: string;   // ✅ Her zaman dönmeli (opsiyonel değil)
}
```

**Backend'de Yapılacak:**
- Support request response'larında `fromUserId` ve `toUserId` her zaman dönmeli
- Opsiyonel değil, required field olmalı

---

## 🟡 İyileştirme Önerileri

### 5. **Inbox Listesinde Thread Tipi Bilgisi**

**Öneri:**
```typescript
interface InboxMessage {
  // ... mevcut alanlar
  threadType?: 'DM' | 'SUPPORT'; // ✅ Thread tipi bilgisi (opsiyonel)
}
```

**Faydası:**
- Mobil taraf thread tipine göre farklı UI gösterebilir
- Support thread'ler için özel işlemler yapılabilir

---

### 6. **Thread Mesajlarında Sender Bilgisi Optimizasyonu**

**Öneri:**
- Her mesajda `sender` bilgisi tekrar tekrar dönüyor
- Backend'de sender bilgisi cache'lenebilir veya optimize edilebilir

---

## 📋 Özet: Backend'de Yapılması Gerekenler

| # | Özellik | Öncelik | Durum |
|---|---------|---------|-------|
| 1 | `GET /messages` → `recipientUserId` ekle | 🔴 Kritik | ❌ Eksik |
| 2 | `GET /messages/threads/:threadId` endpoint ekle | 🔴 Kritik | ❌ Eksik |
| 3 | Context filtreleme backend'de yap | 🔴 Kritik | ❌ Eksik |
| 4 | Support request'lerde `fromUserId`/`toUserId` her zaman dön | 🔴 Kritik | ⚠️ Kısmen |
| 5 | Inbox listesinde `threadType` ekle | 🟡 İyileştirme | ❌ Eksik |

---

## 🔧 Mobil Tarafta Geçici Çözümler

Şu an mobil tarafta yapılan işlemler (backend düzeltilene kadar):

1. **recipientUserId hesaplama:**
   - Thread mesajlarını çekip ilk mesajdan recipient bilgisi alınıyor
   - Fallback: MessageDetail ekranında thread'den alınıyor

2. **Thread'den diğer kullanıcı:**
   - `getOrCreateThread` kullanılıyor (thread oluşturur/getirir)
   - Thread response'undan userOneId/userTwoId alınıyor

3. **Context filtreleme:**
   - Mobil tarafta normalize ederken yapılıyor
   - Backend'de yapılmalı

---

## 📝 Notlar

- Backend düzeltmeleri yapıldıktan sonra mobil taraftaki geçici çözümler kaldırılabilir
- Performans iyileştirmesi için backend'de yapılması önerilir
- API response formatı değiştiğinde mobil taraf type'ları güncellenmeli


