import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import '@/src/i18n/types'; // Import type extensions

/**
 * Custom useTranslation hook with TypeScript support
 *
 * Usage:
 * ```typescript
 * // In a component
 * const { t, i18n } = useTranslation('auth');
 *
 * // Use translations
 * <Text>{t('loginScreen.title')}</Text>
 *
 * // With interpolation
 * <Text>{t('toasts.loginSuccess', { name: 'John' })}</Text>
 *
 * // Change language
 * i18n.changeLanguage('tr');
 *
 * // Get current language
 * const currentLang = i18n.language;
 * ```
 */
export const useTranslation = (namespace?: string) => {
  const translation = useI18nextTranslation(namespace);

  return {
    ...translation,
    t: translation.t as TFunction,
    i18n: translation.i18n,
  };
};
