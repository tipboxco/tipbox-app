import * as Notifications from 'expo-notifications';
import { AndroidChannelConfig } from '../types';

/**
 * Default Android Notification Channels
 * 
 * Farklı öncelik seviyeleri ve kullanım senaryoları için channel'lar
 */
export const DEFAULT_ANDROID_CHANNELS: AndroidChannelConfig[] = [
  {
    id: 'default',
    name: 'Genel Bildirimler',
    description: 'Genel bildirimler için varsayılan kanal',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    audioAttributes: {
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      usage: Notifications.AndroidAudioUsage.NOTIFICATION,
    },
  },
  {
    id: 'high_priority',
    name: 'Önemli Bildirimler',
    description: 'Mesajlar ve önemli bildirimler',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    audioAttributes: {
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
    },
  },
  {
    id: 'messages',
    name: 'Mesajlar',
    description: 'Direkt mesaj bildirimleri',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    audioAttributes: {
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      usage: Notifications.AndroidAudioUsage.NOTIFICATION_COMMUNICATION_INSTANT,
    },
  },
  {
    id: 'events',
    name: 'Etkinlikler',
    description: 'Etkinlik bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
  },
  {
    id: 'low_priority',
    name: 'Düşük Öncelikli',
    description: 'Düşük öncelikli bildirimler',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0, 250],
    lightColor: '#FF231F7C',
    sound: false,
    enableVibrate: false,
    enableLights: false,
    showBadge: false,
  },
];
