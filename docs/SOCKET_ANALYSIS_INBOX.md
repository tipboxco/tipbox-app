# Inbox Ekranları Socket Yapıları Analizi

## 📋 Genel Bakış

Bu dokümantasyon, `InboxScreen`, `MessagesScreen` ve `SupportRequestsScreen` ekranlarındaki socket yapılarını ve mesaj listesi için gerekli socket etkileşimlerini analiz eder.

---

## 🔌 Socket Bağlantı Yönetimi

### SocketProvider (`src/providers/SocketProvider.tsx`)

**Bağlantı Koşulları:**
- ✅ Auth hazır olmalı (`isAuthReady`)
- ✅ Kullanıcı authenticated olmalı (`isAuthenticated`)
- ✅ AppState foreground olmalı (`isForeground`)
- ✅ Background'a geçince otomatik disconnect
- ✅ Foreground'a dönünce otomatik reconnect

**Bağlantı Durumu:**
- `isConnected`: Socket bağlı mı?
- `isConnecting`: Bağlanma süreci devam ediyor mu?

---

## 📨 MessagesScreen Socket Yapıları

### Dinlenen Socket Event'leri

#### 1. `new_message` Event
**Handler:** `handleNewMessage` (satır 58-120)

**İşlev:**
- ✅ Yeni mesaj geldiğinde thread listesini günceller
- ✅ Alınan mesajlar için thread'i okunmamış olarak işaretler
- ✅ Gönderilen mesajlar için sadece `lastMessage` ve `timestamp` günceller
- ✅ Thread'i en üste taşır (yeni mesaj geldiği için)
- ✅ Optimistic update yapar (hemen UI'da gösterir)
- ✅ Cache'i invalidate eder (backend'den güncel veri gelsin)

**Kontrol:**
```typescript
// ✅ Çalışıyor - Optimistic update + cache invalidation
queryClient.setQueryData(inboxKeys.messages(), (oldData) => {
  // Thread bulunursa güncelle ve en üste taşı
  // Alınan mesaj: isUnread: true, unreadCount++
  // Gönderilen mesaj: sadece lastMessage ve timestamp güncelle
});
```

#### 2. `thread_read` Event
**Handler:** `handleThreadRead` (satır 123-139)

**İşlev:**
- ✅ Thread okundu olarak işaretlendiğinde listeyi günceller
- ✅ `isUnread: false` ve `unreadCount: 0` yapar
- ✅ Optimistic update yapar
- ✅ Cache'i invalidate eder

**Kontrol:**
```typescript
// ✅ Çalışıyor - Thread okundu işaretleme
queryClient.setQueryData(inboxKeys.messages(), (oldData) => {
  return oldData.map((msg) => 
    msg.id === eventData.threadId 
      ? { ...msg, isUnread: false, unreadCount: 0 }
      : msg
  );
});
```

#### 3. `user_typing` Event
**Handler:** `handleUserTyping` (satır 142-198)

**İşlev:**
- ✅ Karşı kullanıcının typing durumunu gösterir
- ✅ Kendi typing durumunu göstermez (kendi userId kontrolü)
- ✅ 3 saniye timeout ile otomatik typing'i durdurur
- ✅ Typing state'i `typingUsers` state'inde tutulur
- ✅ MessageCard'a `isTyping` ve `typingUserName` prop'ları geçilir

**Kontrol:**
```typescript
// ✅ Çalışıyor - Typing indicator gösterimi
const typingInfo = typingUsers[item.id];
const isTyping = !!typingInfo;
const typingUserName = typingInfo?.userName;

<MessageCard
  isTyping={isTyping}
  typingUserName={typingUserName}
/>
```

### Gönderilen Socket Event'leri

#### 1. `mark_thread_read` (Socket ile)
**Kullanım:** `markThreadRead(threadId)` (satır 265)

**İşlev:**
- ✅ Thread'i okundu olarak işaretler
- ✅ Socket bağlıysa socket ile, değilse API ile gönderir
- ✅ Fallback: API mutation (`markThreadAsReadMutation`)

**Kontrol:**
```typescript
// ✅ Çalışıyor - Socket bağlıysa socket ile, değilse API ile
if (isConnected) {
  markThreadRead(threadId);
} else {
  markThreadAsReadMutation.mutate(threadId);
}
```

---

## 🆘 SupportRequestsScreen Socket Yapıları

### Dinlenen Socket Event'leri

#### 1. `support_request_accepted` Event
**Handler:** `handleSupportRequestAccepted` (satır 59-64)

**İşlev:**
- ✅ Support request kabul edildiğinde listeyi günceller
- ✅ `inboxKeys.supportRequests()` ve `inboxKeys.messages()` cache'lerini invalidate eder

**Kontrol:**
```typescript
// ✅ Çalışıyor - Support request kabul edildiğinde listeyi güncelle
queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
```

#### 2. `support_request_rejected` Event
**Handler:** `handleSupportRequestRejected` (satır 66-71)

**İşlev:**
- ✅ Support request reddedildiğinde listeyi günceller
- ✅ Cache'leri invalidate eder

**Kontrol:**
```typescript
// ✅ Çalışıyor - Support request reddedildiğinde listeyi güncelle
queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
```

#### 3. `support_request_cancelled` Event
**Handler:** `handleSupportRequestCancelled` (satır 73-78)

**İşlev:**
- ✅ Support request iptal edildiğinde listeyi günceller
- ✅ Cache'leri invalidate eder

**Kontrol:**
```typescript
// ✅ Çalışıyor - Support request iptal edildiğinde listeyi güncelle
queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
```

#### 4. `new_message` Event (Support Request için)
**Handler:** `handleNewMessage` (satır 80-86)

**İşlev:**
- ✅ Support request mesajı geldiğinde listeyi günceller
- ✅ Sadece `messageType === 'support-request'` olan mesajları işler

**Kontrol:**
```typescript
// ✅ Çalışıyor - Support request mesajı geldiğinde listeyi güncelle
if (eventData.messageType === 'support-request') {
  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
}
```

---

## ✅ Mesaj Listesi için Gerekli Socket Etkileşimleri

### 1. Yeni Mesaj Geldiğinde Liste Güncelleme
**Durum:** ✅ **ÇALIŞIYOR**

**Implementasyon:**
- `MessagesScreen`: `handleNewMessage` handler'ı var
- Optimistic update yapılıyor (hemen UI'da gösteriliyor)
- Thread en üste taşınıyor
- Alınan mesajlar için `isUnread: true` ve `unreadCount++` yapılıyor
- Cache invalidate ediliyor

**Kontrol Noktaları:**
- ✅ Event listener doğru ekleniyor (`on('new_message', handleNewMessage)`)
- ✅ Cleanup doğru yapılıyor (`off('new_message', handleNewMessage)`)
- ✅ Optimistic update çalışıyor
- ✅ Thread en üste taşınıyor

### 2. Thread Okundu Olarak İşaretlendiğinde Liste Güncelleme
**Durum:** ✅ **ÇALIŞIYOR**

**Implementasyon:**
- `MessagesScreen`: `handleThreadRead` handler'ı var
- Optimistic update yapılıyor (`isUnread: false`, `unreadCount: 0`)
- Cache invalidate ediliyor

**Kontrol Noktaları:**
- ✅ Event listener doğru ekleniyor (`on('thread_read', handleThreadRead)`)
- ✅ Cleanup doğru yapılıyor
- ✅ Optimistic update çalışıyor

### 3. Typing Indicator Gösterimi
**Durum:** ✅ **ÇALIŞIYOR**

**Implementasyon:**
- `MessagesScreen`: `handleUserTyping` handler'ı var
- Typing state `typingUsers` state'inde tutuluyor
- 3 saniye timeout ile otomatik typing durduruluyor
- `MessageCard`'a `isTyping` ve `typingUserName` prop'ları geçiliyor

**Kontrol Noktaları:**
- ✅ Event listener doğru ekleniyor (`on('user_typing', handleUserTyping)`)
- ✅ Cleanup doğru yapılıyor (timeout'lar temizleniyor)
- ✅ Kendi typing durumu gösterilmiyor (userId kontrolü var)
- ✅ Timeout mekanizması çalışıyor

### 4. Support Request Durum Değişikliklerini Dinleme
**Durum:** ✅ **ÇALIŞIYOR**

**Implementasyon:**
- `SupportRequestsScreen`: 3 event handler var
  - `support_request_accepted`
  - `support_request_rejected`
  - `support_request_cancelled`
- Her durum değişikliğinde cache invalidate ediliyor

**Kontrol Noktaları:**
- ✅ Event listener'lar doğru ekleniyor
- ✅ Cleanup doğru yapılıyor
- ✅ Cache invalidation çalışıyor

### 5. Thread Okundu İşaretleme (Gönderme)
**Durum:** ✅ **ÇALIŞIYOR**

**Implementasyon:**
- `MessagesScreen`: `handleMessagePress` içinde
- Socket bağlıysa `markThreadRead(threadId)` ile socket event gönderiliyor
- Socket bağlı değilse API mutation kullanılıyor (`markThreadAsReadMutation`)

**Kontrol Noktaları:**
- ✅ Socket bağlıysa socket event gönderiliyor
- ✅ Socket bağlı değilse API fallback çalışıyor
- ✅ Optimistic update yapılıyor

---

## 🔍 Potansiyel Sorunlar ve İyileştirmeler

### 1. ⚠️ InboxScreen'de Socket Event Listener Yok
**Durum:** ❌ **EKSİK**

**Sorun:**
- `InboxScreen` sadece container component (PagerView wrapper)
- Socket event listener'ları `MessagesScreen` ve `SupportRequestsScreen` içinde
- Bu doğru bir yaklaşım, ancak `InboxScreen`'de search query için socket event dinlenebilir

**Öneri:**
- Şu an için gerekli değil (search query sadece local state)
- Gelecekte real-time search için socket event eklenebilir

### 2. ✅ Socket Bağlantı Kontrolü
**Durum:** ✅ **ÇALIŞIYOR**

**Kontrol:**
- Her event listener `if (!isConnected) return;` kontrolü yapıyor
- Socket bağlı değilse event listener eklenmiyor

### 3. ✅ Cleanup Mekanizması
**Durum:** ✅ **ÇALIŞIYOR**

**Kontrol:**
- Her `useEffect` içinde cleanup fonksiyonu var
- Event listener'lar `off()` ile kaldırılıyor
- Typing timeout'ları temizleniyor

### 4. ⚠️ MessageDetail'de Thread Join/Leave
**Durum:** ✅ **ÇALIŞIYOR** (MessageDetail analizi dışında)

**Not:**
- `MessageDetail` ekranında thread join/leave mekanizması var
- Bu ekran analiz dışında, ancak mesaj listesi için gerekli değil

### 5. ✅ Optimistic Update vs Cache Invalidation
**Durum:** ✅ **DOĞRU YAKLAŞIM**

**Kontrol:**
- Optimistic update hemen UI'da gösteriliyor
- Cache invalidation backend'den güncel veri getiriyor
- Bu yaklaşım hem hızlı hem de doğru

---

## 📊 Özet Tablo

| Socket Event | MessagesScreen | SupportRequestsScreen | Durum |
|--------------|----------------|----------------------|-------|
| `new_message` | ✅ Dinleniyor | ✅ Dinleniyor (support-request) | ✅ Çalışıyor |
| `thread_read` | ✅ Dinleniyor | ❌ Yok | ✅ Çalışıyor |
| `user_typing` | ✅ Dinleniyor | ❌ Yok | ✅ Çalışıyor |
| `support_request_accepted` | ❌ Yok | ✅ Dinleniyor | ✅ Çalışıyor |
| `support_request_rejected` | ❌ Yok | ✅ Dinleniyor | ✅ Çalışıyor |
| `support_request_cancelled` | ❌ Yok | ✅ Dinleniyor | ✅ Çalışıyor |
| `mark_thread_read` (emit) | ✅ Gönderiliyor | ❌ Yok | ✅ Çalışıyor |

---

## 🎯 Sonuç

### ✅ Çalışan Özellikler

1. **Yeni mesaj geldiğinde liste güncelleme** - ✅ Çalışıyor
2. **Thread okundu işaretleme** - ✅ Çalışıyor
3. **Typing indicator gösterimi** - ✅ Çalışıyor
4. **Support request durum değişiklikleri** - ✅ Çalışıyor
5. **Optimistic update mekanizması** - ✅ Çalışıyor
6. **Cache invalidation** - ✅ Çalışıyor
7. **Socket bağlantı kontrolü** - ✅ Çalışıyor
8. **Cleanup mekanizması** - ✅ Çalışıyor

### ⚠️ İyileştirme Önerileri

1. **Search Query için Socket Event** (Gelecek için)
   - Real-time search için socket event eklenebilir
   - Şu an için gerekli değil

2. **Error Handling** (Opsiyonel)
   - Socket event hatalarında kullanıcıya bilgi verilebilir
   - Şu an için console.log yeterli

3. **Retry Mekanizması** (Opsiyonel)
   - Socket bağlantı hatası durumunda retry mekanizması var (SocketProvider'da)
   - Yeterli görünüyor

---

## 📝 Notlar

- Tüm socket event listener'ları `useEffect` içinde ve cleanup yapılıyor
- Socket bağlantı kontrolü her event listener'da yapılıyor
- Optimistic update + cache invalidation yaklaşımı doğru
- Typing indicator timeout mekanizması çalışıyor
- Support request durum değişiklikleri doğru dinleniyor

**Genel Değerlendirme:** ✅ **Tüm socket yapıları çalışıyor ve doğru implemente edilmiş**
