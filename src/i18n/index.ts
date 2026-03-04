import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SupportedLanguage } from './languages';

// Import locale files
import common_en from '@/src/locales/en/common.json';
import auth_en from '@/src/locales/en/auth.json';
import wallet_en from '@/src/locales/en/wallet.json';
import feed_en from '@/src/locales/en/feed.json';
import events_en from '@/src/locales/en/events.json';
import settings_en from '@/src/locales/en/settings.json';
import inbox_en from '@/src/locales/en/inbox.json';
import profile_en from '@/src/locales/en/profile.json';
import explore_en from '@/src/locales/en/explore.json';
import post_en from '@/src/locales/en/post.json';
import marketplace_en from '@/src/locales/en/marketplace.json';
import catalog_en from '@/src/locales/en/catalog.json';

// Turkish locale files will be imported after all screens are migrated
// import common_tr from '@/src/locales/tr/common.json';
// import auth_tr from '@/src/locales/tr/auth.json';
// ... etc

// Define resources
const resources = {
  en: {
    common: common_en,
    auth: auth_en,
    wallet: wallet_en,
    feed: feed_en,
    events: events_en,
    settings: settings_en,
    inbox: inbox_en,
    profile: profile_en,
    explore: explore_en,
    post: post_en,
    marketplace: marketplace_en,
    catalog: catalog_en,
  },
  // Future languages will be added here after all screens are migrated
} as const;

// Get device language
const getDeviceLanguage = (): SupportedLanguage => {
  const deviceLocale = Localization.getLocales()[0];
  const languageCode = deviceLocale?.languageCode;

  // Check if device language is supported
  if (languageCode && languageCode in resources) {
    return languageCode as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
};

// Get saved language from AsyncStorage
const getSavedLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && savedLanguage in resources) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  // Always use DEFAULT_LANGUAGE if no saved preference
  // User can change language from Settings > Language
  return DEFAULT_LANGUAGE;
};

// Save language to AsyncStorage
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n
export const initializeI18n = async (): Promise<void> => {
  const savedLanguage = await getSavedLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'common',
      ns: ['common', 'auth', 'wallet', 'feed', 'events', 'settings', 'inbox', 'profile', 'explore', 'post', 'marketplace', 'catalog'],

      // React Native compatibility
      compatibilityJSON: 'v3',

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      // React Native doesn't support Suspense
      react: {
        useSuspense: false,
      },

      // Cache configuration
      saveMissing: false,

      // Debug mode (disable in production)
      debug: __DEV__,
    });

  // Listen for language changes and save to storage
  i18n.on('languageChanged', (lng) => {
    saveLanguage(lng as SupportedLanguage);
  });
};

export default i18n;
