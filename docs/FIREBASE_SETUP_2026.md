# Firebase + Google Cloud Console Yapılandırma Rehberi (2026)

Bu dokümantasyon, Tipbox React Native + Expo projesi için Firebase Authentication ve Google Sign-In'i yapılandırma adımlarını içerir.

## ⚠️ ÖNEMLİ: Sorunun Kök Nedeni

### Eski Yapılandırmadaki Problem

**IdToken Response Type** kullanıyorduk:
- `responseType: AuthSession.ResponseType.IdToken`
- Bu flow, **Google Cloud Console Web Client ID** ile düzgün çalışmıyor
- `auth.expo.io` redirect'inden sonra "Something went wrong" hatası alınıyordu
- 30 saniye timeout oluşuyordu

### Çözüm: Authorization Code Flow + PKCE

**Authorization Code Flow** kullanmaya geçtik:
- `responseType: AuthSession.ResponseType.Code`
- `usePKCE: true` (mobil uygulamalar için önerilen güvenli yöntem)
- Token exchange ile ID token alınıyor
- Google Cloud Console ve Expo ile uyumlu

---

## 📋 1. GOOGLE CLOUD CONSOLE YAPILANDIRMASI

### 1.1. Google Cloud Console'a Giriş

1. **[Google Cloud Console](https://console.cloud.google.com/)** adresine gidin
2. Projenizi seçin (yoksa yeni proje oluşturun: "Tipbox")

### 1.2. OAuth Consent Screen (Onay Ekranı)

**⚠️ DİKKAT:** "OAuth Overview" sayfası DEĞİL, "OAuth consent screen" **yapılandırma** sayfasına gitmeniz gerekiyor!

**Doğru Navigation:** 
1. Sol menüden **"APIs & Services"** açın
2. **"OAuth consent screen"** seçin (NOT: "OAuth Overview" değil!)
3. Veya direkt link: https://console.cloud.google.com/apis/credentials/consent

**Görsel İpucu:** 
- ❌ Yanlış sayfa: "OAuth Overview" başlığı, Metrics (Traffic, Errors, Users)
- ✅ Doğru sayfa: "OAuth consent screen" başlığı, "User Type" seçimi (External/Internal)

#### Adımlar:
1. **User Type**: **External** seçin (production için gerekli)
2. **App information**:
   - **App name**: `Tipbox`
   - **User support email**: `omer@tipbox.co`
   - **App logo**: (isteğe bağlı) Tipbox logosu
   
3. **App domain** (isteğe bağlı):
   - **Application home page**: `https://tipbox.co`
   - **Privacy policy**: `https://tipbox.co/privacy`
   - **Terms of service**: `https://tipbox.co/terms`

4. **Authorized domains**:
   - `auth.expo.io` ✅ (ZORUNLU - Expo OAuth proxy için)
   - `tipbox.co` (production domain'iniz)

5. **Developer contact email**: `omer@tipbox.co`

6. **SAVE AND CONTINUE**

#### Scopes (İzinler):
**Navigation:** OAuth consent screen > Step 2: Scopes

Şu scope'ları ekleyin:
- `openid`
- `email` (`https://www.googleapis.com/auth/userinfo.email`)
- `profile` (`https://www.googleapis.com/auth/userinfo.profile`)

**SAVE AND CONTINUE**

#### Test Users (Development modunda gerekli):
**Navigation:** OAuth consent screen > Step 3: Test users

Şu kullanıcıları ekleyin:
- `omer.frk027@gmail.com` ✅
- `omer@fuzyon.ist` ✅
- `omer@tipbox.co` ✅

**SAVE AND CONTINUE**

### 1.3. OAuth 2.0 Client ID Oluşturma

**Navigation:** APIs & Services > Credentials

#### Adımlar:
1. **+ CREATE CREDENTIALS** > **OAuth client ID** tıklayın
2. **Application type**: **Web application** seçin ⚠️ (Mobile değil, Web!)
3. **Name**: `Tipbox Web Client (Expo)`

#### Authorized JavaScript origins:
(Boş bırakabilirsiniz veya development için localhost ekleyin)
```
http://localhost
http://localhost:8081
http://localhost:19006
```

#### Authorized redirect URIs: ⚠️ **KRİTİK!**
```
https://auth.expo.io/@tipboxco/tipbox-app
```

**Önemli Notlar:**
- `@tipboxco` kısmı `app.json` > `expo.owner` ile aynı olmalı
- `/tipbox-app` kısmı `app.json` > `expo.slug` ile aynı olmalı
- **Mutlaka HTTPS** olmalı
- **Mutlaka `auth.expo.io`** domain'i olmalı (Expo OAuth proxy)

5. **CREATE** butonuna basın

#### Client Credentials'ı Kaydedin:
Açılan popup'ta şu bilgileri kopyalayın:
- **Client ID**: `886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com`
- **Client secret**: `GOCSPX-...`

⚠️ Bu bilgileri güvenli bir yere kaydedin!

---

## 📋 2. FIREBASE CONSOLE YAPILANDIRMASI

### 2.1. Firebase Console'a Giriş

1. **[Firebase Console](https://console.firebase.google.com/)** adresine gidin
2. Projenizi seçin (yoksa **"Add project"** ile oluşturun)
   - Firebase projesini Google Cloud Console'daki projeyle **link edin**
   - Böylece OAuth consent screen ayarları paylaşılır

### 2.2. Authentication > Sign-in Methods

**Navigation:** Authentication > Sign-in method

#### Google Provider'ı Etkinleştir:
1. **Add new provider** > **Google** seçin
2. **Enable** toggle'ını açın ✅

#### Web SDK Configuration:
⚠️ **KRİTİK:** Google Cloud Console'dan aldığınız bilgileri girin:

- **Web client ID**: 
  ```
  886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com
  ```
  
- **Web client secret**: 
  ```
  GOCSPX-...
  ```
  (Google Cloud Console > Credentials'dan kopyaladığınız secret)

#### Public-facing name:
```
Tipbox
```

#### Support email:
```
omer@tipbox.co
```

3. **SAVE** butonuna basın

### 2.3. Authorized Domains

**Navigation:** Authentication > Settings > Authorized domains

Şu domain'lerin ekli olduğundan emin olun:
- `auth.expo.io` ✅ (ZORUNLU - Expo OAuth proxy)
- `localhost` ✅ (development için)
- `tipbox.co` (production domain'iniz)

---

## 📋 3. FIREBASE SDK DOSYALARINI İNDİRME

### 3.1. iOS: GoogleService-Info.plist

**Navigation:** Firebase Console > Project Settings (⚙️) > General > Your apps

#### Adımlar:
1. **iOS app** bölümünü bulun
2. Eğer iOS app yoksa:
   - **Add app** > **iOS** seçin
   - **Bundle ID**: `com.tipboxapp` (app.json > ios.bundleIdentifier ile aynı)
   - **App nickname**: "Tipbox iOS"
   - Register

3. **GoogleService-Info.plist** dosyasını indirin
4. Bu dosyayı **projenizin root dizinine** kopyalayın:
   ```
   tipbox-app/GoogleService-Info.plist
   ```

5. `app.json` dosyasında referans olduğundan emin olun:
   ```json
   "ios": {
     "googleServicesFile": "./GoogleService-Info.plist"
   }
   ```

#### GoogleService-Info.plist İçeriği Kontrolü:
Dosyayı açın ve şu değerlerin doğru olduğunu kontrol edin:
- `CLIENT_ID`: Google OAuth Client ID (reversed format)
- `REVERSED_CLIENT_ID`: `com.googleusercontent.apps.886406936506-...`
- `API_KEY`: Firebase iOS API key
- `GCM_SENDER_ID`: Firebase Messaging sender ID
- `PROJECT_ID`: Firebase project ID
- `BUNDLE_ID`: `com.tipboxapp`

### 3.2. Android: google-services.json

**Navigation:** Firebase Console > Project Settings (⚙️) > General > Your apps

#### Adımlar:
1. **Android app** bölümünü bulun
2. Eğer Android app yoksa:
   - **Add app** > **Android** seçin
   - **Package name**: `com.tipbox.app` (app.json > android.package ile aynı)
   - **App nickname**: "Tipbox Android"
   - **SHA-1**: (isteğe bağlı - debug/release keystore'dan alın)
   - Register

3. **google-services.json** dosyasını indirin
4. Bu dosyayı **projenizin root dizinine** kopyalayın:
   ```
   tipbox-app/google-services.json
   ```

5. `app.json` dosyasında referans ekleyin (yoksa):
   ```json
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```

---

## 📋 4. IOS URL SCHEME YAPILANDIRMASI

### 4.1. app.json > ios.infoPlist > CFBundleURLTypes

`app.json` dosyanızda şu yapılandırmanın olduğundan emin olun:

```json
"ios": {
  "bundleIdentifier": "com.tipboxapp",
  "googleServicesFile": "./GoogleService-Info.plist",
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLSchemes": [
          "tipboxapp",
          "com.googleusercontent.apps.886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4"
        ]
      }
    ]
  }
}
```

#### Açıklamalar:
- **`tipboxapp`**: App'inizi açmak için custom scheme (deep linking için)
- **`com.googleusercontent.apps.886406936506-...`**: 
  - Google OAuth Client ID'nin **reversed format**'ı
  - GoogleService-Info.plist > `REVERSED_CLIENT_ID` ile aynı olmalı
  - Format: `com.googleusercontent.apps.[CLIENT_ID_FIRST_PART]`

---

## 📋 5. ENVIRONMENT VARIABLES (.env)

### 5.1. .env Dosyası Oluşturma

Projenizin root dizininde `.env` dosyası oluşturun:

```bash
# Firebase Configuration
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=tipbox-app.firebaseapp.com
FIREBASE_PROJECT_ID=tipbox-app
FIREBASE_STORAGE_BUCKET=tipbox-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=886406936506
FIREBASE_APP_ID=1:886406936506:ios:...

# Google OAuth Configuration
# Web Client ID from Google Cloud Console (for OAuth)
FIREBASE_WEB_CLIENT_ID=886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4.apps.googleusercontent.com

# iOS Client ID (reversed format) - from GoogleService-Info.plist
GOOGLE_IOS_CLIENT_ID=com.googleusercontent.apps.886406936506-j4u0lsdg6gnn7ggv5mda80rothf5tqr4

# Android Client ID (if different from Web Client ID)
# GOOGLE_ANDROID_CLIENT_ID=...
```

#### Değerleri Nereden Alacağınız:

**Firebase Config** (Firebase Console > Project Settings):
- `FIREBASE_API_KEY`: General > Web API Key
- `FIREBASE_AUTH_DOMAIN`: General > Auth domain
- `FIREBASE_PROJECT_ID`: General > Project ID
- `FIREBASE_STORAGE_BUCKET`: General > Storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Cloud Messaging > Sender ID
- `FIREBASE_APP_ID`: General > Your apps > App ID

**Google OAuth Config** (Google Cloud Console > Credentials):
- `FIREBASE_WEB_CLIENT_ID`: OAuth 2.0 Client ID (Web application)
- `GOOGLE_WEB_CLIENT_ID`: Aynı değer (alias)

**iOS Config** (GoogleService-Info.plist):
- `GOOGLE_IOS_CLIENT_ID`: `REVERSED_CLIENT_ID` değeri

### 5.2. .env Dosyasını .gitignore'a Ekleyin

```bash
# Environment variables
.env
.env.local
.env.production
```

⚠️ **Güvenlik:** `.env` dosyasını **asla Git'e commit etmeyin!**

---

## 📋 6. KOD DEĞİŞİKLİKLERİ

### 6.1. GoogleService Güncellemesi

**Dosya:** `src/services/GoogleService/index.ts`

#### Değişiklikler:

1. **Response Type**: `IdToken` → `Code`
   ```typescript
   // ESKI (çalışmıyor)
   responseType: AuthSession.ResponseType.IdToken
   
   // YENİ (çalışıyor)
   responseType: AuthSession.ResponseType.Code
   ```

2. **PKCE Kullanımı**: Eklendi
   ```typescript
   usePKCE: true // Mobil uygulamalar için önerilen
   ```

3. **Token Exchange**: Authorization code'u token'a çevirme
   ```typescript
   const tokenResponse = await AuthSession.exchangeCodeAsync(
     {
       clientId,
       code: authCode,
       redirectUri,
       extraParams: {
         code_verifier: request.codeVerifier,
       },
     },
     googleDiscovery
   );
   ```

4. **Timeout Süresi**: 30 saniye → 60 saniye
   ```typescript
   // Kullanıcıya hesap seçimi için daha fazla zaman tanı
   setTimeout(() => reject(...), 60000);
   ```

#### Tam Implementation:
`src/services/GoogleService/index.ts` dosyası güncellenmiştir. Detaylar için dosyayı inceleyin.

---

## 📋 7. TEST ADIMLARI

### 7.1. Development Build

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

⚠️ **Önemli:** Expo Go ile **çalışmaz**! Development build gereklidir.

### 7.2. Google Sign-In Test

1. Uygulamayı açın
2. **"Google ile Giriş"** butonuna tıklayın
3. Google hesap seçim ekranı açılmalı
4. Test user'lardan birini seçin:
   - `omer.frk027@gmail.com`
   - `omer@fuzyon.ist`
   - `omer@tipbox.co`
5. İzinleri onaylayın
6. Uygulama otomatik olarak giriş yapmalı

### 7.3. Log Kontrolü

Terminal'de şu logları görmeli siniz:

```
[GoogleService] 🔍 Redirect URI: https://auth.expo.io/@tipboxco/tipbox-app
[GoogleService] 🔐 Generating PKCE code challenge...
[GoogleService] 🚀 Starting OAuth flow...
[GoogleService] 🔒 Using PKCE with Code flow
[GoogleService] 📥 OAuth result type: success
[GoogleService] 🔄 Exchanging authorization code for tokens...
[GoogleService] ✅ Token exchange successful
[GoogleService] 📦 ID token received
[GoogleService] 🔥 Creating Firebase credential...
[GoogleService] 🔥 Signing in with Firebase...
[GoogleService] ✅ Firebase sign-in successful
[GoogleService] 👤 User: { uid: '...', email: '...', displayName: '...' }
[GoogleService] 🎫 Firebase ID token obtained
[GoogleService] ✅ Login completed successfully
```

### 7.4. Hata Durumlarında Kontrol Listesi

❌ **"Something went wrong"** hatası alıyorsanız:
- [ ] Google Cloud Console > Authorized redirect URIs doğru mu?
- [ ] `https://auth.expo.io/@tipboxco/tipbox-app` eklendi mi?
- [ ] `app.json` > `owner` ve `slug` değerleri doğru mu?

❌ **Timeout** oluyorsa:
- [ ] Firebase Console > Google Sign-In enabled mi?
- [ ] Web Client ID ve Secret doğru girildi mi?
- [ ] `.env` dosyasında `FIREBASE_WEB_CLIENT_ID` doğru mu?

❌ **"Unauthorized"** hatası alıyorsanız:
- [ ] OAuth Consent Screen > Test users eklenmiş mi?
- [ ] Firebase Console > Authorized domains (`auth.expo.io`) eklenmiş mi?

---

## 📋 8. PRODUCTION DEPLOYMENT

### 8.1. OAuth Consent Screen'i Yayına Alın

**Navigation:** Google Cloud Console > OAuth consent screen

1. **PUBLISH APP** butonuna tıklayın
2. Google'ın onayını bekleyin (birkaç gün sürebilir)
3. Onaylanana kadar sadece test users giriş yapabilir

### 8.2. Production Redirect URI

Production build için redirect URI değişir:

**Expo Managed:**
```
https://auth.expo.io/@tipboxco/tipbox-app
```

**Standalone (Custom Native):**
```
tipboxapp://oauth/redirect
```

`app.json` > `scheme` değerinize göre değişir.

### 8.3. EAS Build

```bash
# Preview build (test için)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## 📋 9. ÖZET: YAPILANDIRMA CHECKLİSTİ

### Google Cloud Console ✅
- [ ] OAuth Consent Screen yapılandırıldı
- [ ] Scopes eklendi (openid, email, profile)
- [ ] Test users eklendi
- [ ] Authorized domains (`auth.expo.io`) eklendi
- [ ] OAuth 2.0 Client ID (Web application) oluşturuldu
- [ ] Authorized redirect URIs (`https://auth.expo.io/@tipboxco/tipbox-app`) eklendi
- [ ] Client ID ve Secret kaydedildi

### Firebase Console ✅
- [ ] Google Sign-In provider enabled
- [ ] Web Client ID ve Secret girildi
- [ ] Authorized domains (`auth.expo.io`) eklendi
- [ ] iOS app eklendi, GoogleService-Info.plist indirildi
- [ ] Android app eklendi, google-services.json indirildi

### Project Files ✅
- [ ] `GoogleService-Info.plist` root dizinde
- [ ] `google-services.json` root dizinde
- [ ] `app.json` > `ios.googleServicesFile` ayarlandı
- [ ] `app.json` > `android.googleServicesFile` ayarlandı
- [ ] `app.json` > `ios.infoPlist.CFBundleURLTypes` ayarlandı
- [ ] `.env` dosyası oluşturuldu ve değerler girildi
- [ ] `.env` dosyası `.gitignore`'da

### Code Changes ✅
- [ ] `GoogleService.ts` güncellendi (Code flow + PKCE)
- [ ] `firebase.config.ts` environment variables kullanıyor
- [ ] Timeout 60 saniye yapıldı

---

## 🔍 SORUN GİDERME

### Log Örnekleri

#### ✅ Başarılı Giriş:
```
[GoogleService] ✅ OAuth success
[GoogleService] 🔄 Exchanging authorization code for tokens...
[GoogleService] ✅ Token exchange successful
[GoogleService] ✅ Firebase sign-in successful
```

#### ❌ Redirect URI Hatası:
```
[GoogleService] ❌ OAuth error: redirect_uri_mismatch
```
**Çözüm:** Google Cloud Console > Authorized redirect URIs kontrol edin

#### ❌ Unauthorized Client:
```
[GoogleService] ❌ OAuth error: unauthorized_client
```
**Çözüm:** Firebase Console > Web Client ID doğru girilmiş mi kontrol edin

#### ❌ Invalid Grant:
```
[GoogleService] ❌ Token exchange error: invalid_grant
```
**Çözüm:** Client Secret doğru mu? Firebase Console'da kontrol edin

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Logları detaylı inceleyin
2. Bu dokümandaki checklist'i kontrol edin
3. Firebase Console ve Google Cloud Console ayarlarını tekrar gözden geçirin

**Yaygın Hatalar ve Çözümleri:** Yukarıdaki "Hata Durumlarında Kontrol Listesi" bölümüne bakın.

---

**Son Güncelleme:** 12 Ocak 2026
**Versiyon:** 2.0
**Platform:** React Native + Expo + Firebase Auth

