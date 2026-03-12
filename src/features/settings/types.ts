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

// Change Password Types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// Notification Settings Types
export interface NotificationSetting {
  notificationCode: number; // 0: EMAIL, 1: PUSH, 2: IN_APP
  value: boolean;
}

export interface UpdateNotificationSettingsRequest {
  settings: NotificationSetting[];
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
}

// Privacy Settings Types
export interface PrivacySetting {
  privacyCode: number; // 0: NFT_BADGE_COLLECTIONS, 1: TRUST_TRUSTER_LIST, 2: ONE_ON_ONE_SUPPORT
  selectedValue: 'trust-only' | 'everyone';
}

export interface UpdatePrivacySettingsRequest {
  settings: PrivacySetting[];
}

export interface UpdatePrivacySettingsResponse {
  success: boolean;
  message: string;
}

// Support Session Price Types
export interface SupportSessionPriceResponse {
  price: number | null;
}

export interface UpdateSupportSessionPriceRequest {
  price: number;
}

export interface UpdateSupportSessionPriceResponse {
  success: boolean;
  message: string;
}

// Device Types
export interface Device {
  id: string;
  name: string;
  location: string | null;
  date: string; // ISO 8601 format
  isActive: boolean;
}

export interface DeleteDeviceResponse {
  success: boolean;
  message: string;
}

// Notification Codes Enum
// Her bildirim türü için benzersiz kod (backend ile uyumlu)
export enum NotificationCode {
  EMAIL = 0,       // Message Notifications
  PUSH = 1,        // Trust/Truster Notifications
  IN_APP = 2,      // 1-on-1 Support Notifications
  DEPOSIT = 3,     // Deposit Notifications
  COLLECTION = 4,  // Collection Notifications
  POST = 5,        // Post Notifications
}

// Privacy Codes Enum
export enum PrivacyCode {
  NFT_BADGE_COLLECTIONS = 0,
  TRUST_TRUSTER_LIST = 1,
  ONE_ON_ONE_SUPPORT = 2,
}