import React from 'react';
import { StatusBar } from 'expo-status-bar';
import '@/global.css';
import { GluestackUIProvider } from '@/src/components/ui/gluestack-ui-provider';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <GluestackUIProvider mode='light'>
      <RootNavigator />
      <StatusBar style='auto' />
    </GluestackUIProvider>
  );
}
