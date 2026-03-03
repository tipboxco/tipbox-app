import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import i18n, { initializeI18n } from '@/src/i18n';

interface LocalizationProviderProps {
  children: React.ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeI18n();
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Even if initialization fails, allow app to continue with default language
        setIsI18nInitialized(true);
      }
    };

    init();
  }, []);

  // Show loading indicator while i18n is initializing
  if (!isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
