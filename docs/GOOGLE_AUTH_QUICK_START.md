# 🔥 Firebase Google Auth Entegrasyonu - Hızlı Başlangıç

## 📝 Yapılan Değişiklikler

### 1. **GoogleService.ts** - OAuth Flow Güncellemesi
**Dosya:** `src/services/GoogleService/index.ts`

#### ❌ ESKİ (Çalışmayan) Yöntem:
```typescript
responseType: AuthSession.ResponseType.IdToken  // Direkt ID token isteme
usePKCE: false
```

#### ✅ YENİ (Çalışan) Yöntem:
```typescript
responseType: AuthSession.ResponseType.Code     // Authorization Code Flow
usePKCE: true                                   // PKCE güvenliği (mobil için önerilen)
```

**Neden Değişti?**
- Google Cloud Console **Web Client ID** ile IdToken flow desteklenmiyor
- Authorization Code Flow + PKCE **daha güvenli** ve **mobil uygulamalar için önerilen** yöntem
- Expo'nun `auth.expo.io` redirect proxy'si ile uyumlu

### 2. **.env Dosyası** - Environment Variables Template
**Dosyalar:** 
- `env-example.txt` (template - Git'e commit edilebilir)
- `.env` (gerçek değerler - Git'e commit edilmemeli)

### 3. **.gitignore** - Güvenlik
`.env` dosyası artık Git'e commit edilmiyor.

### 4. **Dokümantasyon**
**Dosya:** `docs/FIREBASE_SETUP_2026.md`

2026 yılı güncel Firebase Console ve Google Cloud Console arayüzleri için **adım adım yapılandırma rehberi**.

---

## 🚀 HIZLI BAŞLANGIÇ (5 Dakika)

### Adım 1: Google Cloud Console - OAuth Client Oluştur

1. **[Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)** açın
2. **Create Credentials > OAuth client ID > Web application** seçin
3. **Authorized redirect URIs** ekleyin:
   ```
   https://auth.expo.io/@tipboxco/tipbox-app
   ```
4. **Client ID** ve **Client secret**'i kaydedin

### Adım 2: Firebase Console - Google Sign-In Aktif Et

1. **[Firebase Console > Authentication](https://console.firebase.google.com/)** açın
2. **Sign-in method > Add provider > Google** seçin
3. **Enable** yapın ve Google Cloud Console'dan aldığınız:
   - **Web client ID** girin
   - **Web client secret** girin
4. **Save**

### Adım 3: .env Dosyası Oluştur

```bash
cp env-example.txt .env
```

`.env` dosyasını düzenleyip şu değerleri girin:

```bash
# Firebase (Firebase Console > Project Settings'den al)
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=tipbox-app.firebaseapp.com
FIREBASE_PROJECT_ID=tipbox-app
FIREBASE_STORAGE_BUCKET=tipbox-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=886406936506
FIREBASE_APP_ID=1:886406936506:ios:...

# Google OAuth (Google Cloud Console > Credentials'dan al)
FIREBASE_WEB_CLIENT_ID=886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=com.googleusercontent.apps.886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4
```

### Adım 4: Firebase SDK Dosyalarını İndir

**iOS:**
- Firebase Console > Project Settings > iOS app > **GoogleService-Info.plist** indir
- Root dizine kopyala: `tipbox-app/GoogleService-Info.plist`

**Android:**
- Firebase Console > Project Settings > Android app > **google-services.json** indir
- Root dizine kopyala: `tipbox-app/google-services.json`

### Adım 5: Test Et

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

⚠️ **Not:** Expo Go ile **çalışmaz**, development build gerekli!

---

## 🔍 SORUN GİDERME

### ❌ "Something went wrong" Hatası

**Neden:** `auth.expo.io` redirect URI Google Cloud Console'a eklenmemiş

**Çözüm:**
1. [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials) açın
2. OAuth Client ID'nizi düzenleyin
3. **Authorized redirect URIs** ekleyin: `https://auth.expo.io/@tipboxco/tipbox-app`
4. **Save**

### ❌ Timeout (30-60 saniye sonra hata)

**Neden:** 
- Firebase Console'da Google Sign-In enabled değil
- Web Client ID veya Secret yanlış

**Çözüm:**
1. [Firebase Console > Authentication > Sign-in method](https://console.firebase.google.com/) kontrol edin
2. Google provider **enabled** olmalı
3. **Web client ID** ve **Web client secret** doğru girilmiş mi?

### ❌ "Unauthorized" Hatası

**Neden:** Test user listesinde değilsiniz (OAuth Consent Screen "External" modundayken)

**Çözüm:**
1. [Google Cloud Console > OAuth consent screen > Test users](https://console.cloud.google.com/apis/credentials/consent) açın
2. Email adresinizi ekleyin
3. **Save**

---

## 📋 YAPILANDıRMA CHECKLİSTİ

### Google Cloud Console ✅
- [ ] OAuth Consent Screen yapılandırıldı (External)
- [ ] Scopes eklendi: `openid`, `email`, `profile`
- [ ] Test users eklendi
- [ ] Authorized domains: `auth.expo.io` eklendi
- [ ] OAuth 2.0 Client ID oluşturuldu (**Web application**)
- [ ] Authorized redirect URIs: `https://auth.expo.io/@tipboxco/tipbox-app` eklendi
- [ ] Client ID ve Secret kaydedildi

### Firebase Console ✅
- [ ] Google Sign-In provider **enabled**
- [ ] Web Client ID girildi (Google Cloud Console'dan)
- [ ] Web Client Secret girildi
- [ ] Authorized domains: `auth.expo.io`, `localhost` eklendi
- [ ] iOS app eklendi, `GoogleService-Info.plist` indirildi
- [ ] Android app eklendi, `google-services.json` indirildi

### Project Files ✅
- [ ] `GoogleService-Info.plist` root dizinde
- [ ] `google-services.json` root dizinde
- [ ] `.env` dosyası oluşturuldu (`env-example.txt`'den)
- [ ] `.env` dosyasında tüm değerler girildi
- [ ] `app.json` > `ios.googleServicesFile` ayarlandı
- [ ] `app.json` > `android.googleServicesFile` ayarlandı
- [ ] `app.json` > `ios.infoPlist.CFBundleURLTypes` ayarlandı

### Code Changes ✅
- [x] `GoogleService.ts` güncellendi (Code flow + PKCE)
- [x] `.gitignore` güncellendi (`.env` eklendi)
- [x] Dokümantasyon oluşturuldu

---

## 📚 Detaylı Dokümantasyon

Tüm adımlar için: **`docs/FIREBASE_SETUP_2026.md`**

Bu dosyada:
- Google Cloud Console ekran görüntüleriyle adım adım rehber
- Firebase Console yapılandırma detayları
- OAuth Consent Screen kurulumu
- Test users ekleme
- Production deployment
- Troubleshooting

---

## 🎯 SONUÇ

### Yapılması Gerekenler:

1. **Google Cloud Console:**
   - OAuth Client oluştur (Web application)
   - Redirect URI ekle: `https://auth.expo.io/@tipboxco/tipbox-app`

2. **Firebase Console:**
   - Google Sign-In aktif et
   - Web Client ID ve Secret gir

3. **Proje:**
   - `.env` dosyası oluştur
   - Firebase SDK dosyalarını indir (`GoogleService-Info.plist`, `google-services.json`)
   - Development build yap ve test et

### Beklenen Sonuç:

✅ Kullanıcı "Google ile Giriş" butonuna tıklar
✅ Google hesap seçim ekranı açılır
✅ Kullanıcı hesabını seçer
✅ İzinleri onaylar
✅ Uygulama otomatik olarak giriş yapar (timeout veya "something went wrong" hatası yok)

---

**Soru veya sorun olursa:** `docs/FIREBASE_SETUP_2026.md` dosyasına bakın.

**Son Güncelleme:** 12 Ocak 2026


