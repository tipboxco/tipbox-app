import { useMemo } from 'react';
import { useAppStore } from '@/src/store/appStore';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

export const useColorMode = (): ColorModeContextType => {
  // FIX: Zustand selector'larını ayrı ayrı kullan - obje döndürmek yerine
  // Bu sayede her selector sadece kendi değerini subscribe eder
  const colorMode = useAppStore((state) => state.colorMode);
  const toggleColorMode = useAppStore((state) => state.toggleColorMode);

  // FIX: useMemo ile obje referansını stabilize et - React.memo ile uyumluluk için
  // Zustand fonksiyonları zaten stabil, ama obje referansını stabilize etmek için useMemo kullanıyoruz
  return useMemo(
    () => ({
      colorMode,
      toggleColorMode,
    }),
    [colorMode, toggleColorMode]
  );
}; 