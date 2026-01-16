import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { NotificationManager } from './notification-manager';
import { NotificationHandler } from '../types';

/**
 * NotificationHandlers
 * 
 * Foreground, background ve killed state için notification handler'ları
 */
export class NotificationHandlers {
  private manager: NotificationManager;
  private appState: AppStateStatus = 'active';
  private isForeground: boolean = true;

  constructor(manager: NotificationManager) {
    this.manager = manager;
    this.setupAppStateListener();
  }

  /**
   * App state listener
   */
  private setupAppStateListener(): void {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;
      this.isForeground = nextAppState === 'active';
    });

    // Cleanup için subscription'ı sakla (gerekirse)
    // Bu class instance'ı cleanup edildiğinde subscription remove edilebilir
  }

  /**
   * Foreground notification handler
   * App açıkken notification geldiğinde çağrılır
   */
  createForegroundHandler(): NotificationHandler['onNotificationReceived'] {
    return async (notification: Notifications.Notification) => {
      try {
        await this.manager.handleNotification(notification, {
          isForeground: true,
          shouldNavigate: true,
          source: 'push',
        });
      } catch (error) {
        console.error('[NotificationHandlers] Foreground handler error:', error);
      }
    };
  }

  /**
   * Notification response handler
   * Kullanıcı notification'a tıkladığında çağrılır
   */
  createResponseHandler(): NotificationHandler['onNotificationResponseReceived'] {
    return async (response: Notifications.NotificationResponse) => {
      try {
        await this.manager.handleNotificationResponse(response);
      } catch (error) {
        console.error('[NotificationHandlers] Response handler error:', error);
      }
    };
  }

  /**
   * Notifications dropped handler
   * Notification'lar drop edildiğinde çağrılır (rate limiting, etc.)
   */
  createDroppedHandler(): NotificationHandler['onNotificationsDropped'] {
    return async () => {
      try {
        // Analytics tracking
        console.warn('[NotificationHandlers] Notifications dropped');
      } catch (error) {
        console.error('[NotificationHandlers] Dropped handler error:', error);
      }
    };
  }

  /**
   * Background notification handler
   * App background'dayken notification geldiğinde çağrılır
   * Bu handler background task içinde çalışır
   */
  createBackgroundHandler(): (notification: Notifications.Notification) => Promise<void> {
    return async (notification: Notifications.Notification) => {
      try {
        await this.manager.handleNotification(notification, {
          isForeground: false,
          shouldNavigate: false, // Background'da navigation yapma
          source: 'push',
        });
      } catch (error) {
        console.error('[NotificationHandlers] Background handler error:', error);
      }
    };
  }

  /**
   * Killed state notification handler
   * App kapalıyken notification geldiğinde, app açıldığında çağrılır
   */
  async handleKilledStateNotification(): Promise<void> {
    try {
      // App açıldığında son notification response'u kontrol et
      const lastResponse = await Notifications.getLastNotificationResponseAsync();

      if (lastResponse) {
        await this.manager.handleNotificationResponse(lastResponse);
      }
    } catch (error) {
      console.error('[NotificationHandlers] Killed state handler error:', error);
    }
  }

  /**
   * Tüm handler'ları birleştir
   */
  createCombinedHandler(): NotificationHandler {
    return {
      onNotificationReceived: this.createForegroundHandler(),
      onNotificationResponseReceived: this.createResponseHandler(),
      onNotificationsDropped: this.createDroppedHandler(),
    };
  }
}
