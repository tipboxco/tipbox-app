import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './config';
import { useThemeStore } from '@/src/store/themeStore';

interface GluestackProviderProps {
  children: React.ReactNode;
}

export const GluestackProvider: React.FC<GluestackProviderProps> = ({ 
  children
}) => {
  const colorMode = useThemeStore((state) => state.colorMode);

  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {children}
    </GluestackUIProvider>
  );
};
