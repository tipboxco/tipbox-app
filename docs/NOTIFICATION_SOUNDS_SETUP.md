# Özel Bildirim Sesleri Kurulumu

## ⚠️ Önemli: Expo Go Sınırlaması

**Expo Go'da özel bildirim sesleri çalışmaz!**

Özel bildirim seslerini test etmek için:
- ✅ **Development Build** gerekir (`npx expo run:ios` veya `npx expo run:android`)
- ✅ **Production Build** gerekir (EAS Build)
- ❌ **Expo Go** desteklemez

## 📋 Kurulum Adımları

### 1. Ses Dosyalarını Hazırlama

Ses dosyalarını `assets/sounds/` klasörüne ekleyin:

```
assets/
  sounds/
    notification.wav      # iOS için (WAV veya CAF formatı)
    notification.mp3      # Android için (MP3, WAV, OGG)
    message.wav           # Mesaj bildirimleri için
    tips.wav              # Tips bildirimleri için
```

**Format Gereksinimleri:**
- **iOS**: `.wav`, `.caf` (30 saniyeden kısa)
- **Android**: `.mp3`, `.wav`, `.ogg`

### 2. app.json Yapılandırması

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/tipbox-white-logo.jpg",
          "color": "#ffffff",
          "sounds": [
            "./assets/sounds/notification.wav",
            "./assets/sounds/message.wav",
            "./assets/sounds/tips.wav"
          ]
        }
      ]
    ]
  }
}
```

### 3. Android Notification Channel Yapılandırması

Android'de özel ses kullanmak için notification channel'da belirtilmelidir:

```typescript
// src/services/ExpoNotificationService/config/default-channels.ts
await Notifications.setNotificationChannelAsync('messages', {
  name: 'Mesajlar',
  description: 'Direkt mesaj bildirimleri',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'message.wav', // Özel ses dosyası (sadece dosya adı, uzantı ile)
  // ...
});
```

### 4. iOS Notification Content Yapılandırması

iOS'ta notification content'te belirtilmelidir:

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Bildirim',
    body: 'Mesaj içeriği',
    sound: 'notification.wav', // Özel ses dosyası (sadece dosya adı, uzantı ile)
    // ...
  },
  trigger: null,
});
```

## 🧪 Test Etme

### Development Build ile Test

```bash
# iOS için
npx expo run:ios

# Android için
npx expo run:android
```

### Production Build ile Test

```bash
# EAS Build ile
eas build --profile development --platform ios
eas build --profile development --platform android
```

## 📝 Kod Örneği

### Notification Service'de Özel Ses Kullanımı

```typescript
// src/services/ExpoNotificationService/core/notification-service.ts

async sendLocalNotification(
  payload: NotificationPayload & {
    customSound?: string; // Özel ses dosyası adı
  }
): Promise<string> {
  const soundValue = payload.customSound 
    ? payload.customSound  // Özel ses: 'notification.wav'
    : (Platform.OS === 'ios' ? 'default' : true); // Default ses

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      sound: soundValue,
      // ...
    },
    trigger: null,
  });
}
```

### Kullanım Örneği

```typescript
// Mesaj bildirimi için özel ses
await notificationService.sendLocalNotification({
  title: 'Yeni Mesaj',
  body: 'Birisi size mesaj gönderdi',
  customSound: 'message.wav', // Özel ses dosyası
});

// Tips bildirimi için özel ses
await notificationService.sendLocalNotification({
  title: 'TIPS Alındı!',
  body: '50 TIPS kazandınız',
  customSound: 'tips.wav', // Özel ses dosyası
});
```

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Android Channel Ses Değişikliği**: Android'de notification channel oluşturulduktan sonra ses ayarı değiştirilemez. Test için uygulamayı silip yeniden yüklemek gerekebilir.

2. **iOS Ses Formatı**: iOS'ta ses dosyaları `.wav` veya `.caf` formatında olmalı ve 30 saniyeden kısa olmalıdır.

3. **Dosya Adı**: Ses dosyası adını belirtirken sadece dosya adını kullanın (örn: `'notification.wav'`), tam path değil.

4. **Build Gereksinimi**: Her ses dosyası değişikliğinde yeni build gerekir.

## 🔧 Mevcut Yapılandırma

Mevcut `app.json` dosyanızda `expo-notifications` plugin'i var ama `sounds` array'i yok. Özel sesler için eklemeniz gerekiyor:

```json
[
  "expo-notifications",
  {
    "icon": "./assets/tipbox-white-logo.jpg",
    "color": "#ffffff",
    "sounds": [
      "./assets/sounds/notification.wav"
    ]
  }
]
```

## 📚 Kaynaklar

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Custom Notification Sounds](https://docs.expo.dev/versions/latest/sdk/notifications/#custom-notification-sounds)
