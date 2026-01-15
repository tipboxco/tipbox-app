import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { notificationConfig } from '../../config/notification.config';
import {
  NotificationHandler,
  NotificationServiceState,
  NotificationServiceConfig
} from './types';
import { NotificationPayload, NotificationPermissionStatus } from '../../types/notification';
import { registerPushToken } from '../../features/notifications/api/notificationsApi';

const PENDING_PUSH_TOKEN_KEY = 'pending_push_token';
const PENDING_DEVICE_TYPE_KEY = 'pending_device_type';

class ExpoNotificationService {
  private config: NotificationServiceConfig;
  private handler?: NotificationHandler;
  private notificationListeners: Notifications.Subscription[] = [];
  private tokenChangeListener?: Notifications.Subscription;
  private state: NotificationServiceState = {
    isInitialized: false,
    permissionStatus: 'undetermined',
  };

  constructor(config: NotificationServiceConfig = notificationConfig) {
    this.config = config;
  }

  /**
   * Notification servisini initialize eder
   * Sadece permission ve token alma işlemlerini yapar
   * Token kaydı (registerPushToken) ayrı bir metod ile yapılmalı (authenticated olduğunda)
   */
  async initialize(): Promise<NotificationServiceState> {
    if (this.state.isInitialized) {
      return this.state;
    }

    await this.configureForegroundNotifications();
    const permissionStatus = await this.requestPermission();

    // Permission granted ise token'ı al (ama backend'e kaydetme - bu authenticated olduğunda yapılacak)
    if (permissionStatus === 'granted') {
      await this.getPushToken();
    }

    this.state = {
      isInitialized: true,
      permissionStatus,
      expoPushToken: this.state.expoPushToken,
    };

    return this.state;
  }

  private async configureForegroundNotifications() {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // Expo Go'da foreground notification'lar için gerekli
        shouldPlaySound: this.config.defaultSound ?? true,
        shouldSetBadge: true,
        shouldShowBanner: true, // iOS/Android: Banner göster
        shouldShowList: true, // iOS: Notification Center'da göster
      }),
    });
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!Device.isDevice) {
      this.state.permissionStatus = 'denied';
      return 'denied';
    }

    const { status } = await Notifications.requestPermissionsAsync();
    this.state.permissionStatus = status as NotificationPermissionStatus;
    return this.state.permissionStatus;
  }

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status as NotificationPermissionStatus;
  }

  /**
   * Push token'ı backend'e kaydet (retry mekanizması ile)
   * Kalıcı çözüm: Exponential backoff ile retry, token persistence
   */
  private async registerPushTokenWithRetry(
    token: string,
    deviceType: 'ios' | 'android',
    maxRetries: number = 3,
    initialDelay: number = 2000 // 500 hatası için daha uzun initial delay
  ): Promise<void> {
    let lastError: any = null;
    let firstError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await registerPushToken({
          token,
          deviceType,
        });
        
        // Başarılı kayıt - pending token'ı temizle
        await SecureStore.deleteItemAsync(PENDING_PUSH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(PENDING_DEVICE_TYPE_KEY);
        
        return;
      } catch (error: any) {
        lastError = error;
        if (!firstError) {
          firstError = error; // İlk hatayı sakla
        }
        
        const status = error?.response?.status;
        const isServerError = status >= 500 && status < 600;
        const isClientError = status >= 400 && status < 500;
        const isUnauthorized = status === 401;
        
        // 401 (Unauthorized) hatası - login olmadan token kaydetmeye çalışıyoruz
        // Bu durumda sessizce return et, token'ı pending olarak sakla
        if (isUnauthorized) {
          // Token'ı pending olarak sakla, login sonrası tekrar denenecek
          try {
            await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
            await SecureStore.setItemAsync(PENDING_DEVICE_TYPE_KEY, deviceType);
          } catch (storeError) {
            // Store hatası kritik değil, sessizce geç
          }
          // Login olmadan token kaydetmeye çalıştığımız için sessizce return et
          // Log spam'ı önlemek için log gösterme
          return;
        }
        
        // Diğer 4xx hataları (client error) için retry yapma
        if (isClientError && status !== 429) {
          throw error;
        }
        
        // 5xx hataları (server error) veya network hataları için retry yap
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 500 hatası için daha uzun delay
          const delay = isServerError 
            ? initialDelay * Math.pow(2, attempt) * 2 // Server error için 2x daha uzun
            : initialDelay * Math.pow(2, attempt);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Tüm retry'lar başarısız - token'ı SecureStore'da sakla, sonra tekrar deneyebiliriz
    try {
      await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(PENDING_DEVICE_TYPE_KEY, deviceType);
    } catch (storeError) {
      // Error handled silently
    }
  }

  /**
   * Pending push token'ı tekrar kaydetmeyi dene
   * Login sonrası veya network bağlantısı kurulduğunda çağrılabilir
   */
  async retryPendingPushToken(): Promise<void> {
    try {
      const pendingToken = await SecureStore.getItemAsync(PENDING_PUSH_TOKEN_KEY);
      const pendingDeviceType = await SecureStore.getItemAsync(PENDING_DEVICE_TYPE_KEY) as 'ios' | 'android' | null;
      
      if (pendingToken && pendingDeviceType) {
        await this.registerPushTokenWithRetry(pendingToken, pendingDeviceType);
      }
    } catch (error) {
    }
  }

  /**
   * Push token'ı alır (backend'e kaydetmeden)
   * Bu metod login olmadan da çağrılabilir
   */
  private async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        // Android notification channels - Best practice: farklı öncelik seviyeleri
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Genel Bildirimler',
          description: 'Genel bildirimler için varsayılan kanal',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Yüksek öncelikli bildirimler için ayrı kanal
        await Notifications.setNotificationChannelAsync('high_priority', {
          name: 'Önemli Bildirimler',
          description: 'Mesajlar ve önemli bildirimler',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      // ProjectId'yi app.json'dan al
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        throw new Error('Expo projectId bulunamadı. app.json dosyasında extra.eas.projectId tanımlı olmalı.');
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.state.expoPushToken = token.data;

      // Token değişikliklerini dinle (iOS'ta token yenilenebilir)
      this.setupTokenChangeListener();

      return token.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Push token'ı backend'e kaydeder
   * Bu metod SADECE authenticated olduğunda çağrılmalı
   * Login olmadan çağrılırsa 401 hatası alınır ve token pending olarak saklanır
   */
  async registerPushTokenToBackend(): Promise<void> {
    if (!this.state.expoPushToken) {
      // Token yoksa önce al
      const token = await this.getPushToken();
      if (!token) {
        // Token alınamadı, sessizce return et (log spam'ı önle)
        return;
      }
    }

    // Backend'e push token'ı kaydet (retry mekanizması ile)
    // 401 hatası durumunda sessizce return eder (login olmadan çağrıldığı için)
    await this.registerPushTokenWithRetry(
      this.state.expoPushToken!,
      Platform.OS === 'ios' ? 'ios' : 'android'
    );
  }

  /**
   * Token değişikliklerini dinle ve backend'e bildir
   * iOS'ta token yenilenebilir (app update, OS update, etc.)
   */
  private setupTokenChangeListener() {
    // Mevcut listener'ı temizle
    if (this.tokenChangeListener) {
      this.tokenChangeListener.remove();
    }

    // Expo Notifications API'de token change listener yok
    // Bu yüzden periyodik kontrol yapabiliriz veya app state değişiminde kontrol ederiz
    // Şimdilik initialize'da bir kez alıyoruz
  }

  async sendLocalNotification(payload: NotificationPayload) {
    if (this.state.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: this.config.defaultSound,
        badge: this.config.defaultBadge,
      },
      trigger: null,
    });
  }

  setNotificationHandler(handler: NotificationHandler) {
    this.handler = handler;

    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      this.handler?.onNotificationReceived(notification.request.content as NotificationPayload);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      this.handler?.onNotificationResponseReceived(response.notification.request.content as NotificationPayload);
    });

    this.notificationListeners.push(receivedListener, responseListener);
  }

  /**
   * Badge count'u güncelle
   * Unread notification count ile sync et
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      } else {
        // Android'de badge count native olarak desteklenmez
        // Ancak notification channel'ları üzerinden gösterilebilir
      }
    } catch (error) {
    }
  }

  /**
   * Badge count'u sıfırla
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Mevcut badge count'u al
   */
  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await Notifications.getBadgeCountAsync();
      }
      return 0; // Android'de 0 döndür
    } catch (error) {
      return 0;
    }
  }

  /**
   * Token'ı yeniden al (backend'e kaydetmeden)
   * App state değişiminde veya token refresh gerektiğinde çağrılabilir
   * Backend'e kaydetme işlemi registerPushTokenToBackend() ile yapılmalı (authenticated kontrolü ile)
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      if (this.state.permissionStatus !== 'granted') {
        return null;
      }

      // ProjectId'yi app.json'dan al
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        throw new Error('Expo projectId bulunamadı. app.json dosyasında extra.eas.projectId tanımlı olmalı.');
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Token değiştiyse state'i güncelle
      // Backend'e kaydetme işlemi registerPushTokenToBackend() ile yapılmalı (authenticated kontrolü ile)
      if (token.data !== this.state.expoPushToken) {
        this.state.expoPushToken = token.data;
        // Token kaydı authenticated olduğunda yapılacak (registerPushTokenToBackend çağrılacak)
      }

      return token.data;
    } catch (error) {
      return null;
    }
  }

  cleanup() {
    // Güvenli cleanup: notificationListeners undefined olabilir
    if (this.notificationListeners && Array.isArray(this.notificationListeners)) {
      this.notificationListeners.forEach(listener => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      });
      this.notificationListeners = [];
    } else {
      // Eğer undefined ise, boş array olarak initialize et
      this.notificationListeners = [];
    }
    
    if (this.tokenChangeListener) {
      this.tokenChangeListener.remove();
      this.tokenChangeListener = undefined;
    }
  }
}

export const notificationService = new ExpoNotificationService();
export * from './types';
