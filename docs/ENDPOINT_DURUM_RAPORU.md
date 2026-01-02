# Endpoint Entegrasyon Durum Raporu

**Tarih:** 2025-01-XX  
**Durum:** Güncel

---

## ✅ Entegre Edilen Ekranlar

### 1. WalletScreen ✅
- **Durum:** API'ye bağlandı
- **Kullanılan Hook'lar:**
  - `useWalletBalance` - Cüzdan bakiyesi
  - `useWalletTransactions` - İşlem geçmişi
  - `useMyNFTs` - NFT varlıkları
- **Not:** Mock data kaldırıldı, gerçek API kullanılıyor

### 2. SearchModal ✅
- **Durum:** API'ye bağlı
- **Kullanılan Hook:** `useSearch`
- **Not:** Zaten entegre edilmiş durumda

---

## ❌ Mock Data Kullanan Ekranlar

### 3. NftAssetsScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** Local mock nfts array
- **Mevcut Hook:** `useMyNFTs` (marketplace API'den)
- **Aksiyon:** `useMyNFTs` hook'unu kullanarak API'ye bağlanmalı

---

## 📦 Catalog Feature - Mock Data Kullanan Ekranlar

### 4. BrandProductDetailScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:**
  - `mock_brand_product_experience_posts` - Deneyim paylaşımları
  - `mock_news_data` - Haberler
  - `mock_benchmark_posts` - Karşılaştırmalar
- **Route Param:** `productId` mevcut ama kullanılmıyor
- **Eksik Endpoint'ler:**
  - `GET /products/{productId}/posts?type=experience` - Deneyim paylaşımları
  - `GET /products/{productId}/posts?type=comments` - Yorumlar
  - `GET /products/{productId}/posts?type=benchmark` - Karşılaştırmalar
  - `GET /products/{productId}/news` - Haberler
  - `GET /products/{productId}` - Ürün detay bilgileri
- **Aksiyon:** Bu endpoint'ler için API fonksiyonları ve hook'lar oluşturulmalı

### 5. BrandPostListScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `mockPostData`
- **Mevcut Hook:** `useBrandFeed` (var ama kullanılmıyor)
- **Route Param:** `brandId` yok (route params'tan alınmalı)
- **Eksik:** Route params'tan brandId alınıp `useBrandFeed` hook'u kullanılmalı

### 6. BrandEventsScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `mockBrandEvents`
- **Mevcut Hook:** `useBrandEvents` (var ama kullanılmıyor)
- **Route Param:** `brandId` yok (route params'tan alınmalı)
- **Eksik:** Route params'tan brandId alınıp `useBrandEvents` hook'u kullanılmalı

### 7. BrandEventsDetailScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `mockEventDetail`
- **Route Param:** `eventId` yok (route params'tan alınmalı)
- **Eksik Endpoint'ler:**
  - `GET /events/{eventId}` - Etkinlik detay bilgileri
  - `POST /events/{eventId}/join` - Etkinliğe katıl
  - `GET /events/{eventId}/requirements` - Etkinlik gereksinimleri ve ilerleme
- **Aksiyon:** Bu endpoint'ler için API fonksiyonları ve hook'lar oluşturulmalı

### 8. BrandSurveyListScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `mockBrandSurveys`
- **Mevcut Hook:** `useBrandSurveys` (var ama kullanılmıyor)
- **Route Param:** `brandId` yok (route params'tan alınmalı)
- **Eksik:** Route params'tan brandId alınıp `useBrandSurveys` hook'u kullanılmalı

### 9. NewsDetailScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `mock_news_detail`
- **Route Param:** `newsId` mevcut ama kullanılmıyor
- **Eksik Endpoint:**
  - `GET /news/{newsId}` - Haber detay bilgileri
- **Aksiyon:** Bu endpoint için API fonksiyonu ve hook oluşturulmalı

### 10. BrandHistoryScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** Local mock data (brandData object)
- **Route Param:** `brandId` yok (route params'tan alınmalı)
- **Eksik Endpoint'ler:**
  - `GET /brands/{brandId}/history` - Brand geçmişi, istatistikler, rozetler, puan geçmişi
  - `GET /brands/{brandId}/stats` - Brand istatistikleri (surveys, shares, events)
- **Aksiyon:** Bu endpoint'ler için API fonksiyonları ve hook'lar oluşturulmalı

---

## 🎁 Events Feature - Mock Data Kullanan Ekranlar

### 11. RewardsBadgesScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `see_all_reward_mock`
- **Mevcut Hook:** `useAchievements` (var ama kullanılmıyor)
- **Eksik:** `useAchievements` hook'u kullanılmalı
- **Not:** AchievementTab'de zaten kullanılıyor, aynı hook burada da kullanılabilir

---

## 📱 Auth Feature - Mock Data Kullanan Ekranlar

### 12. SelectCategoriesScreen ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:** `@/src/mock/auth/categorys`
- **Eksik Endpoint'ler:**
  - `POST /auth/categories` - Seçilen kategorileri kaydetmek için
  - `GET /auth/categories` - Kullanıcının seçtiği kategorileri getirmek için (opsiyonel)
- **Not:** TODO yorumu var: "TODO: API entegrasyonu yapılacak"
- **Aksiyon:** Bu endpoint'ler için API fonksiyonu ve hook oluşturulmalı

---

## 💳 Settings Feature - Mock Data Kullanan Ekranlar

### 13. PaymentTab ❌
- **Durum:** Mock data kullanıyor
- **Kullanılan Mock:**
  - `mockSavedCards` - Kayıtlı kartlar
  - `mockBillingHistory` - Faturalama geçmişi
  - `mockLinkedPaymentMethod` - Bağlı ödeme yöntemi
- **Eksik Endpoint'ler:**
  - `GET /payment/cards` - Kayıtlı kartları listele
  - `POST /payment/cards` - Yeni kart ekle
  - `DELETE /payment/cards/{cardId}` - Kart sil
  - `GET /payment/billing-history` - Faturalama geçmişi
  - `GET /payment/method` - Bağlı ödeme yöntemi
- **Aksiyon:** Bu endpoint'ler için API fonksiyonları ve hook'lar oluşturulmalı

---

## 📊 Özet İstatistikler

- **Toplam Ekran:** 13 ekran
- **✅ Entegre Edilen:** 2 ekran (WalletScreen, SearchModal)
- **❌ Mock Data Kullanan:** 11 ekran
- **Mevcut Hook'ları Kullanmayan:** 5 ekran (BrandPostListScreen, BrandEventsScreen, BrandSurveyListScreen, RewardsBadgesScreen, NftAssetsScreen)
- **Yeni Endpoint Gerektiren:** 6 ekran (BrandProductDetailScreen, BrandEventsDetailScreen, NewsDetailScreen, BrandHistoryScreen, SelectCategoriesScreen, PaymentTab)

---

## 🎯 Öncelik Sırası

### Yüksek Öncelik (Kullanıcı Akışında Kritik)
1. **SelectCategoriesScreen** - Kullanıcı kayıt akışında kritik
2. **BrandProductDetailScreen** - Ana özelliklerden biri
3. **NftAssetsScreen** - Mevcut hook kullanılabilir, hızlı entegre edilebilir

### Orta Öncelik (Mevcut Hook'ları Kullanabilir)
4. **BrandPostListScreen** - `useBrandFeed` hook'u var
5. **BrandEventsScreen** - `useBrandEvents` hook'u var
6. **BrandSurveyListScreen** - `useBrandSurveys` hook'u var
7. **RewardsBadgesScreen** - `useAchievements` hook'u var

### Düşük Öncelik (Yeni Endpoint Gerektirir)
8. **BrandEventsDetailScreen** - Yeni endpoint'ler gerekiyor
9. **NewsDetailScreen** - Yeni endpoint gerekiyor
10. **BrandHistoryScreen** - Yeni endpoint'ler gerekiyor
11. **PaymentTab** - Yeni endpoint'ler gerekiyor

---

## 🔧 Hızlı Entegrasyon İçin Notlar

### Mevcut Hook'ları Kullanan Ekranlar (Hızlı Entegre Edilebilir)
- **BrandPostListScreen:** Route params'tan `brandId` alıp `useBrandFeed` kullan
- **BrandEventsScreen:** Route params'tan `brandId` alıp `useBrandEvents` kullan
- **BrandSurveyListScreen:** Route params'tan `brandId` alıp `useBrandSurveys` kullan
- **RewardsBadgesScreen:** `useAchievements` hook'unu kullan
- **NftAssetsScreen:** `useMyNFTs` hook'unu kullan

### Yeni Endpoint Gerektiren Ekranlar
Bu ekranlar için önce backend'de endpoint'lerin mevcut olup olmadığı kontrol edilmeli, sonra API fonksiyonları ve hook'lar oluşturulmalı.

---

## 📝 Son Güncelleme
- **WalletScreen** entegrasyonu tamamlandı (2025-01-XX)
- **SearchModal** zaten entegre edilmiş durumda

