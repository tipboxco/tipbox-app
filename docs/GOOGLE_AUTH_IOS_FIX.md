# Google Auth iOS "Invalid Request" Hatası - Çözüm Rehberi

## Sorun
iOS'ta Google OAuth'ta "400: invalid_request" hatası alınıyor.

## Çözüm Adımları

### 1. Firebase Console'dan Güncel GoogleService-Info.plist İndirin

1. [Firebase Console](https://console.firebase.google.com/) > Projenizi seçin
2. Project Settings (⚙️) > Your apps > iOS app
3. **GoogleService-Info.plist** dosyasını indirin
4. Projenizdeki `GoogleService-Info.plist` dosyasını güncel olanla değiştirin

**Önemli:** `REVERSED_CLIENT_ID` key'i bu dosyada olmalı. Eğer yoksa:
- Firebase Console > Authentication > Sign-in method > Google'ı etkinleştirin
- Sonra tekrar plist dosyasını indirin

### 2. Google Cloud Console - OAuth Consent Screen

1. [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > OAuth consent screen
2. **Authorized domains** bölümüne şunları ekleyin:
   - `auth-tipbox-ee978.firebaseapp.com`
   - `auth-tipbox-ee978.web.app`
   - `auth.expo.io` (Expo proxy için)

### 3. Google Cloud Console - Authorized Redirect URIs

1. APIs & Services > Credentials > OAuth 2.0 Client ID (Web client)
2. **Authorized redirect URIs** bölümüne ekleyin:
   ```
   https://auth.expo.io/@tipboxco/tipbox-app
   ```

### 4. iOS Info.plist URL Scheme (Expo otomatik ekler)

Expo `app.json`'daki `scheme: "tipboxapp"` ayarını otomatik olarak Info.plist'e ekler. 
Eğer manuel kontrol etmek isterseniz:

Xcode'da:
1. `ios/Tipbox/Info.plist` dosyasını açın
2. `CFBundleURLTypes` bölümünü kontrol edin
3. Şu scheme'ler olmalı:
   - `tipboxapp` (app.json'dan)
   - `REVERSED_CLIENT_ID` (GoogleService-Info.plist'ten, eğer varsa)

### 5. OAuth Consent Screen - Test Users

Eğer OAuth Consent Screen "Testing" modundaysa:
1. Google Cloud Console > OAuth consent screen
2. **Test users** bölümüne test edecek email adreslerini ekleyin
3. Veya **Publish** butonuna tıklayarak Production moduna geçin

### 6. Environment Variables Kontrolü

`.env.development`, `.env.test`, `.env.production` dosyalarında:

```env
FIREBASE_WEB_CLIENT_ID=856776286796-25scvuu40b4av2qkuanfi6rttvcd98so.apps.googleusercontent.com
```

## Kontrol Listesi

- [ ] Firebase Console'dan güncel GoogleService-Info.plist indirildi
- [ ] GoogleService-Info.plist'te REVERSED_CLIENT_ID var mı kontrol edildi
- [ ] Google Cloud Console > OAuth consent screen > Authorized domains eklendi
- [ ] Google Cloud Console > Credentials > Authorized redirect URIs'ye `https://auth.expo.io/@tipboxco/tipbox-app` eklendi
- [ ] OAuth Consent Screen Production modunda veya test users eklendi
- [ ] Environment variables doğru tanımlı
- [ ] Uygulama yeniden build edildi

## Test

1. Uygulamayı yeniden başlatın
2. Google Sign-In butonuna tıklayın
3. Console loglarını kontrol edin:
   ```
   [GoogleService] 🔍 Redirect URI: https://auth.expo.io/@tipboxco/tipbox-app
   [GoogleService] 🔍 Client ID: 856776286796-25scvu...
   ```
4. OAuth akışı çalışmalı
