# Sentry Error Tracking Kurulumu

Sentry, production ortamında oluşan hataları takip etmek için kullanılır.

## ✅ Kurulum Tamamlandı

Sentry paketi yüklendi ve konfigüre edildi. Şu an **development modunda devre dışı**.

## 🔧 Production için Aktifleştirme

### 1. Sentry Projesi Oluştur

1. [sentry.io](https://sentry.io) adresine git
2. Yeni bir proje oluştur (React Native)
3. DSN (Data Source Name) key'ini kopyala

### 2. DSN'i Ekle

`app.json` dosyasında `extra.sentryDsn` alanına DSN'i ekle:

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://your-dsn-key@sentry.io/project-id"
    }
  }
}
```

### 3. Build Yap

Production build yaptığında Sentry otomatik olarak aktif hale gelecek.

## 📊 Davranış

### Development Mode
- ❌ Sentry devre dışı
- ✅ Hatalar console'da görünür
- ✅ Error boundary'ler normal çalışır

### Production Mode
- ✅ Sentry aktif (DSN varsa)
- ✅ Tüm hatalar Sentry'ye gönderilir
- ✅ Network hataları filtrelenir (gürültü azaltmak için)

## 🎯 Özellikler

### Otomatik Tracking
- ✅ JavaScript hataları
- ✅ Native crash'ler (iOS/Android)
- ✅ Unhandled promise rejections
- ✅ Network performance
- ✅ Navigation tracking
- ✅ User session tracking

### Filtreleme
- ❌ Network errors (timeout, ECONNREFUSED vb.)
- ❌ Console logs (breadcrumb)
- ✅ Application errors
- ✅ Crash reports

## 📝 Manuel Error Logging

Kodda manuel olarak hata loglamak için:

\`\`\`typescript
import { Sentry } from '@/src/config/sentry.config';

// Error loglama
try {
  // Risky operation
} catch (error) {
  Sentry.captureException(error);
}

// Custom event loglama
Sentry.captureMessage('Custom event happened', 'info');

// User context ekleme
Sentry.setUser({
  id: userId,
  email: userEmail,
  username: userName,
});

// Breadcrumb ekleme (debugging için)
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked payment button',
  level: 'info',
});
\`\`\`

## 🔍 Performance Monitoring

Sentry aynı zamanda performance tracking yapar:
- ✅ Navigation transitions
- ✅ API request duration
- ✅ App startup time
- ⚙️ Sample rate: %20 (production'da düşük tutuldu)

## 🚨 Önemli Notlar

1. **DSN olmadan production build yaparsanız:** Sentry çalışmaz, hata vermez
2. **Development'ta test etmek için:** `src/config/sentry.config.ts` içinde `__DEV__` check'ini kaldırabilirsiniz
3. **Source maps:** Production build'de otomatik olarak yüklenir (Expo build process)
4. **Release tracking:** App version otomatik olarak track edilir

## 🔗 Faydalı Linkler

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Dashboard](https://sentry.io)
- [Error Filtering Best Practices](https://docs.sentry.io/platforms/react-native/configuration/filtering/)

## 🎨 Örnek Kullanım Senaryoları

### API Error Tracking
\`\`\`typescript
try {
  const response = await apiService.get('/endpoint');
} catch (error) {
  // API hatalarını Sentry'ye gönder
  Sentry.captureException(error, {
    tags: {
      endpoint: '/endpoint',
      method: 'GET',
    },
  });
}
\`\`\`

### Payment Error Tracking
\`\`\`typescript
try {
  await processPayment(amount);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'payment',
      amount: amount.toString(),
    },
    level: 'error',
  });
}
\`\`\`

### User Action Tracking
\`\`\`typescript
Sentry.addBreadcrumb({
  category: 'user-action',
  message: \`User added product \${productId} to cart\`,
  level: 'info',
  data: {
    productId,
    quantity,
  },
});
\`\`\`
