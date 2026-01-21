import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  NotificationServiceConfig,
  NotificationServiceState,
  NotificationHandler,
  AndroidChannelConfig,
  IOSCategoryConfig,
  ScheduledNotificationInput,
  TokenRegistrationOptions,
} from '../types';
import { NotificationPermissionStatus, NotificationPayload } from '../../../types/notification';
import { registerPushToken } from '../../../features/notifications/api/notificationsApi';

const PENDING_PUSH_TOKEN_KEY = 'pending_push_token';
const PENDING_DEVICE_TYPE_KEY = 'pending_device_type';
const LAST_TOKEN_REFRESH_KEY = 'last_token_refresh';

/**
 * ExpoNotificationService
 * 
 * Expo Notifications API'sini kullanarak kapsamlı notification yönetimi sağlar.
 * 
 * Özellikler:
 * - Token yönetimi (Expo Push Token, Device Push Token)
 * - Permission yönetimi
 * - Android notification channels
 * - iOS notification categories (interactive notifications)
 * - Local notification scheduling
 * - Badge management
 * - Background task support
 * - Token refresh mekanizması
 * - Retry mekanizması ile token registration
 */
export class NotificationService {
  private config: NotificationServiceConfig;
  private handler?: NotificationHandler;
  private notificationListeners: Notifications.Subscription[] = [];
  private tokenChangeListener?: Notifications.Subscription;
  private state: NotificationServiceState = {
    isInitialized: false,
    permissionStatus: 'undetermined',
  };

  constructor(config: NotificationServiceConfig = {}) {
    this.config = {
      defaultSound: true,
      defaultVibrate: true,
      defaultBadge: 0,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      enableTokenRefresh: true,
      tokenRefreshInterval: 24 * 60 * 60 * 1000, // 24 saat
      enableBackgroundTasks: true,
      backgroundTaskName: 'notification-handler',
      ...config,
    };
  }

  /**
   * Service'i initialize et
   * Permission kontrolü, channel/category oluşturma, token alma
   */
  async initialize(): Promise<NotificationServiceState> {
    if (this.state.isInitialized) {
      return this.state;
    }

    try {
      // 1. Foreground notification handler'ı ayarla
      await this.configureForegroundNotifications();

      // 2. Android notification channels oluştur
      if (Platform.OS === 'android' && this.config.androidChannels) {
        await this.setupAndroidChannels();
      }

      // 3. iOS notification categories oluştur
      if (Platform.OS === 'ios' && this.config.iosCategories) {
        await this.setupIOSCategories();
      }

      // 4. Permission iste
      const permissionStatus = await this.requestPermission();

      // 5. Permission granted ise token'ı al
      if (permissionStatus === 'granted') {
        await this.getExpoPushToken();
        await this.getDevicePushToken();
      }

      // 6. Background task'ı register et (eğer enable edilmişse)
      if (this.config.enableBackgroundTasks && this.config.backgroundTaskName) {
        await this.registerBackgroundTask();
      }

      this.state = {
        ...this.state,
        isInitialized: true,
        permissionStatus,
      };

      return this.state;
    } catch (error) {
      console.error('[NotificationService] Initialize error:', error);
      throw error;
    }
  }

  /**
   * Foreground notification handler'ı yapılandır
   */
  private async configureForegroundNotifications(): Promise<void> {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: this.config.shouldPlaySound ?? this.config.defaultSound ?? true,
        shouldSetBadge: this.config.shouldSetBadge ?? true,
        shouldShowBanner: this.config.shouldShowBanner ?? true,
        shouldShowList: this.config.shouldShowList ?? true,
      }),
    });
  }

  /**
   * Android notification channels oluştur
   */
  private async setupAndroidChannels(): Promise<void> {
    if (!this.config.androidChannels || Platform.OS !== 'android') {
      return;
    }

    for (const channelConfig of this.config.androidChannels) {
      try {
        await Notifications.setNotificationChannelAsync(channelConfig.id, {
          name: channelConfig.name,
          description: channelConfig.description,
          importance: channelConfig.importance,
          vibrationPattern: channelConfig.vibrationPattern,
          lightColor: channelConfig.lightColor,
          sound: channelConfig.sound,
          enableVibrate: channelConfig.enableVibrate,
          enableLights: channelConfig.enableLights,
          showBadge: channelConfig.showBadge,
          audioAttributes: channelConfig.audioAttributes,
        });
      } catch (error) {
        console.error(`[NotificationService] Failed to create channel ${channelConfig.id}:`, error);
      }
    }

    // Mevcut channel'ları state'e kaydet
    const channels = await Notifications.getNotificationChannelsAsync();
    this.state.channels = channels ?? [];
  }

  /**
   * iOS notification categories oluştur (interactive notifications)
   */
  private async setupIOSCategories(): Promise<void> {
    if (!this.config.iosCategories || Platform.OS !== 'ios') {
      return;
    }

    for (const categoryConfig of this.config.iosCategories) {
      try {
        const actions: Notifications.NotificationAction[] = categoryConfig.actions.map(action => ({
          identifier: action.identifier,
          buttonTitle: action.buttonTitle,
          options: action.options,
          textInput: action.textInput,
        }));

        await Notifications.setNotificationCategoryAsync(categoryConfig.identifier, actions, {
          intentIdentifiers: categoryConfig.intentIdentifiers,
          hiddenPreviewsBodyPlaceholder: categoryConfig.hiddenPreviewsBodyPlaceholder,
          customDismissAction: categoryConfig.options?.customDismissAction,
          allowInCarPlay: categoryConfig.options?.allowInCarPlay,
          showTitle: categoryConfig.options?.showTitle,
          showSubtitle: categoryConfig.options?.showSubtitle,
        });
      } catch (error) {
        console.error(`[NotificationService] Failed to create category ${categoryConfig.identifier}:`, error);
      }
    }

    // Mevcut category'leri state'e kaydet
    const categories = await Notifications.getNotificationCategoriesAsync();
    this.state.categories = categories ?? [];
  }

  /**
   * Permission iste
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!Device.isDevice) {
      this.state.permissionStatus = 'denied';
      return 'denied';
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });

      this.state.permissionStatus = status as NotificationPermissionStatus;
      return this.state.permissionStatus;
    } catch (error) {
      console.error('[NotificationService] Permission request error:', error);
      this.state.permissionStatus = 'denied';
      return 'denied';
    }
  }

  /**
   * Mevcut permission durumunu al
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.state.permissionStatus = status as NotificationPermissionStatus;
      return this.state.permissionStatus;
    } catch (error) {
      console.error('[NotificationService] Get permission status error:', error);
      return 'denied';
    }
  }

  /**
   * Expo Push Token al
   */
  private async getExpoPushToken(options?: TokenRegistrationOptions): Promise<string | null> {
    try {
      const projectId =
        options?.projectId ??
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error(
          'Expo projectId bulunamadı. app.json dosyasında extra.eas.projectId tanımlı olmalı.'
        );
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.state.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('[NotificationService] Get Expo push token error:', error);
      return null;
    }
  }

  /**
   * Device Push Token al (native token)
   */
  private async getDevicePushToken(): Promise<Notifications.DevicePushToken | null> {
    try {
      const token = await Notifications.getDevicePushTokenAsync();
      this.state.devicePushToken = token;
      return token;
    } catch (error) {
      console.error('[NotificationService] Get device push token error:', error);
      return null;
    }
  }

  /**
   * Push token'ı backend'e kaydet (retry mekanizması ile)
   */
  async registerPushTokenToBackend(
    options?: TokenRegistrationOptions
  ): Promise<void> {
    if (!this.state.expoPushToken) {
      const token = await this.getExpoPushToken(options);
      if (!token) {
        return;
      }
    }

    const maxRetries = options?.retryAttempts ?? 3;
    const initialDelay = options?.retryDelay ?? 2000;

    await this.registerPushTokenWithRetry(
      this.state.expoPushToken!,
      Platform.OS === 'ios' ? 'ios' : 'android',
      maxRetries,
      initialDelay
    );
  }

  /**
   * Token registration with retry mechanism
   */
  private async registerPushTokenWithRetry(
    token: string,
    deviceType: 'ios' | 'android',
    maxRetries: number = 3,
    initialDelay: number = 2000
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
        await SecureStore.setItemAsync(LAST_TOKEN_REFRESH_KEY, Date.now().toString());

        return;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const isServerError = status >= 500 && status < 600;
        const isUnauthorized = status === 401;

        // 401 (Unauthorized) - token'ı pending olarak sakla
        if (isUnauthorized) {
          try {
            await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
            await SecureStore.setItemAsync(PENDING_DEVICE_TYPE_KEY, deviceType);
          } catch (storeError) {
            // Store hatası kritik değil
          }
          return;
        }

        // 4xx hataları için retry yapma (401 hariç)
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }

        // 5xx veya network hataları için retry
        if (attempt < maxRetries - 1) {
          const delay = isServerError
            ? initialDelay * Math.pow(2, attempt) * 2
            : initialDelay * Math.pow(2, attempt);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Tüm retry'lar başarısız - token'ı pending olarak sakla
    try {
      await SecureStore.setItemAsync(PENDING_PUSH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(PENDING_DEVICE_TYPE_KEY, deviceType);
    } catch (storeError) {
      // Error handled silently
    }

    throw lastError;
  }

  /**
   * Pending push token'ı tekrar kaydetmeyi dene
   */
  async retryPendingPushToken(): Promise<void> {
    try {
      const pendingToken = await SecureStore.getItemAsync(PENDING_PUSH_TOKEN_KEY);
      const pendingDeviceType = (await SecureStore.getItemAsync(
        PENDING_DEVICE_TYPE_KEY
      )) as 'ios' | 'android' | null;

      if (pendingToken && pendingDeviceType) {
        await this.registerPushTokenWithRetry(pendingToken, pendingDeviceType);
      }
    } catch (error) {
      console.error('[NotificationService] Retry pending push token error:', error);
    }
  }

  /**
   * Token'ı yenile
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      if (this.state.permissionStatus !== 'granted') {
        return null;
      }

      const token = await this.getExpoPushToken();
      if (token && token !== this.state.expoPushToken) {
        this.state.expoPushToken = token;
      }

      return token;
    } catch (error) {
      console.error('[NotificationService] Refresh push token error:', error);
      return null;
    }
  }

  /**
   * Token refresh gerekip gerekmediğini kontrol et
   */
  async shouldRefreshToken(): Promise<boolean> {
    if (!this.config.enableTokenRefresh) {
      return false;
    }

    try {
      const lastRefresh = await SecureStore.getItemAsync(LAST_TOKEN_REFRESH_KEY);
      if (!lastRefresh) {
        return true;
      }

      const lastRefreshTime = parseInt(lastRefresh, 10);
      const now = Date.now();
      const interval = this.config.tokenRefreshInterval ?? 24 * 60 * 60 * 1000;

      return now - lastRefreshTime > interval;
    } catch (error) {
      return true;
    }
  }

  /**
   * Local notification gönder
   * 
   * Özel ses dosyası kullanımı:
   * - iOS: 'custom-sound.wav' (app.json'da sounds array'inde tanımlı olmalı)
   * - Android: 'custom-sound.wav' (notification channel'da tanımlı olmalı)
   * 
   * ⚠️ ÖNEMLİ: Özel sesler Expo Go'da çalışmaz, development build gerekir!
   */
  async sendLocalNotification(
    payload: NotificationPayload & {
      priority?: 'default' | 'min' | 'low' | 'high' | 'max';
      sound?: boolean | string; // boolean: default ses, string: özel ses dosyası adı (örn: 'notification.wav')
      vibrate?: boolean;
      channelId?: string;
      categoryId?: string;
    }
  ): Promise<string> {
    if (this.state.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Android için channel belirle
    const channelId =
      payload.channelId ??
      (payload.priority === 'high' || payload.priority === 'max' ? 'high_priority' : 'default');

    // Sound ayarı
    // payload.sound string ise özel ses dosyası, boolean ise default ses kontrolü
    let soundValue: string | boolean | undefined;
    if (typeof payload.sound === 'string') {
      // Özel ses dosyası (app.json'da sounds array'inde tanımlı olmalı)
      soundValue = payload.sound; // Örn: 'notification.wav'
    } else {
      // Default ses kontrolü
      const shouldPlaySound = payload.sound !== undefined ? payload.sound : this.config.defaultSound;
      soundValue = Platform.OS === 'ios' ? (shouldPlaySound ? 'default' : false) : shouldPlaySound;
    }

    // CRITICAL FIX: categoryIdentifier sadece iOS'ta ve değer varsa gönderilmeli
    // iOS'ta nil categoryIdentifier hataya neden olur
    
    // Large icon/image support
    // Android: largeIcon (user avatar, post image, etc.)
    // iOS: attachments (image attachments for rich notifications)
    const largeIcon = payload.largeIcon || payload.imageUrl;
    const attachments = payload.attachments || (payload.imageUrl ? [{
      identifier: 'image',
      url: payload.imageUrl,
      mimeType: 'image/jpeg',
    }] : undefined);
    
    const content: Notifications.NotificationContentInput = {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: soundValue,
      badge: this.config.defaultBadge,
      ...(Platform.OS === 'ios' && payload.categoryId && {
        categoryIdentifier: payload.categoryId,
      }),
      ...(Platform.OS === 'ios' && attachments && {
        attachments: attachments.map(att => ({
          identifier: att.identifier,
          url: att.url,
          mimeType: att.mimeType || 'image/jpeg',
        })),
      }),
      ...(Platform.OS === 'android' && {
        android: {
          channelId,
          priority:
            payload.priority === 'high' || payload.priority === 'max'
              ? Notifications.AndroidNotificationPriority.HIGH
              : Notifications.AndroidNotificationPriority.DEFAULT,
          vibrate: payload.vibrate !== undefined ? payload.vibrate : true,
          // Android'de özel ses: string ise direkt kullan, boolean ise default kontrolü
          sound: typeof soundValue === 'string' 
            ? soundValue 
            : (soundValue ? 'default' : undefined),
          // Large icon: kullanıcı avatar'ı, post image'i vb. için
          ...(largeIcon && {
            largeIcon,
          }),
        },
      }),
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Hemen göster
    });

    return notificationId;
  }

  /**
   * Scheduled notification oluştur
   */
  async scheduleNotification(input: ScheduledNotificationInput): Promise<string> {
    if (this.state.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: input.content,
      trigger: input.trigger,
      identifier: input.identifier,
    });

    return notificationId;
  }

  /**
   * Scheduled notification'ı iptal et
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Tüm scheduled notification'ları iptal et
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Tüm scheduled notification'ları al
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Notification handler'ı ayarla
   */
  setNotificationHandler(handler: NotificationHandler): void {
    this.handler = handler;

    // Mevcut listener'ları temizle
    this.cleanupListeners();

    // Notification received listener
    if (handler.onNotificationReceived) {
      const receivedListener = Notifications.addNotificationReceivedListener(
        handler.onNotificationReceived
      );
      this.notificationListeners.push(receivedListener);
    }

    // Notification response listener (tap)
    if (handler.onNotificationResponseReceived) {
      const responseListener = Notifications.addNotificationResponseReceivedListener(
        handler.onNotificationResponseReceived
      );
      this.notificationListeners.push(responseListener);
    }

    // Notifications dropped listener
    if (handler.onNotificationsDropped) {
      const droppedListener = Notifications.addNotificationsDroppedListener(
        handler.onNotificationsDropped
      );
      this.notificationListeners.push(droppedListener);
    }
  }

  /**
   * Badge count'u güncelle
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
        this.state.badgeCount = count;
      }
      // Android'de badge count native olarak desteklenmez
    } catch (error) {
      console.error('[NotificationService] Set badge count error:', error);
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
        const count = await Notifications.getBadgeCountAsync();
        this.state.badgeCount = count;
        return count;
      }
      return 0;
    } catch (error) {
      console.error('[NotificationService] Get badge count error:', error);
      return 0;
    }
  }

  /**
   * Notification'ı dismiss et
   */
  async dismissNotification(identifier: string): Promise<void> {
    await Notifications.dismissNotificationAsync(identifier);
  }

  /**
   * Tüm notification'ları dismiss et
   */
  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Mevcut notification'ları al
   */
  async getPresentedNotifications(): Promise<Notifications.Notification[]> {
    return await Notifications.getPresentedNotificationsAsync();
  }

  /**
   * Background task'ı register et
   */
  private async registerBackgroundTask(): Promise<void> {
    if (!this.config.backgroundTaskName) {
      return;
    }

    try {
      await Notifications.registerTaskAsync(this.config.backgroundTaskName);
    } catch (error) {
      console.error('[NotificationService] Register background task error:', error);
    }
  }

  /**
   * Background task'ı unregister et
   */
  async unregisterBackgroundTask(): Promise<void> {
    if (!this.config.backgroundTaskName) {
      return;
    }

    try {
      await Notifications.unregisterTaskAsync(this.config.backgroundTaskName);
    } catch (error) {
      console.error('[NotificationService] Unregister background task error:', error);
    }
  }

  /**
   * Android channel'ı al
   */
  async getChannel(channelId: string): Promise<Notifications.NotificationChannel | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      return await Notifications.getNotificationChannelAsync(channelId);
    } catch (error) {
      console.error('[NotificationService] Get channel error:', error);
      return null;
    }
  }

  /**
   * Tüm Android channel'ları al
   */
  async getAllChannels(): Promise<Notifications.NotificationChannel[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    try {
      const channels = await Notifications.getNotificationChannelsAsync();
      return channels ?? [];
    } catch (error) {
      console.error('[NotificationService] Get all channels error:', error);
      return [];
    }
  }

  /**
   * Android channel'ı sil
   */
  async deleteChannel(channelId: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await Notifications.deleteNotificationChannelAsync(channelId);
    } catch (error) {
      console.error('[NotificationService] Delete channel error:', error);
    }
  }

  /**
   * iOS category'yi al
   */
  async getCategory(categoryId: string): Promise<Notifications.NotificationCategory | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const categories = await Notifications.getNotificationCategoriesAsync();
      return categories?.find((cat) => cat.identifier === categoryId) ?? null;
    } catch (error) {
      console.error('[NotificationService] Get category error:', error);
      return null;
    }
  }

  /**
   * Tüm iOS category'leri al
   */
  async getAllCategories(): Promise<Notifications.NotificationCategory[]> {
    if (Platform.OS !== 'ios') {
      return [];
    }

    try {
      const categories = await Notifications.getNotificationCategoriesAsync();
      return categories ?? [];
    } catch (error) {
      console.error('[NotificationService] Get all categories error:', error);
      return [];
    }
  }

  /**
   * iOS category'yi sil
   */
  async deleteCategory(categoryId: string): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      await Notifications.deleteNotificationCategoryAsync(categoryId);
    } catch (error) {
      console.error('[NotificationService] Delete category error:', error);
    }
  }

  /**
   * State'i al
   */
  getState(): NotificationServiceState {
    return { ...this.state };
  }

  /**
   * Expo push token'ı al
   */
  getExpoPushTokenSync(): string | undefined {
    return this.state.expoPushToken;
  }

  /**
   * Device push token'ı al
   */
  getDevicePushTokenSync(): Notifications.DevicePushToken | undefined {
    return this.state.devicePushToken;
  }

  /**
   * Listener'ları temizle
   */
  private cleanupListeners(): void {
    if (this.notificationListeners && Array.isArray(this.notificationListeners)) {
      this.notificationListeners.forEach((listener) => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      });
      this.notificationListeners = [];
    }
  }

  /**
   * Cleanup - tüm listener'ları ve resource'ları temizle
   */
  cleanup(): void {
    this.cleanupListeners();

    if (this.tokenChangeListener) {
      this.tokenChangeListener.remove();
      this.tokenChangeListener = undefined;
    }

    this.handler = undefined;
  }
}
