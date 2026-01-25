/**
 * useNotificationSettingsCheck Hook
 * Bildirim göndermeden önce kullanıcının ayarlarını kontrol eden React Hook
 */

import { useMemo } from 'react';
import { useNotificationSettings } from '../api/hooks';
import { shouldSendNotification, shouldSendNotificationMultiChannel } from '../utils/notificationSettingsCheck';
import type { NotificationType } from '@/src/features/notifications/api/types';
import type { NotificationChannel } from '../utils/notificationSettingsCheck';

/**
 * useNotificationSettingsCheck Hook
 * Bildirim göndermeden önce ayarları kontrol eder
 * 
 * @example
 * ```typescript
 * const { canSendNotification, isLoading } = useNotificationSettingsCheck();
 * 
 * const handleSendNotification = async () => {
 *   if (canSendNotification('NEW_MESSAGE', 'push')) {
 *     await sendNotification(...);
 *   }
 * };
 * ```
 */
export function useNotificationSettingsCheck() {
  const { data: settings, isLoading, error } = useNotificationSettings();

  /**
   * Tek kanal için kontrol
   */
  const canSendNotification = useMemo(() => {
    return (notificationType: NotificationType, channel: NotificationChannel): boolean => {
      if (isLoading || error || !settings) {
        // Ayarlar yüklenene kadar bildirim gönder (fallback)
        return true;
      }

      return shouldSendNotification({
        notificationType,
        channel,
        settings,
      });
    };
  }, [settings, isLoading, error]);

  /**
   * Birden fazla kanal için kontrol
   */
  const canSendNotificationMultiChannel = useMemo(() => {
    return (
      notificationType: NotificationType,
      channels: NotificationChannel[]
    ): Record<NotificationChannel, boolean> => {
      if (isLoading || error || !settings) {
        // Ayarlar yüklenene kadar tüm kanallar için true döndür (fallback)
        return {
          push: true,
          email: true,
          in_app: true,
        };
      }

      return shouldSendNotificationMultiChannel({
        notificationType,
        channels,
        settings,
      });
    };
  }, [settings, isLoading, error]);

  return {
    canSendNotification,
    canSendNotificationMultiChannel,
    isLoading,
    error,
    settings,
  };
}
