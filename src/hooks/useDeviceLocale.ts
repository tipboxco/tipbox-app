import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';

/**
 * Cihazın mevcut dilini döndürür
 * Örnek: 'tr-TR' -> 'tr', 'en-US' -> 'en'
 */
export const useDeviceLocale = () => {
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    setLocale(deviceLocale);
    console.log('[useDeviceLocale] Device language:', deviceLocale);
  }, []);

  return locale;
};

