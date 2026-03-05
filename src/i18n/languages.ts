export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    enabled: true,
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    enabled: true,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    enabled: false,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    enabled: false,
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    enabled: false,
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    enabled: false,
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    enabled: false,
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    enabled: false,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    enabled: false,
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    enabled: false,
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    enabled: false,
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    enabled: false,
  },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_STORAGE_KEY = 'app-language';
