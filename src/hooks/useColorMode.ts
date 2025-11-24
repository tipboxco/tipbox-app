import { useAppStore } from '@/src/store/appStore';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

export const useColorMode = (): ColorModeContextType => {
  const { colorMode, toggleColorMode } = useAppStore();

  return {
    colorMode,
    toggleColorMode,
  };
}; 