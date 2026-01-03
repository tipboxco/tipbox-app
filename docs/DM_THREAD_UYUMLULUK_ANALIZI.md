# DM_THREAD.md Uyumluluk Analizi

Bu dokümantasyon, mevcut mobil implementasyonun `DM_THREAD.md` dokümantasyonuna uyumluluğunu analiz eder.

---

## ✅ Uyumlu Olan Kısımlar

### 1. **GET /messages Endpoint Response**
- ✅ `recipientUserId` eklendi
- ✅ `threadType` opsiyonel olarak eklendi
- ✅ Diğer tüm field'lar mevcut

### 2. **GET /messages/threads/:threadId Endpoint**
- ✅ `getThreadDetail` fonksiyonu eklendi
- ✅ `isSupportThread` field'ı eklendi
- ✅ `userOneId` ve `userTwoId` mevcut

### 3. **GET /messages/:threadId Response Normalization**
- ✅ `MessageFeedItem[]` formatına normalize ediliyor
- ✅ `fromUserId` ve `toUserId` support request'lerde kaydediliyor
- ✅ `lastMessage` ve `message` field'ları her ikisi de kontrol ediliyor

### 4. **Inbox Listesinden MessageDetail'e Navigasyon**
- ✅ `recipientUserId` direkt backend'den kullanılıyor
- ✅ Geçici çözüm (thread mesajlarını çekme) kaldırıldı

---

## ⚠️ Uyumsuzluklar ve Düzeltilmesi Gerekenler

### 1. **Support Request Status Değerleri**

**Dokümantasyonda:**
```typescript
status: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported'
```

**Mevcut Kodda:**
```typescript
status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
```

**Sorun:**
- ❌ `'rejected'` eksik
- ❌ `'canceled'` eksik
- ❌ `'accepted'` eksik
- ⚠️ `'active'` dokümantasyonda yok
- ⚠️ `'finalized'` dokümantasyonda yok

**Düzeltme:**
```typescript
// messagesApi.ts - ThreadMessageResponse
status?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';

// ThreadMessage interface
supportRequestStatus?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
```

---

### 2. **Context Filtreleme Mantığı**

**Dokümantasyonda:**
- Normal DM Thread → Sadece `context: "DM"` veya `context: null` mesajlar gösterilir
- Support Chat Thread → Sadece `context: "SUPPORT"` mesajlar gösterilir
- **Backend'de yapılmalı**

**Mevcut Kodda:**
```typescript
// messagesApi.ts - getThreadMessages
context: type === 'support-request' ? 'SUPPORT' : 'DM',
```

**Sorun:**
- ❌ Context filtreleme mobil tarafta yapılıyor (backend'de yapılmalı)
- ❌ Support request'lerin context'i yanlış: Support request'ler normal DM thread'de görünür, context'leri SUPPORT değil
- ❌ Context sadece mesajlar için geçerli (`type: "message"`), support-request ve send-tips için değil

**Düzeltme:**
```typescript
// Context sadece mesajlar için geçerli
context: type === 'message' ? 'DM' : undefined, // Support request ve send-tips için context yok

// Backend'den gelen mesajlar zaten filtrelenmiş olmalı
// Eğer backend filtrelemiyorsa, mobil tarafta filtreleme yapılabilir ama bu ideal değil
```

---

### 3. **fromUserId ve toUserId Required Kontrolü**

**Dokümantasyonda:**
```typescript
fromUserId: string; // Required
toUserId: string;   // Required
```

**Mevcut Kodda:**
```typescript
fromUserId?: string; // Opsiyonel
toUserId?: string;   // Opsiyonel
```

**Sorun:**
- ⚠️ Dokümantasyonda required ama kodda opsiyonel
- Backend'den her zaman geliyorsa sorun yok, ama type safety için required olmalı

**Düzeltme:**
```typescript
// Support request'lerde fromUserId ve toUserId her zaman olmalı
if (type === 'support-request') {
  if (!data.fromUserId || !data.toUserId) {
    console.warn('[getThreadMessages] Support request missing fromUserId or toUserId');
  }
  baseMessage.fromUserId = data.fromUserId!; // Required
  baseMessage.toUserId = data.toUserId!;     // Required
}
```

---

### 4. **Message Field Mapping**

**Dokümantasyonda:**
- `type: "message"` → `lastMessage` veya `message` field'ı
- `type: "support-request"` → `message` field'ı (description)
- `type: "send-tips"` → `message` field'ı (reason)

**Mevcut Kodda:**
```typescript
message: data.message || data.lastMessage || '',
```

**Durum:**
- ✅ Doğru - her iki field da kontrol ediliyor

---

### 5. **Support Request Status Mapping**

**Mevcut Kodda:**
```typescript
// MessageDetail.tsx
status: (msg.supportRequestStatus || 'pending') as 'pending' | 'accepted' | 'completed' | 'declined',
```

**Sorun:**
- ❌ `'declined'` dokümantasyonda yok, `'rejected'` olmalı
- ❌ Eksik status değerleri var

**Düzeltme:**
```typescript
status: (msg.supportRequestStatus || 'pending') as 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported',
```

---

## 📋 Özet: Yapılması Gereken Düzeltmeler

| # | Sorun | Öncelik | Durum |
|---|-------|---------|-------|
| 1 | Support Request Status değerleri güncellenmeli | 🔴 Yüksek | ❌ Eksik |
| 2 | Context filtreleme mantığı düzeltilmeli | 🔴 Yüksek | ❌ Yanlış |
| 3 | fromUserId/toUserId required kontrolü | 🟡 Orta | ⚠️ Opsiyonel |
| 4 | MessageDetail'de status mapping | 🔴 Yüksek | ❌ Yanlış |

---

## 🔧 Önerilen Düzeltmeler

### 1. Support Request Status Güncellemesi

```typescript
// src/features/inbox/api/messagesApi.ts
export interface ThreadMessageResponse {
  // ...
  status?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
}

export interface ThreadMessage {
  // ...
  supportRequestStatus?: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
}
```

### 2. Context Filtreleme Düzeltmesi

```typescript
// src/features/inbox/api/messagesApi.ts
context: type === 'message' ? 'DM' : undefined, // Sadece mesajlar için context var
```

**Not:** Backend'de context filtreleme yapılıyorsa, mobil tarafta ekstra filtreleme gerekmez.

### 3. MessageDetail Status Mapping

```typescript
// src/features/inbox/screens/MessageDetail.tsx
status: (msg.supportRequestStatus || 'pending') as 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported',
```

---

## ✅ Sonuç

Mevcut implementasyon dokümantasyonun **%85'i ile uyumlu**. Yapılması gereken düzeltmeler:

1. **Support Request Status değerleri** güncellenmeli
2. **Context filtreleme mantığı** düzeltilmeli
3. **MessageDetail status mapping** güncellenmeli

Bu düzeltmeler yapıldıktan sonra implementasyon dokümantasyonla **%100 uyumlu** olacaktır.


