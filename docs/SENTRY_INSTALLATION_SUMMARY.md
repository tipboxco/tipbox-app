# Sentry Kurulum Özeti ✅

## 🎯 Yapılan İşlemler

### 1. ✅ Paket Kurulumu
```bash
npm install @sentry/react-native
```

### 2. ✅ Konfigürasyon Dosyası
- `src/config/sentry.config.ts` oluşturuldu
- Development'ta devre dışı, production'da aktif
- Akıllı error filtering (network hatalarını göz ardı eder)

### 3. ✅ App Entegrasyonu
- `index.ts`: Sentry başlatma kodu eklendi (en başta)
- `app.json`: Sentry DSN alanı eklendi (şu an boş)
- LogBox: Sentry warning'leri ignore edildi

### 4. ✅ API Error Tracking
- `src/services/ApiService/interceptors.ts`: Otomatik API error tracking
- Sadece kritik hatalar track edilir (5xx server errors)
- 401, 404, network errors filtrelenir

## 🔒 Güvenlik ve Kontrol

### Aktif Filtreler
- ❌ Network errors (timeout, ECONNREFUSED)
- ❌ 401 (Authentication errors)
- ❌ 404 (Not found errors)
- ❌ Console logs (breadcrumb)
- ✅ 500+ Server errors
- ✅ JavaScript crashes
- ✅ Native crashes
- ✅ Unhandled promises

### Development vs Production
| Özellik | Development | Production |
|---------|-------------|------------|
| Sentry | ❌ Devre dışı | ✅ Aktif (DSN varsa) |
| Console logs | ✅ Görünür | ✅ Görünür |
| Error tracking | ❌ Yok | ✅ Sentry'ye gönderilir |
| Performance | ❌ Tracking yok | ✅ %20 sampling |

## 🚀 Kullanıma Hazır

### Şu An Durum
- ✅ Kurulum tamamlandı
- ✅ Development'ta çalışmaya hazır (disabled mode)
- ⚠️ Production için DSN gerekli

### Production için Aktivasyon
1. [sentry.io](https://sentry.io) adresinde proje oluştur
2. DSN al
3. `app.json` → `extra.sentryDsn` alanına ekle
4. Production build yap

## 📝 Örnek Kullanım

### Otomatik Tracking (Zaten Aktif)
```typescript
// API errors otomatik track edilir
const data = await apiService.get('/endpoint'); // 5xx errors → Sentry

// JavaScript crashes otomatik track edilir
throw new Error('Critical error'); // → Sentry
```

### Manuel Tracking
```typescript
import { Sentry } from '@/src/config/sentry.config';

// Error loglama
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Custom message
Sentry.captureMessage('Payment completed', 'info');

// User context
Sentry.setUser({
  id: user.id,
  email: user.email,
});

// Breadcrumb (debugging için)
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked checkout',
  level: 'info',
});
```

## 🎨 Gelişmiş Özellikler

### Performance Monitoring
- ✅ Navigation tracking
- ✅ API request duration
- ✅ App startup time
- ⚙️ Sample rate: %20

### Session Tracking
- ✅ User sessions
- ✅ Crash-free rate
- ✅ App stability metrics

### Release Tracking
- ✅ Version tracking (otomatik)
- ✅ Build number tracking
- ✅ Source maps (production build'de otomatik)

## 📚 Dokümantasyon

Detaylı kullanım için:
- `docs/SENTRY_SETUP.md` - Kurulum ve kullanım rehberi
- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)

## ⚠️ Önemli Notlar

1. **Development'ta test etmek için:**
   - `src/config/sentry.config.ts` → `__DEV__` check'ini geçici olarak kaldır
   - Test et
   - Geri koy

2. **DSN olmadan:**
   - Sentry başlatılmaz
   - Hata vermez
   - Console'da "Disabled" mesajı görünür

3. **Production build:**
   - Source maps otomatik yüklenir
   - App version otomatik track edilir
   - DSN varsa Sentry aktif olur

## 🔗 Yararlı Linkler

- [Sentry Dashboard](https://sentry.io)
- [Error Filtering](https://docs.sentry.io/platforms/react-native/configuration/filtering/)
- [Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)

## ✨ Sonuç

Sentry başarıyla kuruldu ve production'a hazır! 🎉

**Şu an yapman gereken:**
1. ✅ Kod yazmaya devam et (Sentry pasif)
2. Production'a geçmeden önce:
   - Sentry.io'da proje oluştur
   - DSN'i app.json'a ekle
   - Test et
   - Deploy et
