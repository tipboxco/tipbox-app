export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
  },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_STORAGE_KEY = 'app-language';
