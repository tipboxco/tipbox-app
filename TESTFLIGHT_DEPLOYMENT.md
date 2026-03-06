# Tipbox One - TestFlight Deployment Checklist

## ⚠️ Önemli Not
App Store Connect'te app adını **"Tipbox One"** olarak kullanın (pipe karakteri "|" olmadan).
Pipe karakteri App Store tarafından kabul edilmez.

## 1️⃣ Hazırlık

- [ ] ios ve android klasörlerini sil (prebuild için)
- [ ] package.json bağımlılıklarını kontrol et
- [ ] app.json/eas.json konfigürasyonunu doğrula

## 2️⃣ Production Build

- [ ] EAS Production build başlat:
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Build tamamlanmasını bekle (~15-20 dakika)
- [ ] Build başarılı mı kontrol et

## 3️⃣ App Store Connect Hazırlığı

- [ ] https://appstoreconnect.apple.com'a git
- [ ] App bilgilerini kontrol et:
  - [ ] App Name: **"Tipbox One"** (pipe olmadan!)
  - [ ] Privacy Policy URL ekle (zorunlu)
  - [ ] App Description
  - [ ] Keywords
  - [ ] Support URL
  - [ ] Screenshots (en az 1 cihaz için)
  - [ ] App Category seç
  - [ ] Age Rating bilgilerini doldur

## 4️⃣ TestFlight'a Submit

- [ ] EAS submit komutunu çalıştır:
  ```bash
  eas submit --platform ios --profile production
  ```
- [ ] Build seç (en son production build)
- [ ] Submission tamamlanmasını bekle
- [ ] Apple'ın review'ını bekle (genellikle 1-2 saat)

## 5️⃣ Internal Tester Ekleme

- [ ] App Store Connect > TestFlight > Internal Testing
- [ ] "Internal Group" oluştur veya mevcut grubu seç
- [ ] Build'i gruba ekle
- [ ] Tester'ları ekle:
  - [ ] Email adresleriyle davet et
  - [ ] Veya mevcut App Store Connect kullanıcılarını ekle

## 6️⃣ Tester'ların Erişimi

Tester'lar için adımlar:
1. iPhone'da **TestFlight** uygulamasını indir (App Store'dan)
2. Email'deki davet linkine tıkla veya TestFlight'ı aç
3. "Tipbox One" uygulamasını bul
4. "Install" butonuna bas
5. Uygulamayı test et!

## 7️⃣ Güncelleme Süreci (gelecekte)

Yeni build yayınlamak için:
```bash
# 1. Version'ı güncelle (app.json)
# 2. Build al
eas build --platform ios --profile production

# 3. Submit et
eas submit --platform ios --profile production

# 4. TestFlight otomatik günceller (aynı version grubuna)
```

## 📱 Notlar

- **Internal tester limiti**: 100 kişi
- **External testing**: Daha fazla tester için (Apple review gerekir)
- **TestFlight build süresi**: 90 gün
- **Otomatik güncelleme**: Tester'lar uygulamayı açtığında otomatik güncellenir

## 🔧 Sorun Giderme

### Submit hatası alırsanız:
1. App Store Connect'te app name'de özel karakter var mı kontrol edin
2. Privacy Policy URL eklenmiş mi kontrol edin
3. EAS dashboard'tan detaylı hata logunu inceleyin

### Build hatası alırsanız:
1. `npm install` çalıştırın
2. `eas build:configure` ile yapılandırmayı kontrol edin
3. EAS dashboard'tan build loglarını inceleyin

---

**Durum**: ⏳ Başlanmadı
**Son Güncelleme**: 2026-03-06
