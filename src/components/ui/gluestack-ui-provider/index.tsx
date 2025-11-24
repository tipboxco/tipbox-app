import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './config';
import { useAppStore } from '@/src/store/appStore';

interface GluestackProviderProps {
  children: React.ReactNode;
}

export const GluestackProvider: React.FC<GluestackProviderProps> = ({ 
  children
}) => {
  const colorMode = useAppStore((state) => state.colorMode);

  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {children}
    </GluestackUIProvider>
  );
};
