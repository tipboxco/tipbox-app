# Mobil Tarafta Beklenen Ama Backend'den Eksik/Hatalı Dönen Endpoint'ler

Bu dokümantasyon, mobil uygulamada kullanılan ama backend'den eksik, hatalı veya yanlış format dönen endpoint'leri içerir.

## 📋 Genel Durum

- **Toplam Endpoint:** ~100+
- **Bağlı Endpoint:** ~80+
- **Eksik/Hatalı Endpoint:** ~20+

---

## 🔴 Kritik Sorunlar

### 1. Search Endpoint - `/search`
**Durum:** ✅ Endpoint bağlı, backend response formatı doğrulandı

**Durum:**
- `/search` endpoint'i bağlandı
- Backend response formatı doğrulandı: `{ userData, brandData, productData }`
- SearchModal component'i henüz güncellenmedi (mock data kullanıyor)

**Aksiyon:**
- SearchModal component'ini güncelle
- `useSearch` hook'unu kullan

---

### 2. Wallet Endpoints - `/wallets/*`
**Durum:** ✅ Endpoint'ler bağlandı ve backend'de eklendi

**Güncellemeler:**
- ✅ `GET /wallets/balance` - Backend'de eklendi, response formatı: `{ balance, currency, locked, available }`
- ✅ `GET /wallets/transactions` - Backend'de eklendi, pagination ile
- ✅ Response formatı güncellendi: `{ items: Transaction[], pagination: {...} }`
- ✅ Transaction type'ları güncellendi: `received` | `sent`

**Aksiyon:**
- WalletScreen'i güncelle - Artık `/wallets/transactions` endpoint'ini kullanabilir
- Response formatını yeni yapıya göre güncelle

---

### 3. Inventory Endpoints - `/inventory/*`
**Durum:** ✅ Endpoint'ler bağlandı ve backend doğrulandı

**Güncellemeler:**
- ✅ `POST /inventory/split-experience` - Backend'de doğrulandı (önerilen endpoint)
- ✅ `splitExperience` fonksiyonu `postApi.ts`'de `/inventory/split-experience` kullanacak şekilde güncellendi
- ⚠️ Diğer inventory endpoint'leri bağlandı ama kullanılmıyor:
  - `POST /inventory` - Bağlandı ama kullanılmıyor
  - `PATCH /inventory/:inventoryId` - Bağlandı ama kullanılmıyor
  - `DELETE /inventory/:inventoryId` - Bağlandı ama kullanılmıyor
  - `GET /inventory/experience/options` - Bağlandı ama kullanılmıyor

**Not:**
- `/posts/experience/split` ve `/posts/split-experience` deprecated olarak işaretlenebilir
- Önerilen endpoint: `/inventory/split-experience`

**Aksiyon:**
- Inventory screen'lerinde bu endpoint'leri kullan

---

## 🟡 Orta Öncelikli Sorunlar

### 4. Post Endpoints - `/posts/:postId`
**Durum:** ✅ Endpoint'ler bağlandı ama kullanılmıyor

**Sorunlar:**
- `GET /posts/:postId` - Bağlandı ama PostDetailCard mock data kullanıyor olabilir
- `PUT /posts/:postId` - Bağlandı ama kullanılmıyor
- `DELETE /posts/:postId` - Bağlandı ama kullanılmıyor

**Aksiyon:**
- PostDetailCard'ı kontrol et
- Post edit/delete özelliklerini ekle

---

### 5. User Management - Avatar/Banner Upload
**Durum:** ✅ Endpoint'ler bağlandı ama kullanılmıyor

**Sorunlar:**
- `POST /users/me/avatar` - Bağlandı ama kullanılmıyor
- `POST /users/me/banner` - Bağlandı ama kullanılmıyor

**Aksiyon:**
- Profile edit screen'lerinde bu endpoint'leri kullan

---

### 6. Auth Endpoints
**Durum:** ✅ Endpoint'ler bağlandı ama bazıları kullanılmıyor

**Sorunlar:**
- `POST /auth/verify-email` - Bağlandı ama VerifyCodeScreen'de kullanılıyor mu kontrol et
- `GET /auth/me` - Bağlandı ama kullanılmıyor
- `POST /auth/forgot-password` - Bağlandı ama ForgotPasswordScreen'de kullanılıyor mu kontrol et
- `POST /auth/verify-reset-code` - Bağlandı ama kullanılıyor mu kontrol et
- `POST /auth/reset-password` - Bağlandı ama ResetPasswordScreen'de kullanılıyor mu kontrol et
- `POST /auth/logout` - Bağlandı ama kullanılmıyor

**Aksiyon:**
- Auth screen'lerinde bu endpoint'leri kullan
- Logout fonksiyonunu ekle

---

### 7. Marketplace Endpoints
**Durum:** ✅ Endpoint'ler bağlandı ama bazıları kullanılmıyor

**Sorunlar:**
- `PUT /marketplace/listings/:listingId/price` - Bağlandı ama kullanılmıyor
- `GET /marketplace/sell/:nftId` - Bağlandı ama kullanılmıyor
- `GET /marketplace/sell/:nftId/detail` - Bağlandı ama kullanılmıyor

**Aksiyon:**
- Marketplace screen'lerinde bu endpoint'leri kullan

---

### 8. Event Endpoints
**Durum:** ✅ Endpoint'ler bağlandı ama bazıları kullanılmıyor

**Sorunlar:**
- `GET /events/:eventId/posts` - Bağlandı ama kullanılmıyor
- `GET /events/:eventId/badges` - Bağlandı ama kullanılmıyor

**Aksiyon:**
- Event detail screen'lerinde bu endpoint'leri kullan

---

### 9. Expert Endpoints
**Durum:** ✅ Endpoint'ler bağlandı ama hiçbiri kullanılmıyor

**Sorunlar:**
- Tüm Expert endpoint'leri bağlandı ama Expert feature'ı kullanılmıyor
- Expert screen'leri yok

**Aksiyon:**
- Expert feature'ını implement et
- Expert screen'leri oluştur

---

### 10. Messaging - Message Feed
**Durum:** ✅ Endpoint bağlandı ama kullanılmıyor

**Sorunlar:**
- `GET /messages/feed` - Bağlandı ama InboxScreen'de kullanılmıyor
- InboxScreen muhtemelen `/messages` endpoint'ini kullanıyor

**Aksiyon:**
- InboxScreen'i kontrol et
- Message feed endpoint'ini kullan

---

## 🟢 Düşük Öncelikli Sorunlar

### 11. Response Format Uyumsuzlukları
**Durum:** ✅ Backend response formatları doğrulandı

**Güncellemeler:**
- ✅ `GET /users/:userId/feed` - Pagination formatı doğru
- ✅ `GET /users/:userId/reviews` - Pagination formatı doğru
- ✅ `GET /users/:userId/benchmarks` - Pagination formatı doğru
- ✅ `GET /search` - Response formatı doğru: `{ userData, brandData, productData }`

**Not:**
- Mobil tarafta bazı endpoint'ler için pagination normalizasyonu yapılıyor (array döndürüyorsa pagination objesi oluşturuluyor)
- Bu normalizasyon kod içinde mevcut ve çalışıyor

---

## 📝 Özet ve Öneriler

### Yapılması Gerekenler

1. **SearchModal'ı güncelle** - Search endpoint'ini kullan
2. **WalletScreen'i güncelle** - Wallet endpoint'lerini kullan
3. **Auth screen'lerini kontrol et** - Eksik endpoint'leri kullan
4. **Post edit/delete özelliklerini ekle** - Post endpoint'lerini kullan
5. **Profile edit screen'lerini güncelle** - Avatar/banner upload endpoint'lerini kullan
6. **Marketplace screen'lerini güncelle** - Eksik endpoint'leri kullan
7. **Event detail screen'lerini güncelle** - Event posts/badges endpoint'lerini kullan
8. **Expert feature'ını implement et** - Expert endpoint'lerini kullan
9. **Backend response formatlarını kontrol et** - Pagination ve response formatlarını standardize et

### Backend'de Yapılan Düzeltmeler ✅

1. ✅ **Transaction Endpoint Eklendi** - `GET /wallets/transactions` endpoint'i eklendi
2. ✅ **Balance Endpoint Eklendi** - `GET /wallets/balance` endpoint'i eklendi
3. ✅ **Split Experience Endpoint Doğrulandı** - `/inventory/split-experience` önerilen endpoint
4. ✅ **Response Formatları Doğrulandı** - Tüm response formatları backend'de doğrulandı
5. ✅ **Pagination Formatları Doğrulandı** - Tüm pagination formatları doğru

---

## 🔍 Test Edilmesi Gerekenler

1. Tüm yeni bağlanan endpoint'lerin çalışıp çalışmadığı
2. Response formatlarının dokümantasyona uygun olup olmadığı
3. Error handling'in doğru çalışıp çalışmadığı
4. Pagination'ın doğru çalışıp çalışmadığı
5. Cache stratejilerinin doğru çalışıp çalışmadığı

---

## 📅 Son Güncelleme

Bu dokümantasyon **2024-01-15** tarihinde oluşturulmuş ve **2024-01-15** tarihinde backend revizyonlarına göre güncellenmiştir.

### Backend Revizyonları (2024-01-15)
- ✅ `GET /wallets/transactions` endpoint'i eklendi
- ✅ `GET /wallets/balance` endpoint'i eklendi
- ✅ Response formatları doğrulandı
- ✅ Split Experience endpoint'i doğrulandı (`/inventory/split-experience` önerilen)

