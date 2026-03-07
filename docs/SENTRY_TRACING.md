# Sentry Performance Tracing - Kullanım Kılavuzu

Sentry tracing uygulamanızda performance sorunlarını tespit etmenize ve optimize etmenize yardımcı olur.

## 🎯 Otomatik Olarak İzlenen Özellikler

Aşağıdaki metrikler otomatik olarak izlenir:

### 1. **App Start Tracking**
- Uygulamanın açılış süresi (cold start & warm start)
- `measurements.app_start_cold` ve `measurements.app_start_warm` metrikleri

### 2. **Navigation Tracking**
- Sayfa geçişleri ve navigasyon performansı
- React Navigation ile otomatik entegrasyon

### 3. **Network Requests**
- Tüm `fetch` ve `XMLHttpRequest` istekleri
- API response süreleri
- Trace propagation (API server'a Sentry trace header'ları gönderilir)

### 4. **UI Performance**
- Slow frames ve frozen frames
- UI render süreleri
- JavaScript event loop stall'ları

### 5. **User Interactions**
- Touch event'leri ve UI etkileşimleri
- Button click'leri, scroll event'leri vb.

## 🚀 Manuel Tracing Kullanımı

### Custom Transaction Oluşturma

```typescript
import { Sentry } from '@/src/config/sentry.config';

// Transaction başlat
const transaction = Sentry.startTransaction({
  name: 'Post.Create',
  op: 'task',
  tags: {
    'post.type': 'experience',
  },
});

try {
  // İşlemleri yap
  await createPost(data);

  // Başarılı - transaction'ı sonlandır
  transaction.setStatus('ok');
} catch (error) {
  // Hata oluştu
  transaction.setStatus('internal_error');
  Sentry.captureException(error);
} finally {
  transaction.finish();
}
```

### Child Span Ekleme

```typescript
import { Sentry } from '@/src/config/sentry.config';

const transaction = Sentry.startTransaction({
  name: 'Wallet.Send',
  op: 'task',
});

// Child span - resim upload
const imageSpan = transaction.startChild({
  op: 'upload',
  description: 'Upload profile image',
});

await uploadImage(file);
imageSpan.finish();

// Child span - API call
const apiSpan = transaction.startChild({
  op: 'http.client',
  description: 'POST /api/wallet/send',
});

await sendMoney(data);
apiSpan.finish();

transaction.finish();
```

### Gesture Tracking (React Native Gesture Handler)

```typescript
import { Gesture } from 'react-native-gesture-handler';
import { sentryTraceGesture } from '@/src/config/sentry.config';

// Gesture'ları Sentry ile track et
const pinchGesture = Gesture.Pinch()
  .onUpdate((e) => {
    // Pinch logic
  });

const longPressGesture = Gesture.LongPress()
  .onStart(() => {
    // Long press logic
  });

// Sentry tracing ile wrap et
const gesture = Gesture.Race(
  sentryTraceGesture("pinch-to-zoom", pinchGesture),
  sentryTraceGesture("long-press-action", longPressGesture)
);

// GestureDetector'de kullan
<GestureDetector gesture={gesture}>
  <View>...</View>
</GestureDetector>
```

### User Interaction Labels

UI component'lerine `sentry-label` prop'u ekleyerek daha anlamlı event isimleri oluşturabilirsiniz:

```tsx
import { Pressable, Text } from 'react-native';

// Sentry UI interaction tracking için label ekle
<Pressable
  sentry-label="send-money-button"
  onPress={handleSendMoney}
>
  <Text>Para Gönder</Text>
</Pressable>

// Bu touch event Sentry'de şu şekilde görünür:
// Transaction: "HomeScreen" (screen name)
// Span: "ui.action.press" - "send-money-button"
```

### Custom Span Attributes (Experimental)

```tsx
import { Pressable } from 'react-native';

<Pressable
  sentry-label="premium-feature"
  sentry-span-attributes={{
    'user.tier': 'premium',
    'feature.id': 'dark-mode-toggle',
    'ab_test.variant': 'control',
  }}
  onPress={handlePremiumFeature}
>
  <Text>Premium Özellik</Text>
</Pressable>
```

## ⚙️ Konfigürasyon Ayarları

### Sample Rate

```typescript
// src/config/sentry.config.ts
tracesSampleRate: __DEV__ ? 1.0 : 0.2
// Development: %100 transaction'lar track edilir
// Production: %20 transaction'lar track edilir (cost optimization)
```

### Trace Propagation

```typescript
tracePropagationTargets: ['api-test.tipbox.co', 'api.tipbox.co']
// Bu domain'lere yapılan isteklere Sentry trace header'ları eklenir
// Backend'de distributed tracing için gerekli
```

### Span Filtering

Gereksiz span'ları filtreleyerek noise'i azaltın:

```typescript
shouldCreateSpanForRequest: (url) => {
  // Asset request'lerini filtrele
  if (url.includes('/assets/') || url.includes('.png')) {
    return false;
  }
  return true;
}
```

### Transaction Timeout

```typescript
idleTimeoutMs: 1000        // 1 saniye idle kalırsa transaction sonlanır
finalTimeoutMs: 600000     // Maximum 10 dakika (uzun transaction'lar için)
```

## 📊 Sentry Dashboard'da Görüntüleme

1. **Performance** sekmesine gidin
2. **Transactions** listesinde:
   - Navigation transaction'ları (örn: "HomeScreen", "ProfileScreen")
   - Custom transaction'lar (örn: "Post.Create", "Wallet.Send")
3. Her transaction'a tıklayarak:
   - Waterfall chart (span timeline)
   - Network requests
   - User interactions
   - Error rates

## 🎯 Best Practices

### ✅ DO
- Critical user flow'ları custom transaction ile izleyin (login, checkout, post create)
- Network request'lere meaningful description'lar ekleyin
- UI component'lerine `sentry-label` ekleyin
- Production'da sample rate'i düşük tutun (0.1 - 0.3)

### ❌ DON'T
- Her küçük fonksiyonu transaction yapmayın (noise yaratır)
- Sensitive data'yı span attribute'larında göndermeyin
- Asset request'leri track etmeyin (çok fazla span)
- Development'ta sample rate'i düşük tutmayın (debugging zorlaşır)

## 🔍 Debugging

Development build'de Sentry console log'ları aktiftir:

```bash
[Sentry] ✅ Initialized successfully
[Sentry] 📤 Sending error to Sentry: Error message
[Sentry] 🚫 Filtered network error (not sent)
```

## 📚 Daha Fazla Bilgi

- [Sentry React Native Tracing Docs](https://docs.sentry.io/platforms/react-native/tracing/)
- [Performance Best Practices](https://docs.sentry.io/product/performance/best-practices/)
- [Custom Instrumentation](https://docs.sentry.io/platforms/react-native/tracing/instrumentation/custom-instrumentation/)
