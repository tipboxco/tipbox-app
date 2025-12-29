# Socket Bağlantısı İçin Gerekenler

Socket'in çalışması için aşağıdaki gereksinimlerin karşılanması gerekir:

## ✅ Yapılan Değişiklikler

### 1. Login Sonrası Socket Bağlantısı
- `src/features/auth/api/hooks.ts` dosyasında `useLogin` hook'unun `onSuccess` callback'ine socket bağlantısı eklendi
- Login başarılı olduğunda otomatik olarak socket bağlantısı başlatılıyor

### 2. Logout Sonrası Socket Disconnect
- `src/store/appStore.ts` dosyasında `logout` fonksiyonuna socket disconnect eklendi
- Logout yapıldığında socket bağlantısı kapatılıyor

### 3. App Başlangıcında Socket Bağlantısı
- `App.tsx` dosyasında app başlangıcında eğer kullanıcı zaten login ise socket bağlantısı başlatılıyor
- AppState listener'da foreground'a geldiğinde socket bağlantısı kontrol ediliyor

## 🔧 Backend Gereksinimleri

Socket'in çalışması için backend'de şunlar olmalı:

### 1. Socket.IO Server Çalışıyor Olmalı
- Backend'de Socket.IO server'ı çalışıyor olmalı
- URL: `http://192.168.1.165:3000` (veya `api.config.ts`'deki BASE_URL)
- Path: `/socket.io/`

### 2. JWT Token Authentication
- Backend, socket bağlantısında JWT token'ı doğrulamalı
- Token `auth.token` ve `extraHeaders.Authorization` olarak gönderiliyor

### 3. Backend Event'leri
Backend şu event'leri desteklemeli:
- `connect` - Bağlantı başarılı
- `connected` - Backend bağlantı onayı (data: `{ message, userId, userEmail }`)
- `disconnect` - Bağlantı kesildi
- `thread_joined` - Thread room'una katılım başarılı
- `thread_join_error` - Thread katılım hatası
- `new_message` - Yeni mesaj geldi
- `message_sent` - Mesaj gönderildi (onay)
- `message_send_error` - Mesaj gönderme hatası
- `user_typing` - Kullanıcı yazıyor
- `message_read` - Mesaj okundu

## 📋 Kontrol Listesi

Socket'in çalışıp çalışmadığını kontrol etmek için:

1. **Backend Socket Server Çalışıyor mu?**
   ```bash
   # Backend'de socket server'ın çalıştığından emin olun
   # Terminal'de backend loglarını kontrol edin
   ```

2. **Token Geçerli mi?**
   - Login yapıldıktan sonra token SecureStore'a kaydediliyor
   - Token geçerli ve süresi dolmamış olmalı

3. **URL Doğru mu?**
   - `src/config/api.config.ts` dosyasındaki `BASE_URL` doğru olmalı
   - Şu an: `http://192.168.1.165:3000`

4. **Network Bağlantısı Var mı?**
   - Cihaz ve backend aynı network'te olmalı
   - Firewall socket bağlantısını engellememeli

## 🐛 Hata Ayıklama

### Timeout Hatası
```
ERROR [SocketService] Max reconnection attempts reached
ERROR [SocketService] Connection error details: {"message": "timeout", ...}
```

**Olası Nedenler:**
1. Backend socket server çalışmıyor
2. Network bağlantısı yok
3. Firewall socket bağlantısını engelliyor
4. Backend URL yanlış

**Çözüm:**
1. Backend'de socket server'ın çalıştığını kontrol edin
2. Backend loglarını kontrol edin
3. Network bağlantısını test edin
4. `api.config.ts`'deki URL'i kontrol edin

### Authentication Hatası
```
ERROR [SocketService] Authentication error: ...
```

**Olası Nedenler:**
1. Token geçersiz veya süresi dolmuş
2. Backend token'ı doğrulayamıyor

**Çözüm:**
1. Yeniden login yapın
2. Token'ın geçerli olduğundan emin olun

## 📝 Log Mesajları

Socket bağlantısı sırasında şu log mesajları görülebilir:

**Başarılı Bağlantı:**
```
[SocketService] Connecting to: http://192.168.1.165:3000
[SocketService] Access token available: true
[SocketService] Connected to server, socket ID: <socket-id>
[SocketService] Backend connection confirmed: { message, userId, userEmail }
```

**Hata Durumu:**
```
[SocketService] Connection attempt 1/5 failed: timeout
[SocketService] Max reconnection attempts reached
[SocketService] Socket features disabled. Application will continue with REST API only.
```

## ⚠️ Önemli Notlar

1. **Socket Bağlantısı Kritik Değil**: Socket bağlantısı başarısız olsa bile uygulama REST API ile çalışmaya devam eder
2. **Otomatik Yeniden Bağlanma**: Socket.IO otomatik olarak yeniden bağlanmayı dener (5 deneme)
3. **Token Güncelleme**: Token yenilendiğinde socket bağlantısı otomatik olarak güncellenmez, yeniden bağlanma gerekebilir

## 🔗 İlgili Dosyalar

- `src/services/SocketService/index.ts` - Socket service implementasyonu
- `src/features/auth/api/hooks.ts` - Login sonrası socket bağlantısı
- `src/store/appStore.ts` - Logout sonrası socket disconnect
- `App.tsx` - App başlangıcında socket bağlantısı
- `src/config/api.config.ts` - API ve socket URL konfigürasyonu
- `docs/FRONTEND_SOCKET_CONFIGURATION.md` - Detaylı socket kullanım kılavuzu



