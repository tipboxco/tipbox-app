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

  async initialize(): Promise<NotificationServiceState> {
    if (this.state.isInitialized) {
      return this.state;
    }

    await this.configureForegroundNotifications();
    const permissionStatus = await this.requestPermission();

    if (permissionStatus === 'granted') {
      await this.registerForPushNotifications();
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
        shouldShowAlert: true,
        shouldPlaySound: this.config.defaultSound ?? true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
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
    initialDelay: number = 1000
  ): Promise<void> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await registerPushToken({
          token,
          deviceType,
        });
        
        // Başarılı kayıt - pending token'ı temizle
        await SecureStore.deleteItemAsync(PENDING_PUSH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(PENDING_DEVICE_TYPE_KEY);
        
        console.log('[ExpoNotificationService] ✅ Push token registered to backend');
        return;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const isServerError = status >= 500 && status < 600;
        const isClientError = status >= 400 && status < 500;
        
        // 4xx hataları (client error) için retry yapma
        if (isClientError && status !== 429) {
          console.error('[ExpoNotificationService] ❌ Client error, skipping retry:', {
            status,
            message: error?.response?.data?.message || error?.message,
          });
          throw error;
        }
        
        // 5xx hataları (server error) veya network hataları için retry yap
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(`[ExpoNotificationService] ⚠️ Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`, {
            status,
            message: error?.response?.data?.message || error?.message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Tüm retry'lar başarısız - token'ı SecureStore'da sakla, sonra tekrar deneyebiliriz
    try {
      await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(PENDING_DEVICE_TYPE_KEY, deviceType);
      console.warn('[ExpoNotificationService] ⚠️ All retries failed, token saved for later retry');
    } catch (storeError) {
      console.error('[ExpoNotificationService] ❌ Failed to save pending token:', storeError);
    }
    
    // Hata fırlat ama uygulama çalışmaya devam etsin
    console.error('[ExpoNotificationService] ❌ Failed to register push token after all retries:', lastError);
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
        console.log('[ExpoNotificationService] 🔄 Retrying pending push token registration...');
        await this.registerPushTokenWithRetry(pendingToken, pendingDeviceType);
      }
    } catch (error) {
      console.error('[ExpoNotificationService] ❌ Error retrying pending push token:', error);
    }
  }

  private async registerForPushNotifications() {
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

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.state.expoPushToken = token.data;

      // Backend'e push token'ı kaydet (retry mekanizması ile)
      await this.registerPushTokenWithRetry(
        token.data,
        Platform.OS === 'ios' ? 'ios' : 'android'
      );

      // Token değişikliklerini dinle (iOS'ta token yenilenebilir)
      this.setupTokenChangeListener();
    } catch (error) {
      console.error('[ExpoNotificationService] Error registering for push notifications:', error);
    }
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
        console.log('[ExpoNotificationService] ✅ Badge count updated:', count);
      } else {
        // Android'de badge count native olarak desteklenmez
        // Ancak notification channel'ları üzerinden gösterilebilir
        console.log('[ExpoNotificationService] ℹ️ Badge count (Android):', count);
      }
    } catch (error) {
      console.error('[ExpoNotificationService] ❌ Error setting badge count:', error);
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
      console.error('[ExpoNotificationService] ❌ Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Token'ı yeniden al ve backend'e kaydet
   * App state değişiminde veya token refresh gerektiğinde çağrılabilir
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      if (this.state.permissionStatus !== 'granted') {
        console.log('[ExpoNotificationService] ⚠️ Permission not granted, cannot refresh token');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Token değiştiyse backend'e kaydet
      if (token.data !== this.state.expoPushToken) {
        console.log('[ExpoNotificationService] 🔄 Token changed, updating backend...');
        this.state.expoPushToken = token.data;
        await this.registerPushTokenWithRetry(
          token.data,
          Platform.OS === 'ios' ? 'ios' : 'android'
        );
      }

      return token.data;
    } catch (error) {
      console.error('[ExpoNotificationService] ❌ Error refreshing push token:', error);
      return null;
    }
  }

  cleanup() {
    this.notificationListeners.forEach(listener => listener.remove());
    this.notificationListeners = [];
    
    if (this.tokenChangeListener) {
      this.tokenChangeListener.remove();
      this.tokenChangeListener = undefined;
    }
  }
}

export const notificationService = new ExpoNotificationService();
export * from './types';
