/**
 * Notification Settings Check Utility
 * Bildirim göndermeden önce kullanıcının ayarlarını kontrol eder
 */

import { NotificationCode } from '../types';
import type { NotificationSetting } from '../types';
import type { NotificationType } from '@/src/features/notifications/api/types';

/**
 * Bildirim tipine göre kategori belirleme
 * Her bildirim tipi bir kategoriye aittir ve o kategoriye göre ayar kontrolü yapılır
 */
export type NotificationCategory = 'trust' | 'support' | 'message' | 'collection' | 'post' | 'system';

/**
 * Bildirim tipinden kategoriye mapping
 */
const notificationTypeToCategory: Record<NotificationType, NotificationCategory> = {
  // Trust kategorisi
  NEW_TRUSTER: 'trust',
  NEW_TRUSTED_BY: 'trust',
  
  // Support kategorisi
  SUPPORT_REQUEST_ACCEPTED: 'support',
  DM_REQUEST_RECEIVED: 'support',
  DM_REQUEST_ACCEPTED: 'support',
  DM_REQUEST_DECLINED: 'support',
  
  // Message kategorisi
  NEW_MESSAGE: 'message',
  
  // Collection kategorisi
  COLLECTION_POST_ADDED: 'collection',
  COLLECTION_SHARED: 'collection',
  
  // Post kategorisi
  POST_LIKED: 'post',
  POST_COMMENTED: 'post',
  POST_SHARED: 'post',
  POST_FAVORITED: 'post',
  COMMENT_LIKED: 'post',
  COMMENT_REPLIED: 'post',
  
  // System kategorisi (her zaman gösterilir)
  NEW_BADGE: 'system',
  ACHIEVEMENT_UNLOCKED: 'system',
  REWARD_EARNED: 'system',
  EXPERT_REQUEST_AVAILABLE: 'system',
  EXPERT_REQUEST_ANSWERED: 'system',
  SYSTEM_ANNOUNCEMENT: 'system',
  TIPS_RECEIVED: 'system',
  TIPS_SENT: 'system',
  EVENT_STARTED: 'system',
  EVENT_ENDING_SOON: 'system',
  EVENT_REWARD_AVAILABLE: 'system',
};

/**
 * Bildirim gönderme kanalı tipi
 */
export type NotificationChannel = 'push' | 'email' | 'in_app';

/**
 * NotificationSettingsCheckOptions
 * Bildirim ayar kontrolü için seçenekler
 */
export interface NotificationSettingsCheckOptions {
  /**
   * Bildirim tipi
   */
  notificationType: NotificationType;
  
  /**
   * Bildirim kanalı (push, email, in_app)
   */
  channel: NotificationChannel;
  
  /**
   * Kullanıcının bildirim ayarları
   * Eğer verilmezse, hook içinde otomatik olarak alınır
   */
  settings?: NotificationSetting[];
}

/**
 * Bildirim kategorisinden notification code'a mapping
 * Her kategori kendi benzersiz koduna sahiptir
 */
const categoryToNotificationCode: Record<NotificationCategory, NotificationCode> = {
  trust: NotificationCode.PUSH,        // code 1
  support: NotificationCode.IN_APP,    // code 2
  message: NotificationCode.EMAIL,     // code 0
  collection: NotificationCode.COLLECTION, // code 4
  post: NotificationCode.POST,         // code 5
  system: NotificationCode.PUSH,       // system her zaman gösterilir, bu değer kullanılmaz
};

/**
 * Bildirim gönderilip gönderilmeyeceğini kontrol eder
 *
 * @param options - Kontrol seçenekleri
 * @returns true: Bildirim gönderilebilir, false: Bildirim gönderilmemeli
 */
export function shouldSendNotification(
  options: NotificationSettingsCheckOptions
): boolean {
  const { notificationType, channel, settings } = options;

  // Settings verilmemişse, bildirim gönder (fallback - ayarlar yüklenene kadar)
  if (!settings || settings.length === 0) {
    console.warn('[shouldSendNotification] ⚠️ Settings not provided, allowing notification');
    return true;
  }

  // System bildirimleri her zaman gösterilir (kritik bildirimler)
  const category = notificationTypeToCategory[notificationType];
  if (category === 'system') {
    return true;
  }

  // Kategori bazlı kontrol: her bildirim kategorisinin kendi benzersiz kodu var
  const categoryCode = categoryToNotificationCode[category];
  const categorySetting = settings.find((s) => s.notificationCode === categoryCode);

  // Ayar bulunamadıysa, bildirim gönder (fallback)
  if (!categorySetting) {
    console.warn('[shouldSendNotification] ⚠️ Setting not found for category, allowing notification:', {
      category,
      categoryCode,
    });
    return true;
  }

  // Ayar kapalıysa, bildirim gönderme
  if (!categorySetting.value) {
    if (__DEV__) {
      console.log('[shouldSendNotification] ⏭️ Notification blocked by user settings:', {
        notificationType,
        category,
        channel,
        categoryCode,
        settingValue: categorySetting.value,
      });
    }
    return false;
  }

  // Ayar açıksa, bildirim gönder
  return true;
}

/**
 * Birden fazla kanal için kontrol yapar
 * 
 * @param options - Kontrol seçenekleri (channel yerine channels array)
 * @returns Her kanal için sonuç döndürür
 * 
 * @example
 * ```typescript
 * const results = shouldSendNotificationMultiChannel({
 *   notificationType: 'NEW_MESSAGE',
 *   channels: ['push', 'in_app'],
 *   settings: notificationSettings
 * });
 * 
 * if (results.push) {
 *   await sendPushNotification(...);
 * }
 * if (results.in_app) {
 *   await sendInAppNotification(...);
 * }
 * ```
 */
export function shouldSendNotificationMultiChannel(
  options: Omit<NotificationSettingsCheckOptions, 'channel'> & {
    channels: NotificationChannel[];
  }
): Record<NotificationChannel, boolean> {
  const { channels, ...restOptions } = options;
  
  const results: Record<NotificationChannel, boolean> = {
    push: false,
    email: false,
    in_app: false,
  };

  channels.forEach((channel) => {
    results[channel] = shouldSendNotification({
      ...restOptions,
      channel,
    });
  });

  return results;
}
