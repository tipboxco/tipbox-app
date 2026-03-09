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
  // CRITICAL FIX: toggleColorMode Zustand fonksiyonu zaten stabil, dependency'den çıkarıldı
  // Sadece colorMode değiştiğinde yeni obje döndür
  return useMemo(
    () => ({
      colorMode,
      toggleColorMode,
    }),
    [colorMode] // toggleColorMode dependency'den çıkarıldı - Zustand fonksiyonları stabil
  );
}; 