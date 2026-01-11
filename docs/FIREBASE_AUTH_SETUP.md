# Firebase Authentication Kurulum Rehberi

## Firebase Console'da Yapılması Gerekenler

### 1. iOS App Kaydının Kontrolü
- Firebase Console > Project Settings > Your apps
- iOS app'in kayıtlı olduğundan emin olun
- Bundle ID: `com.tipboxapp` ✅ (GoogleService-Info.plist'te mevcut)

### 2. Google Sign-In Method'unun Etkinleştirilmesi
1. Firebase Console > Authentication > Sign-in method
2. **Google** provider'ı seçin
3. **Enable** butonuna tıklayın
4. **Web SDK configuration** bölümünden **Web client ID**'yi kopyalayın
   - Bu değer `FIREBASE_WEB_CLIENT_ID` environment variable'ına eklenecek

### 3. OAuth 2.0 Client ID Yapılandırması
1. [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Firebase projenizle ilişkili OAuth 2.0 Client ID'leri kontrol edin:
   - **Web client** (Firebase Web SDK için)
   - **iOS client** (opsiyonel, native iOS için)
   - **Android client** (opsiyonel, native Android için)

### 4. Authorized Redirect URIs
Google Cloud Console > OAuth 2.0 Client ID > Authorized redirect URIs'ye şunları ekleyin:
- `tipboxapp://` (iOS/Android için)
- Web için: `https://your-domain.com` (eğer web versiyonu varsa)

### 5. Firebase Config Değerlerini Alma
Firebase Console > Project Settings > Your apps > iOS app'ten:
- **API Key**: `AIzaSyCYtlIx8i4NyvuxeRYTR_-8TB289SevIsc` ✅ (GoogleService-Info.plist'te mevcut)
- **Project ID**: `auth-tipbox-ee978` ✅
- **Storage Bucket**: `auth-tipbox-ee978.firebasestorage.app` ✅
- **Messaging Sender ID**: `917499418984` ✅ (GCM_SENDER_ID)
- **App ID**: `1:917499418984:ios:06251523caeccf9eb6dedd` ✅ (GOOGLE_APP_ID)

**Auth Domain** için:
- Firebase Console > Authentication > Settings
- **Authorized domains** bölümünden auth domain'i alın
- Format: `auth-tipbox-ee978.firebaseapp.com` veya `auth-tipbox-ee978.web.app`

## Environment Variables (.env dosyalarına eklenecek)

Aşağıdaki değerleri `.env.development`, `.env.test`, ve `.env.production` dosyalarına ekleyin:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyCYtlIx8i4NyvuxeRYTR_-8TB289SevIsc
FIREBASE_AUTH_DOMAIN=auth-tipbox-ee978.firebaseapp.com
FIREBASE_PROJECT_ID=auth-tipbox-ee978
FIREBASE_STORAGE_BUCKET=auth-tipbox-ee978.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=917499418984
FIREBASE_APP_ID=1:917499418984:ios:06251523caeccf9eb6dedd

# Google OAuth Client ID (Firebase Web SDK)
FIREBASE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_BURAYA
# veya alternatif olarak:
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_BURAYA
```

## Önemli Notlar

1. **FIREBASE_AUTH_DOMAIN**: Bu değer Firebase Console > Authentication > Settings'ten alınmalı
2. **FIREBASE_WEB_CLIENT_ID**: Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration'dan alınmalı
3. **GoogleService-Info.plist**: iOS native build için zaten yapılandırılmış ✅
4. **Bundle ID**: `com.tipboxapp` olarak ayarlanmış ✅

## Test Etme

Environment variables'ları ekledikten sonra:
1. Uygulamayı yeniden başlatın
2. Google Sign-In butonuna tıklayın
3. OAuth akışının çalıştığını kontrol edin

## Sorun Giderme

- **"FIREBASE_WEB_CLIENT_ID eksik" hatası**: Firebase Console'dan Web Client ID'yi alıp `.env` dosyasına ekleyin
- **"Invalid redirect URI" hatası**: Google Cloud Console'da authorized redirect URIs'ye `tipboxapp://` ekleyin
- **"Firebase config eksik" uyarısı**: Tüm Firebase environment variables'larının `.env` dosyasında olduğundan emin olun
