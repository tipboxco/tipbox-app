import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationConfig } from '../../config/notification.config';
import {
  NotificationHandler,
  NotificationServiceState,
  NotificationServiceConfig
} from './types';
import { NotificationPayload, NotificationPermissionStatus } from '../../types/notification';

class ExpoNotificationService {
  private config: NotificationServiceConfig;
  private handler?: NotificationHandler;
  private notificationListeners: Notifications.Subscription[] = [];
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

  private async registerForPushNotifications() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.state.expoPushToken = token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
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

  cleanup() {
    this.notificationListeners.forEach(listener => listener.remove());
    this.notificationListeners = [];
  }
}

export const notificationService = new ExpoNotificationService();
export * from './types';
