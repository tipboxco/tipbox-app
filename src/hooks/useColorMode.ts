import { useThemeStore } from '@/src/store/themeStore';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

export const useColorMode = (): ColorModeContextType => {
  const { colorMode, toggleColorMode } = useThemeStore();

  return {
    colorMode,
    toggleColorMode,
  };
}; 