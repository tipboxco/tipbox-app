import { useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { useAppStore } from '@/src/store/appStore';

interface ColorModeContextType {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export const useColorMode = (): ColorModeContextType => {
  const storedMode = useAppStore((state) => state.colorMode);
  const toggleColorMode = useAppStore((state) => state.toggleColorMode);

  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')
  );

  useEffect(() => {
    if (storedMode !== 'system') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, [storedMode]);

  const colorMode = useMemo((): 'light' | 'dark' => {
    if (storedMode === 'system') return systemScheme;
    return storedMode as 'light' | 'dark';
  }, [storedMode, systemScheme]);

  return useMemo(() => ({ colorMode, toggleColorMode }), [colorMode]);
};
