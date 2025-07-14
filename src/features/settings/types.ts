// Settings feature'a özel tipler

import type { Theme, Language } from '@/src/types';

// Settings Types
export interface AppSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  general: GeneralSettings;
}

export interface AppearanceSettings {
  theme: Theme;
  language: Language;
  fontSize: FontSize;
  colorScheme: ColorScheme;
}

export interface NotificationSettings {
  push: PushNotificationSettings;
  email: EmailNotificationSettings;
  inApp: InAppNotificationSettings;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  locationServices: boolean;
}

export interface GeneralSettings {
  autoSave: boolean;
  offlineMode: boolean;
  dataUsage: DataUsageSettings;
  backupSettings: BackupSettings;
}

// Notification Sub-types
export interface PushNotificationSettings {
  enabled: boolean;
  tips: boolean;
  comments: boolean;
  likes: boolean;
  follows: boolean;
  dailyDigest: boolean;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  weeklyNewsletter: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
}

// Appearance Sub-types
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ColorScheme =
  | 'default'
  | 'colorful'
  | 'monochrome'
  | 'high-contrast';

// Data & Backup Sub-types
export interface DataUsageSettings {
  wifiOnly: boolean;
  limitVideoQuality: boolean;
  compressImages: boolean;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  includeMedia: boolean;
  cloudProvider: 'icloud' | 'google-drive' | 'dropbox' | 'none';
}

// Settings Actions
export type SettingsAction =
  | 'update_theme'
  | 'update_language'
  | 'update_notifications'
  | 'clear_cache'
  | 'export_data'
  | 'delete_account';

export interface SettingsUpdatePayload {
  section: keyof AppSettings;
  data: Partial<AppSettings[keyof AppSettings]>;
}
