export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  // Future languages will be added here after all screens are migrated:
  // tr: {
  //   code: 'tr',
  //   name: 'Turkish',
  //   nativeName: 'Türkçe',
  // },
  // es: {
  //   code: 'es',
  //   name: 'Spanish',
  //   nativeName: 'Español',
  // },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_STORAGE_KEY = 'app-language';
