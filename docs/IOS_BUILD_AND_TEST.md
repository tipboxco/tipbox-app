# 📱 iOS Development Build ve Test Rehberi

## 🎯 EAS Build ile iOS'ta Google Auth Test Etme

### Ön Gereksinimler

```bash
# EAS CLI kurulu değilse
npm install -g eas-cli

# Expo hesabına giriş yapın
eas login
```

---

## 📋 1. EAS Build Yapılandırması

### 1.1. eas.json Dosyasını Kontrol Edin

**Dosya:** `eas.json` (root dizinde)

Eğer yoksa oluşturun:

```bash
eas build:configure
```

Örnek `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 📱 2. iOS Development Build Alma

### Seçenek A: Simulator için Build (Hızlı Test)

```bash
# Simulator build (Mac'te test etmek için)
eas build --profile development --platform ios --local

# Veya cloud build
eas build --profile development --platform ios
```

**Not:** Simulator build'de **Google Auth çalışmayabilir** (native dependencies). Gerçek cihazda test etmeniz önerilir.

### Seçenek B: Gerçek iOS Cihaz için Build ✅ (ÖNERİLEN)

```bash
# Development build - gerçek cihaz için
eas build --profile development --platform ios
```

**İlk kez build alıyorsanız, EAS şunları soracak:**

1. **Bundle Identifier:** `com.tipboxapp` (app.json'dan otomatik alacak)
2. **Apple Developer Account:** Apple ID ve şifreniz
3. **Distribution Certificate:** Otomatik oluşturacak (ilk kez)
4. **Provisioning Profile:** Otomatik oluşturacak

**⚠️ Önemli:** 
- Apple Developer hesabınız olmalı (ücretsiz veya ücretli)
- Ücretsiz hesapla **maksimum 3 cihaz** ekleyebilirsiniz
- Test cihazınızın **UDID**'sini eklemeniz gerekecek

---

## 📲 3. Test Cihazını (iPhone) Ekleme

### 3.1. UDID Bulma

**Yöntem 1: Finder (macOS Catalina+)**
1. iPhone'u Mac'e bağlayın
2. **Finder** açın
3. Sol taraftan iPhone'unuzu seçin
4. iPhone adının altındaki bilgilere tıklayın (seri numarası, UDID gösterilecek)
5. UDID'yi kopyalayın

**Yöntem 2: Xcode**
1. Xcode açın
2. **Window > Devices and Simulators**
3. iPhone'unuzu seçin
4. **Identifier** (UDID) gösterilecek

**Yöntem 3: Web (en kolay)**
1. https://udid.tech/ adresine gidin
2. iPhone'dan sayfayı açın
3. Profili yükleyin
4. UDID gösterilecek

### 3.2. UDID'yi EAS'a Ekleme

```bash
# Cihaz kaydı (interactive)
eas device:create

# Veya direkt UDID ile
eas device:create --udid YOUR-UDID-HERE
```

**Örnek:**
```bash
eas device:create --udid 00008110-000123456789ABCD
```

EAS size şunları soracak:
- **Device name:** "Ömer'in iPhone" gibi
- **Device UDID:** (otomatik doldurulacak)

### 3.3. Provisioning Profile Güncelleme

UDID ekledikten sonra yeni build alın:

```bash
eas build --profile development --platform ios
```

EAS provisioning profile'ı otomatik güncelleyecek.

---

## 🚀 4. Build'i İndirme ve Yükleme

### 4.1. Build Tamamlandığında

Build tamamlandığında (10-20 dakika sürer):

```bash
# Build listesini görüntüle
eas build:list

# Veya web'den: https://expo.dev/accounts/tipboxco/projects/tipbox-app/builds
```

### 4.2. iPhone'a Yükleme

**Yöntem 1: QR Kod ile (EN KOLAY) ✅**

1. Build tamamlandığında EAS size bir **link** verecek
2. iPhone'da **Safari** ile linki açın
3. **Install** butonuna basın
4. İzinleri onaylayın
5. Ana ekranda Tipbox uygulaması görünecek

**Yöntem 2: TestFlight (Daha profesyonel)**

```bash
# Production/Preview build ile
eas build --profile preview --platform ios

# TestFlight'a gönder
eas submit --platform ios --profile preview
```

TestFlight kullanımı:
1. iPhone'da **TestFlight** uygulamasını indirin
2. Davet linkini açın
3. Uygulamayı TestFlight'tan yükleyin

---

## 🧪 5. Google Auth Test Etme

### 5.1. İlk Açılış

1. iPhone'da Tipbox uygulamasını açın
2. **"Google ile Giriş"** butonuna tıklayın
3. Safari açılacak ve Google hesap seçimi gösterilecek
4. Hesabınızı seçin
5. İzinleri onaylayın
6. Uygulama otomatik açılacak ve giriş yapılacak ✅

### 5.2. Beklenen Davranış

**✅ Başarılı:**
- Google hesap seçim ekranı açılır
- Hesabı seçtikten sonra uygulama otomatik açılır
- Ana sayfaya yönlendirilirsiniz
- **"Something went wrong" hatası YOK**
- **Timeout YOK**

**❌ Sorun Yaşarsanız:**
- **"Safari cannot open the page"**: Redirect URI yanlış (Google Cloud Console kontrol edin)
- **Timeout**: Firebase Console ayarları eksik
- **App açılmıyor**: `app.json` > `scheme` ve URL scheme'leri kontrol edin

### 5.3. Log Kontrolü (Metro)

Mac'te Metro bundler çalışıyor olmalı:

```bash
# Expo dev client ile logları görmek için
npx expo start --dev-client
```

iPhone'dan QR kodu okutun ve logları terminal'de görün.

---

## 🔧 6. Yaygın Sorunlar ve Çözümleri

### Sorun 1: "Unable to install app"

**Neden:** UDID provisioning profile'a eklenmemiş

**Çözüm:**
```bash
eas device:create --udid YOUR-UDID
eas build --profile development --platform ios
```

### Sorun 2: "App is damaged and can't be opened"

**Neden:** Developer certificate güvenilir değil

**Çözüm:**
1. iPhone'da **Settings > General > VPN & Device Management**
2. Developer App bölümünde **Expo** veya sizin profilinizi bulun
3. **Trust** butonuna basın

### Sorun 3: Google Auth çalışmıyor

**Kontrol Listesi:**
- [ ] `GoogleService-Info.plist` root dizinde mi?
- [ ] `app.json` > `ios.googleServicesFile` doğru mu?
- [ ] `app.json` > `ios.infoPlist.CFBundleURLTypes` doğru mu?
- [ ] `.env` dosyasında tüm değerler doğru mu?
- [ ] Google Cloud Console > Redirect URI: `https://auth.expo.io/@tipboxco/tipbox-app`

### Sorun 4: Build'de "GoogleService-Info.plist not found"

**Çözüm:**
```bash
# GoogleService-Info.plist'in root dizinde olduğundan emin olun
ls -la GoogleService-Info.plist

# eas.json'a credential ekleyin
```

---

## 📋 7. Development Build vs Production Build

### Development Build
- **Expo dev client** içerir
- **Hot reload** çalışır
- **Debug** modu
- Metro bundler gerekli
- **Google Auth çalışır** ✅

### Production Build
- Standalone app
- Tüm kodlar bundle'lanmış
- **Hızlı** (native performans)
- Metro bundler gerekmez
- App Store'a gönderilebilir

---

## 🎯 8. Hızlı Başlangıç Komutları

```bash
# 1. EAS Login
eas login

# 2. Build yapılandır (ilk kez)
eas build:configure

# 3. Cihaz ekle (UDID)
eas device:create

# 4. Development build al (iOS)
eas build --profile development --platform ios

# 5. Build listesini gör
eas build:list

# 6. Metro bundler başlat
npx expo start --dev-client

# 7. QR kodu iPhone'dan okut veya build linkinden yükle
```

---

## 📊 Build Profilleri Karşılaştırması

| Profil | Kullanım | Hot Reload | Google Auth | UDID Gerekli |
|--------|----------|------------|-------------|--------------|
| **development** | Development/Debug | ✅ Var | ✅ Çalışır | ✅ Gerekli |
| **preview** | Internal test | ❌ Yok | ✅ Çalışır | ✅ Gerekli |
| **production** | App Store | ❌ Yok | ✅ Çalışır | ❌ Gerekmez |

---

## 🔐 Güvenlik Notları

### Apple Developer Hesabı

**Ücretsiz Apple ID:**
- ✅ Development build alabilirsiniz
- ✅ Maksimum 3 cihaz
- ✅ 7 günlük sertifika (7 günde bir yenilenir)
- ❌ TestFlight kullanılamaz
- ❌ App Store'a gönderilemez

**Ücretli Apple Developer ($99/yıl):**
- ✅ Unlimited cihaz
- ✅ 1 yıllık sertifika
- ✅ TestFlight kullanılır
- ✅ App Store'a gönderilebilir

---

## 🎓 Özet

### Google Auth test etmek için:

1. **EAS CLI kur:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Cihaz UDID'sini ekle:**
   ```bash
   eas device:create
   ```

3. **Development build al:**
   ```bash
   eas build --profile development --platform ios
   ```

4. **iPhone'a yükle:**
   - Build linkini Safari'den aç
   - Install butonuna bas

5. **Test et:**
   - Google ile giriş butonuna tıkla
   - Başarılı ✅

---

## 📞 Yardım

**EAS Build dokümantasyonu:**
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/build-reference/ios-builds/

**Sorun yaşarsanız:**
```bash
# Build loglarını görüntüle
eas build:view BUILD-ID

# Cihazları listele
eas device:list

# Credential'ları kontrol et
eas credentials
```

---

**Son Güncelleme:** 12 Ocak 2026
**Platform:** iOS + EAS Build + Google Auth

