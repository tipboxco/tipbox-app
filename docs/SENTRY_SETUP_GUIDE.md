# Sentry Tracing Setup - Tamamlandı! ✅

## 🎉 Yapılan Değişiklikler

### 1. **Tracing Konfigürasyonu** (src/config/sentry.config.ts)

#### Eklenen Özellikler:
- ✅ **User Interaction Tracking**: Touch event'leri ve UI etkileşimleri
- ✅ **Dynamic Sample Rate**: Dev'de %100, production'da %20
- ✅ **Advanced ReactNativeTracing**:
  - Span filtering (asset request'leri filtreleniyor)
  - Custom span attributes (API version tagging)
  - Transaction timeout ayarları
- ✅ **Gesture Tracking Helper**: `sentryTraceGesture()` fonksiyonu

### 2. **App Wrapper** (App.tsx)
```typescript
export default Sentry.wrap(App, {
  touchEventBoundaryProps: { labelName: 'sentry-label' }
});
```

### 3. **Source Maps Konfigürasyonu**

#### Metro Config (metro.config.js)
```javascript
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const config = getSentryExpoConfig(__dirname);
```
- Source map'lere Debug ID injection yapılıyor
- Build sırasında unique identifier'lar atanıyor

#### Expo Plugin (app.json)
```json
{
  "plugins": [
    ["@sentry/react-native/expo", {
      "organization": "tipbox-rh",
      "project": "tipbox-app",
      "url": "https://sentry.io/"
    }]
  ]
}
```

### 4. **Auth Token Template**
- `.sentryclirc.example` dosyası oluşturuldu
- `.sentryclirc` gitignore'a eklendi (güvenlik)

---

## 🔑 SONRAKİ ADIM: Sentry Auth Token Eklemek

Source map'lerin upload edilebilmesi için Sentry auth token'ı gerekli.

### Adım 1: Token Oluştur
1. https://sentry.io/settings/account/api/auth-tokens/ adresine git
2. **"Create New Token"** butonuna tıkla
3. Token adı: `tipbox-app-sourcemaps`
4. **Gerekli scope'lar:**
   - ✅ `project:read`
   - ✅ `project:write`
   - ✅ `project:releases`
   - ✅ `org:read`
5. Token'ı kopyala

### Adım 2: Token'ı Yapılandır

#### Option A: .sentryclirc Dosyası (Önerilen - Local Development)
```bash
# .sentryclirc.example dosyasını kopyala
cp .sentryclirc.example .sentryclirc

# .sentryclirc dosyasını düzenle ve token'ı ekle
# [auth]
# token=YOUR_ACTUAL_TOKEN_HERE
```

#### Option B: Environment Variable (Önerilen - CI/CD)
```bash
# .env.production dosyasına ekle
SENTRY_AUTH_TOKEN=your_actual_token_here
```

**UYARI:** Token'ı asla git'e commit etme! `.sentryclirc` ve `.env` dosyaları zaten .gitignore'da.

---

## 🚀 Build ve Deploy

### Development Build
```bash
# Source map'ler otomatik upload edilmez (dev build)
npx expo run:ios
npx expo run:android
```

### Production Build (EAS)
```bash
# Source map'ler otomatik upload edilir
# Auth token .sentryclirc veya SENTRY_AUTH_TOKEN env'den alınır
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Build Sırasında Olacaklar:
1. 📦 Metro bundle oluşturulur
2. 🔑 Her bundle'a unique Debug ID atanır
3. 🗺️ Source map'ler generate edilir
4. ⬆️ Source map'ler Sentry'ye upload edilir
5. 🔗 Release bilgisi Sentry'de oluşturulur

---

## 🧪 Test Etme

### 1. Development'ta Test
```typescript
import { Sentry } from '@/src/config/sentry.config';

// Test transaction
const transaction = Sentry.startTransaction({
  name: 'Test.Transaction',
  op: 'test',
});

transaction.finish();
```

Development build'de console'da göreceksiniz:
```
[Sentry] 📤 Sending transaction to Sentry
```

### 2. Production'da Doğrulama
1. Production build yapın
2. Sentry dashboard'a gidin: https://sentry.io/organizations/tipbox-rh/projects/tipbox-app/
3. **Performance** sekmesine gidin
4. Transaction'ları görün:
   - Navigation events (HomeScreen, ProfileScreen, vb.)
   - User interactions (button clicks)
   - API calls
   - Custom transactions

### 3. Source Maps Doğrulama
1. Sentry'de bir error'a tıklayın
2. Stack trace'de dosya isimleri ve satır numaraları görünmeli
3. ❌ Eğer minified görünüyorsa: Source map upload başarısız
4. ✅ Eğer okunabilir: Source maps çalışıyor!

---

## 📊 Otomatik İzlenen Metrikler

### App Performance
- ⏱️ **App Start Time**: Cold & warm start
- 🖼️ **UI Performance**: Slow/frozen frames
- 🔄 **Event Loop Stalls**: JS thread blocking

### Navigation
- 📱 **Screen Changes**: React Navigation tracking
- ⏲️ **Screen Load Times**: Time to interactive

### Network
- 🌐 **API Calls**: Request/response times
- 📡 **Trace Propagation**: Backend distributed tracing
- ❌ **Failed Requests**: Error tracking

### User Interactions
- 👆 **Touch Events**: Button clicks, gestures
- 📜 **Scroll Events**: List scrolling performance
- 🎯 **Custom Gestures**: RNGH gesture tracking

---

## 🎯 Kullanım Örnekleri

### Custom Transaction
```typescript
import { Sentry } from '@/src/config/sentry.config';

const transaction = Sentry.startTransaction({
  name: 'Post.Create',
  op: 'task',
  tags: { 'post.type': 'experience' },
});

const uploadSpan = transaction.startChild({
  op: 'upload',
  description: 'Upload images',
});

await uploadImages();
uploadSpan.finish();

transaction.setStatus('ok');
transaction.finish();
```

### Gesture Tracking
```typescript
import { Gesture } from 'react-native-gesture-handler';
import { sentryTraceGesture } from '@/src/config/sentry.config';

const pinch = Gesture.Pinch().onUpdate(() => {});
const longPress = Gesture.LongPress().onStart(() => {});

const gesture = Gesture.Race(
  sentryTraceGesture("pinch-to-zoom", pinch),
  sentryTraceGesture("long-press", longPress)
);
```

### UI Labels
```tsx
<Pressable
  sentry-label="send-money-button"
  onPress={handleSend}
>
  <Text>Para Gönder</Text>
</Pressable>
```

---

## 🔧 Troubleshooting

### Source Maps Upload Edilmiyor
**Problem:** Build sırasında "401 Unauthorized" hatası

**Çözüm:**
1. Sentry auth token'ın doğru olduğundan emin ol
2. Token scope'larını kontrol et (project:write, project:releases)
3. `.sentryclirc` veya `SENTRY_AUTH_TOKEN` env var'ın set olduğundan emin ol

### Stack Trace Minified Görünüyor
**Problem:** Error'larda dosya isimleri okunmuyor

**Çözüm:**
1. Production build yaptığından emin ol (dev build source map upload etmez)
2. `metro.config.js`'de `getSentryExpoConfig` kullanıldığından emin ol
3. Build log'larında "Uploading source maps to Sentry" mesajını ara

### Transaction'lar Görünmüyor
**Problem:** Sentry dashboard'da performance data yok

**Çözüm:**
1. `tracesSampleRate` ayarını kontrol et (0.0 olmamalı)
2. Dev mode'da `tracesSampleRate: 1.0` olmalı
3. `enableUserInteractionTracing: true` olduğundan emin ol
4. Navigation ref'in `routingInstrumentation.registerNavigationContainer()` ile kayıtlı olduğunu kontrol et

---

## 📚 Daha Fazla Bilgi

- [Sentry React Native Tracing Docs](https://docs.sentry.io/platforms/react-native/tracing/)
- [Expo Source Maps Setup](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [Tracing Usage Guide](./SENTRY_TRACING.md)

---

## ✅ Checklist

- [x] Sentry tracing konfigüre edildi
- [x] User interaction tracking aktif
- [x] App wrapper eklendi
- [x] Metro config güncellendi (source maps)
- [x] Expo plugin eklendi
- [x] .sentryclirc template oluşturuldu
- [x] .gitignore güncellendi
- [ ] **Sentry auth token ekle** (.sentryclirc veya SENTRY_AUTH_TOKEN)
- [ ] Production build yap ve test et
- [ ] Source maps'in upload edildiğini doğrula

---

## 🎊 Sonuç

Sentry tracing tam olarak entegre edildi! Sadece **auth token eklemen** gerekiyor, sonra production build yapıp test edebilirsin.

**Development'ta şu anda:**
- ✅ Tracing çalışıyor
- ✅ Navigation tracking aktif
- ✅ User interaction tracking aktif
- ⚠️ Source maps upload edilmiyor (auth token gerekli)

**Production build sonrası:**
- ✅ Source maps otomatik upload edilecek
- ✅ Stack trace'ler okunabilir olacak
- ✅ Release tracking çalışacak
