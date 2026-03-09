import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './config';
import { useAppStore } from '@/src/store/appStore';

interface GluestackProviderProps {
  children: React.ReactNode;
}

// CRITICAL FIX: Extract colorMode to separate hook to prevent re-render loops
// The issue: GluestackProvider re-renders all children when colorMode changes
// Solution: Memoize the provider and only update when colorMode actually changes
const GluestackProviderComponent: React.FC<GluestackProviderProps> = ({
  children
}) => {
  const colorMode = useAppStore((state) => state.colorMode);

  // PERFORMANCE FIX: Memoize children to prevent unnecessary re-renders
  const memoizedChildren = React.useMemo(() => children, [children]);

  return (
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {memoizedChildren}
    </GluestackUIProvider>
  );
};

export const GluestackProvider = React.memo(GluestackProviderComponent);
