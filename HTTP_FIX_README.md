# HTTP Bağlantı Sorunu Çözümü

## 🔴 Sorun
iOS'ta HTTP istekleri `Network Error` veriyor çünkü iOS App Transport Security (ATS) HTTP isteklerini engelliyor.

## ✅ Çözüm Adımları

### 1. Development Build Yapın (Zorunlu)

Expo Go kullanıyorsanız, `app.json`'daki ATS ayarları çalışmaz. Native build yapmanız gerekiyor:

```bash
# iOS için native build
npx expo run:ios

# Veya EAS Build ile
eas build --platform ios --profile development
```

### 2. Uygulamayı Yeniden Başlatın

Build tamamlandıktan sonra:
```bash
# Development server'ı başlatın
npm start

# iOS simulator'da çalıştırın
# Build otomatik olarak simulator'da açılacak
```

### 3. Alternatif: Android'de Test Edin

Android'de HTTP sorunu genellikle olmaz. Test için:
```bash
npx expo run:android
```

## 📝 Yapılan Değişiklikler

`app.json` dosyasına şu ATS ayarları eklendi:

```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": true,
  "NSAllowsArbitraryLoadsInWebContent": true,
  "NSAllowsLocalNetworking": true,
  "NSExceptionDomains": {
    "188.245.150.117": {
      "NSExceptionAllowsInsecureHTTPLoads": true,
      "NSIncludesSubdomains": true,
      "NSExceptionRequiresForwardSecrecy": false,
      "NSExceptionMinimumTLSVersion": "TLSv1.0"
    }
  }
}
```

## ⚠️ Önemli Notlar

1. **Expo Go Çalışmaz**: Expo Go kullanıyorsanız, ATS ayarları uygulanmaz. Development build yapmanız gerekir.

2. **Native Build Gerekli**: `app.json` ayarlarının çalışması için native build yapılmalı.

3. **Production'da Dikkat**: `NSAllowsArbitraryLoads: true` tüm HTTP isteklere izin verir. Production'da sadece gerekli domain'ler için exception kullanın.

4. **İdeal Çözüm**: Sunucuyu HTTPS'e geçirmek en güvenli çözümdür.

## 🔍 Test

Build yaptıktan sonra register endpoint'ini test edin. Console'da response görmelisiniz.

