import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './config';
import { useColorMode } from '@/src/hooks/useColorMode';

interface GluestackProviderProps {
  children: React.ReactNode;
}

// CRITICAL FIX: Extract colorMode to separate hook to prevent re-render loops
// The issue: GluestackProvider re-renders all children when colorMode changes
// Solution: Memoize the provider and only update when colorMode actually changes
const GluestackProviderComponent: React.FC<GluestackProviderProps> = ({
  children
}) => {
  // useColorMode resolves 'system' → actual 'light' | 'dark' via Appearance API
  // GluestackUIProvider only accepts 'light' | 'dark', NOT 'system'
  const { colorMode } = useColorMode();

  // PERFORMANCE FIX: Memoize children to prevent unnecessary re-renders
  const memoizedChildren = React.useMemo(() => children, [children]);

  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {memoizedChildren}
    </GluestackUIProvider>
  );
};

export const GluestackProvider = React.memo(GluestackProviderComponent);
