import React from 'react';
import { Navigation } from '@/src/navigation';
import { GluestackProvider } from '@/src/components/ui';

export default function App() {
  return (
    <GluestackProvider>
      <Navigation />
    </GluestackProvider>
  );
}
