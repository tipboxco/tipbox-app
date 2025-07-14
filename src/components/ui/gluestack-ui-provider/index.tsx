import React from 'react';
import { View } from 'react-native';

type ModeType = 'light' | 'dark';

interface GluestackUIProviderProps {
  mode?: ModeType;
  children: React.ReactNode;
}

export const GluestackUIProvider: React.FC<GluestackUIProviderProps> = ({
  children,
}) => {
  // GlueStack provider'ı yapacak, şimdilik basit bir wrapper
  return <View style={{ flex: 1 }}>{children}</View>;
};
